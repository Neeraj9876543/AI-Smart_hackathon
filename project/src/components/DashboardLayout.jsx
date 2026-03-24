import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, UserCircle, FileText, Award, Search,
  BarChart3, LogOut, ShieldCheck, Menu, X, GraduationCap, Sparkles, Code
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150 w-full text-left ${
      active
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-muted-foreground hover:bg-secondary'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const studentLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'Profile', icon: UserCircle },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/achievements', label: 'Achievements', icon: Award },
    { path: '/achievement-upload', label: 'Upload Achievement', icon: Award },
    { path: '/projects', label: 'Projects', icon: Code },
    { path: '/resume', label: 'Resume AI', icon: Sparkles },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/search', label: 'Search Students', icon: Search },
    { path: '/admin/verify', label: 'Verification', icon: ShieldCheck },
    { path: '/admin/projects', label: 'Projects', icon: Code },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col p-6 h-screen transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center gap-2 px-2 mb-10">
          <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
            <GraduationCap className="text-primary-foreground" size={20} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">ScholarGraph</span>
        </div>

        <nav className="space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-2">
            {isAdmin ? 'Administration' : 'Main Menu'}
          </p>
          {links.map(link => (
            <NavItem
              key={link.path}
              icon={link.icon}
              label={link.label}
              active={location.pathname === link.path}
              onClick={() => { navigate(link.path); setSidebarOpen(false); }}
            />
          ))}
        </nav>

        <div className="pt-6 border-t border-border">
          <NavItem icon={LogOut} label="Sign Out" onClick={handleLogout} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <header className="flex justify-between items-center p-6 lg:p-10 pb-0 lg:pb-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-display font-bold tracking-tight text-foreground">
                {isAdmin ? 'Admin Panel' : `Welcome back, ${user?.name?.split(' ')[0]}`}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isAdmin ? 'Manage students and verify documents' : 
                  user?.studentDetails ? 
                    `Reg: ${user.studentDetails.regNo || 'N/A'} • ${user.studentDetails.branch || 'N/A'} • ${user.studentDetails.year || 'N/A'} Year` :
                    'Loading profile...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'Student Account'}</p>
            </div>
            <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <div className="p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
