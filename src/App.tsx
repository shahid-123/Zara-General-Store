import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages - I'll create these next
import Home from './pages/Home';
import StoreView from './pages/StoreView';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import CustomerOrders from './pages/CustomerOrders';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'customer' }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 border-x border-slate-200 max-w-md mx-auto relative shadow-sm">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/store/:storeId" element={<StoreView />} />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute role="customer">
                  <CustomerOrders />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster position="bottom-center" />
        </div>
      </Router>
    </AuthProvider>
  );
}
