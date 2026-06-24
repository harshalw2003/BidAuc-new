import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail } from 'lucide-react';
import { toast } from '../utils/toast';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setEmail('');
    toast.success('Thanks for subscribing!');
  };

  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-6xl px-3 py-12 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between md:items-start">
          <div className="md:w-[30%]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-11 items-center justify-center rounded-full bg-slate-100 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white">BidAuc</p>
                {/* <p className="text-sm text-slate-400">Connecting buyers and service providers with trust and speed.</p> */}
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-6 text-slate-400">
              Our branch is committed to delivering intelligent bids and meaningful opportunities at every step of the hiring journey.
            </p>
          </div>

          <div className="flex flex-col items-start">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Quick links</h2>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>
                <Link to="/" className="transition text-slate-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/categories" className="transition text-slate-300 hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="transition text-slate-300 hover:text-white">
                  Jobs
                </Link>
              </li>
              <li>
                <Link to="/profile" className="transition text-slate-300 hover:text-white">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Newsletter</h2>
            <p className="mt-4 text-sm text-slate-300">
              Stay informed with the latest auctions, job posts, and bidding tips.
            </p>
            <form onSubmit={handleSubscribe} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-300" htmlFor="footer-email">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-none border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-none bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 bg-slate-950/90 px-3 py-4 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} BidAuc branch. All rights reserved.</p>
          <p className="text-slate-400">Built for fast bidding, trusted jobs, and modern service discovery.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
