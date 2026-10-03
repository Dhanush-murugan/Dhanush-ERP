import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { api } from "./services/api";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Projects from "./pages/Projects";
import Chat from "./pages/Chat";
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";
import Announcements from "./pages/Announcements";
import Reports from "./pages/Reports";
import AiCopilot from "./pages/AiCopilot";

function MainApp() {
  const { isAuthenticated, user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Non-admins cannot access employees tab
  useEffect(() => {
    if (!isAdmin() && activeTab === "employees") {
      setActiveTab("dashboard");
    }
  }, [activeTab, isAdmin]);

  // Global ERP dataset
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [dashboardData, setDashboardData] = useState({});

  // Direct modal triggers
  const [openEmpAdd, setOpenEmpAdd] = useState(false);
  const [openLeaveApply, setOpenLeaveApply] = useState(false);
  const [openProjNew, setOpenProjNew] = useState(false);

  // Unread chat messages count for real-time sidebar & navbar alert
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshUnreadChat = useCallback(async () => {
    if (!user?.id) return;
    try {
      const count = await api.getChatUnreadCount(user.id);
      setUnreadChatCount(count);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshUnreadChat();

      const handleSync = () => {
        refreshUnreadChat();
      };

      window.addEventListener("ds_chat_sync", handleSync);
      window.addEventListener("storage", handleSync);

      const interval = setInterval(refreshUnreadChat, 3000);
      return () => {
        window.removeEventListener("ds_chat_sync", handleSync);
        window.removeEventListener("storage", handleSync);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, user?.id, refreshUnreadChat]);

  const loadAllData = useCallback(async () => {
    try {
      const [
        emps,
        depts,
        att,
        lvs,
        projs,
        anns,
        pay,
        perf,
        dash
      ] = await Promise.allSettled([
        api.getEmployees(),
        api.getDepartments(),
        api.getAttendance(),
        api.getLeaves(),
        api.getProjects(),
        api.getAnnouncements(),
        api.getPayroll(),
        api.getPerformance(),
        api.getDashboard()
      ]);

      if (emps.status === "fulfilled") setEmployees(emps.value || []);
      if (depts.status === "fulfilled") setDepartments(depts.value || []);
      if (att.status === "fulfilled") setAttendance(att.value || []);
      if (lvs.status === "fulfilled") setLeaves(lvs.value || []);
      if (projs.status === "fulfilled") setProjects(projs.value || []);
      if (anns.status === "fulfilled") setAnnouncements(anns.value || []);
      if (pay.status === "fulfilled") setPayroll(pay.value || []);
      if (perf.status === "fulfilled") setPerformance(perf.value || []);
      if (dash.status === "fulfilled") setDashboardData(dash.value || {});
    } catch (e) {
      console.warn("Failed to load some ERP data:", e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // Handle navigation from command palette, buttons, etc.
  const handleNavigate = (tabId, triggerAction = false) => {
    // Automatically close mobile drawer when navigating so dashboard/page is displayed cleanly
    setIsMobileSidebarOpen(false);

    if (triggerAction && !tabId) {
      setIsCommandPaletteOpen(true);
      return;
    }

    if (tabId) {
      setActiveTab(tabId);
      if (triggerAction) {
        if (tabId === "employees") setOpenEmpAdd(true);
        if (tabId === "leaves") setOpenLeaveApply(true);
        if (tabId === "projects") setOpenProjNew(true);
      } else {
        setOpenEmpAdd(false);
        setOpenLeaveApply(false);
        setOpenProjNew(false);
      }
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  const TAB_TITLES = {
    dashboard: "Dashboard",
    employees: "Employees",
    attendance: "Attendance",
    leaves: "Leaves",
    projects: "Projects",
    chat: "Team Chat",
    payroll: "Payroll",
    performance: "Performance",
    announcements: "Announcements",
    reports: "BI Reports",
    ai: "AI"
  };

  const pendingLeavesCount = leaves.filter((l) => l.status === "pending").length;
  const activeProjectsCount = projects.filter((p) => p.status !== "completed").length;

  return (
    <div className="erp-app-shell">
      {/* Collapsible & Mobile Responsive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingLeavesCount={pendingLeavesCount}
        activeProjectsCount={activeProjectsCount}
        unreadChatCount={unreadChatCount}
      />

      {/* Main Content Area */}
      <div className={`erp-main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Top Navbar */}
        <Navbar
          activeTabTitle={TAB_TITLES[activeTab] || "ERP Dashboard"}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          announcements={announcements}
          unreadChatCount={unreadChatCount}
          onNavigate={handleNavigate}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Page Views */}
        <main className="erp-content-viewport">
          {activeTab === "dashboard" && (
            <Dashboard
              dashboardData={dashboardData}
              employees={employees}
              projects={projects}
              leaves={leaves}
              announcements={announcements}
              attendance={attendance}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === "employees" && (
            <Employees
              employees={employees}
              departments={departments}
              onReload={loadAllData}
              openAddDirectly={openEmpAdd}
            />
          )}

          {activeTab === "attendance" && (
            <Attendance
              attendance={attendance}
              employees={employees}
              onReload={loadAllData}
            />
          )}

          {activeTab === "leaves" && (
            <Leaves
              leaves={leaves}
              onReload={loadAllData}
              openApplyDirectly={openLeaveApply}
            />
          )}

          {activeTab === "projects" && (
            <Projects
              projects={projects}
              employees={employees}
              onReload={loadAllData}
              openNewDirectly={openProjNew}
            />
          )}

          {activeTab === "chat" && (
            <Chat employees={employees} onUnreadCountChange={setUnreadChatCount} />
          )}

          {activeTab === "payroll" && (
            <Payroll
              payroll={payroll}
              employees={employees}
              onReload={loadAllData}
            />
          )}

          {activeTab === "performance" && (
            <Performance
              performance={performance}
              employees={employees}
            />
          )}

          {activeTab === "announcements" && (
            <Announcements
              announcements={announcements}
              onReload={loadAllData}
            />
          )}

          {activeTab === "reports" && (
            <Reports
              employees={employees}
              attendance={attendance}
              projects={projects}
              payroll={payroll}
            />
          )}

          {activeTab === "ai" && (
            <AiCopilot
              onReload={loadAllData}
              employees={employees}
              attendance={attendance}
              payroll={payroll}
              projects={projects}
              leaves={leaves}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Global Spotlight Search (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        employees={employees}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
