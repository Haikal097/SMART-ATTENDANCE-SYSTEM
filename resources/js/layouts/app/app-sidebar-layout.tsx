import { usePage } from '@inertiajs/react';
import { AppSidebar } from '@/components/app-sidebar';
import { StudentSidebar } from '@/components/student-sidebar';
import { LecturerSidebar } from '@/components/lecturer-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';

interface AppLayoutTemplateProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayoutTemplate({ children }: AppLayoutTemplateProps) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    
    const role = auth.user?.role || 'student';

    const renderSidebar = () => {
        switch (role) {
            case 'admin':
                return <AppSidebar />;
            case 'lecturer':
                return <LecturerSidebar />;
            case 'student':
                return <StudentSidebar />;
            default:
                return <StudentSidebar />;
        }
    };

    return (
        <SidebarProvider>
            {renderSidebar()}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </SidebarProvider>
    );
}