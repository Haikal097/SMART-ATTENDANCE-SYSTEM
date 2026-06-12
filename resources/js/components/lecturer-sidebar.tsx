import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    BookOpen,
    CalendarDays,
    ClipboardList,
    UserCheck,
    CalendarCheck,
    BarChart3,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', url: '/lecturer/dashboard', icon: LayoutGrid },
];

const teachingNavItems: NavItem[] = [
    { title: 'My Subjects', url: '/lecturer/subjects',  icon: BookOpen },
    { title: 'Timetable',   url: '/lecturer/timetable', icon: CalendarDays },
    { title: 'Sessions',    url: '/lecturer/sessions',  icon: ClipboardList },
];

const attendanceNavItems: NavItem[] = [
    { title: 'Take Attendance',    url: '/lecturer/attendance/take',    icon: UserCheck },
    { title: 'Attendance Records', url: '/lecturer/attendance/records', icon: CalendarCheck },
    { title: 'Reports',            url: '/lecturer/reports',            icon: BarChart3 },
];

const studentNavItems: NavItem[] = [
    { title: 'My Students', url: '/lecturer/students', icon: Users },
];

export function LecturerSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/lecturer/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <div className="px-2 py-2">
                    <NavMain items={mainNavItems} />
                </div>

                <div className="px-3 py-2">
                    <p className="mb-2 px-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                        Teaching
                    </p>
                    <NavMain items={teachingNavItems} />
                </div>

                <div className="px-3 py-2">
                    <p className="mb-2 px-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                        Attendance
                    </p>
                    <NavMain items={attendanceNavItems} />
                </div>

                <div className="px-3 py-2">
                    <p className="mb-2 px-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                        Students
                    </p>
                    <NavMain items={studentNavItems} />
                </div>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
