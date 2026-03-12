import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Target, TrendingUp, Award, BookOpen, AlertCircle, CheckSquare, Square, Sparkles, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API = 'http://localhost:5000';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [careerInterest, setCareerInterest] = useState(null);
  const [interestSkillsChecked, setInterestSkillsChecked] = useState({});
  const [updatingSkill, setUpdatingSkill] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentUser) return;

        // Fetch recommendations to know what their target roles are
        const recRes = await axios.get(`${API}/career-recommendation?uid=${currentUser.uid}`);
        const recommendedCareers = recRes.data.recommendedCareers;

        // Fetch progress doc
        const progRes = await axios.get(`${API}/progress?uid=${currentUser.uid}`);
        const completedSkills = progRes.data.completedSkills || [];

        // Aggregate all unique required skills from all recommended careers
        let allRequiredSkills = new Set();
        recommendedCareers.forEach((career) => {
          career.requiredSkills.forEach((skill) => allRequiredSkills.add(skill));
        });
        const totalUniqueRequired = Array.from(allRequiredSkills);

        setData({ careers: recommendedCareers, completedSkills, totalUniqueRequired });

        // Build checkbox state from completed skills
        const initialChecked = {};
        completedSkills.forEach((s) => { initialChecked[s] = true; });
        setInterestSkillsChecked(initialChecked);
      } catch (err) {
        console.error(err);
        setError("You haven't completed the quiz or tracking hasn't started yet.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCareerInterest = async () => {
      try {
        if (!currentUser) return;
        const res = await axios.get(`${API}/career-interest?uid=${currentUser.uid}`);
        setCareerInterest(res.data);
      } catch {
        // No career interest saved yet — that's fine
      }
    };

    fetchData();
    fetchCareerInterest();
  }, [currentUser]);

  const handleSkillToggle = async (skill) => {
    if (!currentUser || updatingSkill === skill) return;
    const newValue = !interestSkillsChecked[skill];
    setInterestSkillsChecked((prev) => ({ ...prev, [skill]: newValue }));
    setUpdatingSkill(skill);
    try {
      await axios.post(`${API}/update-progress`, {
        uid: currentUser.uid,
        targetSkill: skill,
        isCompleted: newValue,
      });
      // Refresh completed skills count
      const progRes = await axios.get(`${API}/progress?uid=${currentUser.uid}`);
      const completedSkills = progRes.data.completedSkills || [];
      setData((prev) => prev ? { ...prev, completedSkills } : prev);
    } catch {
      // Revert on failure
      setInterestSkillsChecked((prev) => ({ ...prev, [skill]: !newValue }));
    } finally {
      setUpdatingSkill(null);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>Loading Dashboard...</div>;

  if (error || !data || data.careers.length === 0) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
      <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
      <h2>No Data Available</h2>
      <p style={{ color: 'var(--text-muted)' }}>Complete your profile and take the quiz to unlock the dashboard.</p>
      <Link to="/profile" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Start Now</Link>
    </div>
  );

  const completedCount = data.completedSkills.length;
  const targetCount = data.totalUniqueRequired.length;
  const progressPercent = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;

  const chartData = [
    { name: 'Completed', value: completedCount },
    { name: 'Remaining', value: Math.max(targetCount - completedCount, 0) }
  ];
  const COLORS = ['#10b981', '#1e293b'];

  return (
    <div className="container fade-in">
      <div className="page-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem' }}>Your Dashboard</h1>
        <p className="page-subtitle" style={{ margin: 0 }}>Track your overall progress across all recommended career paths.</p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '2rem' }}>

        {/* Top Stats */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '16px' }}>
            <Target size={32} color="var(--primary)" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Target Paths</p>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{data.careers.length}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '16px' }}>
            <Award size={32} color="var(--success)" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Skills Mastered</p>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{completedCount}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '16px' }}>
            <TrendingUp size={32} color="var(--secondary)" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Overall Readiness</p>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{progressPercent}%</h3>
          </div>
        </div>

        {/* Chart Area */}
        <div className="glass-panel" style={{ gridColumn: 'span 1', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px' }}>
          <h3 style={{ marginBottom: '1rem', width: '100%', textAlign: 'left' }}>Global Progress</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'white' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[0] }} /> Completed
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[1] }} /> Remaining
            </div>
          </div>
        </div>

        {/* Recommended Paths Recap */}
        <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '2rem', height: '350px', overflowY: 'auto' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <BookOpen size={20} className="text-primary" /> Active Learning Paths
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.careers.map((career, i) => {
              const reqLen = career.requiredSkills.length;
              const compLen = career.requiredSkills.filter((s) => data.completedSkills.includes(s)).length;
              const pct = reqLen > 0 ? Math.round((compLen / reqLen) * 100) : 0;
              return (
                <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{career.title}</h4>
                    <span style={{ fontWeight: 'bold', color: pct === 100 ? 'var(--success)' : 'white' }}>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }} />
                  </div>
                  <Link to={`/skill-gap/${career.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Continue Path &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ─── Career Interest Skills Tracker ─────────────────────────────────── */}
      {careerInterest ? (
        <div className="glass-panel fade-in" style={{ marginTop: '2.5rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '10px', padding: '0.6rem' }}>
                <Sparkles size={22} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Career Interest Skills Tracker</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Goal: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{careerInterest.career}</span>
                  &nbsp;·&nbsp;Check off skills as you learn them
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/career-interest')}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              Update Interest <ChevronRight size={16} />
            </button>
          </div>

          {/* Skills checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {careerInterest.skills?.map((skill, i) => {
              const isChecked = !!interestSkillsChecked[skill];
              const isUpdating = updatingSkill === skill;
              return (
                <button
                  key={i}
                  onClick={() => handleSkillToggle(skill)}
                  disabled={isUpdating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: isChecked ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isChecked ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px',
                    padding: '0.875rem 1.125rem',
                    cursor: isUpdating ? 'wait' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    opacity: isUpdating ? 0.6 : 1,
                    color: 'inherit',
                  }}
                >
                  {isChecked
                    ? <CheckSquare size={20} color="#10b981" style={{ flexShrink: 0 }} />
                    : <Square size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
                  <span style={{ fontSize: '0.95rem', textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--text-muted)' : 'inherit' }}>
                    {skill}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress bar for interest skills */}
          {careerInterest.skills?.length > 0 && (() => {
            const total = careerInterest.skills.length;
            const done = careerInterest.skills.filter((s) => interestSkillsChecked[s]).length;
            const pct = Math.round((done / total) * 100);
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>{done} / {total} skills completed</span>
                  <span style={{ fontWeight: '600', color: pct === 100 ? '#10b981' : 'var(--primary)' }}>{pct}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, var(--primary), #ec4899)', transition: 'width 0.5s ease', borderRadius: '4px' }} />
                </div>
                {pct === 100 && (
                  <div style={{ textAlign: 'center', marginTop: '1rem', color: '#10b981', fontWeight: '600', fontSize: '1rem' }}>
                    🎉 All skills completed! You're ready for your {careerInterest.career} journey!
                  </div>
                )}
              </div>
            );
          })()}

          {/* Roadmap preview */}
          {careerInterest.roadmap?.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Learning Roadmap</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {careerInterest.roadmap.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.875rem',
                      fontSize: '0.85rem',
                      color: 'var(--primary)',
                    }}>
                      {i + 1}. {step}
                    </span>
                    {i < careerInterest.roadmap.length - 1 && (
                      <ChevronRight size={14} color="var(--text-muted)" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No career interest saved yet — prompt user */
        <div
          className="glass-panel fade-in"
          style={{
            marginTop: '2.5rem',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px dashed rgba(99,102,241,0.3)',
          }}
        >
          <Sparkles size={40} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.7 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Discover Your Career Path</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Tell us your career interests and get a personalized roadmap with skills to track right here on your dashboard.
          </p>
          <button onClick={() => navigate('/career-interest')} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} /> Discover My Career Path
          </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
