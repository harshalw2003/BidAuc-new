import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../utils/toast';

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    fetchCategories();  
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from API...'); // Debug log
      const response = await api.get('/api/categories/');
      console.log('Fetched categories:', response.data); // Debug log
      if (response.data && response.data.length > 0) {
        console.log('Category structure:', JSON.stringify(response.data[0], null, 2));
      }
      setCategories(response.data);
    } catch (error) { 
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };  

  const loadMoreCategories = () => {
    if (loadingMore || visibleCount >= categories.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prevCount) => Math.min(prevCount + 9, categories.length));
      setLoadingMore(false);
      if (gridRef.current) {
        gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 300);
  };

  const visibleCategories = categories.slice(0, visibleCount);
  const hasMore = visibleCount < categories.length;

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

  const renderIcon = (icon) => {
    if (typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))) {
      return (
        <img
          src={icon}
          alt="Category"
          className="h-20 w-20 rounded-2xl object-cover"
        />
      );
    }

    return <span className="text-3xl leading-none">{iconMap[icon] || '🛠️'}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-16 px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-heading tracking-tight" data-testid="categories-heading">
            All Categories
          </h1>
          <p className="text-base text-slate-600 mb-12 leading-relaxed">
            Browse all service categories and find the right professionals for your needs.
          </p>

          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="all-categories-grid">
            {visibleCategories.map((category) => {
              const buttonHref = user?.role === 'seeker' ? `/post-job?category=${category._id}` : `/jobs?category=${category._id}`;
              const buttonLabel = user?.role === 'seeker' ? 'Post Job' : 'View Jobs';

              return (
                <div
                  key={category._id}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1"
                  data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="p-8 pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
                        {renderIcon(category.icon)}
                      </div>
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        {category.name}
                      </span>
                    </div>

                    <h3 className="text-2xl font-semibold text-slate-900 mb-3 font-heading">
                      {category.name}
                    </h3>
                    <p className="text-sm leading-6 text-slate-600 min-h-[72px]">
                      {category.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
                    <Link
                      to={buttonHref}
                      className="inline-flex items-center rounded-md bg-primary-hover text-white px-4 py-2 text-sm font-medium transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {buttonLabel}
                    </Link>
                    <Link
                      to={`/jobs?category=${category._id}`}
                      className="text-sm font-semibold text-primary transition hover:text-primary-hover"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            {hasMore ? (
              <button
                type="button"
                onClick={loadMoreCategories}
                disabled={loadingMore}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loadingMore ? 'Loading more categories...' : 'Load more categories'}
              </button>
            ) : (
              <p className="text-sm text-slate-500">You have reached end of the page</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;