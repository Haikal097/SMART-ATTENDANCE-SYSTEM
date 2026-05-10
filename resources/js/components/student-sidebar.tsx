import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { 
  LayoutGrid, 
  CalendarCheck, 
  Clock,
  School,
  BookOpen,
  User,
  Camera,
  HelpCircle
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/student/dashboard',
    icon: LayoutGrid,
  },
];

const attendanceNavItems: NavItem[] = [
  {
    title: 'My Attendance',
    url: '/student/attendance',
    icon: CalendarCheck,
  },
  {
    title: 'Today\'s Status',
    url: '/student/attendance/today',
    icon: Clock,
  },
];

const academicNavItems: NavItem[] = [
  {
    title: 'My Classes',
    url: '/student/classes',
    icon: School,
  },
  {
    title: 'Courses',
    url: '/student/courses',
    icon: BookOpen,
  },
];

const accountNavItems: NavItem[] = [
  {
    title: 'My Profile',
    url: '/settings/profile',
    icon: User,
  },
  {
    title: 'Face Registration',
    url: '/settings/profile',
    icon: Camera,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: 'Help & Support',
    url: '/help',
    icon: HelpCircle,
  },
];

export function StudentSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/student/dashboard" prefetch>
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

        <div className="px-3 py-2">
          <p className="mb-2 px-2 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            Account
          </p>
          <NavMain items={accountNavItems} />
        </div>
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}