// resources/js/pages/Students/Index.tsx
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Search,
    Plus,
    Filter,
    Download,
    MoreVertical,
    Mail,
    Phone,
    Camera,
    Upload,
    Trash2,
    Edit,
    Eye,
    Users as UsersIcon,
    GraduationCap,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
    AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
    id: number;
    name: string;
    studentId: string;
    email: string;
    phone: string;
    enrollmentDate: string;
    status: 'active' | 'inactive' | 'graduated';
    attendanceRate: number;
    totalSessions: number;
    faceRegistered: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginator {
    data: Student[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Props {
    students: Paginator;
    filters: {
        search?: string;
        status?: string;
    };
    stats: {
        total: number;
        active: number;
        faceRegistered: number;
        avgAttendance: number;
    };
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: '/students' },
];

// ─── Status config ────────────────────────────────────────────────────────────
const statusStyles = {
    active:    { bg: 'rgba(74,222,128,0.08)',  color: '#4ade80', border: 'rgba(74,222,128,0.2)',  label: 'Active'    },
    inactive:  { bg: 'rgba(248,113,113,0.08)', color: '#f87171', border: 'rgba(248,113,113,0.2)', label: 'Inactive'  },
    graduated: { bg: 'rgba(156,163,175,0.08)', color: '#9ca3af', border: 'rgba(156,163,175,0.2)', label: 'Graduated' },
};

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({
    student,
    onClose,
    onConfirm,
}: {
    student: Student;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#991B1B" />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', margin: 0 }}>Delete student</p>
                </div>
                <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                        Are you sure you want to delete <strong>{student.name}</strong>?
                    </p>
                    <p style={{ fontSize: 13, color: '#6B7280' }}>
                        This will permanently remove their profile, attendance records, and face data. This cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            style={{ height: 36, padding: '0 16px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{ height: 36, padding: '0 16px', fontSize: 13, fontFamily: 'inherit', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <Trash2 size={13} />
                            Delete student
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Row action menu ──────────────────────────────────────────────────────────
function RowMenu({ student, onDelete }: { student: Student; onDelete: (s: Student) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <MoreVertical size={16} color="#aaa" />
            </button>
            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 160, overflow: 'hidden' }}>
                        {[
                            { icon: <Eye size={13} />, label: 'View',  href: `/students/${student.id}`,      color: '#374151' },
                            { icon: <Edit size={13} />, label: 'Edit', href: `/students/${student.id}/edit`, color: '#374151' },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, color: item.color, textDecoration: 'none' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                        <div style={{ height: '0.5px', background: '#F3F4F6' }} />
                        <button
                            onClick={() => { setOpen(false); onDelete(student); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Trash2 size={13} />
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StudentsIndex({ students, filters = {}, stats }: Props) {
    const [search, setSearch]             = useState(filters.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status ?? 'all');
    const [showFilters, setShowFilters]   = useState(false);
    const [selectedIds, setSelectedIds]   = useState<number[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

    // ── Server-side filter ────────────────────────────────────────────────────
    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get('/students', {
            search,
            status: selectedStatus !== 'all' ? selectedStatus : '',
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') applyFilters({ search });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedStatus('all');
        router.get('/students', {}, { preserveState: true, replace: true });
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/students/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    // ── Bulk actions ──────────────────────────────────────────────────────────
    const handleBulkDelete = () => {
        if (!confirm(`Delete ${selectedIds.length} student(s)? This cannot be undone.`)) return;
        router.post('/students/bulk-action', { action: 'delete', ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    // ── Selection ─────────────────────────────────────────────────────────────
    const allIds = students.data.map((s) => s.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

    const toggleAll = () => {
        setSelectedIds(allSelected ? [] : allIds);
    };

    const toggleOne = (id: number) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Students" />

            <style>{`
                .stu-root { font-family: 'DM Sans', sans-serif; }
                .stu-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; }
                .stu-table th { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; padding: 11px 16px; text-align: left; background: #FAFAFA; border-bottom: 1px solid #F3F4F6; }
                .stu-table td { padding: 13px 16px; border-bottom: 1px solid #F9FAFB; font-size: 13px; color: #111827; vertical-align: middle; }
                .stu-table tr:last-child td { border-bottom: none; }
                .stu-table tr:hover td { background: #FAFAFA; }
                .stu-input { font-family: 'DM Sans', sans-serif; font-size: 13px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 9px 12px; color: #111827; transition: border-color 0.15s; }
                .stu-input:focus { outline: none; border-color: #111827; background: #fff; box-shadow: 0 0 0 3px rgba(17,24,39,0.06); }
                .stu-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; border-radius: 8px; padding: 9px 16px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; transition: all 0.12s; }
                .stu-btn-primary { background: #111827; color: #fff; border: none; }
                .stu-btn-primary:hover { opacity: 0.87; }
                .stu-btn-ghost { background: #fff; color: #374151; border: 1px solid #E5E7EB; }
                .stu-btn-ghost:hover { background: #F9FAFB; }
                .dark .stu-card { background: #111; border-color: rgba(255,255,255,0.06); }
                .dark .stu-table th { background: #0d0d0d; color: #555; border-color: rgba(255,255,255,0.05); }
                .dark .stu-table td { color: #e5e5e5; border-color: rgba(255,255,255,0.04); }
                .dark .stu-table tr:hover td { background: rgba(255,255,255,0.02); }
                .dark .stu-input { background: #1a1a1a; border-color: rgba(255,255,255,0.08); color: #fff; }
                .dark .stu-btn-ghost { background: transparent; color: #ccc; border-color: rgba(255,255,255,0.1); }
            `}</style>

            <div className="stu-root" style={{ padding: '28px 32px', maxWidth: 1200 }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Students</h1>
                        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Manage student profiles and face recognition data</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Link href="/students/import" className="stu-btn stu-btn-ghost">
                            <Upload size={13} />
                            Import
                        </Link>
                        <Link href="/students/create" className="stu-btn stu-btn-primary">
                            <Plus size={13} />
                            Add student
                        </Link>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Total students',  value: stats?.total ?? students.total,          icon: UsersIcon,      color: '#111827', bg: '#F3F4F6' },
                        { label: 'Active students', value: stats?.active ?? '—',                    icon: GraduationCap,  color: '#059669', bg: '#D1FAE5' },
                        { label: 'Face registered', value: stats?.faceRegistered ?? '—',            icon: Camera,         color: '#2563EB', bg: '#DBEAFE' },
                        { label: 'Avg attendance',  value: stats?.avgAttendance ? `${stats.avgAttendance}%` : '—', icon: Calendar, color: '#D97706', bg: '#FEF3C7' },
                    ].map((s) => (
                        <div key={s.label} className="stu-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <s.icon size={18} color={s.color} strokeWidth={1.8} />
                            </div>
                            <div>
                                <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{s.value}</p>
                                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF', margin: '4px 0 0' }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Search & filter bar ── */}
                <div className="stu-card" style={{ padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or email… (press Enter)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="stu-input"
                                style={{ paddingLeft: 34, width: '100%' }}
                            />
                        </div>
                        <button onClick={() => applyFilters({ search })} className="stu-btn stu-btn-primary" style={{ padding: '9px 18px' }}>
                            Search
                        </button>
                        <button onClick={() => setShowFilters(!showFilters)} className="stu-btn stu-btn-ghost">
                            <Filter size={13} />
                            Filters
                            {selectedStatus !== 'all' && (
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                            )}
                        </button>
                        <a href="/students/export" className="stu-btn stu-btn-ghost">
                            <Download size={13} />
                            Export
                        </a>
                    </div>

                    {showFilters && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                            <select
                                value={selectedStatus}
                                onChange={(e) => { setSelectedStatus(e.target.value); applyFilters({ status: e.target.value !== 'all' ? e.target.value : '' }); }}
                                className="stu-input"
                                style={{ minWidth: 140 }}
                            >
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="graduated">Graduated</option>
                            </select>

                            <button onClick={clearFilters} className="stu-btn" style={{ color: '#6B7280', background: 'transparent', border: 'none', padding: '9px 12px' }}>
                                <X size={13} />
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Bulk action bar ── */}
                {selectedIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#111827', borderRadius: 10, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span style={{ color: '#fff', fontSize: 13 }}>
                                {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} selected
                            </span>
                            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
                            <button
                                onClick={handleBulkDelete}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', background: 'transparent', color: '#FCA5A5', border: '1px solid rgba(252,165,165,0.3)', borderRadius: 7, cursor: 'pointer' }}
                            >
                                <Trash2 size={12} />
                                Delete selected
                            </button>
                        </div>
                        <button onClick={() => setSelectedIds([])} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </div>
                )}

                {/* ── Table ── */}
                <div className="stu-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="stu-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: 44 }}>
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#111827' }}
                                        />
                                    </th>
                                    <th>Student</th>
                                    <th>ID</th>
                                    <th>Contact</th>
                                    <th>Face ID</th>
                                    <th>Attendance</th>
                                    <th>Status</th>
                                    <th style={{ width: 48 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                            <UsersIcon size={40} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} />
                                            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No students found</p>
                                            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Try adjusting your search or filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((student) => {
                                        const ss = statusStyles[student.status] ?? statusStyles.inactive;
                                        return (
                                            <tr key={student.id}>
                                                {/* Checkbox */}
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(student.id)}
                                                        onChange={() => toggleOne(student.id)}
                                                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#111827' }}
                                                    />
                                                </td>

                                                {/* Student */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <Link href={`/students/${student.id}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none', fontSize: 14 }}>
                                                                {student.name}
                                                            </Link>
                                                            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                                                                Joined {student.enrollmentDate
                                                                    ? new Date(student.enrollmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                                    : '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ID */}
                                                <td style={{ fontFamily: "'DM Mono', monospace", color: '#6B7280', fontSize: 12 }}>
                                                    {student.studentId}
                                                </td>

                                                {/* Contact */}
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Mail size={11} color="#9CA3AF" />
                                                            <span style={{ fontSize: 12, color: '#374151' }}>{student.email}</span>
                                                        </div>
                                                        {student.phone && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <Phone size={11} color="#9CA3AF" />
                                                                <span style={{ fontSize: 12, color: '#6B7280' }}>{student.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Face ID */}
                                                <td>
                                                    {student.faceRegistered ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>
                                                            <Camera size={10} />
                                                            Registered
                                                        </span>
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                                                            <Camera size={10} />
                                                            Missing
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Attendance */}
                                                <td>
                                                    {student.totalSessions === 0 ? (
                                                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>No records</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ width: 52, height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                                                                    <div style={{
                                                                        width: `${student.attendanceRate}%`,
                                                                        height: '100%',
                                                                        background: student.attendanceRate >= 80 ? '#059669' : student.attendanceRate >= 60 ? '#D97706' : '#DC2626',
                                                                        borderRadius: 2,
                                                                    }} />
                                                                </div>
                                                                <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: student.attendanceRate >= 80 ? '#059669' : student.attendanceRate >= 60 ? '#D97706' : '#DC2626', fontWeight: 600 }}>
                                                                    {student.attendanceRate}%
                                                                </span>
                                                            </div>
                                                            <span style={{ fontSize: 10, color: '#9CA3AF' }}>{student.totalSessions} sessions</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                                                        {ss.label}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <RowMenu student={student} onDelete={setDeleteTarget} />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {students.last_page > 1 && (
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                Showing <strong>{students.from}</strong>–<strong>{students.to}</strong> of <strong>{students.total}</strong> students
                            </p>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {students.links.map((link, i) => {
                                    if (link.label === '&laquo; Previous') return (
                                        <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="stu-btn stu-btn-ghost" style={{ padding: '7px 12px', opacity: link.url ? 1 : 0.4 }}>
                                            <ChevronLeft size={14} />
                                        </button>
                                    );
                                    if (link.label === 'Next &raquo;') return (
                                        <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="stu-btn stu-btn-ghost" style={{ padding: '7px 12px', opacity: link.url ? 1 : 0.4 }}>
                                            <ChevronRight size={14} />
                                        </button>
                                    );
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => link.url && router.visit(link.url)}
                                            style={{ width: 34, height: 34, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: link.url ? 'pointer' : 'default', border: link.active ? 'none' : '1px solid #E5E7EB', background: link.active ? '#111827' : '#fff', color: link.active ? '#fff' : '#374151', fontWeight: link.active ? 600 : 400 }}
                                        >
                                            {link.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Row count when only 1 page */}
                    {students.last_page === 1 && students.data.length > 0 && (
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6' }}>
                            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                                Showing {students.data.length} of {students.total} students
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete modal */}
            {deleteTarget && (
                <DeleteModal
                    student={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </AppLayout>
    );
}