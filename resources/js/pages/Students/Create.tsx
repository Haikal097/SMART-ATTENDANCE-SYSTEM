import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: '/students' },
    { title: 'Add Student', href: '/students/create' },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name:            '',
        student_id:      '',
        email:           '',
        phone:           '',
        enrollment_date: '',
        password:        '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/students');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Student" />
            <div className="p-6 max-w-2xl">

                <div className="flex items-center gap-3 mb-6">
                    <Link href="/students" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <ArrowLeft size={18} className="text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Student</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Create a new student record</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Ahmad Farid"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        {/* Student ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Student ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.student_id}
                                onChange={e => setData('student_id', e.target.value)}
                                placeholder="e.g. STU002"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                            {errors.student_id && <p className="text-red-500 text-xs mt-1">{errors.student_id}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="e.g. farid@school.edu"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Phone
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                placeholder="e.g. +60123456789"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">Share this with the student so they can log in.</p>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        {/* Enrollment Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Enrollment Date
                            </label>
                            <input
                                type="date"
                                value={data.enrollment_date}
                                onChange={e => setData('enrollment_date', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                            {errors.enrollment_date && <p className="text-red-500 text-xs mt-1">{errors.enrollment_date}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href="/students"
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-xl transition"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition disabled:opacity-50"
                        >
                            <Save size={15} />
                            {processing ? 'Saving…' : 'Save Student'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
