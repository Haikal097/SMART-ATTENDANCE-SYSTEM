import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    CalendarDays, Clock, MapPin, Users, CheckCircle, ClipboardList,
    ChevronLeft, ChevronRight, Filter, X, Plus, AlertCircle,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sessions', href: '/lecturer/sessions' },
];

interface Session {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    date: string;
    date_raw: string;
    time: string;
    room: string;
    status: string;
    enrolled: number;
    present: number;
    recorded: boolean;
    is_holiday: boolean;
}

interface PaginatedSessions {
    data: Session[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Subject  { id: number; code: string; name: string; }
interface Stats    { total: number; today: number; upcoming: number; completed: number; }
interface Filters  { subject?: string; status?: string; date_from?: string; date_to?: string; }
interface Props    { sessions: PaginatedSessions; subjects: Subject[]; filters: Filters; stats: Stats; }

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'Scheduled' },
    ongoing:   { bg: '#DCFCE7', color: '#166534', dot: '#22C55E', label: 'Ongoing'   },
    completed: { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Completed' },
    cancelled: { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', label: 'Cancelled' },
};

const PALETTE = [
    '#7C3AED', '#1D4ED8', '#059669', '#BE185D',
    '#C2410C', '#0369A1', '#15803D', '#9333EA',
];

export default function LecturerSessions() {
    const { sessions, subjects, filters, stats } = usePage<any>().props as Props;

    const [subject,  setSubject]  = useState(filters.subject   ?? '');
    const [status,   setStatus]   = useState(filters.status    ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(filters.date_to   ?? '');

    const applyFilters = () => {
        router.get('/lecturer/sessions', {
            ...(subject  && { subject }),
            ...(status   && { status }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo   && { date_to: dateTo }),
        }, { preserveScroll: true });
    };

    const clearFilters = () => {
        setSubject(''); setStatus(''); setDateFrom(''); setDateTo('');
        router.get('/lecturer/sessions', {}, { preserveScroll: true });
    };

    const hasFilters = !!(filters.subject || filters.status || filters.date_from || filters.date_to);

    const inputStyle: React.CSSProperties  = { height: 36, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', background: '#fff', color: '#111827' };
    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sessions" />
            <style>{`
                @keyframes onpulse { 0%,100%{opacity:1} 50%{opacity:.35} }
                .session-row:hover td { background: #FAFAFA !important; }
            `}</style>

            <div style={{ padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Sessions</h1>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>All scheduled sessions across your subjects</p>
                    </div>
                    {subjects.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            <select
                                onChange={e => { if (e.target.value) window.location.href = `/subjects/${e.target.value}/sessions/create`; }}
                                defaultValue=""
                                style={{ ...selectStyle, paddingLeft: 32, paddingRight: 12, fontWeight: 600, background: '#111827', color: '#fff', border: 'none' }}
                            >
                                <option value="" disabled>+ New Session</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                            </select>
                            <Plus size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none' }} />
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Total Sessions', value: stats.total,     color: '#111827' },
                        { label: 'Today',          value: stats.today,     color: '#7C3AED' },
                        { label: 'Upcoming',       value: stats.upcoming,  color: '#1D4ED8' },
                        { label: 'Completed',      value: stats.completed, color: '#059669' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value.toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '16px 18px', marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Filter size={13} color="#6B7280" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Filters</span>
                        {hasFilters && (
                            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={11} /> Clear all
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px 160px auto', gap: 8, alignItems: 'center' }}>
                        <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
                            <option value="">All subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                            <option value="">All statuses</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={inputStyle} />
                        <button onClick={applyFilters} style={{ height: 36, padding: '0 18px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Apply
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#6B7280' }}>
                            {sessions.total > 0
                                ? <>Showing <strong style={{ color: '#111827' }}>{sessions.from}–{sessions.to}</strong> of <strong style={{ color: '#111827' }}>{sessions.total.toLocaleString()}</strong> sessions</>
                                : 'No sessions found'}
                        </span>
                        {hasFilters && <span style={{ fontSize: 12, color: '#7C3AED', background: '#F5F3FF', padding: '3px 10px', borderRadius: 20 }}>Filtered</span>}
                    </div>

                    {sessions.data.length === 0 ? (
                        <div style={{ padding: '56px 20px', textAlign: 'center' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <CalendarDays size={20} color="#D1D5DB" />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>No sessions found</p>
                            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Try adjusting your filters or create a new session</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    {['Subject', 'Date', 'Time', 'Room', 'Attendance', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.data.map((s, i) => {
                                    const sc   = STATUS_CFG[s.status] ?? STATUS_CFG.scheduled;
                                    const pal  = PALETTE[subjects.findIndex(sub => sub.id === s.subject_id) % PALETTE.length] ?? '#6B7280';
                                    const rate = s.enrolled > 0 ? Math.round((s.present / s.enrolled) * 100) : 0;

                                    return (
                                        <tr key={s.id} className="session-row" style={{ borderBottom: i < sessions.data.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                                            {/* Subject */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: pal, flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.subject_code}</div>
                                                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.subject_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Date */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    {s.is_holiday && <AlertCircle size={12} color="#F59E0B" title="Holiday" />}
                                                    <span style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{s.date}</span>
                                                </div>
                                            </td>
                                            {/* Time */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Clock size={12} color="#9CA3AF" />
                                                    <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#374151' }}>{s.time}</span>
                                                </div>
                                            </td>
                                            {/* Room */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <MapPin size={12} color="#9CA3AF" />
                                                    <span style={{ fontSize: 13, color: '#374151' }}>{s.room}</span>
                                                </div>
                                            </td>
                                            {/* Attendance */}
                                            <td style={{ padding: '13px 20px', minWidth: 120 }}>
                                                {s.recorded ? (
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                            <Users size={12} color="#9CA3AF" />
                                                            <span style={{ fontSize: 12, color: '#374151' }}>{s.present}/{s.enrolled}</span>
                                                            <span style={{ fontSize: 11, fontWeight: 600, color: rate >= 75 ? '#059669' : '#D97706', marginLeft: 2 }}>{rate}%</span>
                                                        </div>
                                                        <div style={{ height: 3, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${rate}%`, background: rate >= 75 ? '#22C55E' : '#F59E0B', borderRadius: 2 }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                                                )}
                                            </td>
                                            {/* Status */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: sc.bg }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block', animation: s.status === 'ongoing' ? 'onpulse 1.5s infinite' : 'none' }} />
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>{sc.label}</span>
                                                </div>
                                            </td>
                                            {/* Actions */}
                                            <td style={{ padding: '13px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Link
                                                        href={`/subjects/${s.subject_id}/sessions/${s.id}/attendance`}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: s.recorded ? '#059669' : '#7C3AED', textDecoration: 'none', padding: '4px 10px', borderRadius: 7, background: s.recorded ? '#F0FDF4' : '#F5F3FF', border: `1px solid ${s.recorded ? '#BBF7D0' : '#DDD6FE'}` }}
                                                    >
                                                        {s.recorded ? <CheckCircle size={12} /> : <ClipboardList size={12} />}
                                                        {s.recorded ? 'View' : 'Take'}
                                                    </Link>
                                                    <Link
                                                        href={`/subjects/${s.subject_id}/sessions/${s.id}/edit`}
                                                        style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 500, color: '#6B7280', textDecoration: 'none', padding: '4px 10px', borderRadius: 7, background: '#F9FAFB', border: '1px solid #F3F4F6' }}
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {sessions.last_page > 1 && (
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Page {sessions.current_page} of {sessions.last_page}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {sessions.links.map((link, i) => {
                                    if (!link.url && !link.active) return null;
                                    return (
                                        <Link key={i} href={link.url ?? '#'} style={{ minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, fontSize: 13, fontWeight: link.active ? 700 : 400, textDecoration: 'none', background: link.active ? '#111827' : '#F9FAFB', color: link.active ? '#fff' : link.url ? '#374151' : '#D1D5DB', border: '1px solid ' + (link.active ? '#111827' : '#F3F4F6'), pointerEvents: link.url ? 'auto' : 'none', padding: '0 8px' }}>
                                            {link.label.includes('Previous') ? <ChevronLeft size={14} /> : link.label.includes('Next') ? <ChevronRight size={14} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
