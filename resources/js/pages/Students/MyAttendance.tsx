import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Filter,
  Download
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'My Attendance', href: '/student/attendance' },
];

interface AttendanceRecord {
  id: number;
  date: string;
  day: string;
  time: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  course: string;
  courseCode: string;
  checkInMethod: 'face' | 'qr' | 'manual' | '—';
  lecturer: string;
}

interface MonthlyStat {
  month: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

interface CourseStat {
  course: string;
  code: string;
  present: number;
  total: number;
  rate: number;
  trend: 'up' | 'down' | 'stable';
}

interface OverallStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
  streak: number;
}

interface Props {
  records: AttendanceRecord[];
  monthlyStats: MonthlyStat[];
  courseStats: CourseStat[];
  overallStats: OverallStats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  present: { icon: <CheckCircle size={10} />, color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7', label: 'Present' },
  absent:  { icon: <XCircle size={10} />,     color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5', label: 'Absent' },
  late:    { icon: <Clock size={10} />,        color: '#92400E', bg: '#FEF3C7', border: '#FCD34D', label: 'Late' },
  excused: { icon: <AlertTriangle size={10} />, color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD', label: 'Excused' },
};

const methodConfig: Record<string, string> = {
  face: 'Face ID',
  qr: 'QR Code',
  manual: 'Manual',
  '—': '—',
};

// ─── Inline Styles ────────────────────────────────────────────────────────────
const s = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  } as React.CSSProperties,
  
  statCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '20px',
  } as React.CSSProperties,

  progressBar: {
    height: 8,
    background: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  } as React.CSSProperties,

  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
  } as React.CSSProperties,
};

