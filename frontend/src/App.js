import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import PhoneLogin from './pages/PhoneLogin';
import RoleSelection from './pages/RoleSelection';
import Home from './pages/Home';
import Categories from './pages/Categories';
import PostJob from './pages/PostJob';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import ProviderProfile from './pages/ProviderProfile';
import EditProfile from './pages/EditProfile';
import MyProfile from './pages/MyProfile';
import Footer from './components/Footer';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="localhost:3000/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen flex flex-col">
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<PhoneLogin />} />
              <Route path="/role-selection" element={<RoleSelection />} />
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
              <Route path="/jobs" element={<JobList />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/provider/:id" element={<ProviderProfile />} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;