import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Search, ScanFace, UserCheck, HelpCircle, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Attendance Records', href: '/lecturer/attendance/records' },
];

interface Record {
    id: number;
    student_name: string;
    student_id: string;
    subject_code: string;
    subject_name: string;
    date: string;
    time: string;
    status: 'present' | 'late' | 'absent';
    method: string;
}

interface PaginatedRecords {
    data: Record[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Subject { id: number; code: string; name: string; }
interface Stats   { total: number; present: number; late: number; absent: number; }
interface Filters { search?: string; subject?: string; status?: string; method?: string; date_from?: string; date_to?: string; }
interface Props   { records: PaginatedRecords; subjects: Subject[]; filters: Filters; stats: Stats; }

const STATUS_CFG = {
    present: { bg: '#DCFCE7', color: '#166534', label: 'Present' },
    late:    { bg: '#FEF9C3', color: '#854D0E', label: 'Late'    },
    absent:  { bg: '#FEE2E2', color: '#991B1B', label: 'Absent'  },
};

const METHOD_CFG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    face:    { label: 'Face ID', icon: <ScanFace size={12} />,  color: '#7C3AED' },
    face_id: { label: 'Face ID', icon: <ScanFace size={12} />,  color: '#7C3AED' },
    manual:  { label: 'Manual',  icon: <UserCheck size={12} />, color: '#059669' },
};

function getMethod(m: string) {
    return METHOD_CFG[m] ?? { label: m || 'Unknown', icon: <HelpCircle size={12} />, color: '#9CA3AF' };
}

export default function LecturerAttendanceRecords() {
    const { records, subjects, filters, stats } = usePage<any>().props as Props;

    const [search,   setSearch]   = useState(filters.search    ?? '');
    const [subject,  setSubject]  = useState(filters.subject   ?? '');
    const [status,   setStatus]   = useState(filters.status    ?? '');
    const [method,   setMethod]   = useState(filters.method    ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo,   setDateTo]   = useState(filters.date_to   ?? '');

    const applyFilters = () => {
        router.get('/lecturer/attendance/records', {
            ...(search   && { search }),
            ...(subject  && { subject }),
            ...(status   && { status }),
            ...(method   && { method }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo   && { date_to: dateTo }),
        }, { preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch(''); setSubject(''); setStatus(''); setMethod(''); setDateFrom(''); setDateTo('');
        router.get('/lecturer/attendance/records', {}, { preserveScroll: true });
    };

    const hasFilters = !!(filters.search || filters.subject || filters.status || filters.method || filters.date_from || filters.date_to);
    const rate = stats.total > 0 ? Math.round((stats.present + stats.late) / stats.total * 100) : 0;

    const inputStyle: React.CSSProperties  = { height: 36, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', background: '#fff', color: '#111827' };
    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Records" />
            <div style={{ padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Attendance Records</h1>
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>All attendance across your subjects</p>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Total Records', value: stats.total,   color: '#111827', bg: '#F9FAFB' },
                        { label: 'Present',        value: stats.present, color: '#166534', bg: '#DCFCE7' },
                        { label: 'Late',           value: stats.late,    color: '#854D0E', bg: '#FEF9C3' },
                        { label: 'Absent',         value: stats.absent,  color: '#991B1B', bg: '#FEE2E2' },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value.toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
                            {label === 'Total Records' && (
                                <div style={{ marginTop: 8, height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${rate}%`, background: rate >= 80 ? '#22C55E' : rate >= 60 ? '#F59E0B' : '#EF4444', borderRadius: 2 }} />
                                </div>
                            )}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 130px 140px 160px 160px auto', gap: 8, alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="Student name or ID…" style={{ ...inputStyle, width: '100%', paddingLeft: 30 }} />
                        </div>
                        <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
                            <option value="">All subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                            <option value="">All statuses</option>
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                        </select>
                        <select value={method} onChange={e => setMethod(e.target.value)} style={selectStyle}>
                            <option value="">All methods</option>
                            <option value="face">Face ID</option>
                            <option value="manual">Manual</option>
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
                            {records.total > 0
                                ? <>Showing <strong style={{ color: '#111827' }}>{records.from}–{records.to}</strong> of <strong style={{ color: '#111827' }}>{records.total.toLocaleString()}</strong> records</>
                                : 'No records found'}
                        </span>
                        {hasFilters && <span style={{ fontSize: 12, color: '#7C3AED', background: '#F5F3FF', padding: '3px 10px', borderRadius: 20 }}>Filtered</span>}
                    </div>

                    {records.data.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <Search size={20} color="#D1D5DB" />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>No records found</p>
                            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Try adjusting your filters</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    {['Student', 'ID', 'Subject', 'Date', 'Time', 'Method', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.map((r, i) => {
                                    const sc = STATUS_CFG[r.status] ?? STATUS_CFG.absent;
                                    const mc = getMethod(r.method);
                                    return (
                                        <tr key={r.id} style={{ borderBottom: i < records.data.length - 1 ? '1px solid #F9FAFB' : 'none' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                            <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{r.student_name}</td>
                                            <td style={{ padding: '12px 20px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{r.student_id}</td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.subject_code}</div>
                                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{r.subject_name}</div>
                                            </td>
                                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{r.date}</td>
                                            <td style={{ padding: '12px 20px', fontSize: 13, fontFamily: 'monospace', color: '#374151' }}>{r.time}</td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: mc.color, fontSize: 12, fontWeight: 500 }}>
                                                    {mc.icon}{mc.label}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {records.last_page > 1 && (
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Page {records.current_page} of {records.last_page}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {records.links.map((link, i) => {
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
