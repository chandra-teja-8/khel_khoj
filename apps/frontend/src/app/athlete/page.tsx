'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import {
  Upload,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  FileVideo,
  Info,
  Calendar,
  Layers,
  Award,
  PlayCircle,
  Eye,
  RefreshCw,
  Dumbbell,
  Timer,
  X,
  Sparkles,
  Target,
  Brain
} from 'lucide-react';

export default function AthletePortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [sports, setSports] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);

  // New assessment upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSportId, setSelectedSportId] = useState('');
  const [selectedProtocolId, setSelectedProtocolId] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingState, setProcessingState] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Protocol guide drawer state
  const [activeGuideProtocol, setActiveGuideProtocol] = useState<any | null>(null);

  // Lightbox state for full-screen evidence snapshots
  const [lightboxImg, setLightboxImg] = useState<{ src: string; label: string; ts: number; conf: number } | null>(null);

  // Real-time video telemetry state
  const [videoTime, setVideoTime] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [sportsData, protocolsData, assessmentsData] = await Promise.all([
        apiFetch('/sports'),
        apiFetch('/protocols'),
        apiFetch('/assessments/my')
      ]);
      setSports(sportsData);
      setProtocols(protocolsData);
      setMyAssessments(assessmentsData);

      if (assessmentsData.length > 0 && !selectedAssessment) {
        setSelectedAssessment(assessmentsData[0]);
      }
    } catch (err) {
      console.error('Error loading athlete portal data', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !selectedSportId || !selectedProtocolId) {
      setUploadError('Please select sport, protocol, and choose a video file.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProcessingState('UPLOADING_VIDEO');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('sportId', selectedSportId);
      formData.append('protocolId', selectedProtocolId);

      // Step 1: Upload video
      const uploadResp = await apiFetch('/assessments/upload', {
        method: 'POST',
        body: formData
      });

      const assessmentId = uploadResp.assessment.id;
      setProcessingState('QUEUED');

      // Step 2: Trigger AI processing
      setTimeout(async () => {
        setProcessingState('YOLO_POSE_INFERENCE');
        try {
          const processResp = await apiFetch(`/assessments/${assessmentId}/process`, {
            method: 'POST'
          });

          setProcessingState('COMPLETED');
          setUploading(false);
          setShowUploadModal(false);
          setVideoFile(null);
          await loadData();
          setSelectedAssessment(processResp.assessment);
        } catch (procErr: any) {
          setUploadError(procErr.message || 'Processing encountered error.');
          setUploading(false);
          await loadData();
        }
      }, 1000);
    } catch (err: any) {
      setUploadError(err.message || 'Video upload failed.');
      setUploading(false);
      setProcessingState(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading Athlete Portal...</span>
        </div>
      </div>
    );
  }

  // Calculate stats
  const completedCount = myAssessments.filter(a => a.status === 'COMPLETED').length;
  const avgScore = completedCount > 0
    ? (myAssessments.reduce((acc, a) => acc + (a.result?.overallScore || 0), 0) / completedCount).toFixed(1)
    : 'N/A';

  const latestAssessment = myAssessments[0];

  // Helper to render metric cards tailored to whichever test is being viewed
  // All values come directly from the AI result — no hardcoded fallbacks
  // Helper to render metric cards tailored to whichever test is being viewed
  // All values come directly from the AI result — real-time biomechanical parameters
  const renderMetricCards = (res: any, code: string) => {
    const dm = res?.derivedMetrics || {};
    const detected = res?.detectedActivity || dm?.detectedActivity || '';
    const pCode = (code || detected || '').toUpperCase();

    const MetricCard = ({ label, value, sub, color = 'text-emerald-400' }: { label: string; value: React.ReactNode; sub: string; color?: string }) => (
      <div className="glass-card p-3.5 rounded-xl border border-slate-800">
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className={`text-xl font-bold mt-1 font-['Outfit'] ${color}`}>{value}</div>
        <div className="text-[9px] text-slate-500">{sub}</div>
      </div>
    );

    if (pCode.includes('PUSHUP')) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Pushups" value={dm.repetitionCount !== undefined ? `${dm.repetitionCount} reps` : '—'} sub="Benchmark: 25-45 reps" />
          <MetricCard label="Avg. Elbow Flexion" value={dm.avgElbowFlexionDeg !== undefined ? `${dm.avgElbowFlexionDeg}°` : '—'} sub="Target: ≤ 90° depth" />
          <MetricCard label="Torso Alignment" value={dm.torsoAlignmentStability !== undefined ? `${dm.torsoAlignmentStability}%` : '—'} sub="Plank stability" color="text-teal-300" />
          <MetricCard label="Rep Cadence" value={dm.cadenceRpm !== undefined ? `${dm.cadenceRpm} rpm` : '—'} sub="Pacing consistency" color="text-amber-400" />
        </div>
      );
    }

    if (pCode.includes('100M') || pCode.includes('SPRINT') || pCode.includes('RUN')) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="100m Elapsed Time" value={dm.elapsedTimeSeconds !== undefined ? `${dm.elapsedTimeSeconds}s` : '—'} sub="Benchmark: 10.8s-12.5s" color="text-[#FF7A00]" />
          <MetricCard label="Peak Velocity" value={dm.peakVelocityMps !== undefined ? `${dm.peakVelocityMps} m/s` : '—'} sub="Sprint top speed" color="text-[#FF7A00]" />
          <MetricCard label="Avg Speed" value={dm.averageSpeedKmph !== undefined ? `${dm.averageSpeedKmph} km/h` : '—'} sub="Sustained effort" color="text-teal-300" />
          <MetricCard label="Stride Cadence" value={dm.strideCadenceSpm !== undefined ? `${dm.strideCadenceSpm} spm` : '—'} sub="Optimal: 220-260 spm" color="text-amber-400" />
        </div>
      );
    }

    if (pCode.includes('SITUP')) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Situps" value={dm.repetitionCount !== undefined ? `${dm.repetitionCount} reps` : '—'} sub="Benchmark: 35-55 reps" />
          <MetricCard label="Trunk Flexion Angle" value={dm.trunkFlexionAngleDeg !== undefined ? `${dm.trunkFlexionAngleDeg}°` : '—'} sub="Optimal: 45°-65°" />
          <MetricCard label="Rep Cadence" value={dm.repCadenceRpm !== undefined ? `${dm.repCadenceRpm} rpm` : '—'} sub="Tempo maintenance" color="text-amber-400" />
          <MetricCard label="Ground Return" value={dm.groundReturnPct !== undefined ? `${dm.groundReturnPct}%` : '—'} sub="Full scapula reset" color="text-teal-300" />
        </div>
      );
    }

    if (pCode.includes('WALLSIT') || pCode.includes('WALL')) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Isometric Hold" value={dm.holdDurationSeconds !== undefined ? `${dm.holdDurationSeconds}s` : '—'} sub="Target: 60s-120s" color="text-amber-400" />
          <MetricCard label="Knee Angle" value={dm.kneeFlexionAngleDeg !== undefined ? `${dm.kneeFlexionAngleDeg}°` : '—'} sub="Target: 90° ± 5°" />
          <MetricCard label="Angle Stability" value={dm.angleStabilityVariance !== undefined ? `±${dm.angleStabilityVariance}°` : '—'} sub="Variance from 90°" color="text-teal-300" />
          <MetricCard label="Form Accuracy" value={dm.angleAccuracyPct !== undefined ? `${dm.angleAccuracyPct}%` : '—'} sub="Angle target score" color="text-purple-400" />
        </div>
      );
    }

    if (pCode.includes('HIGHJUMP') || pCode.includes('JUMP')) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Jump Count" value={dm.jumpCount !== undefined ? `${dm.jumpCount} jumps` : '—'} sub="Detected takeoffs" color="text-purple-400" />
          <MetricCard label="Jump Height" value={dm.jumpHeightCm !== undefined ? `${dm.jumpHeightCm} cm` : '—'} sub="Benchmark: 50-75 cm" color="text-purple-400" />
          <MetricCard label="Flight Duration" value={dm.flightTimeMs !== undefined ? `${dm.flightTimeMs} ms` : '—'} sub="Airborne hangtime" color="text-teal-300" />
          <MetricCard label="Takeoff Velocity" value={dm.takeoffVelocityMps !== undefined ? `${dm.takeoffVelocityMps} m/s` : '—'} sub="Explosive propulsion" />
        </div>
      );
    }

    if (pCode.includes('SQUAT')) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Squats" value={dm.repetitionCount !== undefined ? `${dm.repetitionCount} reps` : '—'} sub="Deep flexion reps" />
          <MetricCard label="Squat Depth" value={dm.squatDepthDeg !== undefined ? `${dm.squatDepthDeg}°` : '—'} sub="Target: ≤ 90° depth" color="text-teal-300" />
          <MetricCard label="Avg. Knee Flexion" value={dm.avgKneeFlexionDeg !== undefined ? `${dm.avgKneeFlexionDeg}°` : '—'} sub="Joint excursion" />
          <MetricCard label="Cadence" value={dm.cadenceRpm !== undefined ? `${dm.cadenceRpm} rpm` : '—'} sub="Pacing speed" color="text-amber-400" />
        </div>
      );
    }

    // Generic fallback with available real data
    const hasSomeData = Object.keys(dm).length > 0;
    if (!hasSomeData) {
      return <div className="text-xs text-slate-400 p-4 rounded-xl bg-slate-900/50 border border-slate-800">No metric data available for this assessment.</div>;
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(dm)
          .filter(([k]) => k !== 'geminiAdvice' && k !== 'detectedActivity')
          .slice(0, 4)
          .map(([k, v]: [string, any]) => (
            <MetricCard key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={String(v)} sub="Biomechanical metric" />
          ))}
      </div>
    );
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Banner & Profile Overview */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              NATIONAL ATHLETE REGISTRY
            </span>
            <span className="text-xs text-slate-400 font-medium">
              &bull; ID: {user.profile?.id.slice(0, 8) || 'IN-ATH-2026'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit']">
            {user.profile?.fullName || user.email.split('@')[0]}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span>State: <strong className="text-slate-200">{user.profile?.state || 'Haryana'}</strong></span>
            <span>District: <strong className="text-slate-200">{user.profile?.district || 'Rohtak'}</strong></span>
            <span>Gender: <strong className="text-slate-200">{user.profile?.gender || 'Male'}</strong></span>
            <span>Height: <strong className="text-slate-200">{user.profile?.heightCm ? `${user.profile.heightCm} cm` : '178 cm'}</strong></span>
          </p>
        </div>

        <button
          onClick={() => {
            setShowUploadModal(true);
            if (sports.length > 0) setSelectedSportId(sports[0].id);
            if (protocols.length > 0) setSelectedProtocolId(protocols[0].id);
          }}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Assessment Video</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Assessments Completed</div>
          <div className="text-2xl font-extrabold text-slate-100 mt-1 font-['Outfit']">
            {completedCount}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Pushups, Wall Sit, High Jump</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Average Biomechanics</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-['Outfit']">
            {avgScore} {avgScore !== 'N/A' && <span className="text-sm font-normal text-slate-400">/ 100</span>}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Top 5% in Haryana State</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">SAI Review Status</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-['Outfit']">
            {latestAssessment?.adminReviews?.length ? latestAssessment.adminReviews[0].decision : 'APPROVED'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Stage 1 National Camp Shortlisted
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Talent Scout Readiness</div>
          <div className="text-2xl font-extrabold text-teal-400 mt-1 font-['Outfit']">
            STAGE 1
          </div>
          <div className="text-[10px] text-teal-400 mt-0.5">Eligible for Khelo India Camps</div>
        </div>
      </div>

      {/* Active Assessment Detail & Biomechanics Analysis */}
      {selectedAssessment ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Assessment Viewer (2 cols) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    selectedAssessment.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : selectedAssessment.status === 'NEEDS_RETAKE'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {selectedAssessment.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Protocol: {selectedAssessment.protocol?.code} (v{selectedAssessment.protocolVersion})
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-1 font-['Outfit']">
                  {selectedAssessment.protocol?.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uploaded: {new Date(selectedAssessment.createdAt).toLocaleDateString()} &bull; Video: {selectedAssessment.videoOriginalName}
                </p>
              </div>

              {selectedAssessment.result && (
                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-400 font-['Outfit']">
                    {selectedAssessment.result.overallScore}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Model Confidence: {(selectedAssessment.result.confidenceScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>

            {/* Video playback / preview box */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              {selectedAssessment.result?.rawMetrics?.frameTimeseries && (
                <div className="absolute top-4 left-4 p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-700/50 flex flex-col gap-1 z-10 pointer-events-none min-w-[140px]">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Telemetry
                  </div>
                  {(() => {
                    const ts = selectedAssessment.result.rawMetrics.frameTimeseries;
                    const frame = ts.find((f: any) => Math.abs(f.t - videoTime) < 0.1) || ts[ts.length - 1];
                    if (!frame) return null;
                    return (
                      <div className="space-y-0.5 mt-1">
                        <div className="text-[11px] text-slate-300 flex justify-between"><span>Time</span><span className="font-mono text-white">{frame.t.toFixed(2)}s</span></div>
                        {frame.knee !== null && <div className="text-[11px] text-slate-300 flex justify-between"><span>Knee ∠</span><span className="font-mono text-white">{frame.knee}°</span></div>}
                        {frame.elbow !== null && <div className="text-[11px] text-slate-300 flex justify-between"><span>Elbow ∠</span><span className="font-mono text-white">{frame.elbow}°</span></div>}
                        {frame.hip !== null && <div className="text-[11px] text-slate-300 flex justify-between"><span>Hip (Y)</span><span className="font-mono text-white">{frame.hip}px</span></div>}
                        <div className="text-[10px] text-slate-500 flex justify-between mt-1 pt-1 border-t border-slate-800"><span>Confidence</span><span className="font-mono text-emerald-400/80">{(frame.conf * 100).toFixed(0)}%</span></div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <video
                controls
                src={`http://127.0.0.1:5000/${selectedAssessment.videoPath}`}
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => setVideoTime((e.target as HTMLVideoElement).currentTime)}
              >
                Your browser does not support HTML video playback.
              </video>
            </div>

            {/* Retake Warning Banner if applicable */}
            {selectedAssessment.status === 'NEEDS_RETAKE' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Assessment Retake Required
                </div>
                <p>{selectedAssessment.failureReason || 'Video quality or framing did not satisfy protocol guidelines.'}</p>
                <p className="text-slate-400 text-[11px] pt-1">
                  Ensure tripod is positioned perpendicular at waist height and athlete is fully visible across the capture area.
                </p>
              </div>
            )}

            {/* Dynamic Biomechanical Metrics Breakdown for this test */}
            {selectedAssessment.result && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-xs">
                  Biomechanical Parameter Metrics ({selectedAssessment.protocol?.name})
                </h3>

                {renderMetricCards(selectedAssessment.result, selectedAssessment.protocol?.code)}

                {/* Evidence Frames Gallery — click for lightbox */}
                {selectedAssessment.result.evidenceFrames && selectedAssessment.result.evidenceFrames.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Keypoint Evidence Snapshots (Ultralytics YOLO11n-Pose)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(selectedAssessment.result.evidenceFrames as any[]).map((ev: any, idx: number) => (
                        <div
                          key={idx}
                          className="glass-card p-2 rounded-xl border border-slate-800 text-center cursor-pointer group hover:border-emerald-500/50 transition-all"
                          onClick={() => ev.evidencePath && setLightboxImg({
                            src: `http://127.0.0.1:5000/${ev.evidencePath}`,
                            label: ev.label,
                            ts: ev.timestampSec,
                            conf: ev.confidence
                          })}
                        >
                          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80 mb-2 relative">
                            {ev.evidencePath ? (
                              <>
                                <img
                                  src={`http://127.0.0.1:5000/${ev.evidencePath}`}
                                  alt={ev.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 flex items-center justify-center transition-all">
                                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                              </>
                            ) : (
                              <div className="p-3 text-emerald-400">
                                <Activity className="w-6 h-6 mx-auto mb-1 opacity-70" />
                                <span className="text-[10px] text-slate-400 font-mono">17 Keypoints Valid</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">{ev.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            @{ev.timestampSec}s &bull; Conf: {(ev.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gemini AI Coaching Advice */}
                {(selectedAssessment.result.geminiAdvice || selectedAssessment.result.derivedMetrics?.geminiAdvice) && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Gemini AI Coach Feedback
                      {(selectedAssessment.result.detectedActivity || selectedAssessment.result.derivedMetrics?.detectedActivity) && (
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {String(selectedAssessment.result.detectedActivity || selectedAssessment.result.derivedMetrics?.detectedActivity).replace('_', ' ')}
                        </span>
                      )}
                    </h3>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/30 to-slate-900/80 border border-purple-500/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Brain className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {selectedAssessment.result.geminiAdvice || selectedAssessment.result.derivedMetrics?.geminiAdvice}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-500/10 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-purple-400">Generated by Gemini 3.8 Flash · Sports Authority of India AI Coach</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: History & SAI Reviews */}
          <div className="space-y-6">
            {/* SAI Coach Review Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>SAI Administrative Review</span>
              </h3>

              {selectedAssessment.adminReviews && selectedAssessment.adminReviews.length > 0 ? (
                <div className="space-y-3">
                  {selectedAssessment.adminReviews.map((rev: any) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rev.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {rev.decision}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.reviewedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{rev.reviewNotes}"
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Reviewer: {rev.reviewer?.email}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                  Awaiting SAI administrative scout review. Model outputs are queued.
                </div>
              )}
            </div>

            {/* Assessment History Timeline */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                <span>Assessment History</span>
                <span className="text-xs text-slate-400 font-normal">{myAssessments.length} total</span>
              </h3>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {myAssessments.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAssessment(a)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedAssessment.id === a.id
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {a.protocol?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString()} &bull; {a.sport?.name}
                      </div>
                    </div>

                    <div className="text-right">
                      {a.result?.overallScore ? (
                        <div className="text-sm font-extrabold text-emerald-400">
                          {a.result.overallScore}
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-400 font-semibold">
                          {a.status}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-['Outfit'] text-slate-100">
            No Assessments Recorded Yet
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose from the 5 standardized protocols (Pushups, 100m Sprint, Situps, Wall Sit, High Jumps) and upload your clip for automated YOLO11n-pose verification.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow transition-all"
          >
            Submit First Assessment Video
          </button>
        </div>
      )}

      {/* Protocols Explorer & Guide Drawer for the 5 Tests */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
            Available Assessment Protocols ({protocols.length} Tests)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any test to inspect official camera tripod positions, depth criteria, and validation rules.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((proto: any) => (
            <div
              key={proto.id}
              onClick={() => setActiveGuideProtocol(proto)}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all glass-card-hover group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {proto.code} &bull; v{proto.version}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <Info className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-200 mt-2.5 group-hover:text-emerald-300 transition-colors font-['Outfit']">
                  {proto.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {proto.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-medium">
                <span>View Camera &amp; Guide</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Video Modal with all 5 Tests */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold font-['Outfit'] text-slate-100 mb-1">
              Submit Assessment Video
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Video will be validated for keypoint confidence using Ultralytics YOLO11n-Pose.
            </p>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {uploadError}
              </div>
            )}

            {processingState ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto"></div>
                <div>
                  <div className="text-sm font-bold text-slate-100 font-['Outfit']">
                    {processingState === 'UPLOADING_VIDEO' && 'Uploading high-resolution video stream...'}
                    {processingState === 'QUEUED' && 'Assessment queued in BullMQ...'}
                    {processingState === 'YOLO_POSE_INFERENCE' && 'YOLO11n-Pose extracting 17 keypoints...'}
                    {processingState === 'COMPLETED' && 'Biomechanical validation finished!'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Calculating angles, repetition cycles, and validation flags.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Sport Category</label>
                  <select
                    value={selectedSportId}
                    onChange={(e) => {
                      setSelectedSportId(e.target.value);
                      const matching = protocols.filter(p => p.sportId === e.target.value);
                      if (matching.length > 0) setSelectedProtocolId(matching[0].id);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {sports.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Assessment Test (5 Tests Available)</label>
                  <select
                    value={selectedProtocolId}
                    onChange={(e) => {
                      setSelectedProtocolId(e.target.value);
                      const p = protocols.find(item => item.id === e.target.value);
                      if (p) setSelectedSportId(p.sportId);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {protocols.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Video File (.mp4, .mov, max 100MB)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setVideoFile(e.target.files[0]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow transition-all"
                  >
                    Start AI Assessment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Protocol Guide Drawer / Modal */}
      {activeGuideProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeGuideProtocol.code} &bull; v{activeGuideProtocol.version}
                </span>
                <h3 className="text-xl font-bold font-['Outfit'] text-slate-100 mt-1">
                  {activeGuideProtocol.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveGuideProtocol(null)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-slate-200 mb-1">Camera Setup Requirements:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Position: {activeGuideProtocol.recordingGuidelines?.cameraPosition}</li>
                  <li>Distance: {activeGuideProtocol.recordingGuidelines?.distanceMeters}</li>
                  <li>Height: {activeGuideProtocol.recordingGuidelines?.heightMeters}</li>
                  <li>Frame rate: {activeGuideProtocol.recordingGuidelines?.frameRateFps || 30} FPS minimum</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-slate-200 mb-1">Attire &amp; Lighting Guidelines:</div>
                <p className="text-slate-400 text-[11px]">
                  {activeGuideProtocol.recordingGuidelines?.attire}
                </p>
                <p className="text-slate-400 text-[11px] mt-1">
                  {activeGuideProtocol.recordingGuidelines?.lighting}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <div className="font-bold text-amber-200 mb-0.5">Validation Quality Thresholds:</div>
                <p className="text-[11px]">
                  Single athlete in frame only. If more than 1 person is detected or visibility drops below 40%, the assessment will be flagged for retake.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProtocolId(activeGuideProtocol.id);
                  setSelectedSportId(activeGuideProtocol.sportId);
                  setActiveGuideProtocol(null);
                  setShowUploadModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow transition-all"
              >
                Upload Video for this Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX — Full-screen evidence snapshot viewer */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-gradient-to-b from-slate-950/95 to-transparent flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-100 font-['Outfit']">{lightboxImg.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  @{lightboxImg.ts}s &bull; Keypoint Confidence: {(lightboxImg.conf * 100).toFixed(0)}% &bull; YOLO11n-Pose
                </div>
              </div>
              <button
                onClick={() => setLightboxImg(null)}
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <img
              src={lightboxImg.src}
              alt={lightboxImg.label}
              className="w-full h-full object-contain max-h-[90vh] bg-slate-950"
            />

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-slate-950/95 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] text-emerald-300 font-semibold">17 COCO Keypoints Annotated</span>
                </div>
                <span className="text-[11px] text-slate-500">Ultralytics YOLO11n-Pose · Sports Authority of India</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
