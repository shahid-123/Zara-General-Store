import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Phone, Lock, ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'admin' | 'customer'>('customer');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simple validation for phone length
    if (phone.length < 10) {
      toast.error('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await api.register({ phone, password, role, name, address });
        toast.success('Account created!');
      } else {
        await api.login({ phone, password });
        toast.success('Logged in!');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await api.loginWithGoogle();
      toast.success('Logged in!');
      navigate('/');
    } catch (error: any) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <header className="mb-10">
        <Link to="/" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-slate-600 mb-6 active:scale-95 transition-transform">
          <ChevronLeft size={20} />
        </Link>
        <h2 className="text-3xl font-display font-black tracking-tight text-slate-900">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-500 mt-2 font-medium">
          {isRegister ? "Join Zara's General Store today." : 'Please sign in to your account.'}
        </p>
      </header>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 h-14 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 h-14 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        {isRegister && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 h-14 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Delivery Address</label>
              <div className="relative">
                <textarea 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium min-h-[100px]"
                  placeholder="Street, Landmark, Apartment, pincode..."
                />
              </div>
            </div>
          </>
        )}

        {isRegister && (
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setRole('customer')}
                className={`h-12 rounded-2xl border font-bold text-sm transition-all ${role === 'customer' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                Customer
              </button>
              <button 
                type="button" 
                onClick={() => setRole('admin')}
                className={`h-12 rounded-2xl border font-bold text-sm transition-all ${role === 'admin' ? 'bg-slate-900 border-gray-900 text-white shadow-lg shadow-slate-100' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                Store Owner
              </button>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 transition-transform disabled:opacity-50 mt-4"
        >
          {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
          {!loading && <LogIn size={20} />}
        </button>

        <p className="text-center text-sm text-slate-500 mt-6 font-medium">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 font-bold hover:underline"
          >
            {isRegister ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-100"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-slate-300">
          <span className="bg-white px-4">Or continue with</span>
        </div>
      </div>

      <button 
        onClick={handleGoogleLogin} 
        disabled={loading}
        className="w-full bg-white border-2 border-slate-100 text-slate-700 h-14 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:border-indigo-100 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        {loading ? 'Connecting...' : 'Sign in with Google'}
      </button>

      <p className="text-center text-xs text-slate-400 font-medium px-4 mt-8">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
