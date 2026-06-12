import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Search,
    BookOpen,
    Clock,
    User,
    Calendar,
    X,
    CheckCircle,
    Plus,
    ChevronRight,
    GraduationCap,
    Hash,
    BarChart3,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Courses', href: '/student/courses' },
];

interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    credit_hours: number;
    status: 'active' | 'inactive';
    start_date: string | null;
    end_date: string | null;
    lecturer: string;
    schedule: string;
    students_count: number;
    is_enrolled: boolean;
}

interface Props {
    subjects: Subject[];
    studentId: number | null;
}

type CourseStatus = 'enrolled' | 'available' | 'completed';

function getCourseStatus(s: Subject): CourseStatus {
    if (s.is_enrolled) return s.status === 'inactive' ? 'completed' : 'enrolled';
    return 'available';
}

const STATUS_CHIPS = ['All', 'Available', 'Enrolled', 'Completed'];

export default function StudentCourses({ subjects, studentId }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [enrollingId, setEnrollingId] = useState<number | null>(null);

    const withStatus = subjects.map(s => ({ ...s, courseStatus: getCourseStatus(s) }));

    const filtered = withStatus.filter(s => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.lecturer.toLowerCase().includes(q);
        const matchesStatus =
            selectedStatus === 'All' || s.courseStatus === selectedStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const enrolledSubjects = withStatus.filter(s => s.courseStatus === 'enrolled');
    const gridSubjects = filtered.filter(s => s.courseStatus !== 'enrolled');

    const stats = {
        available: subjects.filter(s => getCourseStatus(s) === 'available').length,
        enrolled:  subjects.filter(s => getCourseStatus(s) === 'enrolled').length,
        completed: subjects.filter(s => getCourseStatus(s) === 'completed').length,
    };

    const handleEnroll = (subjectId: number) => {
        if (!studentId) return;
        setEnrollingId(subjectId);
        router.post(`/subjects/${subjectId}/enroll`, { student_ids: [studentId] }, {
            onFinish: () => setEnrollingId(null),
        });
    };

    const handleSubjectClick = (s: Subject) => {
        setSelectedSubject(s);
        setShowModal(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Courses - Student Portal" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

                .courses-root { font-family: 'DM Sans', sans-serif; }

                .course-card {
                    background: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.15s;
                    cursor: pointer;
                }
                .course-card:hover {
                    border-color: #111827;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    transform: translateY(-2px);
                }
                .course-card.enrolled {
                    border-color: #6EE7B7;
                    background: #F9FEFB;
                }
                .course-card.completed {
                    opacity: 0.75;
                }

                .filter-chip {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    border: 1px solid #E5E7EB;
                    background: #FFFFFF;
                    color: #6B7280;
                    transition: all 0.15s;
                    white-space: nowrap;
                }
                .filter-chip.active {
                    background: #111827;
                    color: #FFFFFF;
                    border-color: #111827;
                }
                .filter-chip:hover:not(.active) {
                    border-color: #111827;
                    color: #111827;
                }

                .stat-card {
                    background: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 16px 20px;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-content {
                    background: #FFFFFF;
                    border-radius: 16px;
                    max-width: 560px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                }

                .enroll-btn {
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    border: none;
                    background: #111827;
                    color: #FFFFFF;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .enroll-btn:hover { opacity: 0.9; }
                .enroll-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .enroll-btn.enrolled { background: #D1FAE5; color: #065F46; cursor: default; }
                .enroll-btn.completed { background: #DBEAFE; color: #1E40AF; cursor: default; }
            `}</style>

            <div className="courses-root p-6 space-y-5">

                {/* Header */}
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        Course Catalog
                    </h1>
                    <p style={{ fontSize: 13, color: '#6B7280' }}>
                        Browse and enroll in available courses
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Available', value: stats.available, color: '#111827', icon: BookOpen },
                        { label: 'Enrolled',  value: stats.enrolled,  color: '#059669', icon: CheckCircle },
                        { label: 'Completed', value: stats.completed, color: '#2563EB', icon: GraduationCap },
                    ].map((stat, i) => (
                        <div key={i} className="stat-card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>
                                        {stat.label}
                                    </div>
                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 400, color: stat.color }}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <stat.icon size={18} color={stat.color} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filters */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ position: 'relative', marginBottom: 12 }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search by name, code, or lecturer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 36px',
                                border: '1px solid #E5E7EB',
                                borderRadius: 8,
                                fontSize: 13,
                                fontFamily: 'inherit',
                                background: '#F9FAFB',
                                outline: 'none',
                            }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Status chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {STATUS_CHIPS.map(chip => (
                            <button
                                key={chip}
                                onClick={() => setSelectedStatus(chip)}
                                className={`filter-chip ${selectedStatus === chip ? 'active' : ''}`}
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enrolled Courses (shown when filter is All or Enrolled) */}
                {enrolledSubjects.length > 0 && (selectedStatus === 'All' || selectedStatus === 'Enrolled') && (
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                            My Enrolled Courses
                        </h2>
                        <div className="grid gap-3">
                            {enrolledSubjects.filter(s =>
                                !searchTerm ||
                                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.lecturer.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(s => (
                                <div key={s.id} className="course-card enrolled" onClick={() => handleSubjectClick(s)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <BookOpen size={20} color="#065F46" />
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF' }}>{s.code}</span>
                                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{s.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6B7280' }}>
                                                    {s.schedule && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Clock size={12} />
                                                            {s.schedule}
                                                        </span>
                                                    )}
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <User size={12} />
                                                        {s.lecturer}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#D1FAE5', color: '#065F46' }}>
                                                <CheckCircle size={10} />
                                                Enrolled
                                            </span>
                                            <ChevronRight size={16} color="#9CA3AF" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available / Completed Grid */}
                {(selectedStatus === 'All' || selectedStatus === 'Available' || selectedStatus === 'Completed') && (
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                            {selectedStatus === 'Completed' ? 'Completed Courses' : 'All Courses'}
                        </h2>

                        {gridSubjects.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 60, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
                                <BookOpen size={48} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No courses found</h3>
                                <p style={{ fontSize: 13, color: '#6B7280' }}>Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {gridSubjects.map(s => (
                                    <div
                                        key={s.id}
                                        className={`course-card ${s.courseStatus === 'completed' ? 'completed' : ''}`}
                                        onClick={() => handleSubjectClick(s)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3">
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 10,
                                                    background: s.courseStatus === 'completed' ? '#DBEAFE' : '#F3F4F6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    <BookOpen size={18} color={s.courseStatus === 'completed' ? '#2563EB' : '#6B7280'} />
                                                </div>
                                                <div>
                                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#9CA3AF', background: '#F9FAFB', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginBottom: 4 }}>
                                                        {s.code}
                                                    </span>
                                                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                                                        {s.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>

                                        {s.description && (
                                            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {s.description}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                                                <User size={12} />
                                                <span>{s.lecturer}</span>
                                            </div>
                                            {s.schedule && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                                                    <Clock size={12} />
                                                    <span>{s.schedule}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                                                <Hash size={12} />
                                                <span>{s.credit_hours} credit{s.credit_hours !== 1 ? 's' : ''} • {s.students_count} student{s.students_count !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (s.courseStatus === 'available' && studentId) handleEnroll(s.id);
                                            }}
                                            disabled={s.courseStatus !== 'available' || !studentId || enrollingId === s.id}
                                            className={`enroll-btn w-full justify-center ${s.courseStatus === 'completed' ? 'completed' : ''}`}
                                        >
                                            {enrollingId === s.id ? (
                                                'Enrolling...'
                                            ) : s.courseStatus === 'completed' ? (
                                                <><GraduationCap size={14} /> Completed</>
                                            ) : (
                                                <><Plus size={14} /> Enroll Now</>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Course Detail Modal */}
                {showModal && selectedSubject && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Course Details</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ padding: 24 }}>
                                <div style={{ marginBottom: 20 }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF', background: '#F9FAFB', padding: '3px 8px', borderRadius: 4 }}>
                                        {selectedSubject.code}
                                    </span>
                                    <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginTop: 8, marginBottom: 8 }}>
                                        {selectedSubject.name}
                                    </h3>
                                    {selectedSubject.description && (
                                        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                                            {selectedSubject.description}
                                        </p>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                    {[
                                        { label: 'Lecturer', value: selectedSubject.lecturer, icon: User },
                                        { label: 'Credits',  value: `${selectedSubject.credit_hours} credit${selectedSubject.credit_hours !== 1 ? 's' : ''}`, icon: Hash },
                                        ...(selectedSubject.schedule ? [{ label: 'Schedule', value: selectedSubject.schedule, icon: Clock }] : []),
                                        ...(selectedSubject.start_date ? [{ label: 'Period', value: `${selectedSubject.start_date}${selectedSubject.end_date ? ` – ${selectedSubject.end_date}` : ''}`, icon: Calendar }] : []),
                                        { label: 'Students', value: `${selectedSubject.students_count} enrolled`, icon: BarChart3 },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <item.icon size={14} color="#9CA3AF" />
                                            <div>
                                                <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {(() => {
                                    const status = getCourseStatus(selectedSubject);
                                    return (
                                        <button
                                            onClick={() => {
                                                if (status === 'available' && studentId) {
                                                    handleEnroll(selectedSubject.id);
                                                    setShowModal(false);
                                                }
                                            }}
                                            disabled={status !== 'available' || !studentId || enrollingId === selectedSubject.id}
                                            className={`enroll-btn w-full justify-center ${status === 'enrolled' ? 'enrolled' : ''} ${status === 'completed' ? 'completed' : ''}`}
                                        >
                                            {enrollingId === selectedSubject.id ? (
                                                'Enrolling...'
                                            ) : status === 'enrolled' ? (
                                                <><CheckCircle size={14} /> Already Enrolled</>
                                            ) : status === 'completed' ? (
                                                <><GraduationCap size={14} /> Completed</>
                                            ) : (
                                                <><Plus size={14} /> Enroll Now</>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
