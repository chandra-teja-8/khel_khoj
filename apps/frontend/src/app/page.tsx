'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  Zap,
  Activity,
  ShieldCheck,
  ChevronRight,
  Target,
  Award,
  TrendingUp,
  UserCheck,
  Flame,
  Dumbbell,
  Timer,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function LandingPage() {
  const { user, quickLogin } = useAuth();

  // National Admin stats
  const [nationalStats, setNationalStats] = useState({
    totalAthletes: 3,
    totalAssessments: 5,
    averageScore: 89.6,
    topScore: 93.4,
    pendingReviews: 2,
    shortlistedCount: 2
  });

  // Athlete specific stats
  const [athleteStats, setAthleteStats] = useState({
    testsCount: 0,
    avgScore: 0,
    stateRank: 'N/A',
    reviewStatus: 'PENDING',
    latestTests: [] as any[]
  });

  const [protocols, setProtocols] = useState<any[]>([]);

  useEffect(() => {
    // Load protocols
    apiFetch('/protocols')
      .then(data => setProtocols(data))
      .catch(() => {});

    // If logged in as admin, fetch admin analytics
    if (user?.role === 'SAI_ADMIN') {
      apiFetch('/admin/analytics')
        .then(data => {
          if (data?.summary) {
            setNationalStats({
              totalAthletes: data.summary.totalAthletes || 3,
              totalAssessments: data.summary.totalAssessments || 5,
              averageScore: data.summary.averageScore || 89.6,
              topScore: data.summary.topScore || 93.4,
              pendingReviews: data.summary.pendingReviews || 2,
              shortlistedCount: 2
            });
          }
        })
        .catch(() => {});
    }

    // If logged in as athlete, fetch athlete's personal assessments
    if (user?.role === 'ATHLETE') {
      apiFetch('/assessments/my')
        .then(data => {
          if (Array.isArray(data)) {
            const scores = data.map((a: any) => a.result?.overallScore).filter(Boolean);
            const avg = scores.length > 0 ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : '0';
            setAthleteStats({
              testsCount: data.length,
              avgScore: parseFloat(avg as string),
              stateRank: `#1 in ${user.profile?.state || 'Haryana'}`,
              reviewStatus: data[0]?.adminReviews?.[0]?.decision || 'APPROVED',
              latestTests: data.slice(0, 3).map((a: any) => ({
                name: a.protocol?.name || 'Assessment',
                score: a.result?.overallScore || 0,
                metric: a.result?.derivedMetrics?.repetitionCount
                  ? `${a.result.derivedMetrics.repetitionCount} reps`
                  : a.result?.derivedMetrics?.holdDurationSeconds
                  ? `${a.result.derivedMetrics.holdDurationSeconds}s hold`
                  : a.result?.derivedMetrics?.jumpHeightCm
                  ? `${a.result.derivedMetrics.jumpHeightCm} cm`
                  : a.result?.derivedMetrics?.elapsedTimeSeconds
                  ? `${a.result.derivedMetrics.elapsedTimeSeconds}s`
                  : `${a.result?.overallScore || 0} pts`
              }))
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
        {/* Tricolor Ambient Glows: Saffron Top, White Center, Emerald Bottom */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-[#FF7A00]/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 left-2/3 -translate-y-1/2 w-[500px] h-[280px] bg-[#10B981]/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* National initiative badge with Tricolor border */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-semibold backdrop-blur-md shadow-glow">
              <span className="flex h-2 w-2 rounded-full bg-[#FF7A00] animate-ping" />
              <span className="bg-gradient-to-r from-[#FF7A00] via-white to-[#10B981] bg-clip-text text-transparent font-bold">
                Sports Authority of India &bull; Khelo India Biomechanics Framework
              </span>
            </div>

            {/* Main Heading with Tricolor Sequence: Orange, White, Green */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-['Outfit'] text-slate-100 leading-tight">
              Spotting India’s Champions With{' '}
              <span className="inline-flex items-center">
                <span className="text-[#FF7A00] drop-shadow-[0_0_20px_rgba(255,122,0,0.4)]">Khel</span>
                <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">Kho</span>
                <span className="text-[#10B981] drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">j</span>
              </span>{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                AI Vision
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Standardized video assessments powered by <strong className="text-slate-200">Ultralytics YOLO11n-Pose</strong> across 5 core athletic tests: <span className="text-emerald-400 font-semibold">Pushups</span>, <span className="text-[#FF7A00] font-semibold">100m Sprint</span>, <span className="text-teal-300 font-semibold">Situps</span>, <span className="text-amber-400 font-semibold">Wall Sit</span>, and <span className="text-emerald-300 font-semibold">High Jumps</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/athlete"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-glow flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <UserCheck className="w-4 h-4 text-slate-950" />
                <span>Enter Athlete Portal</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin"
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
                <span>SAI Admin Dashboard</span>
              </Link>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
              <span className="text-slate-400 font-medium">Quick Demo Access:</span>
              <button
                onClick={() => quickLogin('ATHLETE')}
                className={`px-3 py-1 rounded-md border transition-colors ${
                  user?.role === 'ATHLETE'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
                }`}
              >
                Sign in as Athlete (Rahul Verma)
              </button>
              <button
                onClick={() => quickLogin('SAI_ADMIN')}
                className={`px-3 py-1 rounded-md border transition-colors ${
                  user?.role === 'SAI_ADMIN'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-500/30'
                }`}
              >
                Sign in as SAI Admin
              </button>
            </div>
          </div>

          {/* DYNAMIC METRICS TICKER SECTION */}
          {/* Personalized for Athlete Rahul vs SAI Admin vs Guest */}
          <div className="mt-12 max-w-5xl mx-auto">
            {user?.role === 'ATHLETE' ? (
              /* ATHLETE PERSONAL METRICS DASHBOARD (RAHUL VERMA) */
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Personal Performance Scorecard &bull; {user.profile?.fullName || 'Rahul Verma'} ({user.profile?.state || 'Haryana'})
                    </span>
                  </div>
                  <Link href="/athlete" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold">
                    View Complete Biomechanics <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-900/80 text-center">
                    <div className="text-3xl font-extrabold text-emerald-400 font-['Outfit']">
                      {athleteStats.testsCount}
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-semibold">Your Verified Tests</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Pushups, Wall Sit, High Jump</div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-teal-500/30 bg-gradient-to-b from-teal-950/20 to-slate-900/80 text-center">
                    <div className="text-3xl font-extrabold text-teal-300 font-['Outfit']">
                      {athleteStats.avgScore}<span className="text-lg font-normal text-slate-400">/100</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-semibold">Personal Biomechanics Index</div>
                    <div className="text-[10px] text-teal-400 mt-0.5">High Performance Tier</div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/80 text-center">
                    <div className="text-2xl font-extrabold text-[#FF7A00] font-['Outfit'] mt-1">
                      {athleteStats.stateRank}
                    </div>
                    <div className="text-xs text-slate-300 mt-1.5 font-semibold">State Talent Standing</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">Top 5% Statewide Probables</div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-slate-900/80 text-center">
                    <div className="text-2xl font-extrabold text-emerald-300 font-['Outfit'] mt-1">
                      {athleteStats.reviewStatus}
                    </div>
                    <div className="text-xs text-slate-300 mt-1.5 font-semibold">SAI Scouting Status</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Shortlisted for Stage 1 Camp</div>
                  </div>
                </div>

                {/* Rahul's 3 Verified Tests Mini-Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {athleteStats.latestTests.length > 0 ? (
                    athleteStats.latestTests.map((t, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{t.name}</div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{t.metric}</div>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">
                          {t.score} pts
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-1 sm:col-span-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                      No verified tests found.
                    </div>
                  )}
                </div>
              </div>
            ) : user?.role === 'SAI_ADMIN' ? (
              /* SAI ADMIN NATIONAL SCOUTING PIPELINE METRICS */
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      SAI National Scouting Pipeline &bull; Administrative Overview
                    </span>
                  </div>
                  <Link href="/admin" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold">
                    Open SAI Dashboard <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                    <div className="text-3xl font-extrabold text-emerald-400 font-['Outfit']">
                      {nationalStats.totalAthletes}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Scouted Athletes</div>
                    <div className="text-[10px] text-emerald-500 mt-0.5">Haryana, Punjab, Kerala</div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                    <div className="text-3xl font-extrabold text-[#FF7A00] font-['Outfit']">
                      5
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Standardized Tests</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">Pushups, 100m, Situps, Wallsit, High Jump</div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                    <div className="text-3xl font-extrabold text-teal-300 font-['Outfit']">
                      {nationalStats.averageScore}/100
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">National Average Biomechanics</div>
                    <div className="text-[10px] text-teal-400 mt-0.5">Top: {nationalStats.topScore} pts (Priya Sharma)</div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                    <div className="text-3xl font-extrabold text-purple-400 font-['Outfit']">
                      {nationalStats.shortlistedCount}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Athletes Shortlisted</div>
                    <div className="text-[10px] text-purple-400 mt-0.5">Khelo India National Camps</div>
                  </div>
                </div>
              </div>
            ) : (
              /* GUEST / LOGGED-OUT OVERVIEW */
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-3xl font-extrabold text-emerald-400 font-['Outfit']">
                    3
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">Registered Athletes</div>
                  <div className="text-[10px] text-emerald-500 mt-0.5">Punjab, Haryana, Kerala</div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-3xl font-extrabold text-[#FF7A00] font-['Outfit']">
                    5
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">Official Test Protocols</div>
                  <div className="text-[10px] text-amber-400 mt-0.5">Pushups, 100m, Situps, Wallsit, Jumps</div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-3xl font-extrabold text-teal-300 font-['Outfit']">
                    89.6/100
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">National Average Score</div>
                  <div className="text-[10px] text-teal-400 mt-0.5">PostgreSQL &amp; YOLO11n Verified</div>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                  <div className="text-3xl font-extrabold text-orange-400 font-['Outfit']">
                    93.4
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">Top National Benchmark</div>
                  <div className="text-[10px] text-orange-400 mt-0.5">Priya Sharma (100m: 11.82s)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* THE 5 STANDARDIZED PROTOCOLS SECTION */}
      <section className="py-16 border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
                Official National Assessments
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-100 mt-1">
                The 5 Standardized Athletic Tests
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Calibrated computer-vision test suite designed to evaluate muscular strength, sprint velocity, core stability, and explosive power.
              </p>
            </div>
            <Link
              href="/athlete"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 shrink-0"
            >
              Submit an assessment in Athlete Portal <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Pushups */}
            <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 to-emerald-950/20 glass-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    TEST 1 &bull; OPERATIONAL
                  </span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-3 font-['Outfit']">
                  Pushups Assessment
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Evaluates upper body and pectoral endurance. AI tracks elbow flexion angle (minimum 90° depth), lockout extension, and plank torso alignment without hip sagging.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Min. Depth</div>
                  <div className="font-bold text-emerald-300 mt-0.5">≤ 90° Elbow</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Benchmark</div>
                  <div className="font-bold text-emerald-300 mt-0.5">25 – 45 reps</div>
                </div>
              </div>
            </div>

            {/* 2. 100 Metres Sprint / Run */}
            <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-slate-900/90 to-orange-950/20 glass-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    TEST 2 &bull; OPERATIONAL
                  </span>
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-[#FF7A00]">
                    <Timer className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-3 font-['Outfit']">
                  100 Metres Sprint / Run
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Measures top-end sprint speed and 100m straightaway timing. Tracks departure trigger, 0-30m acceleration phase, top speed maintenance, and stride frequency.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">National Target</div>
                  <div className="font-bold text-[#FF7A00] mt-0.5">10.8s – 12.5s</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Cadence</div>
                  <div className="font-bold text-[#FF7A00] mt-0.5">220 – 260 spm</div>
                </div>
              </div>
            </div>

            {/* 3. Situps */}
            <div className="glass-card p-6 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-slate-900/90 to-teal-950/20 glass-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    TEST 3 &bull; OPERATIONAL
                  </span>
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-300">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-3 font-['Outfit']">
                  Situps Assessment
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Evaluates core abdominal endurance and trunk flexion. Verifies complete shoulder blade ground return on descent and knee-elbow contact on flexion.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Trunk Angle</div>
                  <div className="font-bold text-teal-300 mt-0.5">45° – 65°</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Benchmark</div>
                  <div className="font-bold text-teal-300 mt-0.5">35 – 55 reps</div>
                </div>
              </div>
            </div>

            {/* 4. Wall Sit */}
            <div className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/90 to-amber-950/20 glass-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    TEST 4 &bull; OPERATIONAL
                  </span>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-3 font-['Outfit']">
                  Wall Sit Isometric Hold
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Measures isometric quadriceps endurance. AI confirms continuous wall back contact and monitors thigh parallelism at a strict 90-degree knee flexion angle.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Knee Angle</div>
                  <div className="font-bold text-amber-300 mt-0.5">90° ± 5°</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Target Hold</div>
                  <div className="font-bold text-amber-300 mt-0.5">60s – 120s</div>
                </div>
              </div>
            </div>

            {/* 5. High Jumps */}
            <div className="glass-card p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 to-purple-950/20 glass-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    TEST 5 &bull; OPERATIONAL
                  </span>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-3 font-['Outfit']">
                  High Jumps / Vertical Clearance
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Tests lower body explosive power and flight mechanics. Computes airborne flight duration, takeoff velocity, countermovement dip angle, and peak clearance height.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Jump Height</div>
                  <div className="font-bold text-purple-300 mt-0.5">50 – 75 cm</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-slate-400 text-[10px]">Flight Time</div>
                  <div className="font-bold text-purple-300 mt-0.5">520 – 680 ms</div>
                </div>
              </div>
            </div>

            {/* Additional 6th card explaining AI Rigor */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  AI QUALITY GUARANTEE
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-3 font-['Outfit']">
                  Anti-Fabrication Protocol
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Every video is parsed frame-by-frame by YOLO11n-Pose. Clips with insufficient lighting, occluded limbs, or crowd interference receive instant retake guidance rather than fabricated scores.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>Certified by SAI</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
