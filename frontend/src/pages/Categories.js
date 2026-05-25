import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import { toast } from '../utils/toast';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="all-categories-grid">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/jobs?category=${category._id}`}
                className="bg-white border border-slate-200 p-8 hover:border-primary transition-colors duration-200 cursor-pointer"
                data-testid={`category-${category.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <img
                  src={'../static/Assets/categoryImages/applianceRepair.jpg' }
                  alt={category.categoryName}
                  className="w-16 h-16 mb-4 object-cover rounded-full"
                  
                />
                <h3 className="text-xl font-medium text-slate-900 mb-2 font-heading">{category.categoryName}</h3>
                <p className="text-base text-slate-600">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;