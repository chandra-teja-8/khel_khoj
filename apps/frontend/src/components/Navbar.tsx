'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, UserCheck, LogOut, ArrowRight, Zap } from 'lucide-react';

export default function Navbar() {
  const { user, logout, quickLogin } = useAuth();
  const pathname = usePathname();
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/health')
      .then(res => res.json())
      .then(data => setSystemOnline(data.status === 'UP'))
      .catch(() => setSystemOnline(false));
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with Indian Tricolor sequence: Orange, White, Green */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Tricolor bordered icon box: Orange top, White middle, Green bottom */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#FF7A00] via-white to-[#10B981] p-[2px] shadow-glow group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#FF7A00] group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                {/* Logo text: Orange (Khel) -> White (Kho) -> Green (j) */}
                <span className="text-xl font-extrabold tracking-tight font-['Outfit'] flex items-center select-none">
                  <span className="text-[#FF7A00] drop-shadow-[0_0_12px_rgba(255,122,0,0.4)]">Khel</span>
                  <span className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">Kho</span>
                  <span className="text-[#10B981] drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">j</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                SAI National Talent Identification
              </p>
            </div>
          </Link>

          {/* System status pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <span className={`w-2 h-2 rounded-full ${systemOnline === true ? 'bg-emerald-400 animate-pulse' : systemOnline === false ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
            <span>{systemOnline === true ? 'YOLO11n-Pose & PG18 Live' : systemOnline === false ? 'Service Offline' : 'Checking System...'}</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Overview
          </Link>
          <Link
            href="/athlete"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname.startsWith('/athlete') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Athlete Portal
          </Link>
          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname.startsWith('/admin') ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            SAI Admin
          </Link>
        </nav>

        {/* User state / Quick demo switcher */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">
                  {user.profile?.fullName || user.email.split('@')[0]}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    user.role === 'SAI_ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {user.role === 'SAI_ADMIN' ? 'SAI ADMIN' : 'ATHLETE'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-1">
                <span>Demo:</span>
                <button
                  onClick={() => quickLogin('ATHLETE')}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-medium transition-colors"
                >
                  Athlete
                </button>
                <button
                  onClick={() => quickLogin('SAI_ADMIN')}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-medium transition-colors"
                >
                  SAI Admin
                </button>
              </div>

              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1 shadow-glow"
              >
                Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
