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
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-3">
              Profile overview
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-heading tracking-tight">
              My Profile
            </h1>
            <p className="max-w-3xl text-base text-slate-600 leading-7">
              Manage your user details, update your contact information, and keep your service profile aligned with your current availability.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
                <div className="flex-shrink-0">
                  <div className="relative h-28 w-28 rounded-[28px] bg-slate-100 overflow-hidden shadow-sm">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <UserIcon size={44} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-4xl font-bold text-slate-900 font-heading tracking-tight" data-testid="user-name">
                        {user.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                        {user.role === 'seeker'
                          ? 'You are currently looking for services and job postings.'
                          : 'You are registered as a provider and can receive job requests from service seekers.'}
                      </p>
                    </div>

                    <Link
                      to="/profile/edit"
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20"
                      data-testid="edit-profile-button"
                    >
                      <Edit size={18} />
                      Edit Profile
                    </Link>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-500 font-semibold mb-3">
                        Role
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {user.role === 'seeker' ? 'Service Seeker' : 'Service Provider'}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-500 font-semibold mb-3">
                        Member since
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[24px] bg-slate-50 p-6">
                  <div className="flex items-center gap-3 text-slate-900 font-semibold mb-4">
                    <MapPin size={18} />
                    Contact details
                  </div>
                  <div className="space-y-4 text-slate-600">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Phone</p>
                      <p className="mt-2 text-base text-slate-900">{user.phone || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Address</p>
                      <p className="mt-2 text-base text-slate-900">{user.address || 'Not available'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-6">
                  <div className="flex items-center gap-3 text-slate-900 font-semibold mb-4">
                    <Award size={18} />
                    Account status
                  </div>
                  <p className="text-sm text-slate-600 leading-7">
                    Your profile information is visible in the app and can be updated at any time by tapping the edit button.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] p-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-4 font-heading">Personal information</h3>
                <div className="grid gap-4">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">Full name</p>
                    <p className="text-base text-slate-900">{user.name}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">Profile role</p>
                    <p className="text-base text-slate-900">{user.role === 'seeker' ? 'Service Seeker' : 'Service Provider'}</p>
                  </div>
                  {user.bio && (
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">About</p>
                      <p className="text-base text-slate-900 leading-7">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {user.role === 'provider' && user.skills && user.skills.length > 0 && (
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] p-8">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900 font-heading">Skills</h3>
                      <p className="text-sm text-slate-500">Highlight your strongest capabilities for service seekers.</p>
                    </div>
                    <Award size={24} className="text-primary" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {user.skills.map((skill, index) => (
                      <span key={index} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
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
    </div>
  );
};

export default MyProfile;