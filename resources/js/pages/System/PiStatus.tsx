import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Cpu, Wifi, WifiOff, Camera, CameraOff,
    CheckCircle, AlertCircle, RefreshCw, Play, Square,
} from 'lucide-react';

interface PiStatus {
    online: boolean;
    session_id: number | null;
    subject: string | null;
    faces_loaded: number;
    marked_students: number;
    camera_running: boolean;
}

interface Session {
    id: number;
    subject_code: string;
    subject_name: string;
    time: string;
    start_block: number;
    end_block: number;
    room: string;
    status: string;
    face_ready: number;
    total_enrolled: number;
    present: number;
}

interface Props {
    todaySessions: Session[];
    piUrl: string;
    date: string;
}

export default function PiStatus({ todaySessions, piUrl, date }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [piStatus, setPiStatus] = useState<PiStatus | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [preparing, setPreparing] = useState<number | null>(null);
    const [stopping, setStopping] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/system/pi-status/api');
            const data: PiStatus = await res.json();
            setPiStatus(data);
            setLastUpdated(new Date());
        } catch {
            setPiStatus({ online: false, session_id: null, subject: null, faces_loaded: 0, marked_students: 0, camera_running: false });
        } finally {
            setLoadingStatus(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const prepare = (sessionId: number) => {
        setPreparing(sessionId);
        router.post(`/system/pi-status/prepare/${sessionId}`, {}, {
            preserveScroll: true,
            onFinish: () => setPreparing(null),
        });
    };

    const stopCamera = () => {
        setStopping(true);
        router.post('/system/pi-status/stop', {}, {
            preserveScroll: true,
            onFinish: () => setStopping(false),
        });
    };

    const getSessionPiStatus = (session: Session): 'scanning' | 'prepared' | 'idle' | 'offline' => {
        if (!piStatus?.online) return 'offline';
        if (piStatus.camera_running && piStatus.session_id === session.id) return 'scanning';
        if (!piStatus.camera_running && piStatus.session_id === session.id) return 'prepared';
        return 'idle';
    };

    return (
        <AppLayout>
            <Head title="Raspberry Pi Monitor" />
            <div className="p-6 space-y-6 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Cpu className="h-6 w-6 text-blue-500" />
                            Raspberry Pi Monitor
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{date}</p>
                    </div>
                    <button
                        onClick={fetchStatus}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Top cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Pi status — spans 2 cols */}
                    <div className={`md:col-span-2 rounded-xl border p-5 ${
                        piStatus?.online
                            ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    }`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${piStatus?.online ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                    {piStatus?.online
                                        ? <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        : <WifiOff className="h-5 w-5 text-red-500" />}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Connection</p>
                                    <p className={`text-xl font-bold ${piStatus?.online ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                        {loadingStatus ? 'Checking…' : piStatus?.online ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            {lastUpdated && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {lastUpdated.toLocaleTimeString()}
                                </p>
                            )}
                        </div>

                        {piStatus?.online ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className={`flex justify-center mb-1 ${piStatus.camera_running ? 'text-green-500' : 'text-gray-400'}`}>
                                            {piStatus.camera_running ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Camera</p>
                                        <p className={`text-sm font-semibold ${piStatus.camera_running ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                            {piStatus.camera_running ? 'Running' : 'Stopped'}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{piStatus.faces_loaded}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Faces Loaded</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{piStatus.marked_students}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Marked</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                                            {piStatus.subject ?? '—'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Active Subject</p>
                                    </div>
                                </div>

                                {piStatus.camera_running && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={stopCamera}
                                            disabled={stopping}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                        >
                                            <Square className="h-4 w-4" />
                                            {stopping ? 'Stopping…' : 'Stop Camera'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-red-400 dark:text-red-300">
                                Cannot reach the Pi at <span className="font-mono">{piUrl}</span>. Make sure <code>attendance.py</code> is running.
                            </p>
                        )}
                    </div>

                    {/* Config card */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Configuration</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Pi URL</p>
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{piUrl}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Token</p>
                                <p className="text-sm font-mono text-gray-400 dark:text-gray-500">••••••••••••</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Auto-prepare</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">10 min before session</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's sessions table */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Today's Sessions</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Click "Prepare Now" to push face data to the Pi immediately
                            </p>
                        </div>
                        <span className="text-sm text-gray-400">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</span>
                    </div>

                    {todaySessions.length === 0 ? (
                        <div className="p-16 text-center">
                            <Cpu className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No sessions today</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sessions will appear here when scheduled</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs uppercase tracking-wide">
                                        <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Subject</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Time & Room</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Faces Ready</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Attendance</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Pi Status</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {todaySessions.map(session => {
                                        const piStat = getSessionPiStatus(session);
                                        return (
                                            <tr key={session.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded mr-2">
                                                        {session.subject_code}
                                                    </span>
                                                    <span className="text-gray-700 dark:text-gray-300">{session.subject_name}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-gray-700 dark:text-gray-300 font-medium">{session.time}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{session.room}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`font-medium ${session.face_ready > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-400'}`}>
                                                        {session.face_ready}
                                                    </span>
                                                    <span className="text-gray-400 text-xs"> / {session.total_enrolled} enrolled</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-medium text-green-600 dark:text-green-400">{session.present}</span>
                                                    <span className="text-gray-400 text-xs"> / {session.total_enrolled}</span>
                                                    {session.total_enrolled > 0 && (
                                                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1">
                                                            <div
                                                                className="h-1.5 bg-green-500 rounded-full"
                                                                style={{ width: `${Math.round((session.present / session.total_enrolled) * 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {piStat === 'scanning' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                            Scanning
                                                        </span>
                                                    )}
                                                    {piStat === 'prepared' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                            Prepared
                                                        </span>
                                                    )}
                                                    {piStat === 'idle' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-full">
                                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                            Idle
                                                        </span>
                                                    )}
                                                    {piStat === 'offline' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-semibold rounded-full">
                                                            <WifiOff className="h-3 w-3" />
                                                            Pi Offline
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() => prepare(session.id)}
                                                        disabled={preparing === session.id || !piStatus?.online || session.face_ready === 0}
                                                        title={session.face_ready === 0 ? 'No approved faces for this session' : ''}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Play className="h-3 w-3" />
                                                        {preparing === session.id ? 'Sending…' : 'Prepare Now'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
