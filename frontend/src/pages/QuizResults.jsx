import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, ArrowRight, SkipForward, RefreshCw, Sparkles, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_LABELS = {
  programming: 'Programming',
  logical: 'Logical',
  communication: 'Communication',
  tech_basics: 'Tech Basics'
};
const COLORS = { programming: '#6366f1', logical: '#ec4899', communication: '#10b981', tech_basics: '#f59e0b' };

const QuizResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [aiCareers, setAiCareers] = useState(null);
  const [loadingCareers, setLoadingCareers] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchCareers = async () => {
      try {
        try {
          const res = await axios.get(`http://localhost:5000/recommendations?uid=${currentUser.uid}`);
          setAiCareers(res.data.recommendedCareers);
        } catch (err) {
          if (err.response?.status === 404) {
            const genRes = await axios.post(`http://localhost:5000/recommend-careers`, { uid: currentUser.uid });
            setAiCareers(genRes.data.recommendedCareers);
          } else {
            throw err;
          }
        }
      } catch (e) {
        console.error("Failed to load AI careers for result page:", e);
      } finally {
        setLoadingCareers(false);
      }
    };
    fetchCareers();
  }, [currentUser]);

  if (!state?.result) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '15vh' }}>
        <h2>No results found.</h2>
        <button className="btn btn-primary" onClick={() => navigate('/quiz')} style={{ marginTop: '1rem' }}>Take the Quiz</button>
      </div>
    );
  }

  const { scores, skipped = [], aiSummary } = state.result;
  const maxScore = 100;

  const radarData = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    subject: label,
    score: scores[key] || 0,
    fullMark: maxScore
  }));

  const displayCareers = aiCareers || [];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxTotal = Object.keys(scores).length * maxScore;
  const percentage = Math.round((totalScore / maxTotal) * 100);

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1 className="page-title text-gradient">Your Results</h1>
        <p className="page-subtitle">Here's a breakdown of your strengths and recommended career paths.</p>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>

        {/* Score Overview */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Score Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(scores).map(([key, val]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <span style={{ color: COLORS[key] || 'white', fontWeight: '600' }}>{CATEGORY_LABELS[key]}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{val} / {maxScore}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min((val / maxScore) * 100, 100)}%`, height: '100%', background: COLORS[key] || 'var(--primary)', borderRadius: '4px', transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)' }}>{percentage}%</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Overall Aptitude Score</div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem' }}>Skill Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Radar name="You" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} itemStyle={{ color: 'white' }} />
            </RadarChart>
          </ResponsiveContainer>

          {skipped.length > 0 && (
            <div style={{ marginTop: 'auto', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--warning)' }}>
              <SkipForward size={16} /> You skipped {skipped.length} question(s) — scores reflect answered questions only.
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✨ AI Insight
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1rem' }}>{aiSummary}</p>
        </div>
      )}

      {/* Career Recommendations */}
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
        <Trophy size={22} style={{ marginRight: '0.5rem' }} color="var(--warning)" />
        Recommended Career Paths
        {loadingCareers && <Loader size={18} style={{ marginLeft: '1rem', animation: 'spin 1s linear infinite' }} color="var(--primary)" />}
      </h2>
      <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '3rem' }}>
        {!loadingCareers && displayCareers.map((career, i) => (
          <div key={i} className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-bright)' }}>{career.title}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {career.skills?.slice(0, 4).map((skill, j) => (
                <span key={j} style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem' }}>{skill}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              <strong>Next Step:</strong> {career.learningPath?.[0]}
            </p>
            <Link to="/recommendation" className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              View Full Details <ArrowRight size={18} />
            </Link>
          </div>
        ))}
        {!loadingCareers && displayCareers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No personalized career recommendations could be generated at this time.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', paddingBottom: '3rem' }}>
        <button
          onClick={() => navigate('/career-interest')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem', fontSize: '1rem' }}
        >
          <Sparkles size={18} /> Discover Your Career Path
        </button>
        <Link to="/recommendation" className="btn btn-outline">Explore All Careers →</Link>
        <button onClick={() => navigate('/quiz')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Retake Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
