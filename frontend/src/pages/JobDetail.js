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
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  console.log(user);
  const navigate = useNavigate();

  const fetchJobDetails = useCallback(async () => {
    try {
      const jobResponse = await api.get(`/api/jobs/${id}`);
      setJob(jobResponse.data);
      console.log('Fetched job details:', jobResponse.data);

      if (user) {
        if (user.role === 'seeker' && jobResponse.data.seekerId === user._id) {
          const bidsResponse = await api.get(`/api/bids/job/${id}`);
          setBids(bidsResponse.data);
          console.log('Fetched bids for job:', bidsResponse.data);
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

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/bids/', {
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
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto space-y-8">

          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">
                  Job details
                </p>
                <h1
                  className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight"
                  data-testid="job-title"
                >
                  {job.title}
                </h1>
                <p className="max-w-3xl text-base text-slate-600 leading-7">
                  Review the job details, bids, and progress in a clean modern view.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <span className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold ${getStatusColor(job.status)}`}>
                  {job.status.toUpperCase()}
                </span>
                <div className="text-sm text-slate-600">
                  Posted {formatDate(job.createdAt)}
                </div>
                <div className="text-xl font-semibold text-slate-900">
                  ₹{job.budget}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Location</p>
                <p className="mt-2 font-medium text-slate-900 flex items-center gap-2">
                  <MapPin size={16} /> {job.location}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Category</p>
                <p className="mt-2 font-medium text-slate-900">
                  {getCategoryName(job.categoryId) || 'Uncategorized'}
                </p>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 font-heading">
              Job Description
            </h2>
            <p
              className="text-slate-600 leading-8 whitespace-pre-wrap"
              data-testid="job-description"
            >
              {job.description}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4 font-heading">
              Posted By
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center">
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
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)] mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 font-heading">
                Place Your Bid
              </h2>
              <form onSubmit={handlePlaceBid} className="space-y-5">
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
                    className="block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                    rows="4"
                    placeholder="Tell the client why you're the best fit..."
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    className="block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    data-testid="bid-message-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                  data-testid="place-bid-button"
                >
                  {submitting ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </form>
            </div>
          )}

          {/* Login Prompt */}
          {!user && job.status === 'open' && (
            <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)] mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 font-heading">
                Interested in this job?
              </h2>
              <p className="text-slate-600 mb-5">
                Sign in as a service provider to place your bid and connect with the client.
              </p>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Sign In to Bid
              </Link>
            </div>
          )}

          {/* Provider's Existing Bid */}
          {userBid && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)] mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 font-heading">
                Your Bid
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-3xl font-bold text-slate-900">₹{userBid.amount}</div>
                  {userBid.message && (
                    <p className="text-slate-600 mt-2">{userBid.message}</p>
                  )}
                </div>
                <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
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
              className="w-full rounded-3xl bg-success px-6 py-3 text-sm font-semibold text-white transition hover:bg-success/90 mb-8"
              data-testid="mark-complete-button"
            >
              Mark Job as Complete
            </button>
          )}

          {/* Payment Loading State */}
          {paymentLoading && (
            <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-6 text-center mb-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-slate-600 text-sm">Initializing payment gateway...</p>
            </div>
          )}

          {/* Bids List for Seeker */}
          {isOwner && bids.length > 0 && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6 font-heading">
                Bids Received ({bids.length})
              </h2>
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div
                    key={bid._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    data-testid={`bid-${bid._id}`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3">
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
                          className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
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