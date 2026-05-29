import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Clock, User as UserIcon, Check } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../utils/toast';

// ─── Load Razorpay Script Once ────────────────────────────
// Loaded outside component so it persists across renders
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if already loaded — prevent duplicate script tags
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userBid, setUserBid] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchJobDetails = useCallback(async () => {
    try {
      const jobResponse = await api.get(`/api/jobs/${id}`);
      setJob(jobResponse.data);

      if (user) {
        if (user.role === 'seeker' && jobResponse.data.seekerId._id === user._id) {
          const bidsResponse = await api.get(`/api/bids/job/${id}`);
          setBids(bidsResponse.data);
        }

        if (user.role === 'provider') {
          const myBidsResponse = await api.get('/api/bids/my');
          const existingBid = myBidsResponse.data.find(
            b => b.jobId === id || b.jobId?._id === id
          );
          if (existingBid) {
            setUserBid(existingBid);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/bids', {
        jobId: id,
        amount: parseFloat(bidAmount),
        message: bidMessage
      });
      setUserBid(response.data);
      toast.success('Bid placed successfully!');
      setBidAmount('');
      setBidMessage('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const initiatePayment = async (bidId) => {
    setPaymentLoading(true);

    try {
      // Load Razorpay script safely — no duplicate loading
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setPaymentLoading(false);
        return;
      }

      // Create order via payment-service
      const orderResponse = await api.post('/api/payments/create-order', { bidId });
      const { orderId, amount, currency, keyId } = orderResponse.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'BidAuc',
        description: `Payment for ${job.title}`,

        // ─── Success Handler ────────────────────────────
        handler: async (response) => {
          try {
            await api.post('/api/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            toast.success('Payment successful! Job is now active.');
            fetchJobDetails();
          } catch (error) {
            toast.error('Payment verification failed. Contact support.');
          } finally {
            setPaymentLoading(false);
          }
        },

        // ─── Prefill User Details ───────────────────────
        prefill: user ? {
          name: user.name,
          // Razorpay requires +91 prefix for Indian numbers
          contact: user.phone.startsWith('+')
            ? user.phone
            : `+91${user.phone}`
        } : {},

        // ─── Modal Dismiss Handler ──────────────────────
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
            setPaymentLoading(false);
          }
        },

        theme: {
          color: '#0055FF'
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      // ─── Payment Failure Handler ────────────────────────
      razorpayInstance.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        toast.error(
          response.error?.description || 'Payment failed. Please try again.'
        );
        setPaymentLoading(false);
      });

      razorpayInstance.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setPaymentLoading(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm(
      'Are you sure you want to accept this bid? This will reject all other bids.'
    )) {
      return;
    }

    try {
      const response = await api.patch(`/api/bids/${bidId}/accept`);
      toast.success(response.data.message);
      await fetchJobDetails();
      // Initiate payment after bid accepted
      await initiatePayment(bidId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept bid');
    }
  };

  const handleMarkComplete = async () => {
    if (!window.confirm('Are you sure you want to mark this job as complete?')) {
      return;
    }

    try {
      await api.patch(`/api/jobs/${id}/complete`);
      toast.success('Job marked as complete!');
      fetchJobDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to mark job as complete'
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-primary text-white';
      case 'active': return 'bg-warning text-white';
      case 'completed': return 'bg-success text-white';
      case 'cancelled': return 'bg-danger text-white';
      default: return 'bg-slate-200 text-slate-900';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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

  if (!job) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-16 px-6 text-center">
          <p className="text-slate-600">Job not found</p>
        </div>
      </div>
    );
  }

  const isOwner = user && user._id === job.seekerId._id;
  const canBid = user && user.role === 'provider' && job.status === 'open' && !userBid;
  const canMarkComplete = user &&
    user.role === 'provider' &&
    job.status === 'active' &&
    userBid?.status === 'accepted';

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">

          {/* Job Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <h1
                className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight"
                data-testid="job-title"
              >
                {job.title}
              </h1>
              <span
                className={`px-3 py-1 text-xs font-medium ${getStatusColor(job.status)}`}
                data-testid="job-status"
              >
                {job.status.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-base text-slate-600 mb-6">
              <span className="flex items-center gap-1">
                <MapPin size={18} />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign size={18} />
                ₹{job.budget}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={18} />
                Posted {formatDate(job.createdAt)}
              </span>
            </div>

            {job.categoryId && (
              <span className="inline-block text-sm px-4 py-2 bg-slate-100 text-slate-700">
                {job.categoryId.name}
              </span>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 font-heading">
              Job Description
            </h2>
            <p
              className="text-slate-600 leading-relaxed whitespace-pre-wrap"
              data-testid="job-description"
            >
              {job.description}
            </p>
          </div>

          {/* Posted By */}
          <div className="bg-white border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 font-heading">
              Posted By
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <UserIcon size={24} className="text-slate-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">{job.seekerId.name}</div>
                <div className="text-sm text-slate-600">{job.seekerId.phone}</div>
              </div>
            </div>
          </div>

          {/* Provider Bid Form */}
          {canBid && (
            <div className="bg-white border border-slate-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 font-heading">
                Place Your Bid
              </h2>
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <label
                    htmlFor="bidAmount"
                    className="block text-sm font-medium text-slate-900 mb-2"
                  >
                    Bid Amount (₹)
                  </label>
                  <input
                    id="bidAmount"
                    type="number"
                    placeholder="Enter your bid amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    data-testid="bid-amount-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bidMessage"
                    className="block text-sm font-medium text-slate-900 mb-2"
                  >
                    Message (Optional)
                  </label>
                  <textarea
                    id="bidMessage"
                    rows="3"
                    placeholder="Tell the client why you're the best fit..."
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    className="border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    data-testid="bid-message-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all disabled:opacity-50"
                  data-testid="place-bid-button"
                >
                  {submitting ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </form>
            </div>
          )}

          {/* Login Prompt */}
          {!user && job.status === 'open' && (
            <div className="bg-blue-50 border border-blue-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 font-heading">
                Interested in this job?
              </h2>
              <p className="text-slate-600 mb-4">
                Sign in as a service provider to place your bid.
              </p>
              <Link
                to="/login"
                className="inline-block bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all"
              >
                Sign In to Bid
              </Link>
            </div>
          )}

          {/* Provider's Existing Bid */}
          {userBid && (
            <div className="bg-white border border-slate-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 font-heading">
                Your Bid
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{userBid.amount}
                  </div>
                  {userBid.message && (
                    <p className="text-slate-600 mt-2">{userBid.message}</p>
                  )}
                </div>
                <span className={`px-3 py-1 text-xs font-medium ${
                  userBid.status === 'accepted' ? 'bg-success text-white' :
                  userBid.status === 'rejected' ? 'bg-danger text-white' :
                  'bg-warning text-white'
                }`}>
                  {userBid.status.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Mark Complete Button */}
          {canMarkComplete && (
            <button
              onClick={handleMarkComplete}
              className="w-full bg-success text-white rounded-none px-6 py-3 font-medium hover:bg-success/90 transition-all mb-8"
              data-testid="mark-complete-button"
            >
              Mark Job as Complete
            </button>
          )}

          {/* Payment Loading State */}
          {paymentLoading && (
            <div className="bg-blue-50 border border-blue-200 p-4 mb-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-slate-600 text-sm">Initializing payment gateway...</p>
            </div>
          )}

          {/* Bids List for Seeker */}
          {isOwner && bids.length > 0 && (
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 font-heading">
                Bids Received ({bids.length})
              </h2>
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div
                    key={bid._id}
                    className="border border-slate-200 p-4"
                    data-testid={`bid-${bid._id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Link
                        to={`/provider/${bid.providerId._id || bid.providerId}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <UserIcon size={20} className="text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {bid.providerId.name || 'Provider'}
                          </div>
                        </div>
                      </Link>
                      <span className={`px-3 py-1 text-xs font-medium ${
                        bid.status === 'accepted' ? 'bg-success text-white' :
                        bid.status === 'rejected' ? 'bg-danger text-white' :
                        'bg-warning text-white'
                      }`}>
                        {bid.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-2xl font-bold text-slate-900 mb-2">
                      ₹{bid.amount}
                    </div>

                    {bid.message && (
                      <p className="text-slate-600 mb-4">{bid.message}</p>
                    )}

                    {bid.status === 'pending' && job.status === 'open' && (
                      <button
                        onClick={() => handleAcceptBid(bid._id)}
                        disabled={paymentLoading}
                        className="flex items-center gap-2 bg-primary text-white rounded-none px-6 py-2 font-medium hover:bg-primary-hover transition-all disabled:opacity-50"
                        data-testid={`accept-bid-${bid._id}`}
                      >
                        <Check size={18} />
                        {paymentLoading ? 'Processing...' : 'Accept Bid'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;