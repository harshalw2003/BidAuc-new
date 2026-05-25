import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User as UserIcon, MapPin, Award } from 'lucide-react';
import Header from '../components/Header';
import api from '../api';
import { toast } from '../utils/toast';

const ProviderProfile = () => {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    try {
      const response = await api.get(`/api/users/${id}`);
      setProvider(response.data);
    } catch (error) {
      toast.error('Failed to load provider profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
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

  if (!provider) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-16 px-6 text-center">
          <p className="text-slate-600">Provider not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                {provider.profilePhoto ? (
                  <img src={provider.profilePhoto} alt={provider.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-900 mb-2 font-heading tracking-tight" data-testid="provider-name">
                  {provider.name}
                </h1>
                <div className="flex items-center gap-4 text-slate-600 mb-4">
                  <span className="flex items-center gap-1">
                    <UserIcon size={16} />
                    {provider.phone}
                  </span>
                  {provider.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {provider.address}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  Member since {formatDate(provider.createdAt)}
                </p>
              </div>
            </div>

            {provider.bio && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-3 font-heading">About</h2>
                <p className="text-slate-600 leading-relaxed">{provider.bio}</p>
              </div>
            )}

            {provider.skills && provider.skills.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-3 font-heading flex items-center gap-2">
                  <Award size={20} />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {provider.skills.map((skill, index) => (
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

export default ProviderProfile;