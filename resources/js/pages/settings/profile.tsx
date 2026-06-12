import * as faceapi from 'face-api.js';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState, useEffect, useCallback } from 'react';

// ─── Face-api model loader (singleton, loaded once per session) ───────────────
let _modelsLoaded = false;
let _modelsPromise: Promise<void> | null = null;

function loadModels(): Promise<void> {
    if (_modelsLoaded) return Promise.resolve();
    if (_modelsPromise)  return _modelsPromise;
    // Models served from CDN; copy to /public/models for offline use
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    _modelsPromise = Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]).then(() => { _modelsLoaded = true; });
    return _modelsPromise;
}

import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Camera, CheckCircle, Clock, Pencil, ScanFace, Shield, X, Eye, EyeOff, Lock, Mail, User, AlertTriangle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'info' | 'faceid' | 'security' | 'danger';
type FaceStatus = 'none' | 'pending' | 'approved' | 'rejected';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile settings', href: '/settings/profile' },
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
    input: {
        height: 40,
        padding: '0 12px 0 36px',
        fontSize: 14,
        fontFamily: 'inherit',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        color: '#111827',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s, box-shadow 0.15s',
    } as React.CSSProperties,

    inputNoIcon: {
        height: 40,
        padding: '0 12px',
        fontSize: 14,
        fontFamily: 'inherit',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        color: '#111827',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s, box-shadow 0.15s',
    } as React.CSSProperties,

    inputIcon: {
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9CA3AF',
        pointerEvents: 'none',
    } as React.CSSProperties,

    btnPrimary: {
        height: 38,
        padding: '0 20px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#111827',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
    } as React.CSSProperties,

    btnGhost: {
        height: 36,
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: '#FFFFFF',
        color: '#374151',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
    } as React.CSSProperties,

    card: {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    } as React.CSSProperties,

    cardDanger: {
        background: '#FFFFFF',
        border: '1px solid #FCA5A5',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    } as React.CSSProperties,

    cardHead: {
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FAFAFA',
    } as React.CSSProperties,

    cardHeadDanger: {
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #FCA5A5',
        backgroundColor: '#FEF2F2',
    } as React.CSSProperties,

    cardBody: {
        padding: 20,
    } as React.CSSProperties,

    fieldLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        marginBottom: 4,
    } as React.CSSProperties,

    sectionLabel: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: '#6B7280',
    } as React.CSSProperties,

    inputWrapper: {
        position: 'relative',
    } as React.CSSProperties,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#111827' : '#6B7280',
                cursor: 'pointer',
                borderBottom: active ? '2px solid #111827' : '2px solid transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                marginBottom: -1,
                background: 'none',
                fontFamily: 'inherit',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function Card({ label, badge, children, danger = false }: { label: string; badge?: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
    return (
        <div style={danger ? s.cardDanger : s.card}>
            <div style={danger ? s.cardHeadDanger : s.cardHead}>
                <span style={{ ...s.sectionLabel, color: danger ? '#991B1B' : '#6B7280' }}>{label}</span>
                {badge}
            </div>
            <div style={s.cardBody}>{children}</div>
        </div>
    );
}

function Field({ label, error, children, full = false }: { label: string; error?: string; children: React.ReactNode; full?: boolean }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: full ? 'span 2' : undefined }}>
            <label style={s.fieldLabel}>{label}</label>
            {children}
            {error && <span style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>{error}</span>}
        </div>
    );
}

function StatusBadge({ status }: { status: FaceStatus }) {
    const map: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode; label: string }> = {
        pending:  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: <Clock size={10} />,        label: 'Pending approval'     },
        approved: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', icon: <CheckCircle size={10} />, label: 'Approved'              },
        rejected: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', icon: <X size={10} />,            label: 'Rejected — re-upload'  },
    };
    const c = map[status];
    if (!c) return null;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
            {c.icon}
            {c.label}
        </span>
    );
}

