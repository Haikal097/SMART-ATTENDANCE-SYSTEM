// resources/js/pages/subjects/index.tsx
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Plus, Search, BookOpen, Users, Clock,
    MoreVertical, Edit, Trash2, Eye,
    AlertTriangle, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface Lecturer {
    id: number;
    name: string;
    email: string;
    pivot: { role: string };
}

interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    credit_hours: number;
    status: 'active' | 'inactive';
    lecturers: Lecturer[];
    students_count: number;
    sessions_count: number;
}

interface Paginator {
    data: Subject[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    subjects: Paginator;
    filters: { search?: string; status?: string };
    stats: { total: number; active: number; totalStudents: number; totalSessions: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Subjects', href: '/subjects' },
];

function DeleteModal({ subject, onClose, onConfirm }: { subject: Subject; onClose: () => void; onConfirm: () => void }) {
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#991B1B" />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', margin: 0 }}>Delete subject</p>
                </div>
                <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                        Are you sure you want to delete <strong>{subject.code} — {subject.name}</strong>?
                    </p>
                    <p style={{ fontSize: 13, color: '#6B7280' }}>
                        This will also delete all sessions and attendance records for this subject.
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{ height: 36, padding: '0 16px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button onClick={onConfirm} style={{ height: 36, padding: '0 16px', fontSize: 13, fontFamily: 'inherit', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Trash2 size={13} />
                            Delete subject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RowMenu({ subject, onDelete }: { subject: Subject; onDelete: (s: Subject) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(!open)} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                <MoreVertical size={16} color="#9CA3AF" />
            </button>
            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 160, overflow: 'hidden' }}>
                        {[
                            { icon: <Eye size={13} />,  label: 'View',  href: `/subjects/${subject.id}` },
                            { icon: <Edit size={13} />, label: 'Edit',  href: `/subjects/${subject.id}/edit` },
                        ].map((item) => (
                            <Link key={item.label} href={item.href}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, color: '#374151', textDecoration: 'none' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                {item.icon}{item.label}
                            </Link>
                        ))}
                        <div style={{ height: '0.5px', background: '#F3F4F6' }} />
                        <button
                            onClick={() => { setOpen(false); onDelete(subject); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Trash2 size={13} />Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function SubjectsIndex({ subjects, filters = {}, stats }: Props) {
    const [search, setSearch]           = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get('/subjects', {
            search,
            status: statusFilter !== 'all' ? statusFilter : '',
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/subjects/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subjects" />

            <style>{`
                .sub-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; }
                .sub-table th { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; padding: 11px 16px; text-align: left; background: #FAFAFA; border-bottom: 1px solid #F3F4F6; }
                .sub-table td { padding: 13px 16px; border-bottom: 1px solid #F9FAFB; font-size: 13px; color: #111827; vertical-align: middle; }
                .sub-table tr:last-child td { border-bottom: none; }
                .sub-table tr:hover td { background: #FAFAFA; }
                .sub-input { font-family: inherit; font-size: 13px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 9px 12px; color: #111827; transition: border-color 0.15s; outline: none; }
                .sub-input:focus { border-color: #111827; background: #fff; box-shadow: 0 0 0 3px rgba(17,24,39,0.06); }
                .sub-btn { font-family: inherit; font-size: 13px; font-weight: 500; border-radius: 8px; padding: 9px 16px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; transition: all 0.12s; }
                .sub-btn-primary { background: #111827; color: #fff; border: none; }
                .sub-btn-primary:hover { opacity: 0.87; }
                .sub-btn-ghost { background: #fff; color: #374151; border: 1px solid #E5E7EB; }
                .sub-btn-ghost:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 1100, fontFamily: 'inherit' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={22} color="#7C3AED" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Subjects</h1>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Manage subjects, lecturers and enrolled students</p>
                        </div>
                    </div>
                    <Link href="/subjects/create" className="sub-btn sub-btn-primary">
                        <Plus size={13} />
                        Add subject
                    </Link>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Total subjects',  value: stats?.total ?? 0,          color: '#7C3AED', bg: '#EDE9FE', icon: BookOpen },
                        { label: 'Active',          value: stats?.active ?? 0,         color: '#059669', bg: '#D1FAE5', icon: BookOpen },
                        { label: 'Total students',  value: stats?.totalStudents ?? 0,  color: '#2563EB', bg: '#DBEAFE', icon: Users },
                        { label: 'Total sessions',  value: stats?.totalSessions ?? 0,  color: '#D97706', bg: '#FEF3C7', icon: Clock },
                    ].map((s) => (
                        <div key={s.label} className="sub-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
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

                {/* Search & filter */}
                <div className="sub-card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search by code or name… (press Enter)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            className="sub-input"
                            style={{ paddingLeft: 34, width: '100%' }}
                        />
                    </div>
                    <button onClick={() => applyFilters({ search })} className="sub-btn sub-btn-primary" style={{ padding: '9px 18px' }}>Search</button>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); applyFilters({ status: e.target.value !== 'all' ? e.target.value : '' }); }}
                        className="sub-input"
                        style={{ minWidth: 140 }}
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {(search || statusFilter !== 'all') && (
                        <button onClick={() => { setSearch(''); setStatusFilter('all'); router.get('/subjects', {}, { preserveState: true, replace: true }); }} className="sub-btn sub-btn-ghost">
                            <X size={13} />Clear
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="sub-card" style={{ overflow: 'hidden' }}>
                    <table className="sub-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Code</th>
                                <th>Credits</th>
                                <th>Lecturers</th>
                                <th>Students</th>
                                <th>Sessions</th>
                                <th>Status</th>
                                <th style={{ width: 48 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                        <BookOpen size={40} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} />
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No subjects found</p>
                                        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 16 }}>Get started by adding your first subject</p>
                                        <Link href="/subjects/create" className="sub-btn sub-btn-primary" style={{ display: 'inline-flex' }}>
                                            <Plus size={13} />Add subject
                                        </Link>
                                    </td>
                                </tr>
                            ) : subjects.data.map((subject) => (
                                <tr key={subject.id}>
                                    {/* Subject name */}
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <BookOpen size={16} color="#7C3AED" />
                                            </div>
                                            <div>
                                                <Link href={`/subjects/${subject.id}`} style={{ fontWeight: 600, fontSize: 14, color: '#111827', textDecoration: 'none' }}>
                                                    {subject.name}
                                                </Link>
                                                {subject.description && (
                                                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                                                        {subject.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Code */}
                                    <td>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, background: '#F3F4F6', padding: '3px 10px', borderRadius: 20, color: '#374151' }}>
                                            {subject.code}
                                        </span>
                                    </td>

                                    {/* Credits */}
                                    <td style={{ color: '#6B7280', fontSize: 13 }}>
                                        {subject.credit_hours} hrs
                                    </td>

                                    {/* Lecturers */}
                                    <td>
                                        {subject.lecturers.length === 0 ? (
                                            <span style={{ fontSize: 12, color: '#D97706' }}>None assigned</span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {subject.lecturers.slice(0, 2).map((l) => (
                                                    <span key={l.id} style={{ fontSize: 12, color: '#374151' }}>
                                                        {l.name}
                                                        <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 4 }}>({l.pivot.role})</span>
                                                    </span>
                                                ))}
                                                {subject.lecturers.length > 2 && (
                                                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>+{subject.lecturers.length - 2} more</span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Students */}
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151' }}>
                                            <Users size={13} color="#9CA3AF" />
                                            {subject.students_count}
                                        </span>
                                    </td>

                                    {/* Sessions */}
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151' }}>
                                            <Clock size={13} color="#9CA3AF" />
                                            {subject.sessions_count}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td>
                                        {subject.status === 'active' ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>Active</span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>Inactive</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td><RowMenu subject={subject} onDelete={setDeleteTarget} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {subjects.last_page > 1 && (
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                Showing <strong>{subjects.from}</strong>–<strong>{subjects.to}</strong> of <strong>{subjects.total}</strong> subjects
                            </p>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {subjects.links.map((link, i) => {
                                    if (link.label === '&laquo; Previous') return (
                                        <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="sub-btn sub-btn-ghost" style={{ padding: '7px 10px', opacity: link.url ? 1 : 0.4 }}>
                                            <ChevronLeft size={14} />
                                        </button>
                                    );
                                    if (link.label === 'Next &raquo;') return (
                                        <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className="sub-btn sub-btn-ghost" style={{ padding: '7px 10px', opacity: link.url ? 1 : 0.4 }}>
                                            <ChevronRight size={14} />
                                        </button>
                                    );
                                    return (
                                        <button key={i} onClick={() => link.url && router.visit(link.url)}
                                            style={{ width: 34, height: 34, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: link.url ? 'pointer' : 'default', border: link.active ? 'none' : '1px solid #E5E7EB', background: link.active ? '#111827' : '#fff', color: link.active ? '#fff' : '#374151', fontWeight: link.active ? 600 : 400 }}
                                        >
                                            {link.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {subjects.last_page === 1 && subjects.data.length > 0 && (
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6' }}>
                            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Showing {subjects.data.length} of {subjects.total} subjects</p>
                        </div>
                    )}
                </div>
            </div>

            {deleteTarget && (
                <DeleteModal subject={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
            )}
        </AppLayout>
    );
}
