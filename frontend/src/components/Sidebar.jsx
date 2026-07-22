import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, CalendarDays, Building2, BookMarked,
  LogOut, ChevronRight, User, Menu, X
} from 'lucide-react';

const facultyNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
  { to: '/book',      icon: Building2,       label: 'Book' },
  { to: '/my-bookings', icon: BookMarked,    label: 'Bookings' },
];

const adminNav = [
  { to: '/admin',       icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/halls', icon: Building2,       label: 'Halls' },
  { to: '/calendar',    icon: CalendarDays,    label: 'Calendar' },
];

export default function Sidebar({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = isAdmin() ? adminNav : facultyNav;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ═══════════════════════════════════════════════
          DESKTOP: Left Sidebar (lg and above only)
      ═══════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-blue-700
                          flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-900/50">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">VCET Halls</div>
            <div className="text-slate-500 text-xs">Hall Reservation</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                 ${isActive
                   ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                   : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`
              }>
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-700 to-blue-800 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-slate-500 text-xs truncate">{user?.department}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                       text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 group">
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Mobile Top Bar ── */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3
                            bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-blue-700 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">VCET Hall Reservation</span>
          </div>
          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8
                          pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════
          MOBILE: Bottom Tab Bar (hidden on lg+)
      ═══════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40
                       bg-slate-900/95 backdrop-blur-md border-t border-slate-800
                       safe-area-bottom">
        <div className="flex items-stretch">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1
                 text-xs font-medium transition-all duration-200 relative
                 ${isActive ? 'text-primary-400' : 'text-slate-500 active:text-slate-300'}`
              }>
              {({ isActive }) => (
                <>
                  {/* Active indicator pill */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5
                                     bg-primary-500 rounded-full" />
                  )}
                  <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Logout tab */}
          <button onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1
                        text-xs font-medium text-slate-500 active:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="leading-none">Logout</span>
          </button>
        </div>
      </nav>

    </div>
  );
}
