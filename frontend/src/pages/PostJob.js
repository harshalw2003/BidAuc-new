import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../utils/toast';

const PostJob = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    description: '',
    location: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user?.role !== 'seeker') {
      toast.error('Only seekers can post jobs');
      navigate('/');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setFormData((prevData) => ({
        ...prevData,
        categoryId
      }));
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories/');
      console.log('Fetched categories for PostJob:', response.data);
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.categoryId || !formData.description || !formData.location || !formData.budget) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/jobs/', formData);
      toast.success('Job posted successfully!');
      navigate(`/jobs/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-3">
              Job posting
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-heading tracking-tight" data-testid="post-job-heading">
              Post a Job
            </h1>
            <p className="max-w-3xl text-base text-slate-600 leading-7">
              Describe your job requirements and get bids from qualified service providers.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] p-8">
            <form onSubmit={handleSubmit} className="space-y-8" data-testid="post-job-form">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-900 mb-2">
                  Job Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Fix leaking kitchen pipe"
                  value={formData.title}
                  onChange={handleChange}
                  className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  data-testid="job-title-input"
                />
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-slate-900 mb-2">
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="border border-slate-200 rounded-[20px] px-4 py-3 w-full bg-white text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  data-testid="category-select"
                >
                  <option value="" className="text-slate-500">
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id} className="text-slate-900">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  placeholder="Provide detailed information about the job..."
                  value={formData.description}
                  onChange={handleChange}
                  className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  data-testid="job-description-input"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-slate-900 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g., Koramangala, Bangalore"
                    value={formData.location}
                    onChange={handleChange}
                    className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    data-testid="job-location-input"
                  />
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-slate-900 mb-2">
                    Budget (₹)
                  </label>
                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    placeholder="Enter your budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="border border-slate-200 rounded-[20px] px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    data-testid="job-budget-input"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                  data-testid="submit-job-button"
                >
                  {loading ? 'Posting...' : 'Post Job'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
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

export default PostJob;