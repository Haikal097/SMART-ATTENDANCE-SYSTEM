import { Head, Link, useForm } from '@inertiajs/react';
import { 
  Camera, 
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  School,
  Shield,
  Wifi,
  Activity,
  Users,
  CheckCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Welcome() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState({
    piConnected: true,
    cameraActive: true,
    studentsTracked: 1247,
    todayAttendance: 89
  });

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <>
      <Head title="Smart Attendance System - Login Portal" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        {/* Left Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo & Brand */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Smart Attendance System
              </h1>
              <p className="text-gray-600">
                Secure access for administrators and faculty
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              {/* User Type Tabs */}
              <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-lg">
                <button className="flex-1 bg-white text-gray-900 py-2 px-4 rounded-md text-sm font-medium shadow-sm">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Administrator
                </button>
                <button className="flex-1 text-gray-600 hover:text-gray-900 py-2 px-4 rounded-md text-sm font-medium">
                  <Users className="w-4 h-4 inline mr-2" />
                  Faculty
                </button>
              </div>

              <form onSubmit={submit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={data.email}
                      onChange={e => setData('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="admin@school.edu"
                      required
                      autoFocus
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={data.password}
                      onChange={e => setData('password', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={data.remember}
                      onChange={e => setData('remember', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link
                    href={route('password.request')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Signing in...' : 'Sign In to Dashboard'}
                </button>
              </form>

              {/* Alternative Login Methods */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Quick Access Options</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <Camera className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Face ID</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <School className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">SSO Login</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact IT Support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - System Info & Status */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-12 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 w-full">
            {/* Time & Date Display */}
            <div className="text-right mb-12">
              <div className="text-4xl font-mono font-bold mb-2">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-blue-100">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-3" />
                System Status
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wifi className="w-5 h-5 mr-3" />
                    <span>Raspberry Pi Connection</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${systemStatus.piConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span>{systemStatus.piConnected ? 'Connected' : 'Offline'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Camera className="w-5 h-5 mr-3" />
                    <span>Camera Module V2</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${systemStatus.cameraActive ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span>{systemStatus.cameraActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Statistics */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Today's Overview</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold mb-1">{systemStatus.studentsTracked}</div>
                  <div className="text-blue-100 text-sm">Students Tracked</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">{systemStatus.todayAttendance}%</div>
                  <div className="text-blue-100 text-sm">Attendance Rate</div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <h3 className="text-sm font-semibold mb-3 text-blue-100">LIVE ACTIVITY</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                    <span>John Doe - CS101 (09:15 AM)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                    <span>Jane Smith - MATH202 (09:22 AM)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                    <span>Mike Johnson - PHY150 (09:30 AM)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 text-center text-blue-100 text-sm">
              <p>Secure • Reliable • Real-time Face Recognition</p>
              <p className="mt-2 opacity-75">© 2024 Smart Attendance System</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}