import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Briefcase, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="px-6 md:px-12 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <Briefcase className="text-primary" size={28} />
            <span className="text-xl font-bold text-slate-900 font-heading">BidAuc</span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-700 hover:text-primary transition-colors" data-testid="home-link">
              Home
            </Link>
            <Link to="/categories" className="text-slate-700 hover:text-primary transition-colors" data-testid="categories-link">
              Categories
            </Link>
            <Link to="/jobs" className="text-slate-700 hover:text-primary transition-colors" data-testid="jobs-link">
              Jobs
            </Link>
            {user ? (
              <>
                <Link to="/profile" className="text-slate-700 hover:text-primary transition-colors" data-testid="profile-link">
                  <User size={20} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-700 hover:text-danger transition-colors"
                  data-testid="logout-button"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-primary text-white rounded-none px-4 py-2 font-medium hover:bg-primary-hover transition-all text-sm"
                data-testid="login-link"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-700"
            data-testid="mobile-menu-toggle"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-4" data-testid="mobile-menu">
            <Link
              to="/"
              className="block text-slate-700 hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/categories"
              className="block text-slate-700 hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Categories
            </Link>
            <Link
              to="/jobs"
              className="block text-slate-700 hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Jobs
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block text-slate-700 hover:text-primary transition-colors flex items-center gap-2"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={20} /> Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block text-danger hover:text-danger/80 transition-colors flex items-center gap-2"
                >
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block bg-primary text-white rounded-none px-4 py-2 font-medium hover:bg-primary-hover transition-all text-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;