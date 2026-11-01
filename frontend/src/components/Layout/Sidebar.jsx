import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Upload, FolderOpen, Shield,
  User, LogOut, Cloud, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard',  Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resources',  Icon: BookOpen,         label: 'Browse Resources' },
  { to: '/upload',     Icon: Upload,           label: 'Upload Resource' },
  { to: '/my-uploads', Icon: FolderOpen,       label: 'My Uploads' },
  { to: '/profile',    Icon: User,             label: 'Profile' },
];

const adminItems = [
  { to: '/admin',           Icon: Shield, label: 'Admin Dashboard' },
  { to: '/admin/users',     Icon: User,   label: 'Manage Users' },
  { to: '/admin/resources', Icon: BookOpen,label:'Manage Resources' },
];

function NavItem({ to, Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard' || to === '/admin'}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800',
        collapsed && 'justify-center'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = (
    <div className={clsx(
      'flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={clsx('flex items-center h-16 px-4 border-b border-slate-800', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-white">CampusCloud</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}

        {isAdmin && (
          <>
            <div className={clsx('pt-3 pb-1', collapsed ? 'flex justify-center' : '')}>
              {!collapsed && <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold px-3">Admin</p>}
              {collapsed && <div className="w-6 border-t border-slate-700" />}
            </div>
            {adminItems.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>

      {/* Collapse btn (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-indigo-600 border border-slate-600 rounded-full items-center justify-center transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block relative flex-shrink-0">
        {SidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full">
            {SidebarContent}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
