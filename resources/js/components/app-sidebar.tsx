import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
  LayoutGrid,
  Users,
  CalendarCheck,
  Clock,
  BarChart3,
  Camera,
  Cpu,
  ScanFace,
  School,
  BookOpen,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutGrid,
  },
];

const attendanceNavItems: NavItem[] = [
  {
    title: 'Students',
    url: '/students',
    icon: Users,
  },
  {
    title: 'Attendance Records',
    url: '/attendance',
    icon: CalendarCheck,
  },
  {
    title: 'Today\'s Activity',
    url: '/attendance/today',
    icon: Clock,
  },
  {
    title: 'Reports & Analytics',
    url: '/reports',
    icon: BarChart3,
  },
];

const systemNavItems: NavItem[] = [
  {
    title: 'Live Camera',
    url: '/camera',
    icon: Camera,
  },
  {
    title: 'Raspberry Pi',
    url: '/system/pi-status',
    icon: Cpu,
  },
  {
    title: 'Face Approvals',
    url: '/system/face-approvals',
    icon: ScanFace,
  },
];

const academicNavItems: NavItem[] = [
  {
    title: 'Classes',
    url: '/admin/classes',
    icon: School,
  },
  {
    title: 'Subjects',
    url: '/subjects',
    icon: BookOpen,
  },
];

const footerNavItems: NavItem[] = [
    
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Section */}
        <div className="px-2 py-2">
          <NavMain items={mainNavItems} />
        </div>

        {/* Attendance Section */}
        <div className="px-3 py-2">
          <p className="mb-2 px-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            Attendance
          </p>
          <NavMain items={attendanceNavItems} />
        </div>

        {/* System Section */}
        <div className="px-3 py-2">
          <p className="mb-2 px-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            System
          </p>
          <NavMain items={systemNavItems} />
        </div>

        {/* Academic Section */}
        <div className="px-3 py-2">
          <p className="mb-2 px-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            Academic
          </p>
          <NavMain items={academicNavItems} />
        </div>

      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}