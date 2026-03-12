import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Replaced signInMocker
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    lastStudied: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const res = await axios.get(`http://localhost:5000/profile?uid=${currentUser.uid}`);
        if (res.data && res.data.name) {
          setFormData({
            name: res.data.name || '',
            age: res.data.age || '',
            lastStudied: res.data.lastStudied || ''
          });
          setIsUpdate(true);
        }
      } catch (err) {
        // No profile found, which is fine for a new user
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!currentUser) {
        setLoading(false);
        return;
    }
    
    try {
      await axios.post('http://localhost:5000/create-profile', {
        uid: currentUser.uid,
        ...formData
      });
      // If it was just an update from Dashboard, go back there.
      if (isUpdate) {
        navigate('/dashboard');
      } else {
        // New user setup flow -> go to quiz
        navigate('/quiz');
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to save profile. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>Loading profile...</div>;
  }

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1 className="page-title text-gradient">{isUpdate ? 'Update Your Profile' : "Let's Get Started"}</h1>
        <p className="page-subtitle">{isUpdate ? 'Update your information below to personalize your career recommendations.' : 'Tell us a bit about yourself to personalize your career recommendations.'}</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              name="name" 
              className="form-control" 
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <input 
              type="number" 
              name="age" 
              className="form-control" 
              required
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g. 21"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Last Studied (School / College)</label>
            <input 
              type="text" 
              name="lastStudied" 
              className="form-control" 
              required
              value={formData.lastStudied}
              onChange={handleChange}
              placeholder="e.g. B.Tech Computer Science"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving Profile...' : (isUpdate ? 'Update Profile' : 'Continue to Skill Quiz')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
