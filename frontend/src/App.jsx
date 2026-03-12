import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import QuizResults from './pages/QuizResults';
import Recommendation from './pages/Recommendation';
import SkillGap from './pages/SkillGap';
import Dashboard from './pages/Dashboard';
import CareerInterest from './pages/CareerInterest';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main style={{ padding: '2rem 0' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
            <Route path="/quiz-results" element={<PrivateRoute><QuizResults /></PrivateRoute>} />
            <Route path="/recommendation" element={<PrivateRoute><Recommendation /></PrivateRoute>} />
            <Route path="/skill-gap/:roleId" element={<PrivateRoute><SkillGap /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/career-interest" element={<PrivateRoute><CareerInterest /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
