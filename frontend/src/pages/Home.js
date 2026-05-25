import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Briefcase } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../utils/toast';
// import image from ../static/Assets/

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
      const response = await api.get('/api/categories');
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
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-heading tracking-tight" data-testid="hero-heading">
                Connect with Skilled Service Providers
              </h1>
              <p className="text-base text-slate-600 mb-8 leading-relaxed">
                Find reliable professionals for all your home and business needs. Post jobs or offer your services to earn.
              </p>
              
              {user?.role === 'seeker' ? (
                <Link
                  to="/post-job"
                  className="inline-flex items-center gap-2 bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all"
                  data-testid="post-job-cta"
                >
                  <Plus size={20} />
                  Post a Job
                </Link>
              ) : (
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all"
                  data-testid="browse-jobs-cta"
                >
                  <Briefcase size={20} />
                  Browse Jobs
                </Link>
              )}
            </div>
            <div>
              <img
                src="https://static.prod-images.emergentagent.com/jobs/a65215cc-1af9-49fb-adba-a050f0ccd8b2/images/fc8a483a1029c17d2c341ffba68f1db4a768d6245b1d71b75fb55ded482c0969.png"
                alt="Services illustration"
                className="w-full"
              />
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-12">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search for services or jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-slate-200 rounded-none px-4 py-4 pl-12 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                data-testid="search-input"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 font-heading tracking-tight">Service Categories</h2>
            <Link to="/categories" className="text-primary hover:text-primary-hover text-sm font-medium" data-testid="view-all-categories">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" data-testid="category-grid">
            {categories.slice(0, 10).map((category) => (
              <Link
                key={category._id}
                to={`/jobs?category=${category._id}`}
                className="bg-white border border-slate-200 p-6 hover:border-primary transition-colors duration-200 cursor-pointer"
                data-testid={`category-card-${category.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <img
                  // src={'../static/Assets/categoryImages/applianceRepair.jpg' + category.image || '🔧'}
                  src='../'
                  alt={category.categoryName}
                  className="w-14 h-14 mb-3 object-cover rounded-full"
                />
                <h3 className="font-medium text-slate-900 mb-1">{category.categoryName}</h3>
                <p className="text-sm text-slate-600">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;