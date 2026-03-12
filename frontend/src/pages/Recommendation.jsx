import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Trophy, AlertTriangle, Sparkles, Send, Loader } from 'lucide-react';

const Recommendation = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();

    // AI interest suggestion state
    const [interests, setInterests] = useState('');
    const [aiResult, setAiResult] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                if (!currentUser) return;
                const res = await axios.get(`http://localhost:5000/career-recommendation?uid=${currentUser.uid}`);
                setData(res.data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || 'Failed to load recommendations. Please take the quiz first.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [currentUser]);

    const handleAISuggest = async (e) => {
        e.preventDefault();
        if (!interests.trim()) return;
        setAiLoading(true);
        setAiError('');
        setAiResult(null);
        try {
            const res = await axios.post('http://localhost:5000/career-suggestion', {
                uid: currentUser.uid,
                interests
            });
            setAiResult(res.data);
        } catch (err) {
            setAiError('AI suggestion failed. Please check your Gemini API key in the backend .env file.');
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) return (
        <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}>
            <div style={{ display: 'inline-block', width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ marginTop: '1rem' }}>Analyzing your profile...</h2>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="container fade-in">
            <div className="page-header">
                <h1 className="page-title text-gradient">Your Career Matches</h1>
                <p className="page-subtitle">Based on your quiz results and interests, here are the best paths for you.</p>
            </div>

            {/* ─── AI Interest Suggester ─────────────────────────────── */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', borderTop: '3px solid var(--primary)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={20} color="var(--primary)" /> AI Career Advisor
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Describe your interests, passions, or dream job — our AI will suggest tailored career paths just for you.
                </p>
                <form onSubmit={handleAISuggest} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <textarea
                            value={interests}
                            onChange={e => setInterests(e.target.value)}
                            placeholder="e.g. I love building things, enjoy problem-solving, and I'm fascinated by AI and automation..."
                            className="form-control"
                            rows={3}
                            style={{ resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </div>
                    <button type="submit" disabled={aiLoading || !interests.trim()} className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', height: 'fit-content', opacity: !interests.trim() ? 0.6 : 1 }}>
                        {aiLoading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Thinking...</> : <><Send size={16} /> Get Suggestions</>}
                    </button>
                </form>

                {aiError && (
                    <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
                        {aiError}
                    </div>
                )}

                {aiResult && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                            "{aiResult.encouragement}"
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {aiResult.suggestions?.map((s, i) => (
                                <div key={i} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{s.title}</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>{s.reason}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {s.skills?.map((skill, j) => (
                                            <span key={j} style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Score-Based Recommendations ──────────────────────────── */}
            {error ? (
                <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                    <h2>{error}</h2>
                    <Link to="/quiz" className="btn btn-primary" style={{ marginTop: '1rem' }}>Take the Quiz</Link>
                </div>
            ) : data && (
                <>
                    {/* Score Summary */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
                        {Object.entries({ Programming: 'programming', Logical: 'logical', Communication: 'communication', 'Tech Basics': 'tech_basics' }).map(([label, key]) => (
                            <div key={key} style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{label}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{data.userScores?.[key] || 0}</div>
                            </div>
                        ))}
                    </div>

                    {/* AI Summary from quiz */}
                    {data.aiSummary && (
                        <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>✨ {data.aiSummary}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2">
                        {data.recommendedCareers?.length > 0 ? (
                            data.recommendedCareers.map((career, i) => (
                                <div key={i} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px' }}>
                                            <Trophy size={28} color="var(--warning)" />
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{career.title}</h3>
                                    </div>
                                    <div style={{ marginBottom: '1.5rem', flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {career.requiredSkills.slice(0, 4).map((skill, j) => (
                                            <span key={j} style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.85rem' }}>{skill}</span>
                                        ))}
                                        {career.requiredSkills.length > 4 && <span style={{ padding: '4px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>+{career.requiredSkills.length - 4} more</span>}
                                    </div>
                                    <Link to={`/skill-gap/${career.id}`} className="btn btn-outline" style={{ justifyContent: 'space-between', width: '100%' }}>
                                        View Skill Gaps & Path <ArrowRight size={18} />
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="glass-panel" style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                                <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                <h3>We need more data</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Complete the quiz to unlock personalized career recommendations.</p>
                                <Link to="/quiz" className="btn btn-primary">Take the Quiz</Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Recommendation;
