'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { ShieldCheck, UserCheck, ArrowRight, Lock, Mail, User, MapPin, Calendar, Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin, user } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDob, setRegDob] = useState('2006-05-15');
  const [regGender, setRegGender] = useState('Male');
  const [regState, setRegState] = useState('Haryana');
  const [regDistrict, setRegDistrict] = useState('Rohtak');
  const [regHeight, setRegHeight] = useState('175');
  const [regWeight, setRegWeight] = useState('65');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect
  if (user) {
    if (user.role === 'SAI_ADMIN') {
      router.push('/admin');
    } else {
      router.push('/athlete');
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext will update and trigger redirect
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          fullName: regFullName,
          dateOfBirth: regDob,
          gender: regGender,
          state: regState,
          district: regDistrict,
          heightCm: parseFloat(regHeight) || undefined,
          weightKg: parseFloat(regWeight) || undefined
        })
      });
      localStorage.setItem('khelkhoj_token', data.token);
      window.location.href = '/athlete';
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-[#FF7A00] via-white to-[#10B981] p-0.5 shadow-glow mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#FF7A00]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-100 flex items-center justify-center gap-1.5">
            <span>Welcome to</span>
            <span className="inline-flex items-center">
              <span className="text-[#FF7A00]">Khel</span>
              <span className="text-white">Kho</span>
              <span className="text-[#10B981]">j</span>
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your athletic assessment records or SAI scouting desk
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
          <button
            onClick={() => { setTab('LOGIN'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'LOGIN' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('REGISTER'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'REGISTER' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register as Athlete
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {tab === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com or admin@sai.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={regState}
                  onChange={(e) => setRegState(e.target.value)}
                  placeholder="Haryana, Punjab..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  placeholder="Rohtak, Patiala..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={regHeight}
                  onChange={(e) => setRegHeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={regWeight}
                  onChange={(e) => setRegWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-1.5 mt-3 disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Athlete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Demo Fast Logins */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center mb-3">
            One-Click Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLogin('ATHLETE')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-left transition-colors group"
            >
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                <span>Athlete Demo</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">rahul.verma@example.com</div>
            </button>

            <button
              onClick={() => quickLogin('SAI_ADMIN')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-left transition-colors group"
            >
              <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>SAI Admin</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">admin@sai.gov.in</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
