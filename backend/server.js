require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./firebaseAdmin');
const careersData = require('./data/careers.json');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Helper to call OpenRouter
async function callOpenRouter(prompt) {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'stepfun/step-3.5-flash:free',
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter API error:', error?.response?.data || error.message);
        throw error;
    }
}

// ─── 1. Create Profile ─────────────────────────────────────────────────────────
app.post('/create-profile', async (req, res) => {
    try {
        const { uid, name, age, lastStudied } = req.body;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });
        await db.collection('users').doc(uid).set({ name, age, lastStudied, createdAt: new Date().toISOString() });
        res.json({ message: 'Profile created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 2. Get Profile ─────────────────────────────────────────────────────────────
app.get('/profile', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 2b. Check Profile Exists ───────────────────────────────────────────────────
// GET /check-profile/:uid  -> { profileExists: boolean }
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

// ─── 3. AI: Generate Quiz Questions ───────────────────────────────────────────
app.post('/generate-questions', async (req, res) => {
    try {
        const { name, age, lastStudied } = req.body;

        const prompt = `You are an expert career assessment AI. Generate exactly 10 multiple-choice quiz questions.
        
CRITICAL REQUIREMENT: 
5 of the 10 questions MUST test the student specifically on their background: "${lastStudied || 'General Tech'}".
The remaining 5 questions should assess general logic, communication, and basic tech skills.

Student profile:
- Name: ${name || 'Student'}
- Age: ${age || 'Unknown'}
- Background / Last Studied: ${lastStudied || 'Not specified'}

Rules:
1. Return ONLY valid JSON, no markdown, no extra text.
2. Each question must have: id (q1-q10), question (string), category (one of: programming|logical|communication|tech_basics), options (array of 3 objects with: text (string), score (object with category key and number value)). Note: Use 'programming' or 'tech_basics' as the internal category for the questions about ${lastStudied}.
3. Correct option should have score value of 10 for its category, wrong options score 0.

Return this exact JSON format:
[
  {
    "id": "q1",
    "question": "...",
    "category": "programming",
    "options": [
      { "text": "...", "score": { "programming": 10 } },
      { "text": "...", "score": { "programming": 0 } },
      { "text": "...", "score": { "programming": 0 } }
    ]
  }
]`;

        const raw = await callOpenRouter(prompt);
        // Strip markdown code fences if present
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const questions = JSON.parse(cleaned);
        res.json({ questions });
    } catch (error) {
        console.error('AI question generation error:', error);
        // Fallback to static questions if AI fails
        const fallback = require('./data/quiz.json');
        res.json({ questions: fallback, fallback: true });
    }
});

// ─── 4. Submit Quiz ─────────────────────────────────────────────────────────────
app.post('/submit-quiz', async (req, res) => {
    try {
        const { uid, answers, questions } = req.body;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });

        let scores = { programming: 0, logical: 0, communication: 0, tech_basics: 0 };

        // answers = { q1: "answer text", q2: null (skipped), ... }
        const questionsSource = questions || require('./data/quiz.json');

        for (const [qId, ansText] of Object.entries(answers)) {
            if (!ansText) continue; // skipped
            const question = questionsSource.find(q => q.id === qId);
            if (question) {
                const option = question.options.find(opt => opt.text === ansText);
                if (option && option.score) {
                    for (const [category, points] of Object.entries(option.score)) {
                        scores[category] = (scores[category] || 0) + points;
                    }
                }
            }
        }

        const skipped = Object.entries(answers).filter(([, v]) => !v).map(([k]) => k);

        // Generate AI summary
        let aiSummary = '';
        try {
            const summaryPrompt = `A student completed a career aptitude quiz with these scores:
Programming: ${scores.programming}, Logical: ${scores.logical}, Communication: ${scores.communication}, Tech Basics: ${scores.tech_basics}.
They skipped ${skipped.length} question(s).

Write a 2-3 sentence encouraging summary of their strengths and what career fields suit them. Be specific and motivating. No bullet points, just a short paragraph.`;
            aiSummary = await callOpenRouter(summaryPrompt);
        } catch (e) {
            aiSummary = 'Great work completing the assessment! Your scores reflect your unique strengths.';
        }

        await db.collection('quizResults').doc(uid).set({
            scores, skipped, aiSummary,
            completedAt: new Date().toISOString()
        });

        res.json({ message: 'Quiz submitted', scores, skipped, aiSummary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 5. Career Recommendation (AI-based) ────────────────────────────────────
app.post('/recommend-careers', async (req, res) => {
    try {
        const { uid, interest } = req.body;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });

        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : { lastStudied: 'Unknown' };

        let scoresContext = '';
        const quizDoc = await db.collection('quizResults').doc(uid).get();
        let aiSummary = '';
        if (quizDoc.exists) {
            const docData = quizDoc.data();
            const scores = docData.scores;
            aiSummary = docData.aiSummary || '';
            scoresContext = `Their aptitude scores — Programming: ${scores.programming}, Logical: ${scores.logical}, Communication: ${scores.communication}, Tech Basics: ${scores.tech_basics}.`;
        }

        const interestContext = interest ? `They also mentioned an interest in: "${interest}".` : '';

        const prompt = `You are a career guidance AI. A student needs 3 career suggestions based on their profile.
CRITICAL: The suggested careers MUST highly align with their previous background in "${userData.lastStudied}".

Background: ${userData.lastStudied}.
${scoresContext}
${interestContext}

Generate exactly 3 career suggestions. Return ONLY valid JSON, no markdown.
Each suggestion must precisely match this format:
{
  "title": "Career Title",
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "learningPath": ["Learning Step 1", "Learning Step 2", "Learning Step 3", "Learning Step 4", "Learning Step 5"],
  "platforms": ["Platform 1", "Platform 2"]
}

Return an array of 3 objects formatted exactly as above.`;

        const raw = await callOpenRouter(prompt);
        let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(cleaned);
        
        await db.collection('recommendations').doc(uid).set({
            recommendedCareers: result,
            aiSummary,
            timestamp: new Date().toISOString()
        });
        
        res.json({ recommendedCareers: result, aiSummary });
    } catch (error) {
        console.error('Career recommendation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/recommendations', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });
        const doc = await db.collection('recommendations').doc(uid).get();
        if (!doc.exists) return res.status(404).json({ error: 'No recommendations found' });
        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 6. AI: Career Suggestion based on Interests ──────────────────────────────
app.post('/career-suggestion', async (req, res) => {
    try {
        const { uid, interests } = req.body;
        if (!uid || !interests) return res.status(400).json({ error: 'Missing uid or interests' });

        // Fetch quiz scores if available
        let scoresContext = '';
        try {
            const doc = await db.collection('quizResults').doc(uid).get();
            if (doc.exists) {
                const { scores } = doc.data();
                scoresContext = `Their aptitude scores — Programming: ${scores.programming}, Logical: ${scores.logical}, Communication: ${scores.communication}, Tech Basics: ${scores.tech_basics}.`;
            }
        } catch (e) {}

        const prompt = `You are a career guidance AI. A student described their interests as: "${interests}". ${scoresContext}

Based on their interests and aptitude, suggest 3 specific tech career paths. For each, explain why it fits them in 1-2 sentences. Also write a brief 2-sentence opening encouragement.

Return ONLY valid JSON, no markdown:
{
  "encouragement": "...",
  "suggestions": [
    { "title": "Career Title", "reason": "Why this fits them.", "skills": ["skill1", "skill2", "skill3"] }
  ]
}`;

        const raw = await callOpenRouter(prompt);
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(cleaned);
        res.json(result);
    } catch (error) {
        console.error('Career suggestion error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── 7. Skill Gap Analysis ────────────────────────────────────────────────────
app.get('/skill-gap', async (req, res) => {
    try {
        const { roleId, uid } = req.query;
        if (!roleId || !uid) return res.status(400).json({ error: 'Missing roleId or uid' });

        const career = careersData.find(c => c.id === roleId);
        if (!career) return res.status(404).json({ error: 'Role not found' });

        let userSkills = [];
        const progDoc = await db.collection('progress').doc(uid).get();
        if (progDoc.exists) userSkills = progDoc.data().completedSkills || [];

        const requiredSkills = career.requiredSkills;
        const missingSkills = requiredSkills.filter(skill => !userSkills.includes(skill));

        res.json({ role: career.title, requiredSkills, userSkills, missingSkills, learningPath: career.learningPath, courses: career.courses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 8. Update Progress ────────────────────────────────────────────────────────
app.post('/update-progress', async (req, res) => {
    try {
        const { uid, targetSkill, isCompleted } = req.body;
        if (!uid || !targetSkill) return res.status(400).json({ error: 'Missing uid or skill' });

        const docRef = db.collection('progress').doc(uid);
        const doc = await docRef.get();
        let completedSkills = doc.exists ? (doc.data().completedSkills || []) : [];

        if (isCompleted && !completedSkills.includes(targetSkill)) {
            completedSkills.push(targetSkill);
        } else if (!isCompleted) {
            completedSkills = completedSkills.filter(s => s !== targetSkill);
        }

        await docRef.set({ completedSkills, updatedAt: new Date().toISOString() });
        res.json({ message: 'Progress updated', completedSkills });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 9. Get Progress ───────────────────────────────────────────────────────────
app.get('/progress', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });
        const doc = await db.collection('progress').doc(uid).get();
        if (!doc.exists) return res.json({ completedSkills: [] });
        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── 10. Analyze Career Interest ──────────────────────────────────────────────
const CAREER_KEYWORDS = [
    {
        career: 'AI / ML Engineer',
        keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'data science', 'data scientist'],
        skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow / PyTorch', 'Mathematics & Statistics', 'Data Structures'],
        courses: ['Python for Data Science', 'Machine Learning Fundamentals', 'Deep Learning Specialization', 'Linear Algebra & Calculus'],
        roadmap: ['Learn Python basics', 'Study Mathematics for AI (Linear Algebra, Calculus, Stats)', 'Learn Machine Learning concepts', 'Practice with real datasets', 'Study Deep Learning & Neural Networks', 'Build AI projects & publish on GitHub']
    },
    {
        career: 'Web Developer',
        keywords: ['web', 'website', 'frontend', 'backend', 'fullstack', 'html', 'css', 'javascript', 'react', 'node', 'coding', 'web apps', 'ui', 'interface'],
        skills: ['HTML & CSS', 'JavaScript', 'React.js', 'Node.js', 'REST APIs', 'Git & GitHub'],
        courses: ['HTML/CSS Fundamentals', 'JavaScript Essentials', 'React - The Complete Guide', 'Node.js & Express', 'Database Basics (SQL / MongoDB)'],
        roadmap: ['Master HTML & CSS', 'Learn JavaScript (ES6+)', 'Build static websites', 'Learn React for frontend', 'Learn Node.js & Express for backend', 'Deploy full-stack projects']
    },
    {
        career: 'Data Scientist',
        keywords: ['data', 'analytics', 'statistics', 'excel', 'tableau', 'power bi', 'sql', 'analysis', 'visualization', 'big data', 'data analyst'],
        skills: ['Python / R', 'SQL', 'Data Visualization (Tableau / Power BI)', 'Statistics', 'Machine Learning basics', 'Excel'],
        courses: ['Statistics Fundamentals', 'Python for Data Analysis', 'SQL Bootcamp', 'Data Visualization with Tableau', 'Intro to Machine Learning'],
        roadmap: ['Learn Excel & basic statistics', 'Learn SQL for data querying', 'Learn Python (Pandas, NumPy, Matplotlib)', 'Study data visualization tools', 'Apply ML for predictive analytics', 'Work on real-world datasets']
    },
    {
        career: 'Cybersecurity Analyst',
        keywords: ['security', 'cybersecurity', 'hacking', 'ethical hacking', 'penetration', 'network', 'firewall', 'malware', 'ctf', 'vulnerability', 'infosec'],
        skills: ['Networking Fundamentals', 'Linux', 'Ethical Hacking', 'Cryptography', 'SIEM Tools', 'Python Scripting'],
        courses: ['CompTIA Security+', 'Ethical Hacking (CEH)', 'Linux Administration', 'Network Security Basics', 'Python for Cybersecurity'],
        roadmap: ['Learn networking fundamentals (TCP/IP, DNS)', 'Master Linux command line', 'Study cryptography basics', 'Learn ethical hacking & penetration testing', 'Practice on CTF platforms (TryHackMe, HackTheBox)', 'Get certified (CompTIA Security+, CEH)']
    },
    {
        career: 'UI/UX Designer',
        keywords: ['design', 'ui', 'ux', 'user experience', 'figma', 'sketch', 'wireframe', 'prototype', 'graphic', 'creative', 'visual'],
        skills: ['Figma / Adobe XD', 'User Research', 'Wireframing & Prototyping', 'Design Systems', 'HTML & CSS basics', 'Interaction Design'],
        courses: ['UI/UX Design Fundamentals', 'Figma Masterclass', 'User Research Methods', 'Google UX Design Certificate', 'Web Accessibility'],
        roadmap: ['Learn design principles (color, typography, layout)', 'Master Figma or Adobe XD', 'Study user research & usability testing', 'Build a UI/UX portfolio', 'Learn basic HTML/CSS to collaborate with devs', 'Apply for internships or freelance projects']
    },
    {
        career: 'Mobile App Developer',
        keywords: ['mobile', 'android', 'ios', 'app', 'flutter', 'react native', 'swift', 'kotlin', 'smartphone', 'play store', 'app store'],
        skills: ['Flutter / React Native', 'Dart / JavaScript', 'REST API Integration', 'Firebase', 'Git', 'UI Design basics'],
        courses: ['Flutter Complete Course', 'React Native - Practical Guide', 'Mobile UI/UX Design', 'Firebase for Mobile Apps'],
        roadmap: ['Choose a framework (Flutter or React Native)', 'Learn the language (Dart or JavaScript)', 'Build simple apps (To-do, Calculator)', 'Integrate APIs and Firebase', 'Publish on Play Store / App Store', 'Build a portfolio of 3+ apps']
    },
    {
        career: 'Cloud / DevOps Engineer',
        keywords: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'ci/cd', 'infrastructure', 'deployment', 'linux server'],
        skills: ['Linux & Bash Scripting', 'Docker & Kubernetes', 'AWS / Azure / GCP', 'CI/CD Pipelines', 'Terraform', 'Monitoring Tools'],
        courses: ['AWS Cloud Practitioner', 'Docker & Kubernetes Mastery', 'Linux for Engineers', 'Terraform Fundamentals', 'DevOps Bootcamp'],
        roadmap: ['Learn Linux administration', 'Understand networking & virtualization', 'Learn Docker & containerization', 'Study Kubernetes orchestration', 'Learn a cloud provider (AWS/Azure/GCP)', 'Implement CI/CD pipelines & get certified']
    }
];

const DEFAULT_CAREER = {
    career: 'Software Engineer',
    skills: ['Programming Fundamentals', 'Data Structures & Algorithms', 'Git & GitHub', 'Problem Solving', 'SQL basics'],
    courses: ['CS50 Introduction to Computer Science', 'Data Structures & Algorithms', 'Git & GitHub for Beginners', 'SQL Basics'],
    roadmap: ['Learn a programming language (Python / JavaScript)', 'Study Data Structures & Algorithms', 'Build small projects', 'Learn version control with Git', 'Contribute to open source', 'Apply for internships']
};

app.post('/analyze-career-interest', async (req, res) => {
    try {
        const { uid, interest } = req.body;
        if (!interest || !interest.trim()) return res.status(400).json({ error: 'Missing interest text' });

        const lowerInterest = interest.toLowerCase();
        let matched = null;

        // Keyword matching — score each career by how many keywords match
        let bestScore = 0;
        for (const entry of CAREER_KEYWORDS) {
            const score = entry.keywords.filter(kw => lowerInterest.includes(kw)).length;
            if (score > bestScore) { bestScore = score; matched = entry; }
        }

        let result = matched ? {
            career: matched.career,
            skills: matched.skills,
            courses: matched.courses,
            roadmap: matched.roadmap
        } : { ...DEFAULT_CAREER };

        // Try to enrich with Gemini AI for a better, personalized result
        try {
            const prompt = `A student described their career interest as: "${interest}"

Based on this, return a JSON object with:
- "career": the single best career role title
- "skills": array of 5-6 most important skills (short strings)
- "courses": array of 4-5 recommended course names (short strings)
- "roadmap": array of 5-6 step-by-step learning milestones (short action strings starting with a verb)

Return ONLY valid JSON, no markdown, no explanation. Example format:
{"career":"...","skills":["..."],"courses":["..."],"roadmap":["..."]}`;

            const raw = await callOpenRouter(prompt);
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const aiResult = JSON.parse(cleaned);
            if (aiResult.career && aiResult.skills && aiResult.courses && aiResult.roadmap) {
                result = aiResult;
            }
        } catch (aiErr) {
            console.warn('Gemini enrichment failed, using keyword match:', aiErr.message);
        }

        // Save to Firebase if uid provided
        if (uid) {
            try {
                await db.collection('careerInterests').doc(uid).set({
                    interest,
                    ...result,
                    timestamp: new Date().toISOString()
                });
            } catch (dbErr) {
                console.warn('DB save failed:', dbErr.message);
            }
        }

        res.json(result);
    } catch (error) {
        console.error('/analyze-career-interest error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── 11. Get Career Interest ───────────────────────────────────────────────────
app.get('/career-interest', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });
        const doc = await db.collection('careerInterests').doc(uid).get();
        if (!doc.exists) return res.status(404).json({ error: 'No career interest found' });
        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
