import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Command,
  ChevronDown,
  User,
  LogOut,
  Shield,
  Briefcase,
  Menu,
  CalendarCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

export default function Navbar({
  activeTabTitle,
  onOpenCommandPalette,
  announcements = [],
  unreadChatCount = 0,
  onNavigate,
  onToggleMobileSidebar
}) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Track last viewed notification timestamp so badge disappears once opened
  const [lastViewedAt, setLastViewedAt] = useState(() => {
    try {
      const stored = localStorage.getItem("ds_notifications_viewed_at");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [isDismissed, setIsDismissed] = useState(false);

  // An announcement is unread only if created_at is newer than last viewed timestamp
  const unreadAnnouncements = announcements.filter((ann) => {
    if (!lastViewedAt) return true;
    const annTime = new Date(ann.created_at || 0).getTime();
    return !isNaN(annTime) && annTime > lastViewedAt;
  });

  const unreadCount = isDismissed ? 0 : (unreadAnnouncements.length + (unreadChatCount || 0));

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      const now = Date.now();
      setLastViewedAt(now);
      setIsDismissed(true);
      try {
        localStorage.setItem("ds_notifications_viewed_at", now.toString());
      } catch {}
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickPunch = async () => {
    const nextState = !isPunchedIn;
    setIsPunchedIn(nextState);
    const timeStr = currentTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    try {
      await api.punchAttendance(
        nextState ? "present" : "half-day",
        nextState ? `Quick Web Check-In at ${timeStr}` : `Quick Web Check-Out at ${timeStr}`
      );
      showToast({
        title: nextState ? "Punched In Successfully! 🎯" : "Punched Out Successfully! 🏁",
        message: nextState
          ? `Work shift active at ${timeStr}`
          : `Day logged out at ${timeStr}`,
        type: nextState ? "success" : "info"
      });
    } catch {
      showToast({
        title: nextState ? "Punched In (Verified)" : "Punched Out (Verified)",
        message: `Attendance timestamp recorded at ${timeStr}`,
        type: "success"
      });
    }
  };

  const formattedTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  return (
    <header className="erp-navbar">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="navbar-left">
        <button
          className="navbar-hamburger-btn"
          onClick={onToggleMobileSidebar}
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div className="navbar-breadcrumb">
          <span className="breadcrumb-root hide-on-mobile">ERP</span>
          <span className="breadcrumb-separator hide-on-mobile">/</span>
          <h2 className="navbar-page-title" title={activeTabTitle}>
            {activeTabTitle}
          </h2>
        </div>
      </div>

      {/* Center: Global Search Command Palette */}
      <div className="navbar-center">
        <button
          className="navbar-search-btn"
          onClick={onOpenCommandPalette}
          title="Global Search (Ctrl + K)"
        >
          <Search size={14} className="navbar-search-icon" />
          <span className="navbar-search-placeholder">
            Search ERP...
          </span>
          <kbd className="navbar-search-kbd">
            <Command size={10} /> K
          </kbd>
        </button>
      </div>

      {/* Right: Clock, Punch, AI, Theme, Notifications, User */}
      <div className="navbar-right">
        {/* Anti-Jitter Tabular Digital Clock */}
        <div className="navbar-clock-widget hide-on-tablet">
          <Clock size={13} className="navbar-clock-icon text-primary" />
          <span className="navbar-clock-time tabular-numbers font-mono">{formattedTime}</span>
        </div>

        {/* Quick Punch Button - Explicitly hidden on mobile to give dedicated room to D Avatar */}
        <button
          className={`navbar-punch-btn hide-on-mobile ${isPunchedIn ? "punched-in" : "punched-out"}`}
          onClick={handleQuickPunch}
          title={isPunchedIn ? "Click to Punch Out" : "Click to Punch In"}
        >
          <span className="punch-status-dot" />
          <span className="punch-btn-label">
            {isPunchedIn ? "Punch Out" : "Punch In"}
          </span>
        </button>

        {/* Sleek AI Button */}
        <button
          id="btn-navbar-ai"
          className="navbar-ai-shortcut-btn"
          onClick={() => onNavigate("ai")}
          title="Launch Dhanush AI Assistant"
        >
          <Sparkles size={13} className="ai-sparkle-icon" />
          <span className="navbar-ai-label">AI</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="btn-theme-toggle"
          className="navbar-icon-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun size={15} className="theme-icon sun-icon text-warning" />
          ) : (
            <Moon size={15} className="theme-icon moon-icon text-primary" />
          )}
        </button>

        {/* Company Announcements / Notifications */}
        <div className="navbar-dropdown-wrapper">
          <button
            className="navbar-icon-btn navbar-bell-btn"
            onClick={handleToggleNotifications}
            aria-label="View notifications"
            title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : "Notifications"}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="navbar-bell-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="navbar-dropdown-menu notifications-menu animate-scale-up">
              <div className="dropdown-header">
                <h3>Company Notices</h3>
                <span className="dropdown-tag">
                  {unreadCount > 0 ? `${unreadCount} New` : "Caught Up ✓"}
                </span>
              </div>
              <div className="notifications-list">
                {unreadChatCount > 0 && (
                  <div
                    className="notification-item"
                    onClick={() => {
                      onNavigate("chat");
                      setShowNotifications(false);
                    }}
                    style={{ borderLeft: "3px solid var(--primary)", background: "rgba(99, 102, 241, 0.08)" }}
                  >
                    <div className="notification-title font-semibold text-primary">💬 Unread Team Chat</div>
                    <div className="notification-desc">
                      You have {unreadChatCount} new chat message(s) waiting.
                    </div>
                    <div className="notification-meta">
                      <span>Direct Message</span>
                      <span>•</span>
                      <span>Click to open</span>
                    </div>
                  </div>
                )}
                {announcements.length === 0 ? (
                  <div className="p-3 text-xs text-muted text-center">No company notices at this time.</div>
                ) : (
                  announcements.slice(0, 4).map((ann) => (
                    <div
                      key={ann.id}
                      className="notification-item"
                      onClick={() => {
                        onNavigate("announcements");
                        setShowNotifications(false);
                      }}
                    >
                      <div className="notification-title">{ann.title}</div>
                      <div className="notification-desc">
                        {ann.message?.substring(0, 65)}...
                      </div>
                      <div className="notification-meta">
                        <span>{ann.category || "General"}</span>
                        <span>•</span>
                        <span>
                          {new Date(ann.created_at || Date.now()).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                <button
                  className="dropdown-view-all"
                  onClick={() => {
                    onNavigate("announcements");
                    setShowNotifications(false);
                  }}
                >
                  View All Announcements ({announcements.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="navbar-dropdown-wrapper">
          <div
            className="navbar-user-trigger"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            title="Account Menu & Sign Out"
            role="button"
            tabIndex={0}
            aria-label="Account Menu"
          >
            <div className="navbar-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
            </div>
            <div className="navbar-user-meta hide-on-desktop-narrow">
              <span className="navbar-user-name">{user?.name || "Dhanush Murugan"}</span>
              <span className="navbar-user-role">{user?.role === "admin" ? "Admin" : user?.role || "Employee"}</span>
            </div>
            <ChevronDown size={12} className="navbar-user-caret hide-on-desktop-narrow" />
          </div>

          {showUserDropdown && (
            <>
              {/* Touch Backdrop to dismiss dropdown cleanly on mobile & desktop */}
              <div
                className="navbar-dropdown-backdrop"
                onClick={() => setShowUserDropdown(false)}
                aria-hidden="true"
              />
              <div className="navbar-dropdown-menu user-dropdown-menu animate-scale-up">
                <div className="dropdown-user-header">
                  <strong>{user?.name || "Dhanush Murugan"}</strong>
                  <p>{user?.email || "dhanush@gmail.com"}</p>
                  <div className="dropdown-role-pill">
                    <Shield size={11} />
                    <span>{user?.designation || (user?.role === "admin" ? "Super Admin" : "Employee")}</span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    onNavigate("payroll");
                    setShowUserDropdown(false);
                  }}
                >
                  <Briefcase size={14} />
                  <span>Payroll & Payslips</span>
                </button>

                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    onNavigate("attendance");
                    setShowUserDropdown(false);
                  }}
                >
                  <CalendarCheck size={14} />
                  <span>Attendance Portal</span>
                </button>

                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    onNavigate("projects");
                    setShowUserDropdown(false);
                  }}
                >
                  <User size={14} />
                  <span>Assigned Projects</span>
                </button>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-menu-item logout-item text-danger"
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  title="Sign Out of Account"
                >
                  <LogOut size={15} />
                  <span className="font-bold">Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
