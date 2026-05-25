import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../utils/toast';

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user.name || '',
    address: user.address || '',
    profilePhoto: user.profilePhoto || '',
    bio: user.bio || '',
    skills: user.skills || []
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch(`/api/users/${user._id}`, formData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className= "min-h-screen bg-white">
      <Header />

      <div className= "py-16 md:py-24 px-6 md:px-12 ">
        <div className= "max-w-2xl mx-auto ">
          <h1 className= "text-4xl md:text-5xl font-bold text-slate-900 mb-8 font-heading tracking-tight " data-testid= "edit-profile-heading ">
            Edit Profile
          </h1>

          <form onSubmit={handleSubmit} className= "space-y-6 ">
            <div>
              <label htmlFor= "name " className= "block text-sm font-medium text-slate-900 mb-2 ">
                Name *
              </label>
              <input
                id= "name "
                name= "name "
                type= "text "
                value={formData.name}
                onChange={handleChange}
                className= "border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all "
                data-testid= "name-input "
                />
            </div>

            <div>
              <label htmlFor= "address " className= "block text-sm font-medium text-slate-900 mb-2 ">
                Address
              </label>
              <input
                id= "address "
                name= "address "
                type= "text "
                placeholder= "Enter your address "
                value={formData.address}
                onChange={handleChange}
                className= "border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all "
                data-testid= "address-input "
              />
            </div>

            <div>
              <label htmlFor= "profilePhoto " className= "block text-sm font-medium text-slate-900 mb-2 ">
                Profile Photo URL
              </label>
              <input
                id= "profilePhoto "
                name= "profilePhoto "
                type= "url "
                placeholder= "https://example.com/photo.jpg "
                value={formData.profilePhoto}
                onChange={handleChange}
                className= "border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all "
                data-testid= "profile-photo-input "
              />
            </div>

            {user.role === 'provider' && (
              <>
                <div>
                  <label htmlFor= "bio " className= "block text-sm font-medium text-slate-900 mb-2 ">
                    Bio
                  </label>
                  <textarea
                    id= "bio "
                    name= "bio "
                    rows= "4 "
                    placeholder= "Tell clients about yourself and your experience... "
                    value={formData.bio}
                    onChange={handleChange}
                    className= "border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all "
                    data-testid= "bio-input "
                  />
                </div>

                <div>
                  <label htmlFor= "skills " className= "block text-sm font-medium text-slate-900 mb-2 ">
                    Skills
                  </label>
                  <div className= "flex gap-2 mb-3 ">
                    <input
                      id= "skills "
                      type= "text "
                      placeholder= "Add a skill "
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(e)}
                      className= "border border-slate-200 rounded-none px-4 py-3 flex-1 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all "
                      data-testid= "skill-input "
                    />
                    <button
                      type= "button "
                      onClick={handleAddSkill}
                      className= "bg-slate-100 text-slate-900 rounded-none px-6 py-3 font-medium hover:bg-slate-200 transition-all "
                      data-testid= "add-skill-button "
                    >
                      Add
                    </button>
                  </div>

                  {formData.skills.length > 0 && (
                    <div className= "flex flex-wrap gap-2 " data-testid= "skills-list ">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className= "px-4 py-2 bg-slate-100 text-slate-700 text-sm flex items-center gap-2 "
                        >
                          {skill}
                          <button
                            type= "button "
                            onClick={() => handleRemoveSkill(skill)}
                            className= "text-slate-500 hover:text-danger "
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className= "flex gap-4 pt-4 ">
              <button
                type= "submit "
                disabled={loading}
                className= "flex-1 bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all disabled:opacity-50 "
                data-testid= "save-profile-button "
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type= "button "
                onClick={() => navigate('/profile')}
                className= "flex-1 border border-slate-200 bg-transparent text-slate-900 rounded-none px-6 py-3 hover:border-slate-300 "
                data-testid= "cancel-button "
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
