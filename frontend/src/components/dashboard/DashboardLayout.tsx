import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNav, MobileHeader } from './';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background theme-dashboard">
      <MobileHeader />
      <Sidebar />
      {/* 
        Mobile: pt-14 (Header) + pb-32 (Floating Nav Space)
        Desktop: pt-0, ml-72
      */}
      <main className="pt-14 pb-32 lg:pb-0 lg:pt-0 lg:ml-[18rem] min-h-screen">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
