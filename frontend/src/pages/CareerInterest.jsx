import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles, Send, Loader, CheckCircle, BookOpen,
  Map, Briefcase, Plus, ArrowRight, RotateCcw, ChevronRight
} from 'lucide-react';

const API = 'http://localhost:5000';

const CareerInterest = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const EXAMPLE_PROMPTS = [
    'I want to become a data scientist',
    'I like coding and building websites',
    'I am interested in artificial intelligence and machine learning',
    'I want to work in cybersecurity',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interest.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    try {
      const res = await axios.post(`${API}/analyze-career-interest`, {
        uid: currentUser?.uid,
        interest: interest.trim(),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTracker = async () => {
    if (!result || !currentUser) return;
    setSaving(true);
    setError('');
    try {
      // Save each skill as uncompleted to the progress tracker
      const skillPromises = result.skills.map((skill) =>
        axios.post(`${API}/update-progress`, {
          uid: currentUser.uid,
          targetSkill: skill,
          isCompleted: false,
        })
      );
      await Promise.all(skillPromises);
      setSaved(true);
    } catch (err) {
      setError('Failed to save to tracker. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setInterest('');
    setSaved(false);
    setError('');
  };

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1 className="page-title text-gradient">Discover Your Career Path</h1>
        <p className="page-subtitle">
          Tell us what excites you — we'll analyze your interest and build a personalized roadmap.
        </p>
      </div>

      {/* Input Section */}
      <div
        className="glass-panel"
        style={{ padding: '2.5rem', marginBottom: '2.5rem', maxWidth: '780px', margin: '0 auto 2.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '10px', padding: '0.6rem' }}>
            <Sparkles size={22} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>What career are you interested in?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Describe in your own words — be as detailed as you like.
            </p>
          </div>
        </div>

        {/* Example chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInterest(ex)}
              style={{
                background: interest === ex ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: 'var(--primary)',
                borderRadius: '99px',
                padding: '4px 14px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(99,102,241,0.22)')}
              onMouseLeave={(e) =>
                (e.target.style.background =
                  interest === ex ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)')
              }
            >
              {ex}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            id="career-interest-input"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. I love problem-solving and I'm fascinated by how AI models work. I want to build intelligent applications..."
            className="form-control"
            rows={5}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.25rem' }}
            required
          />
          <button
            id="analyze-btn"
            type="submit"
            disabled={loading || !interest.trim()}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: !interest.trim() ? 0.6 : 1,
            }}
          >
            {loading ? (
              <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing your interest...</>
            ) : (
              <><Send size={18} /> Analyze &amp; Get Roadmap</>
            )}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.875rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Results */}
      {result && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="fade-in">

          {/* Career Title Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(236,72,153,0.15))',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '14px', padding: '1rem' }}>
                <Briefcase size={32} color="var(--primary)" />
              </div>
              <div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '0.3rem',
                  }}
                >
                  Recommended Career
                </div>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{result.career}</h2>
              </div>
            </div>

            <button
              id="add-to-tracker-btn"
              onClick={handleAddToTracker}
              disabled={saved || saving}
              className={saved ? 'btn btn-outline' : 'btn btn-primary'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? (
                <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              ) : saved ? (
                <><CheckCircle size={16} /> Added to Tracker!</>
              ) : (
                <><Plus size={16} /> Add to My Progress Tracker</>
              )}
            </button>
          </div>

          {/* Cards Grid */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}
          >
            {/* Skills Card */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(16,185,129,0.15)', borderRadius: '8px', padding: '0.5rem' }}>
                  <CheckCircle size={20} color="#10b981" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Skills to Learn</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {result.skills?.map((skill, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            {/* Courses Card */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: '8px', padding: '0.5rem' }}>
                  <BookOpen size={20} color="#f59e0b" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Courses to Study</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.courses?.map((course, i) => (
                  <li
                    key={i}
                    style={{
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.875rem',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.8rem' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {course}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Roadmap Card */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
              <div style={{ background: 'rgba(236,72,153,0.15)', borderRadius: '8px', padding: '0.5rem' }}>
                <Map size={20} color="#ec4899" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Learning Roadmap</h3>
            </div>
            <div style={{ position: 'relative' }}>
              {result.roadmap?.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: i < result.roadmap.length - 1 ? '1.5rem' : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #ec4899)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        color: 'white',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < result.roadmap.length - 1 && (
                      <div
                        style={{
                          width: '2px',
                          flexGrow: 1,
                          background: 'linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(99,102,241,0.05))',
                          marginTop: '4px',
                          minHeight: '24px',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingTop: '0.5rem', paddingBottom: i < result.roadmap.length - 1 ? '0.5rem' : 0 }}>
                    <p style={{ margin: 0, fontSize: '0.975rem', lineHeight: 1.5 }}>{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved banner */}
          {saved && (
            <div
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: '12px',
                padding: '1.25rem 1.75rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={22} color="#10b981" />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1rem', color: '#10b981' }}>Skills saved to your tracker!</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Head to your Dashboard to track your progress with checkboxes.
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
              >
                View Dashboard <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', paddingBottom: '3rem' }}>
            <button
              onClick={handleReset}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCcw size={16} /> Try Another Interest
            </button>
            <button
              onClick={() => navigate('/recommendation')}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Explore All Careers <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerInterest;
