import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, DollarSign, Clock } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../utils/toast';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    fetchJobs();
  }, [activeTab, categoryFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/categories/');
        setCategories(res.data || []);
      } catch (err) {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  const getCategoryName = (cat) => {
    if (!cat) return null;
    if (typeof cat === 'string') {
      const found = categories.find((c) => c._id === cat);
      return found ? found.name : null;
    }
    return cat.name || null;
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/jobs/';
      const params = new URLSearchParams();

      if (user) {
        if (user.role === 'seeker') {
          if (activeTab === 'my') {
            endpoint = '/api/jobs/my';
          } else if (activeTab === 'active') {
            params.append('status', 'active');
            endpoint = '/api/jobs/my';
          } else if (activeTab === 'completed') {
            params.append('status', 'completed');
            endpoint = '/api/jobs/my';
          }
        } else {
          // Provider
          if (activeTab === 'browse') {
            params.append('status', 'open');
          } else if (activeTab === 'active') {
            endpoint = '/api/jobs/active';
          } else if (activeTab === 'completed') {
            params.append('status', 'completed');
            endpoint = '/api/jobs/active'; // Get provider's jobs that are completed
          }
        }
      } else {
        // Unauthenticated user - show all open jobs
        params.append('status', 'open');
      }

      if (categoryFilter && activeTab !== 'active') {
        params.append('categoryId', categoryFilter);
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const response = await api.get(url);
      setJobs(response.data);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-primary text-white';
      case 'active':
        return 'bg-warning text-white';
      case 'completed':
        return 'bg-success text-white';
      case 'cancelled':
        return 'bg-danger text-white';
      default:
        return 'bg-slate-200 text-slate-900';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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
              {user ? (user.role === 'seeker' ? 'Seeker dashboard' : 'Provider dashboard') : 'Browse jobs'}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-heading tracking-tight" data-testid="jobs-heading">
              {!user ? 'Available Jobs' : user.role === 'seeker' ? 'My Jobs' : 'Available Jobs'}
            </h1>
            <p className="max-w-3xl text-base text-slate-600 leading-7">
              {user
                ? user.role === 'seeker'
                  ? 'Track your job posts, active contracts, and completed work in one place.'
                  : 'Browse open jobs or manage your assignments with polished summaries and quick access.'
                : 'Discover open jobs and find the right opportunities that fit your skills and schedule.'}
            </p>
          </div>

          {user ? (
          <div className="flex flex-wrap gap-3 mb-10">
            {user.role === 'seeker' ? (
              <>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-testid="tab-my-posted"
                >
                  All Posted Jobs
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === 'active'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-testid="tab-active"
                >
                  Active Jobs
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === 'completed'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-testid="tab-completed"
                >
                  Completed Jobs
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === 'browse'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-testid="tab-browse"
                >
                  Browse Open Jobs
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === 'active'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-testid="tab-my-active"
                >
                  My Active Jobs
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === 'completed'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-testid="tab-my-completed"
                >
                  Completed Jobs
                </button>
              </>
            )}
          </div>
          ) : null}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16" data-testid="no-jobs-message">
              <p className="text-slate-600 text-lg">No jobs found</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2" data-testid="jobs-list">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:border-primary"
                  data-testid={`job-card-${job._id}`}
                >
                  <div className="p-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          {getCategoryName(job.categoryId) && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                              {getCategoryName(job.categoryId)}
                            </span>
                          )}
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(job.status)}`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-2xl font-semibold text-slate-900 font-heading">{job.title}</h3>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={16} />
                            {formatDate(job.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                          ₹{job.budget}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 leading-7 mt-6">
                      {job.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobList;