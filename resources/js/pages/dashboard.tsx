import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

// TypeScript Interfaces
interface RaspberryPiStatus {
  connected: boolean;
  cameraActive: boolean;
  lastSync: Date;
}

interface Stats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
}

interface AttendanceRecord {
  id: number;
  name: string;
  studentId: string;
  time: string;
  status: 'present' | 'absent' | 'late';
  class: string;
}

interface ClassInfo {
  id: number;
  name: string;
  code: string;
  students: number;
  present: number;
  time: string;
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [raspberryPiStatus, setRaspberryPiStatus] = useState<RaspberryPiStatus>({
    connected: true,
    cameraActive: true,
    lastSync: new Date()
  });

  // Mock data - Replace with props from Laravel controller
  const [stats, setStats] = useState<Stats>({
    totalStudents: 248,
    presentToday: 187,
    absentToday: 42,
    lateToday: 19,
    attendanceRate: 87.5
  });

  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([
    { id: 1, name: 'John Smith', studentId: 'STU001', time: '09:15', status: 'present', class: 'CS101' },
    { id: 2, name: 'Emma Wilson', studentId: 'STU045', time: '09:22', status: 'present', class: 'CS101' },
    { id: 3, name: 'Michael Chen', studentId: 'STU078', time: '09:35', status: 'late', class: 'CS101' },
    { id: 4, name: 'Sarah Johnson', studentId: 'STU032', time: '09:45', status: 'present', class: 'MATH202' },
    { id: 5, name: 'David Kim', studentId: 'STU112', time: '10:05', status: 'absent', class: 'MATH202' },
  ]);

  const [classes, setClasses] = useState<ClassInfo[]>([
    { id: 1, name: 'Computer Science 101', code: 'CS101', students: 45, present: 38, time: '09:00–10:30' },
    { id: 2, name: 'Advanced Mathematics', code: 'MATH202', students: 32, present: 28, time: '11:00–12:30' },
    { id: 3, name: 'Physics Lab', code: 'PHY150', students: 28, present: 25, time: '14:00–15:30' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateString = currentTime
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();

  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'present': 
        return { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.2)' };
      case 'absent': 
        return { bg: 'rgba(248,113,113,0.08)', color: '#f87171', border: 'rgba(248,113,113,0.2)' };
      case 'late': 
        return { bg: 'rgba(250,204,21,0.08)', color: '#facc15', border: 'rgba(250,204,21,0.2)' };
      default: 
        return { bg: 'rgba(255,255,255,0.04)', color: '#888', border: 'rgba(255,255,255,0.1)' };
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Smart Attendance Dashboard" />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        .dash-root { 
          font-family: 'DM Sans', sans-serif; 
          background: #f5f5f5;
        }

        .dash-card {
          background: #ffffff;
          border: 0.5px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          transition: all 0.15s;
        }

        .dash-card:hover {
          border-color: rgba(0,0,0,0.15);
        }

        .dash-stat-value {
          font-family: 'DM Mono', monospace;
          font-weight: 400;
        }

        .dash-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          border-radius: 8px;
          transition: all 0.15s;
          cursor: pointer;
        }

        .dash-btn-primary {
          background: #0f1117;
          color: #fff;
          border: none;
        }

        .dash-btn-primary:hover {
          opacity: 0.85;
        }

        .dash-btn-secondary {
          background: transparent;
          color: #0f1117;
          border: 0.5px solid rgba(0,0,0,0.1);
        }

        .dash-btn-secondary:hover {
          background: #f5f5f5;
        }

        .dash-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          background: #f9f9f9;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          transition: border-color 0.15s;
        }

        .dash-input:focus {
          outline: none;
          border-color: rgba(0,0,0,0.3);
        }

        .dash-table th {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #888;
        }

        .dash-table td {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #0f1117;
        }

