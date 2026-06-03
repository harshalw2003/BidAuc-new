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
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-3">
              Profile management
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-heading tracking-tight" data-testid="edit-profile-heading">
              Edit Profile
            </h1>
            <p className="max-w-3xl text-base text-slate-600 leading-7">
              Update your name, address, profile photo, and skills so your profile stays fresh and discoverable.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-2">
                    Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    data-testid="name-input"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-900 mb-2">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={handleChange}
                    className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    data-testid="address-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profilePhoto" className="block text-sm font-medium text-slate-900 mb-2">
                  Profile Photo URL
                </label>
                <input
                  id="profilePhoto"
                  name="profilePhoto"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.profilePhoto}
                  onChange={handleChange}
                  className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  data-testid="profile-photo-input"
                />
              </div>

              {user.role === 'provider' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-900 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="5"
                      placeholder="Tell clients about yourself and your experience..."
                      value={formData.bio}
                      onChange={handleChange}
                      className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                      data-testid="bio-input"
                    />
                  </div>

                  <div className="rounded-[24px] bg-slate-50 p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">Skills</p>
                        <p className="text-sm text-slate-600 mt-1">Add the top skills that best describe your services.</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id="skills"
                          type="text"
                          placeholder="Add a skill"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(e)}
                          className="border border-slate-200 rounded-[20px] px-4 py-3 flex-1 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                          data-testid="skill-input"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                          data-testid="add-skill-button"
                        >
                          Add Skill
                        </button>
                      </div>

                      {formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2" data-testid="skills-list">
                          {formData.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="text-slate-500 hover:text-danger"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                  data-testid="save-profile-button"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
