import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ChevronLeft, SkipForward, AlertOctagon, Brain, Loader } from 'lucide-react';

const Quiz = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});     // { q1: "text" | null (skipped) }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSkipped, setShowSkipped] = useState(false); // review mode

  // Load questions from profile then AI
  useEffect(() => {
    if (!currentUser) return;
    const fetchQuestions = async () => {
      try {
        // Fetch profile for personalized questions
        let profileData = {};
        try {
          const profileRes = await axios.get(`http://localhost:5000/profile?uid=${currentUser.uid}`);
          profileData = profileRes.data;
        } catch (e) {}

        const res = await axios.get('http://localhost:5000/api/generate-quiz');

        const fetchedQuestions = Array.isArray(res.data) ? res.data : res.data.questions || [];
        setQuestions(fetchedQuestions);
        // Initialize all as unanswered
        const init = {};
        fetchedQuestions.forEach(q => { init[q.id] = undefined; });
        setAnswers(init);
      } catch (err) {
        setError('Failed to load questions. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [currentUser]);

  const skippedIds = Object.entries(answers).filter(([, v]) => v === null).map(([k]) => k);
  const answeredCount = Object.values(answers).filter(v => v !== undefined && v !== null).length;
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const handleSelect = (text) => {
    const q = questions[currentIdx];
    setAnswers(prev => ({ ...prev, [q.id]: text }));
  };

  const handleSkip = () => {
    const q = questions[currentIdx];
    setAnswers(prev => ({ ...prev, [q.id]: null }));
    goNext();
  };

  const goNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
    else setShowSkipped(true);
  };

  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const cleaned = {};
      for (const [k, v] of Object.entries(answers)) {
        cleaned[k] = v === undefined ? null : v;
      }
      
      // Calculate scores on the frontend since /submit-quiz is gone
      let scores = { programming: 0, logical: 0, communication: 0, tech_basics: 0 };
      for (const [qId, ansText] of Object.entries(cleaned)) {
          if (!ansText) continue; // skipped
          const question = questions.find(q => q.id === qId);
          if (question) {
              const option = question.options.find(opt => opt.text === ansText);
              if (option && option.score) {
                  for (const [category, points] of Object.entries(option.score)) {
                      scores[category] = (scores[category] || 0) + points;
                  }
              }
          }
      }

      const skippedArray = Object.entries(cleaned).filter(([, v]) => !v).map(([k]) => k);
      
      const resultData = {
          scores,
          skipped: skippedArray,
          aiSummary: "Great work completing the assessment! Your scores reflect your unique strengths."
      };

      // We should also ideally save it to DB here if needed, but the old functionality is fine to just pass to next screen
      // Pass results via navigate state
      navigate('/quiz-results', { state: { result: resultData, questions } });
    } catch (err) {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Brain size={48} color="var(--primary)" />
          <Loader size={64} color="rgba(99,102,241,0.2)" style={{ position: 'absolute', top: '-8px', left: '-8px', animation: 'spin 2s linear infinite' }} />
        </div>
        <h2>AI is generating your personalized questions...</h2>
        <p style={{ color: 'var(--text-muted)' }}>This takes a few seconds</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '15vh' }}>
      <AlertOctagon size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
      <h2>{error}</h2>
    </div>
  );

  if (questions.length === 0) return null;

  // Show skipped review panel
  if (showSkipped) {
    const unanswered = questions.filter(q => answers[q.id] === undefined || answers[q.id] === null);
    if (unanswered.length === 0) {
      return (
        <div className="container fade-in" style={{ textAlign: 'center', maxWidth: '600px', margin: 'auto', paddingTop: '10vh' }}>
          <div className="glass-panel" style={{ padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ marginBottom: '1rem' }}>All Done!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You answered all {questions.length} questions. Ready to see your results?</p>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '1rem' }}>
              {submitting ? 'Analyzing your answers...' : 'Submit & See Results →'}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="container fade-in" style={{ maxWidth: '700px', margin: 'auto', paddingTop: '5vh' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Review Skipped Questions</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You skipped {unanswered.length} question(s). You can answer them now or submit as-is.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
            {unanswered.map((q) => (
              <div key={q.id}>
                <p style={{ fontWeight: '600', marginBottom: '1rem' }}>{q.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {q.options.map((opt, i) => {
                    const isSelected = answers[q.id] === opt.text;
                    return (
                      <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.text }))}
                        style={{ padding: '0.875rem 1.25rem', background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.2)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '8px', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '1rem' }}>
            {submitting ? 'Analyzing your answers...' : 'Submit & See Results →'}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const selectedAnswer = answers[q.id];
  const isSkipped = selectedAnswer === null;

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1 className="page-title text-gradient">Skill Assessment</h1>
        <p className="page-subtitle">Answer each question or skip to revisit later. Answered: {answeredCount}/{questions.length}</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem' }}>

        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {skippedIds.length > 0 && <span style={{ color: 'var(--warning)' }}>⏭ {skippedIds.length} skipped</span>}
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 0.3s' }} />
          </div>
          {/* Question dots */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {questions.map((qu, i) => {
              const ans = answers[qu.id];
              let bg = 'rgba(255,255,255,0.1)';
              if (i === currentIdx) bg = 'var(--primary)';
              else if (ans === null) bg = 'var(--warning)';
              else if (ans) bg = 'var(--success)';
              return (
                <button key={i} onClick={() => setCurrentIdx(i)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', background: bg, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.75rem', color: 'white', fontWeight: '600' }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {isSkipped && <span style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--warning)', padding: '2px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>SKIPPED</span>}
            {q.category && <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize' }}>{q.category.replace('_', ' ')}</span>}
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{q.question}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {q.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt.text;
              return (
                <button key={i} onClick={() => handleSelect(opt.text)}
                  style={{ padding: '1rem 1.25rem', background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.2)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                    {isSelected ? '✓' : String.fromCharCode(65 + i)}
                  </div>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={goPrev} disabled={currentIdx === 0} style={{ opacity: currentIdx === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronLeft size={18} /> Previous
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleSkip} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--warning)', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              <SkipForward size={16} /> Skip
            </button>

            {currentIdx < questions.length - 1 ? (
              <button className="btn btn-primary" onClick={goNext} disabled={selectedAnswer === undefined} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: selectedAnswer === undefined ? 0.6 : 1 }}>
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowSkipped(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Finish <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