        .dash-badge {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .dash-camera-feed {
          background: #0f1117;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .dash-camera-feed::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
        }

        .dash-live-badge {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          border-radius: 6px;
          padding: 4px 8px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.05em;
        }

        .dash-progress-bar {
          height: 4px;
          background: rgba(0,0,0,0.05);
          border-radius: 2px;
          overflow: hidden;
        }

        .dash-progress-fill {
          height: 100%;
          background: #4ade80;
          border-radius: 2px;
          transition: width 0.3s;
        }

        .dark .dash-root { background: #0a0a0a; }
        .dark .dash-card { background: #111; border-color: rgba(255,255,255,0.06); }
        .dark .dash-card:hover { border-color: rgba(255,255,255,0.12); }
        .dark .dash-btn-secondary { color: #fff; border-color: rgba(255,255,255,0.1); }
        .dark .dash-btn-secondary:hover { background: rgba(255,255,255,0.05); }
        .dark .dash-input { background: #1a1a1a; border-color: rgba(255,255,255,0.08); color: #fff; }
        .dark .dash-table td { color: #e5e5e5; }
        .dark .dash-progress-bar { background: rgba(255,255,255,0.05); }
      `}</style>

      <div className="dash-root flex h-full flex-1 flex-col gap-5 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ 
              width: 36, height: 36, 
              background: '#0f1117', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div>
              <h1 style={{ 
                fontFamily: "'DM Sans', sans-serif", 
                fontSize: 18, 
                fontWeight: 500, 
                color: '#0f1117',
                letterSpacing: '-0.01em'
              }}>
                Smart Attendance
              </h1>
              <p style={{ fontSize: 12, color: '#888' }}>Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Pi Status */}
            <div className="flex items-center gap-2 px-4 py-2" style={{
              background: '#fff',
              border: '0.5px solid rgba(0,0,0,0.08)',
              borderRadius: 30
            }}>
              <div style={{ 
                width: 6, height: 6, 
                background: raspberryPiStatus.connected ? '#4ade80' : '#f87171',
                borderRadius: '50%',
                boxShadow: raspberryPiStatus.connected ? '0 0 8px rgba(74,222,128,0.3)' : 'none'
              }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#0f1117' }}>
                Pi {raspberryPiStatus.connected ? 'ON' : 'OFF'}
              </span>
              <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
              <div style={{ 
                width: 6, height: 6, 
                background: raspberryPiStatus.cameraActive ? '#4ade80' : '#888',
                borderRadius: '50%',
                animation: raspberryPiStatus.cameraActive ? 'pulse 2s infinite' : 'none'
              }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#888' }}>
                CAM
              </span>
            </div>

            {/* Time */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 400, color: '#0f1117', lineHeight: 1.2 }}>
                {timeString}
              </div>
              <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.05em' }}>
                {dateString}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: stats.totalStudents, color: '#0f1117', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 0 1 4 4' },
            { label: 'Present Today', value: stats.presentToday, color: '#4ade80', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3' },
            { label: 'Absent Today', value: stats.absentToday, color: '#f87171', icon: 'M18 6L6 18M6 6l12 12' },
            { label: 'Late Arrivals', value: stats.lateToday, color: '#facc15', icon: 'M12 8v4l3 3 M12 2a10 10 0 1 0 10 10' },
          ].map((stat, i) => (
            <div key={i} className="dash-card" style={{ padding: '20px 22px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {stat.label}
                  </div>
                  <div className="dash-stat-value" style={{ fontSize: 34, color: '#0f1117' }}>
                    {stat.value}
                  </div>
                </div>
                <div style={{ 
                  width: 40, height: 40, 
                  background: `${stat.color}08`, 
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="1.5">
                    <path d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Camera Feed + Recent Activity */}
        <div className="grid grid-cols-3 gap-4">
          {/* Camera Feed */}
          <div className="dash-card" style={{ padding: '20px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#0f1117', letterSpacing: '-0.01em' }}>
                Camera Feed
              </h3>
              <div className="flex items-center gap-1">
                <div style={{ width: 5, height: 5, background: '#4ade80', borderRadius: '50%' }} />
                <span style={{ fontSize: 10, color: '#4ade80', letterSpacing: '0.05em' }}>LIVE</span>
              </div>
            </div>
            
            <div className="dash-camera-feed" style={{ aspectRatio: '16/9', marginBottom: 16 }}>
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 8
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  Pi Camera V2
                </span>
              </div>
              <div className="dash-live-badge" style={{ position: 'absolute', bottom: 10, right: 10, color: '#fff' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ 
                    width: 6, height: 6, 
                    background: '#ef4444', 
                    borderRadius: '50%',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  REC
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="dash-btn dash-btn-primary" style={{ flex: 1, padding: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 6 }}>
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Refresh
              </button>
              <button className="dash-btn dash-btn-secondary" style={{ flex: 1, padding: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 6 }}>
                  <rect x="2" y="2" width="20" height="20" rx="2.18" />
                  <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
                </svg>
                Capture
              </button>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="dash-card col-span-2" style={{ padding: '20px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#0f1117', letterSpacing: '-0.01em' }}>
                Recent Attendance
              </h3>
              <div className="flex items-center gap-2">
                <div style={{ position: 'relative' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="dash-input"
                    style={{ padding: '8px 12px 8px 36px', width: 180 }}
                  />
                </div>
                <button className="dash-btn dash-btn-secondary" style={{ padding: '8px 12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9h12M6 15h6M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                  </svg>
                </button>
              </div>
            </div>

            <table className="dash-table w-full">
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Student</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record) => {
                  const statusStyle = getStatusStyles(record.status);
                  return (
                    <tr key={record.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.03)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ 
                            width: 32, height: 32, 
                            background: '#0f1117', 
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 500
                          }}>
                            {record.name.charAt(0)}
                          </div>
                          <span>{record.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#888', fontFamily: "'DM Mono', monospace" }}>
                        {record.studentId}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{record.class}</td>
                      <td style={{ padding: '12px 8px', fontFamily: "'DM Mono', monospace", color: '#888' }}>
                        {record.time}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="dash-badge" style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `0.5px solid ${statusStyle.border}`,
                          textTransform: 'capitalize'
                        }}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classes Overview */}
        <div className="dash-card" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#0f1117', letterSpacing: '-0.01em' }}>
              Today's Classes
            </h3>
            <button className="dash-btn" style={{ 
              background: 'transparent', 
              color: '#0f1117', 
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              View All
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} style={{
                border: '0.5px solid rgba(0,0,0,0.06)',
                borderRadius: 12,
                padding: '16px',
                transition: 'all 0.15s'
              }} className="hover:border-black/15">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f1117', marginBottom: 2 }}>
                      {cls.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.05em' }}>
                      {cls.code}
                    </div>
                  </div>
                  <span style={{
                    background: '#f5f5f5',
                    padding: '4px 8px',
                    borderRadius: 20,
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    color: '#0f1117'
                  }}>
                    {cls.time}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#888' }}>Students</span>
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>{cls.students}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span style={{ color: '#888' }}>Present</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: '#4ade80' }}>{cls.present}</span>
                  </div>
                  <div className="dash-progress-bar">
                    <div className="dash-progress-fill" style={{ 
                      width: `${(cls.present / cls.students) * 100}%` 
                    }} />
                  </div>
                </div>

                <button className="dash-btn dash-btn-secondary w-full" style={{ padding: '8px' }}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}