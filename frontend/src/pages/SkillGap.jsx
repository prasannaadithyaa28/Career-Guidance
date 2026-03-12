import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Circle, AlertCircle, ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';

const SkillGap = () => {
    const { roleId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth(); // Replaced signInMocker

    useEffect(() => {
        const fetchGap = async () => {
            try {
                if (!currentUser) return;
                const res = await axios.get(`http://localhost:5000/skill-gap?uid=${currentUser.uid}&roleId=${roleId}`);
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGap();
    }, [roleId]);

    const handleUpdateProgress = async (skill, isCompleted) => {
        try {
            if (!currentUser) return;
            await axios.post('http://localhost:5000/update-progress', {
                uid: currentUser.uid,
                targetSkill: skill,
                isCompleted
            });
            // Update local state without refetching for immediate UI response
            setData(prev => {
                const newUserSkills = isCompleted 
                    ? [...prev.userSkills, skill] 
                    : prev.userSkills.filter(s => s !== skill);
                return {
                    ...prev,
                    userSkills: newUserSkills,
                    missingSkills: prev.requiredSkills.filter(s => !newUserSkills.includes(s))
                };
            });
        } catch (error) {
            console.error(error);
            alert("Failed to update progress.");
        }
    };

    if (loading || !data) return <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>Loading analysis...</div>;

    const completionPercent = Math.round((data.userSkills.length / data.requiredSkills.length) * 100) || 0;

    return (
        <div className="container fade-in">
            <Link to="/recommendation" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', transition: 'color 0.2s', '&:hover': { color: 'white' } }}>
                <ArrowLeft size={18} /> Back to Recommendations
            </Link>
            
            <div className="page-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem' }}>{data.role} Roadmap</h1>
                <p className="page-subtitle" style={{ margin: 0 }}>Review your skill gaps and track your progress to become a {data.role}.</p>
            </div>

            <div className="grid grid-cols-3">
                
                {/* Left Column - Skills Checklist */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Required Skills</h2>
                            <div style={{ color: completionPercent === 100 ? 'var(--success)' : 'var(--primary)', fontWeight: 'bold' }}>
                                {completionPercent}% Ready
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '2rem' }}>
                            <div style={{ width: `${completionPercent}%`, height: '100%', background: completionPercent === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }}></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.requiredSkills.map((skill, i) => {
                                const isAcquired = data.userSkills.includes(skill);
                                return (
                                    <div 
                                      key={i} 
                                      onClick={() => handleUpdateProgress(skill, !isAcquired)}
                                      style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '1rem', 
                                          padding: '1.25rem', 
                                          background: isAcquired ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', 
                                          border: `1px solid ${isAcquired ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                                          borderRadius: '12px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                      }}
                                    >
                                        {isAcquired ? <CheckCircle2 color="var(--success)" /> : <Circle color="var(--text-muted)" />}
                                        <span style={{ flexGrow: 1, fontSize: '1.1rem', color: isAcquired ? 'white' : 'var(--text-muted)', textDecoration: isAcquired ? 'line-through' : 'none', opacity: isAcquired ? 0.7 : 1 }}>
                                            {skill}
                                        </span>
                                        {!isAcquired && <span style={{ fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '2px 8px', borderRadius: '4px' }}>Gap Detected</span>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column - Learning Resources */}
                <div>
                    <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                            <BookOpen size={20} className="text-primary" /> Learning Path
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                            {data.learningPath.map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{step}</p>
                                </div>
                            ))}
                        </div>

                        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recommended Courses</h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {data.courses.map((course, i) => (
                                <li key={i}>
                                    <a href="#" onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-main)', textDecoration: 'none', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', transition: 'border-color 0.2s', '&:hover': { borderColor: 'var(--primary)' } }}>
                                        <ExternalLink size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
                                        <span style={{ fontSize: '0.9rem' }}>{course}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SkillGap;
