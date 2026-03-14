require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./firebaseAdmin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// IMPORTANT: Add GEMINI_API_KEY to your environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'PLACEHOLDER_ERROR');

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to extract JSON block from Gemini output
const extractJSON = (text) => {
    try {
        // Find possible markdown JSON block (```json ... ``` or ``` ... ```)
        const jsonMatch = text.match(/```json\n?([\s\S]*?)```/) || text.match(/```\n?([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text;
        return JSON.parse(jsonStr.trim());
    } catch(e) {
        console.error("Failed to parse Gemini JSON:", text);
        throw new Error("AI returned malformed JSON");
    }
}

// ---------------------------------------------------------
// Original Profile / Progress Routes
// ---------------------------------------------------------
app.post('/create-profile', async (req, res) => {
    try {
        const { uid, name, age, lastStudied } = req.body;
        if (!uid) return res.status(400).json({ error: "Missing uid" });
        await db.collection('users').doc(uid).set({ name, age, lastStudied, createdAt: new Date().toISOString() });
        res.json({ message: "Profile created successfully" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/profile', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: "Missing uid" });
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) return res.status(404).json({ error: "Profile not found" });
        res.json(doc.data());
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Extra helper retained to prevent frontend crashes if using check-profile
app.get('/check-profile/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });
        const doc = await db.collection('users').doc(uid).get();
        res.json({ profileExists: doc.exists });
    } catch (error) {
        console.error('Error in /check-profile:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/update-progress', async (req, res) => {
    try {
         const { uid, targetSkill, isCompleted } = req.body;
         if (!uid || !targetSkill) return res.status(400).json({ error: "Missing uid or skill" });

         const docRef = db.collection('progress').doc(uid);
         const doc = await docRef.get();
         
         let completedSkills = [];
         if (doc.exists) { completedSkills = doc.data().completedSkills || []; }

         if (isCompleted && !completedSkills.includes(targetSkill)) { completedSkills.push(targetSkill); } 
         else if (!isCompleted) { completedSkills = completedSkills.filter(s => s !== targetSkill); }

         await docRef.set({ completedSkills, updatedAt: new Date().toISOString() }, { merge: true });
         res.json({ message: "Progress updated", completedSkills });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/progress', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: "Missing uid" });
        const doc = await db.collection('progress').doc(uid).get();
        if (!doc.exists) return res.json({ completedSkills: [] });
        res.json(doc.data());
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ---------------------------------------------------------
// NEW AI INTEGRATION ROUTES
// ---------------------------------------------------------

app.get('/api/generate-quiz', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Generate exactly 10 multiple-choice questions to assess a student's skills in Programming, Logical Reasoning, Tech Basics, and Communication. 
        Format the output strictly as a JSON array of objects. Do NOT include markdown blocks or any other text before or after the JSON array.
        Each object must follow this exact structure:
        {
          "id": "unique string like q1, q2",
          "question": "The question text",
          "options": [
             { "text": "Option 1", "score": { "programming": 10, "logical": 0, "communication": 0, "tech_basics": 5 } }
          ]
        }
        Ensure there are exactly 3 options per question. Only assign scores (out of 10) to the relevant categories logically based on the option correctness.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const quizData = extractJSON(responseText);

        res.json(quizData);
    } catch (error) {
        console.error("Generate Quiz Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analyze-career', async (req, res) => {
    try {
        const { uid, scores, interests } = req.body;
        if (!uid) return res.status(400).json({ error: "Missing uid" });

        // Save scores directly
        await db.collection('quizResults').doc(uid).set({
            scores,
            interests,
            completedAt: new Date().toISOString()
        });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Act as an expert Career Guidance Counselor. 
        A student has achieved the following skill scores (max around 40-50 per category depending on quiz): 
        Programming: ${scores.programming}, Logical: ${scores.logical}, Communication: ${scores.communication}, Tech Basics: ${scores.tech_basics}.
        The student also provided the following specific interests: "${interests}".

        Based on these scores and their personal interests, recommend exactly 3 highly suitable career paths.
        Format the output strictly as a JSON array of objects. Do NOT include any markdown blocks or external text. 
        Each object must follow this exact structure:
        {
          "id": "unique string like role_ai_dev",
          "title": "Title of the Role",
          "requiredSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
          "learningPath": ["Step 1 description", "Step 2", "Step 3", "Step 4"],
          "courses": [
            { "name": "Name of a highly relevant real course (e.g. from Coursera/Udemy/Kaggle)", "url": "https://actual-course-url.example.com" }
          ]
        }
        Provide exactly 3 course URLs from real platforms. Keep requiredSkills to exactly 5 specific technical/soft skills.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const recommendedCareers = extractJSON(responseText);

        // Save recommendations to DB so dashboard can pull them later
        await db.collection('recommendations').doc(uid).set({ recommendedCareers, updatedAt: new Date().toISOString() });

        res.json({ recommendedCareers, userScores: scores });
    } catch (error) {
        console.error("Analyze Career Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Helper to pull saved recommendations and progress for skill-gap and dashboard pages
app.get('/api/get-recommendations', async (req, res) => {
    try {
         const { uid } = req.query;
         if (!uid) return res.status(400).json({ error: "Missing uid" });

         const doc = await db.collection('recommendations').doc(uid).get();
         if (!doc.exists) return res.status(404).json({ error: "No recommendations found. Take the quiz first." });

         const scoreDoc = await db.collection('quizResults').doc(uid).get();
         const userScores = scoreDoc.exists ? scoreDoc.data().scores : {};

         res.json({ recommendedCareers: doc.data().recommendedCareers, userScores });
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

app.get('/api/skill-gap', async (req, res) => {
    try {
        const { roleId, uid } = req.query;
        if (!roleId || !uid) return res.status(400).json({ error: "Missing roleId or uid" });

        // Retrieve specifically from the dynamic recommendations doc
        const doc = await db.collection('recommendations').doc(uid).get();
        if (!doc.exists) return res.status(404).json({ error: "No recommendations found." });

        const career = doc.data().recommendedCareers.find(c => c.id === roleId);
        if (!career) return res.status(404).json({ error: "Role not found" });

        let userSkills = [];
        const progDoc = await db.collection('progress').doc(uid).get();
        if (progDoc.exists) { userSkills = progDoc.data().completedSkills || []; }

        const missingSkills = career.requiredSkills.filter(s => !userSkills.includes(s));

        res.json({
            role: career.title,
            requiredSkills: career.requiredSkills,
            userSkills,
            missingSkills,
            learningPath: career.learningPath,
            courses: career.courses
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
