import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { 
  Users, 
  Camera, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Activity,
  RefreshCw,
  Settings,
  LogOut,
  ChevronRight,
  Search,
  Filter,
  Download,
  MoreVertical,
  Wifi,
  WifiOff,
  UserCheck,
  UserX,
  GraduationCap
} from 'lucide-react';

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

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

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
    { id: 1, name: 'John Smith', studentId: 'STU001', time: '09:15 AM', status: 'present', class: 'CS101' },
    { id: 2, name: 'Emma Wilson', studentId: 'STU045', time: '09:22 AM', status: 'present', class: 'CS101' },
    { id: 3, name: 'Michael Chen', studentId: 'STU078', time: '09:35 AM', status: 'late', class: 'CS101' },
    { id: 4, name: 'Sarah Johnson', studentId: 'STU032', time: '09:45 AM', status: 'present', class: 'MATH202' },
    { id: 5, name: 'David Kim', studentId: 'STU112', time: '10:05 AM', status: 'absent', class: 'MATH202' },
  ]);

  const [classes, setClasses] = useState<ClassInfo[]>([
    { id: 1, name: 'Computer Science 101', code: 'CS101', students: 45, present: 38, time: '09:00 AM - 10:30 AM' },
    { id: 2, name: 'Advanced Mathematics', code: 'MATH202', students: 32, present: 28, time: '11:00 AM - 12:30 PM' },
    { id: 3, name: 'Physics Lab', code: 'PHY150', students: 28, present: 25, time: '02:00 PM - 03:30 PM' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Smart Attendance Dashboard" />
      
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Header with Time and Pi Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Attendance System
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Raspberry Pi Status */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {raspberryPiStatus.connected ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium dark:text-gray-300">
                Pi: {raspberryPiStatus.connected ? 'Connected' : 'Offline'}
              </span>
              <div className={`w-2 h-2 rounded-full ${raspberryPiStatus.cameraActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            </div>

            {/* Current Time */}
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-gray-700 dark:text-gray-300">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Students</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-2">{stats.totalStudents}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
              <Activity className="w-4 h-4 mr-1" />
              <span>Active enrollment</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Present Today</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.presentToday}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>{((stats.presentToday / stats.totalStudents) * 100).toFixed(1)}% of total</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Absent Today</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.absentToday}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>{((stats.absentToday / stats.totalStudents) * 100).toFixed(1)}% of total</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Late Arrivals</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.lateToday}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>Today's late check-ins</span>
            </div>
          </div>
        </div>

        {/* Camera Feed and Recent Attendance */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Camera Feed */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Live Camera Feed</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Camera className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>
            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Raspberry Pi Camera V2</p>
                  <p className="text-gray-500 text-xs mt-1">Stream Active</p>
                </div>
              </div>
              <div className="absolute bottom-3 right-3">
                <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-xs">LIVE</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Feed
              </button>
              <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Capture Frame
              </button>
            </div>
          </div>

          {/* Recent Attendance Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Recent Attendance</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((record: AttendanceRecord) => (
                    <tr key={record.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="py-3 px-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {record.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{record.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{record.studentId}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{record.class}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{record.time}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1 capitalize">{record.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Classes Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Today's Classes</h2>
            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls: ClassInfo) => (
              <div key={cls.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{cls.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cls.code}</p>
                  </div>
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded">
                    {cls.time}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Students:</span>
                    <span className="font-medium dark:text-gray-300">{cls.students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Present:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{cls.present}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Attendance Rate</span>
                      <span>{((cls.present / cls.students) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(cls.present / cls.students) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg transition">
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