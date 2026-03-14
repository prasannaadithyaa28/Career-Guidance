import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, User, BrainCircuit, Target, LayoutDashboard, LogOut, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Compass className="text-primary" size={28} />
        <span className="text-gradient">SkillPath</span>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
        {currentUser ? (
          <>
            <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
              <User size={18} /> Profile
            </Link>
            <Link to="/quiz" className={`nav-link ${isActive('/quiz')}`}>
              <BrainCircuit size={18} /> Quiz
            </Link>
            <Link to="/career-interest" className={`nav-link ${isActive('/career-interest')}`}>
              <Sparkles size={18} /> My Path
            </Link>
            <Link to="/recommendation" className={`nav-link ${isActive('/recommendation')}`}>
              <Target size={18} /> Career
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className={`nav-link ${isActive('/login')}`}>
            <LogIn size={18} /> Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
