import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Bus,
  Building2,
  MapPin,
  Map,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Users,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './AdminLayout.css';

const navItems = [
  { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
  { to: '/admin/bookings', icon: <Calendar size={20} />, label: 'Bookings' },
  { to: '/admin/buses', icon: <Bus size={20} />, label: 'Buses' },
  { to: '/admin/companies', icon: <Building2 size={20} />, label: 'Companies' },
  { to: '/admin/company-suggestions', icon: <Lightbulb size={20} />, label: 'Company Suggestions' },
  { to: '/admin/spots', icon: <MapPin size={20} />, label: 'Visiting Spots' },
  { to: '/admin/cities', icon: <Map size={20} />, label: 'Cities' },
  { to: '/admin/drivers', icon: <Users size={20} />, label: 'Drivers' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/" className="sidebar-link">
            <ChevronLeft size={20} />
            <span>Back to Site</span>
          </NavLink>
          <button className="sidebar-link logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h1>Sri Murugan Tours - Admin</h1>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