// ─── Calendar Day Component ────────────────────────────────────────────────────
function CalendarDay({ day, status, isToday }: { day: number; status?: string; isToday?: boolean }) {
  const config = status ? statusConfig[status] : null;
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "'DM Mono', monospace",
        background: config?.bg || '#F9FAFB',
        color: config?.color || '#9CA3AF',
        border: config ? `1px solid ${config.border}` : '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative',
      }}
      title={status ? statusConfig[status].label : isToday ? 'Today' : ''}
    >
      {day}
      {isToday && (
        <span style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#8B5CF6',
          position: 'absolute',
          bottom: 4,
        }} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyAttendance({ records, monthlyStats, courseStats, overallStats }: Props) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const filteredAttendance = records.filter((record: AttendanceRecord) => {
    const matchesStatus = selectedFilter === 'all' || record.status === selectedFilter;
    const matchesCourse = selectedCourse === 'all' || record.courseCode === selectedCourse;
    return matchesStatus && matchesCourse;
  });

  // Generate calendar days for current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const uniqueCourses = [...new Set(records.map((r: AttendanceRecord) => r.courseCode))];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="My Attendance" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        
        .attendance-root {
          font-family: 'DM Sans', sans-serif;
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
          font-family: 'DM Sans', sans-serif;
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
      `}</style>

      <div className="attendance-root p-6 space-y-5">

        {/* ── Header ── */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>
            My Attendance
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            Track your attendance records and statistics
          </p>
        </div>

        {/* ── Top Stats ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Attendance Rate', value: `${overallStats.rate}%`,    icon: <Target size={18} />,       color: '#059669', bg: '#D1FAE5' },
            { label: 'Total Classes',   value: overallStats.total,          icon: <Calendar size={18} />,     color: '#6366F1', bg: '#EEF2FF' },
            { label: 'Total Present',   value: overallStats.present,        icon: <CheckCircle size={18} />,  color: '#059669', bg: '#D1FAE5' },
            { label: 'Total Absent',    value: overallStats.absent,         icon: <XCircle size={18} />,      color: '#DC2626', bg: '#FEE2E2' },
          ].map((stat, i) => (
            <div key={i} style={s.statCard}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 400, color: '#111827' }}>
                    {stat.value}
                  </div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Monthly Stats & Calendar ── */}
        <div className="grid grid-cols-3 gap-4">
          
          {/* Monthly Breakdown */}
          <div style={s.card}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Monthly Breakdown</h3>
            </div>
            <div style={{ padding: '12px 20px' }}>
              {monthlyStats.map((month, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < monthlyStats.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{month.month}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: month.rate >= 90 ? '#059669' : month.rate >= 80 ? '#D97706' : '#DC2626' }}>
                      {month.rate}%
                    </span>
                  </div>
                  <div style={s.progressBar}>
                    <div style={{ 
                      height: '100%', 
                      width: `${month.rate}%`, 
                      background: month.rate >= 90 ? '#059669' : month.rate >= 80 ? '#F59E0B' : '#DC2626',
                      borderRadius: 4,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div className="flex gap-4 mt-2" style={{ fontSize: 11, color: '#9CA3AF' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                      {month.present} present
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} />
                      {month.absent} absent
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                      {month.late} late
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div style={s.card}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else { setCurrentMonth(currentMonth - 1); } }}
                  style={{ padding: 4, border: '1px solid #E5E7EB', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer', display: 'flex' }}
                >
                  <ChevronLeft size={14} color="#6B7280" />
                </button>
                <button 
                  onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else { setCurrentMonth(currentMonth + 1); } }}
                  style={{ padding: 4, border: '1px solid #E5E7EB', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer', display: 'flex' }}
                >
                  <ChevronRight size={14} color="#6B7280" />
                </button>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', padding: '4px 0' }}>
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => (
                  <div key={`blank-${i}`} style={{ width: 36, height: 36 }} />
                ))}
                {calendarDays.map(day => {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const record = records.find((r: AttendanceRecord) => r.date === dateStr);
                  const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
                  return <CalendarDay key={day} day={day} status={record?.status} isToday={isToday} />;
                })}
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-4 justify-center" style={{ fontSize: 10, color: '#9CA3AF' }}>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: config.color }} />
                    {config.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div style={s.card}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>By Course</h3>
            </div>
            <div style={{ padding: '12px 20px' }}>
              {courseStats.map((course, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < courseStats.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#9CA3AF' }}>{course.code}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: '#111827' }}>
                        {course.rate}%
                      </span>
                      {course.trend === 'up' ? <TrendingUp size={12} color="#059669" /> : course.trend === 'down' ? <TrendingDown size={12} color="#DC2626" /> : null}
                    </div>
                  </div>
                  <div style={s.progressBar}>
                    <div style={{ 
                      height: '100%', 
                      width: `${course.rate}%`, 
                      background: course.rate >= 90 ? '#059669' : course.rate >= 80 ? '#F59E0B' : '#DC2626',
                      borderRadius: 4
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filters & Table ── */}
        <div style={s.card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Attendance Records</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{
                  padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
                  fontSize: 12, fontFamily: 'inherit', background: '#F9FAFB', outline: 'none'
                }}
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map(code => <option key={code} value={code}>{code}</option>)}
              </select>
              <button style={{ padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'inherit', color: '#6B7280' }}>
                <Download size={14} />
                Export
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'present', label: 'Present' },
              { key: 'absent', label: 'Absent' },
              { key: 'late', label: 'Late' },
              { key: 'excused', label: 'Excused' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setSelectedFilter(f.key)}
                className={`filter-chip ${selectedFilter === f.key ? 'active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {['Date', 'Day', 'Time', 'Course', 'Status', 'Method', 'Lecturer'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => {
                  const status = statusConfig[record.status];
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#111827' }}>{record.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{record.day}</td>
                      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#6B7280' }}>{record.time}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{record.course}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#9CA3AF', marginLeft: 4 }}>{record.courseCode}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ ...s.chip, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{methodConfig[record.checkInMethod]}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{record.lecturer}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredAttendance.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Calendar size={36} color="#E5E7EB" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>No records found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}