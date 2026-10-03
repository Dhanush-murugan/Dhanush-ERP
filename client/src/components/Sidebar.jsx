import React from "react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  FolderGit2,
  MessageSquare,
  BadgeIndianRupee,
  Bell,
  Settings,
  BarChart3,
  Award,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "./BrandLogo";

export default function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  pendingLeavesCount = 0,
  activeProjectsCount = 0,
  unreadChatCount = 0
}) {
  const { user, logout, isAdmin } = useAuth();

  // Navigation Items - Employees is restricted exclusively to Admin / Super Admin
  const ALL_NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Employees", icon: Users, adminOnly: true },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "leaves", label: "Leaves", icon: CalendarDays, badge: pendingLeavesCount > 0 ? pendingLeavesCount : null, badgeColor: "warning" },
    { id: "projects", label: "Projects", icon: FolderGit2, badge: activeProjectsCount > 0 ? activeProjectsCount : null, badgeColor: "primary" },
    { id: "chat", label: "Team Chat", icon: MessageSquare, badge: unreadChatCount > 0 ? unreadChatCount : null, badgeColor: "success", badgeDot: unreadChatCount > 0 },
    { id: "payroll", label: "Payroll", icon: BadgeIndianRupee },
    { id: "performance", label: "Performance", icon: Award },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "reports", label: "BI Reports", icon: BarChart3 }
  ];

  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin()) return false;
    return true;
  });

  const handleItemClick = (id) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          className="erp-sidebar-backdrop animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`erp-sidebar ${collapsed ? "collapsed" : ""} ${
          isOpenMobile ? "mobile-open" : "mobile-closed"
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand-wrapper">
          <div
            className="sidebar-brand"
            onClick={() => handleItemClick("dashboard")}
            title="Dhanush Softwares ERP"
          >
            <BrandLogo collapsed={collapsed} size={36} />
          </div>

          <div className="sidebar-brand-actions">
            {/* Desktop Collapse / Expand Toggle */}
            <button
              className="sidebar-collapse-btn desktop-only"
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Mobile Close 'X' Button */}
            <button
              className="sidebar-close-btn mobile-only"
              onClick={onCloseMobile}
              title="Close Navigation"
              aria-label="Close Navigation"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">
            {!collapsed && <span>MAIN MODULES</span>}
          </div>
          <ul className="sidebar-nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id} className="sidebar-nav-item">
                  <button
                    id={`nav-${item.id}`}
                    className={`sidebar-nav-button ${isActive ? "active" : ""}`}
                    onClick={() => handleItemClick(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="sidebar-item-icon">
                      <Icon size={19} />
                    </div>
                    {!collapsed && (
                      <span className="sidebar-item-label">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className={`sidebar-badge badge-${item.badgeColor || "primary"}`}>
                        {item.badge}
                      </span>
                    )}
                    {!collapsed && item.badgeDot && (
                      <span className="sidebar-badge-dot" />
                    )}
                    {isActive && <div className="sidebar-active-indicator" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Card Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name" title={user?.name || "Dhanush Murugan"}>
                  {user?.name || "Dhanush Murugan"}
                </div>
                <div className="sidebar-user-role-row">
                  <span className={`sidebar-role-tag role-${user?.role || "admin"}`}>
                    {user?.role === "admin" ? "Admin" : user?.role || "Employee"}
                  </span>
                  {isAdmin() && (
                    <ShieldCheck size={13} className="text-success" title="Verified Administrator" />
                  )}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                className="sidebar-logout-btn"
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
