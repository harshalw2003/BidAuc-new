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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    fetchJobs();
  }, [activeTab, categoryFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/jobs';
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
    <div className="min-h-screen bg-white">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 font-heading tracking-tight" data-testid="jobs-heading">
            {!user ? 'Available Jobs' : user.role === 'seeker' ? 'My Jobs' : 'Available Jobs'}
          </h1>

          {/* Tabs */}
          {user ? (
          <div className="flex gap-4 mb-8 border-b border-slate-200">
            {user.role === 'seeker' ? (
              <>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`pb-4 px-4 font-medium transition-all border-b-2 ${
                    activeTab === 'all'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid="tab-my-posted"
                >
                  All Posted Jobs
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`pb-4 px-4 font-medium transition-all border-b-2 ${
                    activeTab === 'active'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid="tab-active"
                >
                  Active Jobs
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`pb-4 px-4 font-medium transition-all border-b-2 ${
                    activeTab === 'completed'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
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
                  className={`pb-4 px-4 font-medium transition-all border-b-2 ${
                    activeTab === 'browse'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid="tab-browse"
                >
                  Browse Open Jobs
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`pb-4 px-4 font-medium transition-all border-b-2 ${
                    activeTab === 'active'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid="tab-my-active"
                >
                  My Active Jobs
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`pb-4 px-4 font-medium transition-all border-b-2 ${
                    activeTab === 'completed'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid="tab-my-completed"
                >
                  Completed Jobs
                </button>
              </>
            )}
          </div>
          ) : null}

          {/* Job List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12" data-testid="no-jobs-message">
              <p className="text-slate-600">No jobs found</p>
            </div>
          ) : (
            <div className="grid gap-6" data-testid="jobs-list">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="bg-white border border-slate-200 p-6 hover:border-primary transition-colors duration-200 cursor-pointer"
                  data-testid={`job-card-${job._id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-slate-900 mb-2 font-heading">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={16} />
                          ₹{job.budget}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 mb-4">{job.description}</p>
                  {job.categoryId && (
                    <span className="inline-block text-xs px-3 py-1 bg-slate-100 text-slate-700">
                      {job.categoryId.name}
                    </span>
                  )}
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