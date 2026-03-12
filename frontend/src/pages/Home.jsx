import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpen, Target } from 'lucide-react';

const Home = () => {
  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="container" style={{ textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '9999px', color: 'var(--primary)', marginBottom: '2rem', fontWeight: '600' }}>
          <Sparkles size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> 
          Discover Your True Potential
        </div>
        
        <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem', fontWeight: '800', lineHeight: '1.1' }}>
          Navigate Your Future with <br />
          <span className="text-gradient">Smart Guidance</span>
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
          Analyze your skills, identify gaps, and discover the perfect career path tailored just for you. Our AI-driven platform provides actionable learning paths to help you land your dream job.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/profile" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            Get Started Now <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container" style={{ paddingBottom: '6rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>How It Works</h2>
        <div className="grid grid-cols-3">
          
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.5rem' }}>
              <Target size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Skill Analysis</h3>
            <p style={{ color: 'var(--text-muted)' }}>Take our comprehensive quiz to evaluate your technical, logical, and communication skills.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2.5rem' }}>
             <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', marginBottom: '1.5rem' }}>
               <Sparkles size={24} />
             </div>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Career Matching</h3>
             <p style={{ color: 'var(--text-muted)' }}>Get personalized career recommendations based on your unique skill profile and strengths.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2.5rem' }}>
             <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: '1.5rem' }}>
               <BookOpen size={24} />
             </div>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Learning Paths</h3>
             <p style={{ color: 'var(--text-muted)' }}>Identify skill gaps and follow structured learning resources to achieve your career goals.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
