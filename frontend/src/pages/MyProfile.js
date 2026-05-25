import React from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, Edit, MapPin, Award } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const MyProfile = () => {
  const { user } = useAuth();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight">My Profile</h1>
            <Link
              to="/profile/edit"
              className="flex items-center gap-2 bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all"
              data-testid="edit-profile-button"
            >
              <Edit size={18} />
              Edit Profile
            </Link>
          </div>

          <div className="bg-white border border-slate-200 p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-slate-900 mb-2 font-heading tracking-tight" data-testid="user-name">
                  {user.name}
                </h2>
                <div className="flex items-center gap-4 text-slate-600 mb-4">
                  <span className="flex items-center gap-1">
                    <UserIcon size={16} />
                    {user.phone}
                  </span>
                  {user.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {user.address}
                    </span>
                  )}
                </div>
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary text-white">
                  {user.role === 'seeker' ? 'SERVICE SEEKER' : 'SERVICE PROVIDER'}
                </span>
                <p className="text-sm text-slate-500 mt-3">
                  Member since {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            {user.bio && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-3 font-heading">About</h3>
                <p className="text-slate-600 leading-relaxed">{user.bio}</p>
              </div>
            )}

            {user.role === 'provider' && user.skills && user.skills.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3 font-heading flex items-center gap-2">
                  <Award size={20} />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;