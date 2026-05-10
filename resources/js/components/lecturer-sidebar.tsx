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
  School,
  BookOpen,
  FileText
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/lecturer/dashboard',
    icon: LayoutGrid,
  },
];

const attendanceNavItems: NavItem[] = [
  {
    title: 'My Students',
    url: '/lecturer/students',
    icon: Users,
  },
  {
    title: 'Attendance Records',
    url: '/lecturer/attendance',
    icon: CalendarCheck,
  },
  {
    title: 'Today\'s Log',
    url: '/lecturer/attendance/today',
    icon: Clock,
  },
  {
    title: 'Reports',
    url: '/lecturer/reports',
    icon: BarChart3,
  },
];

const academicNavItems: NavItem[] = [
  {
    title: 'My Classes',
    url: '/lecturer/classes',
    icon: School,
  },
  {
    title: 'Courses',
    url: '/lecturer/courses',
    icon: BookOpen,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: 'Documentation',
    url: '/docs',
    icon: FileText,
  },
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
            Attendance
          </p>
          <NavMain items={attendanceNavItems} />
        </div>

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