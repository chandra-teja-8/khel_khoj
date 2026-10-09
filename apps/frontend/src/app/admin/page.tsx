'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import {
  ShieldCheck,
  Users,
  Award,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  FileText,
  UserCheck,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function SaiAdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'ATHLETES' | 'QUEUE' | 'LEADERBOARD' | 'SHORTLISTS' | 'AUDIT'>('ANALYTICS');

  // Analytics data
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Athletes list data
  const [athletes, setAthletes] = useState<any[]>([]);
  const [athleteSearch, setAthleteSearch] = useState('');
  const [athleteStateFilter, setAthleteStateFilter] = useState('');

  // Assessment queue data
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | 'RETAKE_REQUESTED' | 'FLAGGED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Leaderboard data
  const [protocols, setProtocols] = useState<any[]>([]);
  const [selectedLeaderboardProtocol, setSelectedLeaderboardProtocol] = useState<string>('');
  const [leaderboardData, setLeaderboardData] = useState<any | null>(null);

  // Shortlists data
  const [shortlists, setShortlists] = useState<any[]>([]);
  const [newShortlistName, setNewShortlistName] = useState('');
  const [newShortlistDesc, setNewShortlistDesc] = useState('');
  const [showCreateShortlist, setShowCreateShortlist] = useState(false);

  // Audit logs data
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'SAI_ADMIN') {
        // Not admin
      }
    }
  }, [user, authLoading, router]);

  const loadAdminData = async () => {
    try {
      const [analyticsData, protocolsData, assessmentsData, shortlistsData] = await Promise.all([
        apiFetch('/admin/analytics'),
        apiFetch('/protocols'),
        apiFetch('/admin/assessments'),
        apiFetch('/admin/shortlists')
      ]);

      setAnalytics(analyticsData);
      setProtocols(protocolsData);
      setAssessments(assessmentsData);
      setShortlists(shortlistsData);

      if (protocolsData.length > 0 && !selectedLeaderboardProtocol) {
        setSelectedLeaderboardProtocol(protocolsData[0].id);
      }

      if (assessmentsData.length > 0 && !selectedAssessment) {
        setSelectedAssessment(assessmentsData[0]);
      }
    } catch (err) {
      console.error('Failed to load SAI admin data', err);
    }
  };

  const loadAthletes = async () => {
    try {
      const query = new URLSearchParams();
      if (athleteSearch) query.append('search', athleteSearch);
      if (athleteStateFilter) query.append('state', athleteStateFilter);
      const data = await apiFetch(`/admin/athletes?${query.toString()}`);
      setAthletes(data.athletes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLeaderboard = async (protoId: string) => {
    if (!protoId) return;
    try {
      const data = await apiFetch(`/admin/leaderboard?protocolId=${protoId}`);
      setLeaderboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await apiFetch('/admin/audit-logs');
      setAuditLogs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'SAI_ADMIN') {
      loadAdminData();
      loadAthletes();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'ATHLETES') loadAthletes();
    if (activeTab === 'LEADERBOARD' && selectedLeaderboardProtocol) loadLeaderboard(selectedLeaderboardProtocol);
    if (activeTab === 'AUDIT') loadAuditLogs();
  }, [activeTab, selectedLeaderboardProtocol]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setSubmittingReview(true);
    try {
      await apiFetch(`/admin/assessments/${selectedAssessment.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision: reviewDecision,
          reviewNotes
        })
      });
      setReviewNotes('');
      // Reload assessments
      const updated = await apiFetch('/admin/assessments');
      setAssessments(updated);
      const current = updated.find((a: any) => a.id === selectedAssessment.id);
      if (current) setSelectedAssessment(current);
      const analyticsUpdate = await apiFetch('/admin/analytics');
      setAnalytics(analyticsUpdate);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreateShortlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortlistName) return;
    try {
      await apiFetch('/admin/shortlists', {
        method: 'POST',
        body: JSON.stringify({
          name: newShortlistName,
          description: newShortlistDesc
        })
      });
      setNewShortlistName('');
      setNewShortlistDesc('');
      setShowCreateShortlist(false);
      const updated = await apiFetch('/admin/shortlists');
      setShortlists(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to create shortlist');
    }
  };

  const handleAddToShortlist = async (shortlistId: string, athleteId: string, assessmentId?: string) => {
    try {
      await apiFetch(`/admin/shortlists/${shortlistId}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          athleteId,
          assessmentId,
          notes: 'Added via official SAI Leaderboard evaluation'
        })
      });
      alert('Athlete successfully added to shortlist!');
      const updated = await apiFetch('/admin/shortlists');
      setShortlists(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to add athlete');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
      </div>
    );
  }

  if (user.role !== 'SAI_ADMIN') {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md glass-card p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-['Outfit'] text-slate-100">
            SAI Administrative Access Required
          </h2>
          <p className="text-xs text-slate-400">
            Your current account ({user.email}) has role <strong>{user.role}</strong>. Please sign in with an official SAI Admin account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            Switch to Admin Demo Account
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-amber-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SAI NATIONAL SCOUTING DESK
            </span>
            <span className="text-xs text-slate-400 font-medium">
              &bull; Official Assessment &amp; Talent Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit']">
            Sports Authority of India &bull; Administrative Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as: <strong className="text-slate-200">{user.email}</strong> &bull; Role: <strong className="text-amber-400">SAI_ADMIN</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadAdminData(); loadAthletes(); }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync DB</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ANALYTICS'
              ? 'bg-amber-500 text-slate-950 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'QUEUE'
              ? 'bg-amber-500 text-slate-950 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Assessment Review Queue</span>
          {analytics?.summary?.pendingReviews > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px]">
              {analytics.summary.pendingReviews}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'LEADERBOARD'
              ? 'bg-amber-500 text-slate-950 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Protocol Rankings</span>
        </button>

        <button
          onClick={() => setActiveTab('ATHLETES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ATHLETES'
              ? 'bg-amber-500 text-slate-950 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Athlete Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('SHORTLISTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'SHORTLISTS'
              ? 'bg-amber-500 text-slate-950 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Talent Shortlists</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'AUDIT'
              ? 'bg-amber-500 text-slate-950 shadow-glow'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit History</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS OVERVIEW */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Total Athletes Registered</div>
              <div className="text-2xl font-extrabold text-slate-100 mt-1 font-['Outfit']">
                {analytics.summary.totalAthletes}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Grassroots National Database</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Verified AI Assessments</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1 font-['Outfit']">
                {analytics.summary.totalAssessments}
              </div>
              <div className="text-[10px] text-amber-400 mt-0.5">
                {analytics.summary.completedAssessments} Completed &bull; {analytics.summary.retakeAssessments} Retakes
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">National Average Biomechanics</div>
              <div className="text-2xl font-extrabold text-teal-300 mt-1 font-['Outfit']">
                {analytics.summary.averageScore}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Top: {analytics.summary.topScore}/100</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Administrative Reviews</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-['Outfit']">
                {analytics.summary.approvedReviews} Approved
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{analytics.summary.pendingReviews} pending evaluation</div>
            </div>
          </div>

          {/* Recharts Analytics Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Athletes by State Chart */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 font-['Outfit']">
                Geographic Athlete Talent Distribution (by State)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.stateDistribution}>
                    <XAxis dataKey="state" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Assessments by Sport Distribution */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 font-['Outfit']">
                Assessments by Sport Category
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sportsDistribution}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Bar dataKey="assessmentsCount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSESSMENT REVIEW QUEUE */}
      {activeTab === 'QUEUE' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Assessment List (1 col) */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 font-['Outfit'] flex items-center justify-between">
              <span>Assessment Submissions</span>
              <span className="text-xs text-slate-400 font-normal">{assessments.length}</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {assessments.map((a: any) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssessment(a)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    selectedAssessment?.id === a.id
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {a.athlete?.fullName || 'Athlete'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      a.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {a.protocol?.name} &bull; {a.sport?.name}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-emerald-400">
                      {a.result?.overallScore ? `${a.result.overallScore} pts` : 'No score'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Assessment Inspection & Decision Panel (2 cols) */}
          {selectedAssessment ? (
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {selectedAssessment.athlete?.fullName}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({selectedAssessment.athlete?.state}, {selectedAssessment.athlete?.gender})
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] mt-1">
                    {selectedAssessment.protocol?.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Protocol Version: v{selectedAssessment.protocolVersion} &bull; Video: {selectedAssessment.videoOriginalName}
                  </p>
                </div>

                {selectedAssessment.result && (
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-400 font-['Outfit']">
                      {selectedAssessment.result.overallScore}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Pose Confidence: {(selectedAssessment.result.confidenceScore * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Video Player */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                <video
                  controls
                  src={`http://127.0.0.1:5000/${selectedAssessment.videoPath}`}
                  className="w-full h-full object-contain"
                >
                  Video playback not supported
                </video>
              </div>

              {/* Biomechanical Evidence Frames */}
              {selectedAssessment.result?.evidenceFrames && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    AI Evidence Frames (YOLO11n-Pose Annotations)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(selectedAssessment.result.evidenceFrames as any[]).map((ev: any, idx: number) => (
                      <div key={idx} className="glass-card p-2 rounded-xl border border-slate-800 text-center">
                        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80 mb-2">
                          {ev.evidencePath ? (
                            <img
                              src={`http://127.0.0.1:5000/${ev.evidencePath}`}
                              alt={ev.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">Keypoint Frame</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-200">{ev.label}</div>
                        <div className="text-[10px] text-slate-400">@{ev.timestampSec}s</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Reviews History */}
              {selectedAssessment.adminReviews?.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-200">Existing Administrative Review:</div>
                  {selectedAssessment.adminReviews.map((r: any) => (
                    <div key={r.id} className="text-xs text-slate-300">
                      <span className="font-bold text-emerald-400">{r.decision}</span>: "{r.reviewNotes}"
                      <span className="text-[10px] text-slate-500 block">by {r.reviewer?.email} on {new Date(r.reviewedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Administrative Review Submission Form */}
              <form onSubmit={handleReviewSubmit} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 font-['Outfit']">
                  Record Administrative Decision (Scout Evaluation)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['APPROVED', 'REJECTED', 'RETAKE_REQUESTED', 'FLAGGED'] as const).map((dec) => (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => setReviewDecision(dec)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        reviewDecision === dec
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {dec}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Scout Notes &amp; Technical Rationale
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter technical comments regarding sagittal hip drive, cadence, and camp selection recommendations..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow transition-all"
                  >
                    {submittingReview ? 'Recording...' : 'Submit Administrative Decision'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-2 glass-panel p-12 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
              Select an assessment from the queue to inspect video evidence and record an administrative decision.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROTOCOL-COMPATIBLE LEADERBOARDS */}
      {activeTab === 'LEADERBOARD' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] text-slate-100">
                Protocol-Compatible National Leaderboard
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranks only athletes tested against the exact same sport, protocol, and protocol version.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Protocol:</label>
              <select
                value={selectedLeaderboardProtocol}
                onChange={(e) => {
                  setSelectedLeaderboardProtocol(e.target.value);
                  loadLeaderboard(e.target.value);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {protocols.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
                ))}
              </select>
            </div>
          </div>

          {leaderboardData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Athlete Name</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Key Metrics</th>
                    <th className="py-3 px-4 text-right">Shortlist Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboardData.rankings.map((item: any) => (
                    <tr key={item.athleteId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        #{item.rank}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {item.athleteName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{item.state}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.district}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.gender}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-400 text-sm">
                          {item.overallScore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {item.derivedMetrics?.repetitionCount !== undefined && `${item.derivedMetrics.repetitionCount} reps `}
                        {item.derivedMetrics?.elbowAngleMinDeg !== undefined && `Elbow: ${item.derivedMetrics.elbowAngleMinDeg}° `}
                        {item.derivedMetrics?.elapsedTimeSeconds !== undefined && `Time: ${item.derivedMetrics.elapsedTimeSeconds}s `}
                        {item.derivedMetrics?.strideCadenceSpm !== undefined && `Cadence: ${item.derivedMetrics.strideCadenceSpm} spm `}
                        {item.derivedMetrics?.peakVelocityMps !== undefined && `Top: ${item.derivedMetrics.peakVelocityMps}m/s `}
                        {item.derivedMetrics?.trunkFlexionAngleDeg !== undefined && `Trunk: ${item.derivedMetrics.trunkFlexionAngleDeg}° `}
                        {item.derivedMetrics?.holdDurationSeconds !== undefined && `Hold: ${item.derivedMetrics.holdDurationSeconds}s `}
                        {item.derivedMetrics?.kneeAngleAvgDeg !== undefined && `Knee: ${item.derivedMetrics.kneeAngleAvgDeg}° `}
                        {item.derivedMetrics?.jumpHeightCm !== undefined && `Height: ${item.derivedMetrics.jumpHeightCm}cm `}
                        {item.derivedMetrics?.flightTimeMs !== undefined && `Flight: ${item.derivedMetrics.flightTimeMs}ms `}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {shortlists.length > 0 ? (
                          <button
                            onClick={() => handleAddToShortlist(shortlists[0].id, item.athleteId)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                          >
                            + Shortlist
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Create shortlist first</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              Loading protocol leaderboard...
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATHLETE DIRECTORY */}
      {activeTab === 'ATHLETES' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] text-slate-100">
                National Athlete Talent Registry
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Search and inspect verified profiles across all sports and states.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={athleteSearch}
                  onChange={(e) => setAthleteSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAthletes()}
                  placeholder="Search name or district..."
                  className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={loadAthletes}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4">Tests</th>
                  <th className="py-3 px-4">Latest Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {athletes.map((ath: any) => (
                  <tr key={ath.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">{ath.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{ath.email}</td>
                    <td className="py-3.5 px-4 text-slate-300">{ath.state}</td>
                    <td className="py-3.5 px-4 text-slate-400">{ath.district}</td>
                    <td className="py-3.5 px-4 text-slate-400">{ath.gender}</td>
                    <td className="py-3.5 px-4 text-amber-300 font-medium">{ath.sport}</td>
                    <td className="py-3.5 px-4 text-slate-300">{ath.totalAssessments}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {ath.latestScore ? `${ath.latestScore} pts` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TALENT SHORTLISTS */}
      {activeTab === 'SHORTLISTS' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] text-slate-100">
                Khelo India Talent Shortlists
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage official cohorts of selected athletes for state and national training camps.
              </p>
            </div>

            <button
              onClick={() => setShowCreateShortlist(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-glow"
            >
              <Plus className="w-4 h-4" />
              <span>New Shortlist</span>
            </button>
          </div>

          {/* Create Modal */}
          {showCreateShortlist && (
            <form onSubmit={handleCreateShortlist} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-200">Create New Shortlist</h3>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Shortlist Name</label>
                <input
                  type="text"
                  required
                  value={newShortlistName}
                  onChange={(e) => setNewShortlistName(e.target.value)}
                  placeholder="e.g. National Sprint Camp 2026 Under-18"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newShortlistDesc}
                  onChange={(e) => setNewShortlistDesc(e.target.value)}
                  placeholder="Selection criteria and camp objectives..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateShortlist(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Shortlist
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {shortlists.map((sl: any) => (
              <div key={sl.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                      {sl.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{sl.description}</p>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Created by: {sl.creator?.email} &bull; {new Date(sl.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {sl.entries?.length || 0} Athletes
                  </span>
                </div>

                {sl.entries && sl.entries.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/60">
                    <div className="text-xs font-semibold text-slate-300 mb-2">Shortlisted Athletes:</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {sl.entries.map((entry: any) => (
                        <div key={entry.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-200">{entry.athlete?.fullName}</div>
                            <div className="text-[10px] text-slate-400">{entry.athlete?.state} &bull; {entry.notes || 'Selected'}</div>
                          </div>
                          {entry.assessment?.result?.overallScore && (
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              {entry.assessment.result.overallScore} pts
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT HISTORY */}
      {activeTab === 'AUDIT' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-bold font-['Outfit'] text-slate-100">
              Administrative Action Audit Trail
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable logging of all scouting decisions, reviews, and shortlisting activities.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-400">{log.user?.email || 'SYSTEM'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