// ─── Types for real data ──────────────────────────────────────────────────────
interface AttendanceStat {
    total: number;
    present: number;
    late: number;
    absent: number;
    rate: number;
}

interface RecentItem {
    status: 'present' | 'late' | 'absent';
    subjectCode: string;
    subjectName: string;
    room: string;
    time: string;
}

const statusPill: Record<string, React.CSSProperties> = {
    present: { background: '#EAF3DE', color: '#3B6D11' },
    absent:  { background: '#FCEBEB', color: '#A32D2D' },
    late:    { background: '#FAEEDA', color: '#854F0B' },
};
const statusDot: Record<string, string> = { present: '#059669', absent: '#DC2626', late: '#D97706' };

function rateColor(r: number) {
    return r >= 80 ? { color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97', label: 'Good standing' }
         : r >= 60 ? { color: '#854F0B', bg: '#FAEEDA', border: '#F6C98B', label: 'Needs attention' }
         :           { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1', label: 'At risk' };
}

// ─── Face capture section ─────────────────────────────────────────────────────
const HOLD_MS = 1500; // ms to hold pose before auto-capture

// Yaw ratio: (noseTip.x - eyeMidX) / eyeDistance  (raw, unmirrored frame)
// face-api uses viewer-perspective indices: lm[36]=viewer-left-eye, lm[45]=viewer-right-eye
// → lm[45].x > lm[36].x in raw frame
// User turns THEIR left  → nose moves to image-right → yawRatio > 0
// User turns THEIR right → nose moves to image-left  → yawRatio < 0
const POSE_THRESHOLD = {
    frontal: (r: number) => Math.abs(r) < 0.15,
    left:    (r: number) => r > 0.30,
    right:   (r: number) => r < -0.30,
};

function FaceCaptureSection({
    faceStatus: initialStatus,
    existingUrl,
    existingLeftUrl,
    existingRightUrl,
    onSuccess,
}: {
    faceStatus: FaceStatus;
    existingUrl: string | null;
    existingLeftUrl: string | null;
    existingRightUrl: string | null;
    onSuccess: (url: string) => void;
}) {
    type Phase   = 'idle' | 'camera' | 'captured' | 'review';
    type StepKey = 'frontal' | 'left' | 'right';

    const STEPS: Array<{ key: StepKey; label: string; hint: string; emoji: string }> = [
        { key: 'frontal', label: 'Frontal',    hint: 'Look straight at the camera',       emoji: '😊' },
        { key: 'left',    label: 'Left side',  hint: 'Slowly turn your head to the left', emoji: '👈' },
        { key: 'right',   label: 'Right side', hint: 'Slowly turn your head to the right',emoji: '👉' },
    ];

    const [phase,        setPhase]       = useState<Phase>('idle');
    const [stepIdx,      setStepIdx]     = useState(0);
    const [captures,     setCaptures]    = useState<Partial<Record<StepKey, string>>>({});
    const [blobs,        setBlobs]       = useState<Partial<Record<StepKey, Blob>>>({});
    const [preview,      setPreview]     = useState<string | null>(null);
    const [camErr,       setCamErr]      = useState<string | null>(null);
    const [uploadErr,    setUploadErr]   = useState<string | null>(null);
    const [uploading,    setUploading]   = useState(false);
    const [modelsReady,  setModelsReady] = useState(_modelsLoaded);
    const [faceDetected, setFaceDetected]= useState(false);
    const [poseOk,       setPoseOk]      = useState(false);
    const [holdProgress, setHoldProgress]= useState(0); // 0–100

    const videoRef     = useRef<HTMLVideoElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const streamRef    = useRef<MediaStream | null>(null);
    const detectingRef = useRef(false);
    const matchStartRef= useRef<number | null>(null);
    const ringRef      = useRef<SVGEllipseElement>(null);
    const [ringLen, setRingLen] = useState(192); // measured via getTotalLength once SVG mounts

    const stopStream = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };
    useEffect(() => () => stopStream(), []);

    // ── Attach stream once <video> mounts ─────────────────────────────────────
    useEffect(() => {
        if (phase === 'camera' && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [phase]);

    // ── Measure the SVG ellipse path length once it's in the DOM ──────────────
    useEffect(() => {
        if (phase === 'camera' && ringRef.current) {
            const len = ringRef.current.getTotalLength?.();
            if (len && len > 0) setRingLen(len);
        }
    }, [phase]);

    // ── Pose detection loop ───────────────────────────────────────────────────
    const captureFrame = useCallback(() => {
        const video = videoRef.current, canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        ctx.restore();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreview(dataUrl);
        canvas.toBlob(blob => {
            if (!blob) return;
            setBlobs(prev    => ({ ...prev, [STEPS[stepIdx].key]: blob }));
            setCaptures(prev => ({ ...prev, [STEPS[stepIdx].key]: dataUrl }));
        }, 'image/jpeg', 0.9);
        setPhase('captured');
    // stepIdx intentionally captured via ref below; STEPS is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stepIdx]);

    // Keep a ref so the detect loop always calls the latest captureFrame
    const captureRef = useRef(captureFrame);
    useEffect(() => { captureRef.current = captureFrame; }, [captureFrame]);

    useEffect(() => {
        if (phase !== 'camera' || !modelsReady) return;

        detectingRef.current = true;
        matchStartRef.current = null;
        setFaceDetected(false);
        setPoseOk(false);
        setHoldProgress(0);

        let timer: ReturnType<typeof setTimeout>;
        const key = STEPS[stepIdx].key;

        const loop = async () => {
            if (!detectingRef.current) return;
            const video = videoRef.current;
            if (!video || video.readyState < 2) {
                timer = setTimeout(loop, 200);
                return;
            }
            try {
                const result = await faceapi
                    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.45 }))
                    .withFaceLandmarks(true);

                if (!detectingRef.current) return;

                if (!result) {
                    setFaceDetected(false);
                    setPoseOk(false);
                    setHoldProgress(0);
                    matchStartRef.current = null;
                } else {
                    setFaceDetected(true);
                    const lm      = result.landmarks.positions;
                    // lm[36] = left-eye outer, lm[45] = right-eye outer, lm[30] = nose tip
                    const eyeMidX  = (lm[36].x + lm[45].x) / 2;
                    const eyeDist  = Math.abs(lm[36].x - lm[45].x) || 1;
                    const yawRatio = (lm[30].x - eyeMidX) / eyeDist;
                    const ok = POSE_THRESHOLD[key](yawRatio);
                    setPoseOk(ok);

                    if (ok) {
                        if (!matchStartRef.current) matchStartRef.current = Date.now();
                        const elapsed  = Date.now() - matchStartRef.current;
                        const progress = Math.min(100, (elapsed / HOLD_MS) * 100);
                        setHoldProgress(progress);
                        if (elapsed >= HOLD_MS) {
                            detectingRef.current = false;
                            matchStartRef.current = null;
                            setHoldProgress(0);
                            captureRef.current();
                            return;
                        }
                    } else {
                        matchStartRef.current = null;
                        setHoldProgress(0);
                    }
                }
            } catch { /* ignore detection errors */ }

            if (detectingRef.current) timer = setTimeout(loop, 180);
        };

        loop();
        return () => {
            detectingRef.current = false;
            clearTimeout(timer);
            matchStartRef.current = null;
            setFaceDetected(false);
            setPoseOk(false);
            setHoldProgress(0);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, stepIdx, modelsReady]);

    // ── Camera actions ────────────────────────────────────────────────────────
    const startCamera = async () => {
        setCamErr(null);
        setCaptures({});
        setBlobs({});
        setPreview(null);
        setStepIdx(0);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            // Load models in background while camera warms up
            if (!_modelsLoaded) {
                loadModels()
                    .then(() => setModelsReady(true))
                    .catch(() => setModelsReady(false));
            }
            setPhase('camera');
        } catch {
            setCamErr('Camera access denied. Please allow camera access in your browser settings and try again.');
        }
    };

    const retake = () => {
        const key = STEPS[stepIdx].key;
        setBlobs(prev    => { const n = { ...prev }; delete n[key]; return n; });
        setCaptures(prev => { const n = { ...prev }; delete n[key]; return n; });
        setPreview(null);
        setPhase('camera');
    };

    const nextStep = () => {
        if (stepIdx < STEPS.length - 1) {
            setStepIdx(i => i + 1);
            setPreview(null);
            setPhase('camera');
        } else {
            stopStream();
            setPhase('review');
        }
    };

    const submit = async () => {
        const { frontal, left, right } = blobs;
        if (!frontal || !left || !right) return;
        setUploading(true);
        setUploadErr(null);
        const fd   = new FormData();
        fd.append('face_frontal', frontal, 'frontal.jpg');
        fd.append('face_left',    left,    'left.jpg');
        fd.append('face_right',   right,   'right.jpg');
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        try {
            const res    = await fetch('/profile/upload-face', { method: 'POST', body: fd, headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json' } });
            const result = await res.json();
            if (result.success) { onSuccess(result.url); window.location.reload(); }
            else setUploadErr(result.message ?? 'Upload failed.');
        } catch {
            setUploadErr('Network error. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const step = STEPS[stepIdx];

    // Oval border color: white → amber (face seen) → green (pose ok)
    const ovalColor = poseOk
        ? 'rgba(16,185,129,0.95)'
        : faceDetected
            ? 'rgba(245,158,11,0.9)'
            : 'rgba(255,255,255,0.75)';

    // Status label shown in the camera viewport
    const statusLabel = !modelsReady
        ? { text: 'Loading face detection…', bg: 'rgba(99,102,241,0.7)' }
        : !faceDetected
            ? { text: 'Position your face in the oval', bg: 'rgba(0,0,0,0.55)' }
            : !poseOk
                ? { text: step.hint, bg: 'rgba(0,0,0,0.55)' }
                : holdProgress < 100
                    ? { text: 'Hold still…', bg: 'rgba(5,150,105,0.75)' }
                    : { text: '✓ Captured!', bg: 'rgba(5,150,105,0.75)' };

    // ── Idle ──────────────────────────────────────────────────────────────────
    if (phase === 'idle') return (
        <div>
            {existingUrl && (
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Current Face ID photos</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {[
                            { label: 'Frontal',    url: existingUrl      },
                            { label: 'Left side',  url: existingLeftUrl  },
                            { label: 'Right side', url: existingRightUrl },
                        ].map(({ label, url }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ width: 80, height: 96, borderRadius: 10, overflow: 'hidden', border: url ? '1px solid #E5E7EB' : '1px dashed #D1D5DB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {url
                                        ? <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <ScanFace size={20} color="#D1D5DB" />
                                    }
                                </div>
                                <span style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginTop: 4 }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {initialStatus === 'pending' && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, fontSize: 13, color: '#92400E', display: 'flex', gap: 8 }}>
                    <Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    Your photos are under review. Usually takes 1–2 hours.
                </div>
            )}
            {initialStatus === 'rejected' && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 13, color: '#991B1B', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    Photos were rejected. Please capture new ones.
                </div>
            )}

            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 14 }}>You'll capture 3 photos — just follow the on-screen guide:</p>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {STEPS.map((st, i) => (
                        <div key={st.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 20 }}>
                                    {st.emoji}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{st.label}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, lineHeight: 1.3 }}>{st.hint}</div>
                            </div>
                            {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: '#D1D5DB', flexShrink: 0, marginBottom: 20 }} />}
                        </div>
                    ))}
                </div>
            </div>

            {camErr && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#991B1B', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    {camErr}
                </div>
            )}

            <button onClick={startCamera} style={s.btnPrimary}>
                <Camera size={14} />
                {existingUrl ? 'Re-capture photos' : 'Start capture'}
            </button>
        </div>
    );

    // ── Camera / Captured ─────────────────────────────────────────────────────
    if (phase === 'camera' || phase === 'captured') return (
        <div>
            {/* Step progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {STEPS.map((st, i) => {
                    const done   = !!captures[st.key];
                    const active = i === stepIdx;
                    return (
                        <div key={st.key} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: done ? '#059669' : active ? '#111827' : '#F3F4F6',
                                    color:      done || active ? '#fff' : '#9CA3AF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                                }}>
                                    {done ? <CheckCircle size={13} /> : i + 1}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#111827' : '#9CA3AF' }}>
                                    {st.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ width: 40, height: 2, background: done ? '#059669' : '#E5E7EB', margin: '0 8px 14px', borderRadius: 1, transition: 'background 0.3s' }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Viewport */}
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#000', maxWidth: 420, margin: '0 auto 16px', aspectRatio: '4/3' }}>
                {phase === 'camera' ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
                        />
                        {/* Oval face guide (vignette + border) */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <div style={{
                                width: '52%', aspectRatio: '3/4',
                                border: `2.5px solid ${ovalColor}`,
                                borderRadius: '50%',
                                boxShadow: `0 0 0 1500px rgba(0,0,0,0.38), 0 0 0 3px ${ovalColor}33`,
                                transition: 'border-color 0.3s, box-shadow 0.3s',
                            }} />
                        </div>
                        {/* Progress ring — SVG ellipse that traces the oval exactly.
                            viewBox 0 0 100 75 matches the 4:3 container.
                            Oval is 52% wide → rx=26; height=52×(4/3) → ry=34.67.
                            Always rendered so getTotalLength() is available. */}
                        <svg
                            viewBox="0 0 100 75"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <ellipse
                                ref={ringRef}
                                cx="50" cy="37.5" rx="26" ry="34.67"
                                fill="none"
                                stroke={poseOk && holdProgress > 0 ? 'rgba(16,185,129,0.92)' : 'none'}
                                strokeWidth="2"
                                strokeDasharray={ringLen}
                                strokeDashoffset={poseOk ? ringLen * (1 - holdProgress / 100) : ringLen}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.18s linear' }}
                            />
                        </svg>
                        {/* Status label */}
                        <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                            <span style={{
                                fontSize: 12, fontWeight: 600, color: '#fff',
                                background: statusLabel.bg,
                                padding: '5px 14px', borderRadius: 20,
                                transition: 'background 0.3s',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}>
                                {!modelsReady && <Loader2 size={11} className="animate-spin" />}
                                {statusLabel.text}
                            </span>
                        </div>
                        {/* Manual capture fallback */}
                        <button
                            onClick={() => { detectingRef.current = false; captureFrame(); }}
                            title="Capture manually"
                            style={{ position: 'absolute', bottom: 52, right: 14, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Camera size={15} color="#fff" />
                        </button>
                    </>
                ) : (
                    <img src={preview ?? ''} alt="Capture preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Actions (only shown after capture) */}
            {phase === 'captured' && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button onClick={retake} style={s.btnGhost}>
                        <X size={13} /> Retake
                    </button>
                    <button onClick={nextStep} style={s.btnPrimary}>
                        {stepIdx < STEPS.length - 1 ? `Next: ${STEPS[stepIdx + 1].label} →` : 'Review all →'}
                    </button>
                </div>
            )}
        </div>
    );

    // ── Review ────────────────────────────────────────────────────────────────
    if (phase === 'review') return (
        <div>
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
                Review your captures. Submit when you're happy, or start over to re-capture.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {STEPS.map(st => (
                    <div key={st.key}>
                        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', aspectRatio: '3/4', background: '#F9FAFB', marginBottom: 6 }}>
                            <img src={captures[st.key] ?? ''} alt={st.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'center', margin: 0 }}>{st.label}</p>
                    </div>
                ))}
            </div>
            {uploadErr && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#991B1B', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    {uploadErr}
                </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={startCamera} style={s.btnGhost} disabled={uploading}>Start over</button>
                <button onClick={submit} disabled={uploading} style={{ ...s.btnPrimary, opacity: uploading ? 0.7 : 1 }}>
                    {uploading
                        ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
                        : <><CheckCircle size={13} /> Submit photos</>}
                </button>
            </div>
        </div>
    );

    return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Profile({
    mustVerifyEmail,
    status,
    attendanceStat,
    recentActivity,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    attendanceStat: AttendanceStat | null;
    recentActivity: RecentItem[];
}) {
    const { auth } = usePage<SharedData>().props;

    const [activeTab, setActiveTab]       = useState<Tab>('overview');
    const [facePreview, setFacePreview]   = useState<string | null>((auth.user.face_image_url as string | null) ?? null);
    const [faceStatus, setFaceStatus]     = useState<FaceStatus>((auth.user.face_status as FaceStatus) || 'none');
    const [showPw, setShowPw]             = useState(false);

    // Profile info form
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });
    const submitInfo: FormEventHandler = (e) => { e.preventDefault(); patch(route('profile.update')); };

    // Password form
    const { data: pwData, setData: setPwData, put: putPw, errors: pwErrors, processing: pwProcessing, recentlySuccessful: pwSuccess, reset: pwReset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const submitPw: FormEventHandler = (e) => {
        e.preventDefault();
        putPw(route('password.update'), { onSuccess: () => pwReset(), preserveScroll: true });
    };

    const initials = getInitials(auth.user.name);
    const role = typeof auth.user.role === 'string' ? auth.user.role : 'member';

    const tabs: { id: Tab; label: string; icon?: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview',      icon: <Shield size={14} /> },
        { id: 'info',     label: 'Personal info',  icon: <User size={14} />  },
        { id: 'faceid',   label: 'Face ID',        icon: <Camera size={14} /> },
        { id: 'security', label: 'Security',       icon: <Lock size={14} />  },
        { id: 'danger',   label: 'Account',        icon: <AlertTriangle size={14} /> },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <style>{`
                input:focus {
                    border-color: #111827 !important;
                    box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1) !important;
                }
                input:hover {
                    border-color: #9CA3AF;
                }
                button:hover {
                    filter: brightness(0.95);
                }
                button:active {
                    transform: scale(0.98);
                }
            `}</style>

            <SettingsLayout>
                <div style={{ maxWidth: 720, fontFamily: 'inherit' }}>

                    {/* ── Identity header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #DBEAFE 0%, #D1FAE5 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: '#1E40AF',
                                    overflow: 'hidden',
                                    border: '3px solid #E5E7EB',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                }}
                            >
                                {faceStatus === 'approved' && facePreview
                                    ? <img src={facePreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : initials
                                }
                            </div>
                            <span style={{
                                position: 'absolute',
                                bottom: 3,
                                right: 3,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: '#059669',
                                border: '3px solid #FFFFFF',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111827', marginBottom: 4 }}>
                                {auth.user.name}
                            </p>
                            <p style={{ fontSize: 13, color: '#6B7280', fontFamily: "'SF Mono', 'DM Mono', monospace", marginBottom: 10 }}>
                                {auth.user.email}
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                                    <Shield size={10} />
                                    {typeof auth.user.role === 'string' ? auth.user.role.charAt(0).toUpperCase() + auth.user.role.slice(1) : 'Member'}
                                </span>
                                {faceStatus !== 'none' && <StatusBadge status={faceStatus} />}
                            </div>
                        </div>

                        <button onClick={() => setActiveTab('info')} style={s.btnGhost}>
                            <Pencil size={13} />
                            Edit
                        </button>
                    </div>

                    <div style={{ height: '1px', background: '#E5E7EB', marginBottom: 0 }} />

                    {/* ── Tabs ── */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 24}}>
                        {tabs.map((t) => (
                            <TabButton key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} icon={t.icon} />
                        ))}
                    </div>

                    {/* ══ Overview ════════════════════════════════════════════════ */}
                    {activeTab === 'overview' && (
                        <div>
                            {attendanceStat ? (
                                <>
                                    {/* ── Attendance rate banner ── */}
                                    {(() => {
                                        const rc = rateColor(attendanceStat.rate);
                                        return (
                                            <div style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 14, padding: '18px 22px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: '#fff', border: `3px solid ${rc.border}`, flexShrink: 0 }}>
                                                    <span style={{ fontSize: 20, fontWeight: 800, color: rc.color, lineHeight: 1 }}>{attendanceStat.rate}%</span>
                                                    <span style={{ fontSize: 9, fontWeight: 600, color: rc.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>rate</span>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: 15, fontWeight: 700, color: rc.color, margin: '0 0 2px' }}>{rc.label}</p>
                                                    <p style={{ fontSize: 13, color: rc.color, opacity: 0.8, margin: '0 0 8px' }}>
                                                        {attendanceStat.present + attendanceStat.late} of {attendanceStat.total} sessions attended
                                                    </p>
                                                    {/* progress bar */}
                                                    <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${attendanceStat.rate}%`, background: rc.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* ── Stat cards ── */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
                                        {[
                                            { val: attendanceStat.present, lbl: 'Present',  sub: 'on time',       color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97' },
                                            { val: attendanceStat.absent,  lbl: 'Absent',   sub: 'sessions missed', color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' },
                                            { val: attendanceStat.late,    lbl: 'Late',     sub: 'arrived late',  color: '#854F0B', bg: '#FAEEDA', border: '#F6C98B' },
                                        ].map((card) => (
                                            <div key={card.lbl} style={{ background: '#fff', border: `1px solid ${card.border}`, borderRadius: 12, padding: '14px 16px' }}>
                                                <p style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1, margin: '0 0 2px' }}>{card.val}</p>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: card.color, margin: 0 }}>{card.lbl}</p>
                                                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{card.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                /* Non-student users (admin/lecturer) */
                                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Shield size={22} color="#2563EB" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>No attendance data</p>
                                        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                            Attendance statistics are only available for enrolled students.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Recent activity ── */}
                            <Card label="Recent activity">
                                {recentActivity.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                                        <Clock size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        <p style={{ fontSize: 13, margin: 0 }}>No attendance records yet.</p>
                                    </div>
                                ) : (
                                    recentActivity.map((a, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0, ...statusPill[a.status] }}>
                                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusDot[a.status] }} />
                                                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                            </span>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#F3F4F6', color: '#374151', flexShrink: 0, fontFamily: 'monospace' }}>
                                                {a.subjectCode}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.subjectName}</div>
                                                {a.room && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Room {a.room}</div>}
                                            </div>
                                            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.time}</span>
                                        </div>
                                    ))
                                )}
                            </Card>
                        </div>
                    )}

                    {/* ══ Personal info ═══════════════════════════════════════════ */}
                    {activeTab === 'info' && (
                        <Card label="Personal information">
                            <form onSubmit={submitInfo}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                    <Field label="Full name" error={errors.name}>
                                        <div style={s.inputWrapper}>
                                            <User size={14} style={s.inputIcon} />
                                            <input style={s.input} value={data.name} onChange={(e) => setData('name', e.target.value)} required autoComplete="name" placeholder="Your full name" />
                                        </div>
                                    </Field>
                                    <Field label="Email address" error={errors.email}>
                                        <div style={s.inputWrapper}>
                                            <Mail size={14} style={s.inputIcon} />
                                            <input style={s.input} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required autoComplete="username" placeholder="you@example.com" />
                                        </div>
                                    </Field>
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
                                        <strong>Email not verified.</strong>{' '}
                                        <Link href={route('verification.send')} method="post" as="button" style={{ fontWeight: 700, textDecoration: 'underline', color: '#92400E' }}>
                                            Resend verification email
                                        </Link>
                                        {status === 'verification-link-sent' && (
                                            <p style={{ marginTop: 6, color: '#065F46', fontWeight: 500 }}>✓ Verification link sent.</p>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <button type="submit" disabled={processing} style={{ ...s.btnPrimary, opacity: processing ? 0.6 : 1 }}>
                                        {processing ? 'Saving...' : 'Save changes'}
                                    </button>
                                    <Transition show={recentlySuccessful} enter="transition ease-in-out duration-200" enterFrom="opacity-0" leave="transition ease-in-out duration-200" leaveTo="opacity-0">
                                        <span style={{ fontSize: 13, color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle size={14} /> Saved
                                        </span>
                                    </Transition>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* ══ Face ID ═══════════════════════════════════════════════════ */}
                    {activeTab === 'faceid' && (
                        <Card label="Face ID capture" badge={faceStatus !== 'none' ? <StatusBadge status={faceStatus} /> : undefined}>
                            <FaceCaptureSection
                                faceStatus={faceStatus}
                                existingUrl={facePreview}
                                existingLeftUrl={(auth.user.face_left_url as string | null) ?? null}
                                existingRightUrl={(auth.user.face_right_url as string | null) ?? null}
                                onSuccess={(url) => { setFacePreview(url); setFaceStatus('pending'); }}
                            />
                        </Card>
                    )}

                    {/* ══ Security ══════════════════════════════════════════════════ */}
                    {activeTab === 'security' && (
                        <>
                            <Card label="Change password">
                                <form onSubmit={submitPw}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                        <Field label="Current password" error={pwErrors.current_password} full>
                                            <div style={s.inputWrapper}>
                                                <Lock size={14} style={s.inputIcon} />
                                                <input
                                                    style={s.input}
                                                    type={showPw ? 'text' : 'password'}
                                                    value={pwData.current_password}
                                                    onChange={(e) => setPwData('current_password', e.target.value)}
                                                    autoComplete="current-password"
                                                    placeholder="Current password"
                                                />
                                                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                                                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </Field>
                                        <Field label="New password" error={pwErrors.password}>
                                            <input style={s.inputNoIcon} type="password" value={pwData.password} onChange={(e) => setPwData('password', e.target.value)} autoComplete="new-password" placeholder="Min. 8 characters" />
                                        </Field>
                                        <Field label="Confirm new password" error={pwErrors.password_confirmation}>
                                            <input style={s.inputNoIcon} type="password" value={pwData.password_confirmation} onChange={(e) => setPwData('password_confirmation', e.target.value)} autoComplete="new-password" placeholder="Repeat new password" />
                                        </Field>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <button type="submit" disabled={pwProcessing} style={{ ...s.btnPrimary, opacity: pwProcessing ? 0.6 : 1 }}>
                                            {pwProcessing ? 'Updating…' : 'Update password'}
                                        </button>
                                        <Transition show={pwSuccess} enter="transition ease-in-out duration-200" enterFrom="opacity-0" leave="transition ease-in-out duration-200" leaveTo="opacity-0">
                                            <span style={{ fontSize: 13, color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <CheckCircle size={14} /> Password updated
                                            </span>
                                        </Transition>
                                    </div>
                                </form>
                            </Card>
                        </>
                    )}

                    {/* ══ Danger ════════════════════════════════════════════════════ */}
                    {activeTab === 'danger' && (
                        <Card label="Danger zone" danger>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Delete account</p>
                                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                                        Permanently delete your account and all associated data. This action cannot be undone.
                                    </p>
                                </div>
                                <div style={{ marginLeft: 24, flexShrink: 0 }}>
                                    <DeleteUser />
                                </div>
                            </div>
                        </Card>
                    )}

                </div>
            </SettingsLayout>
        </AppLayout>
    );
}