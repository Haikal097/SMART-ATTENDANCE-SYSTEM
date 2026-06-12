import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Clock, MapPin, CheckCircle2, XCircle, AlertCircle, ScanFace, UserCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Today's Status", href: '/student/attendance/today' },
];

interface Session {
    id: number;
    subject_code: string;
    subject_name: string;
    time: string;
    room: string;
    status: string;
    my_status: 'present' | 'late' | 'absent' | null;
    checked_in_at: string | null;
    method: string | null;
}

interface Summary { total: number; present: number; late: number; absent: number; }
interface Student { name: string; student_id: string; }
interface Props   { student: Student | null; sessions: Session[]; summary: Summary; date: string; }

const PALETTE = ['#18181B','#27272A','#3F3F46','#52525B','#71717A','#18181B','#27272A','#3F3F46'];

function getInitials(code: string) {
    return code.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
}

function MethodBadge({ method }: { method: string | null }) {
    if (method === 'face' || method === 'face_id')
        return (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                <ScanFace size={10} /> Face ID
            </span>
        );
    if (method === 'manual')
        return (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                <UserCheck size={10} /> Manual
            </span>
        );
    return null;
}

export default function TodayStatus() {
    const { student, sessions, summary, date } = usePage<any>().props as Props;
    const attended = summary.present + summary.late;
    const rate = summary.total > 0 ? Math.round((attended / summary.total) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Today's Status" />
            <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

            <div className="p-6 max-w-2xl space-y-6">

                {/* Header */}
                <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Today's Status</h1>
                    <p className="text-sm text-gray-400 mt-1">{date}</p>
                </div>

                {!student ? (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-14 text-center">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Student profile not found</p>
                        <p className="text-sm text-gray-400 mt-1">Your account isn't linked to a student record yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats row */}
                        {summary.total > 0 && (
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Classes', value: summary.total,   highlight: false },
                                    { label: 'Present', value: summary.present, highlight: false },
                                    { label: 'Late',    value: summary.late,    highlight: false },
                                    { label: 'Absent',  value: summary.absent,  highlight: false },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                                        <p className="text-xs text-gray-400 mt-1">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Rate bar */}
                        {summary.total > 0 && (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{rate}%</span>
                            </div>
                        )}

                        {/* No sessions */}
                        {sessions.length === 0 ? (
                            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                                <p className="text-5xl mb-4">🎉</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">No classes today</p>
                                <p className="text-sm text-gray-400 mt-1">Enjoy your free day!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((s, idx) => {
                                    const isOngoing   = s.status === 'ongoing';
                                    const isScheduled = s.status === 'scheduled';
                                    const isCompleted = s.status === 'completed';

                                    return (
                                        <div key={s.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">

                                            {/* Top section */}
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300">{getInitials(s.subject_code)}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 dark:text-white text-[15px] leading-tight">{s.subject_code}</p>
                                                            <p className="text-sm text-gray-400 truncate">{s.subject_name}</p>
                                                        </div>
                                                    </div>

                                                    {isOngoing && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-semibold rounded-full flex-shrink-0">
                                                            <span className="w-1.5 h-1.5 bg-white dark:bg-gray-900 rounded-full" style={{ animation: 'pulse-dot 1.5s infinite' }} />
                                                            Live
                                                        </span>
                                                    )}
                                                    {isScheduled && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[11px] font-semibold rounded-full flex-shrink-0">
                                                            Upcoming
                                                        </span>
                                                    )}
                                                    {isCompleted && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-[11px] font-semibold rounded-full flex-shrink-0">
                                                            Done
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Clock size={12} /> {s.time}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <MapPin size={12} /> {s.room}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status strip at bottom */}
                                            {s.my_status === 'present' && (
                                                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-emerald-50 dark:bg-emerald-900/10 px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                                                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Present</span>
                                                        {s.checked_in_at && <span className="text-xs text-emerald-600/60 dark:text-emerald-500/60">· {s.checked_in_at}</span>}
                                                    </div>
                                                    {s.method && <MethodBadge method={s.method} />}
                                                </div>
                                            )}
                                            {s.my_status === 'late' && (
                                                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/10 px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />
                                                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Late</span>
                                                        {s.checked_in_at && <span className="text-xs text-amber-600/60 dark:text-amber-500/60">· {s.checked_in_at}</span>}
                                                    </div>
                                                    {s.method && <MethodBadge method={s.method} />}
                                                </div>
                                            )}
                                            {(s.my_status === 'absent' || (!s.my_status && isCompleted)) && (
                                                <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 px-5 py-3">
                                                    <XCircle size={15} className="text-red-500" />
                                                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">Absent</span>
                                                </div>
                                            )}
                                            {!s.my_status && (isOngoing || isScheduled) && (
                                                <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3">
                                                    <Clock size={13} className="text-gray-400" />
                                                    <span className="text-xs text-gray-400">
                                                        {isOngoing ? 'In progress — not yet recorded' : 'Not started yet'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
