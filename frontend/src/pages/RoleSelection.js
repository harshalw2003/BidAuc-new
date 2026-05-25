import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Wrench } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

const RoleSelection = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const phone = location.state?.phone;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !role) {
      toast.error('Please enter your name and select a role');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', { phone, name, role });
      login(response.data.user);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/a65215cc-1af9-49fb-adba-a050f0ccd8b2/images/6fdb1da7a4425f7079e157cc4fa49a295b46a0f0399d96e71ece64a6351bbc51.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-white border border-slate-200 p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-heading tracking-tight">Complete Your Profile</h1>
          <p className="text-base text-slate-600 font-body">Tell us about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
              data-testid="name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-4">
              I am a
            </label>
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => setRole('seeker')}
                className={`border p-6 transition-all flex items-center gap-4 ${
                  role === 'seeker'
                    ? 'border-primary bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="role-seeker-button"
              >
                <Briefcase size={32} className={role === 'seeker' ? 'text-primary' : 'text-slate-400'} />
                <div className="text-left">
                  <div className="font-medium text-slate-900">Service Seeker</div>
                  <div className="text-sm text-slate-600">I need help with tasks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`border p-6 transition-all flex items-center gap-4 ${
                  role === 'provider'
                    ? 'border-primary bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid="role-provider-button"
              >
                <Wrench size={32} className={role === 'provider' ? 'text-primary' : 'text-slate-400'} />
                <div className="text-left">
                  <div className="font-medium text-slate-900">Service Provider</div>
                  <div className="text-sm text-slate-600">I provide services</div>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !role}
            className="w-full bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all disabled:opacity-50"
            data-testid="complete-registration-button"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection;