import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Briefcase, MapPin, DollarSign, Star } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../utils/toast';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories/');
      console.log('Fetched categories from Home:', response.data);
      if (response.data && response.data.length > 0) {
        console.log('Category structure:', JSON.stringify(response.data[0], null, 2));
      }
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${searchQuery}`);
    }
  };

  const iconMap = {
    Wrench: '🔧',
    Zap: '⚡',
    Hammer: '🔨',
    Sparkles: '✨',
    Paintbrush: '🎨',
    Wind: '🌬️',
    Settings: '⚙️',
    Leaf: '🌿',
    Shield: '🛡️',
    Users: '👥'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-12 md:pt-20 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Headline */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-sm font-semibold text-primary">
                {!user ? 'Simple. Fast. Reliable.' : user.role === 'seeker' ? 'Post & Hire' : 'Earn & Grow'}
              </span>
            </div>
            
            {!user ? (
              <>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 font-heading tracking-tight leading-tight" data-testid="hero-heading">
                  Find trusted professionals{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                    for every task
                  </span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Connect with vetted service providers, get instant quotes, and complete your projects with confidence.
                </p>
              </>
            ) : user.role === 'seeker' ? (
              <>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 font-heading tracking-tight leading-tight" data-testid="hero-heading">
                  Post a job and find{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                    the perfect match
                  </span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Describe your project, get quotes from qualified professionals, and hire the best fit for your needs.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 font-heading tracking-tight leading-tight" data-testid="hero-heading">
                  Grow your business and{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                    earn more
                  </span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Browse open opportunities, showcase your skills, and build a thriving service business.
                </p>
              </>
            )}
          </div>

          {/* Hero Action Panel */}
          <div className="mb-16">
            <div className="bg-white rounded-[24px] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.1)] border border-slate-100 max-w-5xl mx-auto">
              <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] items-center">
                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold mb-3 block">
                    Search for services
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search for services or jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-4 pl-12 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      data-testid="search-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 self-end">
                  {user?.role === 'seeker' ? (
                    <button
                      type="button"
                      onClick={() => navigate('/post-job')}
                      className="h-14 w-full rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                    >
                      Post a Job
                    </button>
                  ) : user?.role === 'provider' ? (
                    <button
                      type="button"
                      onClick={() => navigate('/jobs')}
                      className="h-14 w-full rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                    >
                      View Jobs
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/jobs')}
                      className="h-14 w-full rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                    >
                      Browse Jobs
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate('/categories')}
                    className="h-14 w-full rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-900 transition hover:border-primary hover:text-primary"
                  >
                    View Categories
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Illustration and Stats */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-slate-100">
              <img
                src="https://static.prod-images.emergentagent.com/jobs/a65215cc-1af9-49fb-adba-a050f0ccd8b2/images/fc8a483a1029c17d2c341ffba68f1db4a768d6245b1d71b75fb55ded482c0969.png"
                alt="Services illustration"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold mb-1">Active Professionals</p>
                    <p className="text-3xl font-bold text-slate-900">10,000+</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold mb-1">Average Rating</p>
                    <p className="text-3xl font-bold text-slate-900">4.8</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold mb-1">Jobs Completed</p>
                    <p className="text-3xl font-bold text-slate-900">50,000+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-3">
              Popular categories
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-heading tracking-tight">Featured services</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10" data-testid="category-grid">
            {categories.slice(0, 3).map((category) => (
              <Link
                key={category._id}
                to={`/jobs?category=${category._id}`}
                className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                data-testid={`category-card-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <img
                      src={category.icon}
                      alt={category.name}
                      className="h-10 w-10 object-cover rounded-lg"
                    />
                  </div>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">
                    {category.name}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{category.name}</h3>
                <p className="text-sm leading-5 text-slate-600 line-clamp-2">{category.description}</p>
                <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:gap-2 transition-all">
                  Explore <span className="ml-1">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link 
              to="/categories" 
              className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              data-testid="view-all-categories"
            >
              View all categories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;