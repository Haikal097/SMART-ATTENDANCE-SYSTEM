import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';

interface Student {
    id: number;
    name: string;
    student_id: string;
    email: string;
    phone: string | null;
    status: string;
}

interface Props {
    student: Student;
}

export default function StudentEdit({ student }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Students', href: '/students' },
        { title: student.name, href: `/students/${student.id}` },
        { title: 'Edit', href: `/students/${student.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name:       student.name       ?? '',
        student_id: student.student_id ?? '',
        email:      student.email      ?? '',
        phone:      student.phone      ?? '',
        status:     student.status     ?? 'active',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/students/${student.id}`);
    };

    const inputStyle = (hasError: boolean) => ({
        width: '100%', height: 42, padding: '0 12px', fontSize: 14,
        fontFamily: 'inherit', border: `1.5px solid ${hasError ? '#FCA5A5' : '#E5E7EB'}`,
        borderRadius: 10, outline: 'none', background: '#fff', color: '#111827',
        boxSizing: 'border-box' as const,
    });

    const labelStyle = {
        display: 'block', fontSize: 12, fontWeight: 600, color: '#374151',
        marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${student.name}`} />

            <div style={{ padding: '28px 32px', maxWidth: 640, fontFamily: 'inherit' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                    <Link
                        href={`/students/${student.id}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', textDecoration: 'none' }}
                    >
                        <ChevronLeft size={18} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Edit Student</h1>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>{student.name}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit}>
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Full Name */}
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Ahmad Faiz" style={inputStyle(!!errors.name)} />
                            {errors.name && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{errors.name}</p>}
                        </div>

                        {/* Student ID */}
                        <div>
                            <label style={labelStyle}>Student ID</label>
                            <input type="text" value={data.student_id} onChange={e => setData('student_id', e.target.value)}
                                placeholder="e.g. A22EC1234" style={inputStyle(!!errors.student_id)} />
                            {errors.student_id && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{errors.student_id}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                placeholder="student@university.edu" style={inputStyle(!!errors.email)} />
                            {errors.email && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)}
                                placeholder="e.g. +60123456789" style={inputStyle(!!errors.phone)} />
                            {errors.phone && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{errors.phone}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label style={labelStyle}>Status</label>
                            <select
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                                style={{ ...inputStyle(false), appearance: 'auto' }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="graduated">Graduated</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <Link
                            href={`/students/${student.id}`}
                            style={{ height: 42, padding: '0 20px', fontSize: 14, fontWeight: 500, background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 10, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{ height: 42, padding: '0 24px', fontSize: 14, fontWeight: 600, background: processing ? '#374151' : '#111827', color: '#fff', border: 'none', borderRadius: 10, cursor: processing ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}
                        >
                            {processing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </AppLayout>
    );
}
