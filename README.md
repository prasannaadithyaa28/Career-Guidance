 # Career Guidance App

An AI-powered career guidance platform that helps students discover suitable tech career paths through personalized quizzes, skill analysis, and interest-based recommendations.

## Features

- **Profile Management**: Create and fetch student profiles using a unique `uid`.
- **AI-Generated Quiz**: Uses Gemini (`gemini-1.5-flash`) to generate 10 aptitude questions covering programming, logical reasoning, communication, and tech basics.
- **Quiz Scoring & Summary**: Scores answers, tracks skipped questions, and generates an AI-written motivational summary.
- **Career Recommendations**: Suggests careers based on quiz scores and predefined criteria from `careers.json`.
- **Interest-Based Suggestions**: Analyzes free-text interests and returns tailored career paths, skills, courses, and learning roadmaps (via AI, with keyword fallbacks).
- **Skill Gap Analysis**: Compares a user’s current skills against a target role and returns missing skills and a learning path.
- **Progress Tracking**: Store and retrieve completed skills per user.

## Tech Stack

- **Backend**: Node.js, Express
- **AI**: Google Generative AI (Gemini)
- **Database**: Firebase Firestore (via `firebaseAdmin`)
- **Other**: CORS, environment variables via `dotenv`

## Project Structure (backend)

- `backend/server.js` – Main Express server with all API endpoints.
- `backend/firebaseAdmin.js` – Firebase Admin SDK initialization (Firestore).
- `backend/data/careers.json` – Career definitions, criteria, learning paths, and courses.
- `backend/data/quiz.json` – Fallback static quiz questions if AI generation fails.

> Note: If you have a frontend (e.g. React or Next.js), it will typically live in a `frontend` directory and talk to these endpoints.

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- A Firebase project with Firestore enabled
- A Google Generative AI (Gemini) API key

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd career-guid
cd backend
npm install
```

### 3. Environment Variables

Create a `.env` file inside the `backend` folder with:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key_with_newlines_escaped"
PORT=5000
```

Adjust the Firebase-related variables to match how `firebaseAdmin.js` is implemented in your project.

### 4. Run the Backend

```bash
cd backend
npm start   # or: node server.js / nodemon server.js
```

The server will run on `http://localhost:5000` by default (or the `PORT` you set).

## Key API Endpoints

- **POST** `/create-profile` – Create a user profile.
- **GET** `/profile?uid=...` – Get a user profile.
- **GET** `/check-profile/:uid` – Check whether a profile exists.
- **POST** `/generate-questions` – Generate quiz questions via Gemini.
- **POST** `/submit-quiz` – Submit quiz answers and store results.
- **GET** `/career-recommendation?uid=...` – Get score-based career recommendations.
- **POST** `/career-suggestion` – Get AI-crafted career suggestions based on interests.
- **GET** `/skill-gap?roleId=...&uid=...` – Skill gap analysis for a target role.
- **POST** `/update-progress` – Update a user’s completed skills.
- **GET** `/progress?uid=...` – Get a user’s learning progress.
- **POST** `/analyze-career-interest` – Analyze a free-text interest and return an AI-enriched roadmap.
- **GET** `/career-interest?uid=...` – Get the saved career interest analysis.

## Deployment Notes

- Ensure environment variables are configured in your hosting platform (e.g. Render, Railway, Vercel backend, or a VM).
- Protect your Gemini and Firebase credentials; never commit `.env` to version control.

## Future Improvements

- Add authentication (e.g. Firebase Auth) to secure user data.
- Build a dedicated frontend for students and counselors.
- Add localization and multi-language support.

