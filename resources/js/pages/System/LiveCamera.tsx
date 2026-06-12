import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Maximize2, RefreshCw, WifiOff, ScanFace, Wifi } from 'lucide-react';

const STREAM_URL = 'https://raspberrypi.tail1d11cb.ts.net/house/';
const POLL_MS    = 6000;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Live Camera', href: '/camera' },
];

interface Checkin {
    id: number;
    student_name: string;
    student_id: string;
    subject_code: string;
    time: string;
    status: 'present' | 'late' | 'absent';
    method: string;
}

interface ActiveSession {
    subject_code: string;
    subject_name: string;
    room: string;
    time: string;
}

interface Props {
    recentCheckins: Checkin[];
    activeSession: ActiveSession | null;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    present: { bg: '#DCFCE7', color: '#166534' },
    late:    { bg: '#FEF9C3', color: '#854D0E' },
    absent:  { bg: '#FEE2E2', color: '#991B1B' },
};

export default function LiveCamera() {
    const { recentCheckins, activeSession } = usePage<{ props: Props } & any>().props as Props;

    const [feedStatus, setFeedStatus] = useState<'loading' | 'live' | 'offline'>('loading');
    const [iframeKey, setIframeKey]   = useState(0);
    const [uptime, setUptime]         = useState(0);
    const [clock, setClock]           = useState(new Date());
    const [newIds, setNewIds]         = useState<Set<number>>(new Set());
    const prevIds                     = useRef<Set<number>>(new Set(recentCheckins.map(c => c.id)));

    // Wall clock
    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Feed uptime
    useEffect(() => {
        if (feedStatus !== 'live') return;
        const t = setInterval(() => setUptime(s => s + 1), 1000);
        return () => clearInterval(t);
    }, [feedStatus]);

    // Auto-poll for new check-ins
    useEffect(() => {
        const t = setInterval(() => {
            router.reload({ only: ['recentCheckins', 'todayStats', 'activeSession'], preserveScroll: true });
        }, POLL_MS);
        return () => clearInterval(t);
    }, []);

    // Highlight newly arrived check-ins
    useEffect(() => {
        const incoming = recentCheckins.map(c => c.id);
        const fresh    = incoming.filter(id => !prevIds.current.has(id));
        if (fresh.length) {
            setNewIds(new Set(fresh));
            setTimeout(() => setNewIds(new Set()), 3000);
        }
        prevIds.current = new Set(incoming);
    }, [recentCheckins]);

    const fmtUptime = (s: number) => {
        const h   = Math.floor(s / 3600).toString().padStart(2, '0');
        const m   = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${h}:${m}:${sec}`;
    };

    const reload = () => { setFeedStatus('loading'); setUptime(0); setIframeKey(k => k + 1); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Live Camera" />
            <style>{`
                @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
                @keyframes fadein { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
                .checkin-new { animation: fadein 0.4s ease; background: #F0FDF4 !important; }
            `}</style>

            <div style={{ padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Live Camera</h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>
                            {clock.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {activeSession && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: '#EDE9FE', borderRadius: 10, border: '1px solid #DDD6FE' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7C3AED', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#5B21B6' }}>
                                    {activeSession.subject_code} — {activeSession.room} · {activeSession.time}
                                </span>
                            </div>
                        )}
                        <button onClick={reload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#374151', cursor: 'pointer' }}>
                            <RefreshCw size={13} /> Reload feed
                        </button>
                    </div>
                </div>

                {/* Main layout: feed + sidebar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

                    {/* ── Feed card ── */}
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        {/* Feed header */}
                        <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: feedStatus === 'live' ? '#F0FDF4' : feedStatus === 'loading' ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${feedStatus === 'live' ? '#BBF7D0' : feedStatus === 'loading' ? '#FDE68A' : '#FECACA'}` }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: feedStatus === 'live' ? '#22C55E' : feedStatus === 'loading' ? '#F59E0B' : '#EF4444', display: 'inline-block', animation: feedStatus !== 'live' ? 'pulse 1.5s infinite' : 'none' }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: feedStatus === 'live' ? '#166534' : feedStatus === 'loading' ? '#92400E' : '#991B1B', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                        {feedStatus === 'live' ? 'LIVE' : feedStatus === 'loading' ? 'CONNECTING…' : 'OFFLINE'}
                                    </span>
                                </div>
                                {feedStatus === 'live' && (
                                    <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>{fmtUptime(uptime)}</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: feedStatus === 'live' ? '#6B7280' : '#9CA3AF' }}>
                                {feedStatus === 'live' ? <Wifi size={13} color="#22C55E" /> : <WifiOff size={13} />}
                                <span>raspberrypi · Tailscale</span>
                            </div>
                        </div>

                        {/* Feed area */}
                        <div style={{ position: 'relative', background: '#0a0a0a' }} id="feed-wrap">
                            {feedStatus === 'offline' && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 2 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <WifiOff size={22} color="rgba(255,255,255,0.3)" />
                                    </div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: 0 }}>No signal</p>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Ensure Tailscale is connected</p>
                                    <button onClick={reload} style={{ marginTop: 4, padding: '8px 18px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                                        Try again
                                    </button>
                                </div>
                            )}
                            <iframe
                                key={iframeKey}
                                src={STREAM_URL}
                                style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block', opacity: feedStatus === 'offline' ? 0 : 1 }}
                                onLoad={() => setFeedStatus('live')}
                                onError={() => setFeedStatus('offline')}
                                allow="autoplay"
                                title="Pi Camera"
                            />
                            {/* Fullscreen */}
                            {feedStatus === 'live' && (
                                <button onClick={() => document.getElementById('feed-wrap')?.requestFullscreen?.()} style={{ position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
                                    <Maximize2 size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Live check-in feed */}
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Live check-ins</span>
                                </div>
                                <span style={{ fontSize: 10, color: '#9CA3AF' }}>auto-refresh</span>
                            </div>

                            {recentCheckins.length === 0 ? (
                                <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                                    <ScanFace size={24} style={{ display: 'block', margin: '0 auto 8px', color: '#E5E7EB' }} />
                                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>No check-ins yet today</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                                    {recentCheckins.map((c, i) => {
                                        const s = STATUS_STYLE[c.status] ?? STATUS_STYLE.absent;
                                        const isNew = newIds.has(c.id);
                                        return (
                                            <div
                                                key={c.id}
                                                className={isNew ? 'checkin-new' : ''}
                                                style={{ padding: '10px 16px', borderBottom: i < recentCheckins.length - 1 ? '1px solid #F9FAFB' : 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.4s' }}
                                            >
                                                {/* Avatar */}
                                                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#6B7280' }}>
                                                        {c.student_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                                                    </span>
                                                </div>
                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.student_name}</div>
                                                    <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                                                        <span>{c.subject_code}</span>
                                                        {c.method === 'face_id' && <><span>·</span><ScanFace size={10} color="#7C3AED" /></>}
                                                    </div>
                                                </div>
                                                {/* Time + status */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                                                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6B7280' }}>{c.time}</span>
                                                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: s.bg, color: s.color }}>{c.status}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
