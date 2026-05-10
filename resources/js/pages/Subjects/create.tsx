// resources/js/pages/subjects/create.tsx
// Use the same file for Edit — just pass `subject` prop for edit mode

import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { BookOpen, Plus, X, ChevronLeft } from 'lucide-react';

interface Lecturer {
    id: number;
    name: string;
    email: string;
}

interface Subject {
    id?: number;
    code: string;
    name: string;
    description: string;
    credit_hours: number;
    status: 'active' | 'inactive';
    lecturers?: { id: number; pivot: { role: string } }[];
}

interface Props {
    subject?: Subject;
    lecturers: Lecturer[];
}

export default function SubjectForm({ subject, lecturers }: Props) {
    const isEdit = !!subject?.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Subjects', href: '/subjects' },
        { title: isEdit ? 'Edit subject' : 'Add subject', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        code:         subject?.code         ?? '',
        name:         subject?.name         ?? '',
        description:  subject?.description  ?? '',
        credit_hours: subject?.credit_hours ?? 3,
        status:       subject?.status       ?? 'active',
        lecturers: subject?.lecturers?.map((l) => ({
            user_id: l.id,
            role: l.pivot.role,
        })) ?? [] as { user_id: number; role: string }[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/subjects/${subject!.id}`);
        } else {
            post('/subjects');
        }
    };

    const addLecturer = () => {
        setData('lecturers', [...data.lecturers, { user_id: 0, role: 'lecturer' }]);
    };

    const removeLecturer = (index: number) => {
        setData('lecturers', data.lecturers.filter((_, i) => i !== index));
    };

    const updateLecturer = (index: number, field: 'user_id' | 'role', value: string | number) => {
        const updated = [...data.lecturers];
        updated[index] = { ...updated[index], [field]: field === 'user_id' ? Number(value) : value };
        setData('lecturers', updated);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Subject' : 'Add Subject'} />

            <style>{`
                .sf-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; }
                .sf-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
                .sf-input { font-family: inherit; font-size: 14px; width: 100%; height: 40px; padding: 0 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; color: #111827; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
                .sf-input:focus { border-color: #111827; background: #fff; box-shadow: 0 0 0 3px rgba(17,24,39,0.06); }
                .sf-textarea { font-family: inherit; font-size: 14px; width: 100%; padding: 10px 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; color: #111827; outline: none; resize: vertical; min-height: 80px; box-sizing: border-box; transition: border-color 0.15s; }
                .sf-textarea:focus { border-color: #111827; background: #fff; box-shadow: 0 0 0 3px rgba(17,24,39,0.06); }
                .sf-select { font-family: inherit; font-size: 14px; width: 100%; height: 40px; padding: 0 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; color: #111827; outline: none; cursor: pointer; box-sizing: border-box; }
                .sf-error { font-size: 11px; color: #DC2626; margin-top: 4px; }
                .sf-btn-primary { font-family: inherit; font-size: 13px; font-weight: 500; height: 38px; padding: 0 20px; background: #111827; color: #fff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
                .sf-btn-primary:hover { opacity: 0.87; }
                .sf-btn-ghost { font-family: inherit; font-size: 13px; font-weight: 500; height: 38px; padding: 0 16px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
                .sf-btn-ghost:hover { background: #F9FAFB; }
            `}</style>

            <div style={{ padding: '28px 32px', maxWidth: 760, fontFamily: 'inherit' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                    <Link href="/subjects" className="sf-btn-ghost" style={{ padding: '0 10px' }}>
                        <ChevronLeft size={16} />
                    </Link>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={22} color="#7C3AED" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
                            {isEdit ? 'Edit subject' : 'Add subject'}
                        </h1>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
                            {isEdit ? `Editing ${subject!.code}` : 'Create a new subject and assign lecturers'}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Basic info */}
                        <div className="sf-card" style={{ padding: 24 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>
                                Basic information
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label className="sf-label">Subject code *</label>
                                    <input className="sf-input" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="e.g. CS101" required />
                                    {errors.code && <p className="sf-error">{errors.code}</p>}
                                </div>
                                <div>
                                    <label className="sf-label">Subject name *</label>
                                    <input className="sf-input" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Introduction to Computer Science" required />
                                    {errors.name && <p className="sf-error">{errors.name}</p>}
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label className="sf-label">Description</label>
                                <textarea className="sf-textarea" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Brief description of this subject…" />
                                {errors.description && <p className="sf-error">{errors.description}</p>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="sf-label">Credit hours *</label>
                                    <input className="sf-input" type="number" min="1" max="10" value={data.credit_hours} onChange={(e) => setData('credit_hours', Number(e.target.value))} required />
                                    {errors.credit_hours && <p className="sf-error">{errors.credit_hours}</p>}
                                </div>
                                <div>
                                    <label className="sf-label">Status</label>
                                    <select className="sf-select" value={data.status} onChange={(e) => setData('status', e.target.value as 'active' | 'inactive')}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Lecturers */}
                        <div className="sf-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', margin: 0 }}>
                                    Assigned lecturers
                                </p>
                                <button type="button" onClick={addLecturer} className="sf-btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
                                    <Plus size={12} />
                                    Add lecturer
                                </button>
                            </div>

                            {data.lecturers.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', background: '#F9FAFB', borderRadius: 10, border: '1px dashed #E5E7EB' }}>
                                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No lecturers assigned yet</p>
                                    <button type="button" onClick={addLecturer} style={{ marginTop: 10, fontSize: 13, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                        Assign a lecturer
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {data.lecturers.map((lec, index) => (
                                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                                            <div>
                                                <label className="sf-label" style={{ marginBottom: 4 }}>Lecturer</label>
                                                <select
                                                    className="sf-select"
                                                    value={lec.user_id || ''}
                                                    onChange={(e) => updateLecturer(index, 'user_id', e.target.value)}
                                                >
                                                    <option value="">Select lecturer…</option>
                                                    {lecturers.map((l) => (
                                                        <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="sf-label" style={{ marginBottom: 4 }}>Role</label>
                                                <select
                                                    className="sf-select"
                                                    value={lec.role}
                                                    onChange={(e) => updateLecturer(index, 'role', e.target.value)}
                                                >
                                                    <option value="lecturer">Lecturer</option>
                                                    <option value="co-lecturer">Co-lecturer</option>
                                                </select>
                                            </div>
                                            <button type="button" onClick={() => removeLecturer(index)} style={{ marginTop: 20, width: 32, height: 32, background: '#FEE2E2', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <X size={14} color="#DC2626" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors.lecturers && <p className="sf-error" style={{ marginTop: 8 }}>{errors.lecturers}</p>}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <Link href="/subjects" className="sf-btn-ghost">Cancel</Link>
                            <button type="submit" disabled={processing} className="sf-btn-primary" style={{ opacity: processing ? 0.6 : 1 }}>
                                {processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create subject'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
