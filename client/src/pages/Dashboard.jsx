import React from "react";
import {
  Users,
  CalendarCheck,
  CalendarDays,
  FolderGit2,
  BadgeIndianRupee,
  Plus,
  ArrowUpRight,
  Clock,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Activity,
  Briefcase,
  Building
} from "lucide-react";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function Dashboard({
  dashboardData = {},
  employees = [],
  projects = [],
  leaves = [],
  announcements = [],
  attendance = [],
  onNavigate
}) {
  const { user, isAdmin } = useAuth();

  const totalEmps = employees.length || dashboardData.totalEmployees || 8;
  const activeEmps = employees.filter((e) => e.status === "active").length || 7;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const activeProjects = projects.filter((p) => p.status !== "completed").length;

  // Calculate today's attendance percentage
  const presentCount = attendance.filter((a) => a.status === "present").length || 6;
  const halfDayCount = attendance.filter((a) => a.status === "half-day").length || 1;
  const attendanceRate = Math.round(((presentCount + halfDayCount * 0.5) / (totalEmps || 1)) * 100);

  return (
    <div className="page-dashboard-container animate-fade-in">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-pill">
            <span className="welcome-dot" />
            <span>Real-time Enterprise Operations</span>
          </div>
          <h1 className="welcome-title">
            Welcome back, {user?.name || "Dhanush Murugan"} 👋
          </h1>
          <p className="welcome-subtitle">
            Here is your live enterprise summary for <strong>Thursday, 01 October 2026</strong>. All systems operating at 99.98% uptime.
          </p>

          {/* Employee Identity & Profession Meta Bar */}
          <div className="welcome-employee-meta-bar">
            <div className="emp-meta-chip">
              <Briefcase size={13} className="text-primary" />
              <span className="emp-meta-lbl">Role:</span>
              <strong className="emp-meta-val">
                {user?.designation || (isAdmin() ? "Chief Executive Administrator" : "Software Engineer")}
              </strong>
            </div>
            <div className="emp-meta-chip">
              <Building size={13} className="text-secondary" />
              <span className="emp-meta-lbl">Dept:</span>
              <strong className="emp-meta-val">
                {user?.department_name || (isAdmin() ? "Executive Board" : "Engineering & Technology")}
              </strong>
            </div>
            <div className="emp-meta-chip font-mono">
              <span className="emp-meta-lbl">EMP ID:</span>
              <strong className="emp-meta-val text-primary font-bold">
                {user?.employee_code || `EMP${String(user?.id || 1).padStart(3, "0")}`}
              </strong>
            </div>
            <div className="emp-meta-chip">
              <span className="emp-status-badge status-active">
                <span className="emp-status-dot" /> On-Duty (Active)
              </span>
            </div>
          </div>

          <div className="welcome-quick-actions">
            {isAdmin() && (
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate("employees", true)}>
                <Plus size={16} />
                <span>Add Employee</span>
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("leaves", true)}>
              <CalendarDays size={16} />
              <span>Apply Leave</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("projects", true)}>
              <FolderGit2 size={16} />
              <span>New Project</span>
            </button>
            <button className="btn btn-ai btn-sm" onClick={() => onNavigate("ai")}>
              <Sparkles size={16} />
              <span>Ask Muruga AI</span>
            </button>
          </div>
        </div>

        <div className="welcome-banner-graphic">
          <div className="graphic-circle-orbit">
            <div className="graphic-node node-1">
              <Users size={16} />
            </div>
            <div className="graphic-node node-2">
              <FolderGit2 size={16} />
            </div>
            <div className="graphic-node node-3">
              <BadgeIndianRupee size={16} />
            </div>
            <div className="graphic-center-logo">
              <BrandLogo collapsed={true} size={46} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-cards-grid">
        <StatCard
          title="Total Workforce"
          value={totalEmps}
          change="+14.2% YoY"
          isPositive={true}
          icon={Users}
          colorScheme="indigo"
          subtitle={`${activeEmps} active on payroll`}
        />

        <StatCard
          title="Today's Attendance"
          value={`${attendanceRate}%`}
          change="+3.5% vs avg"
          isPositive={true}
          icon={CalendarCheck}
          colorScheme="emerald"
          subtitle={`${presentCount} present • ${halfDayCount} half-day`}
        />

        <StatCard
          title="Pending Leaves"
          value={pendingLeaves}
          change={pendingLeaves > 0 ? "Requires Review" : "All Clear"}
          isPositive={pendingLeaves === 0}
          icon={CalendarDays}
          colorScheme="amber"
          subtitle="Managerial approvals"
        />

        <StatCard
          title="Active Projects"
          value={activeProjects}
          change="3 Near Completion"
          isPositive={true}
          icon={FolderGit2}
          colorScheme="violet"
          subtitle="Sprint velocity: 94%"
        />

        <StatCard
          title="Monthly Payroll Spent"
          value="₹7,45,000"
          change="September Disbursed"
          isPositive={true}
          icon={BadgeIndianRupee}
          colorScheme="sky"
          subtitle="Direct deposit processed"
        />
      </div>

      {/* Central Visual Analytics Row */}
      <div className="dashboard-grid-row">
        {/* Attendance Visual Radial Card */}
        <div className="dashboard-card card-attendance-radial">
          <div className="dashboard-card-header">
            <div>
              <h3 className="card-title">Attendance Presence</h3>
              <p className="card-subtitle">Real-time daily biometric & check-in distribution</p>
            </div>
            <button className="card-action-btn" onClick={() => onNavigate("attendance")}>
              <span>Full Logs</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="attendance-radial-content">
            <div className="radial-chart-wrapper">
              <svg className="radial-svg" viewBox="0 0 120 120">
                <circle
                  className="radial-bg-circle"
                  cx="60"
                  cy="60"
                  r="50"
                />
                <circle
                  className="radial-progress-circle"
                  cx="60"
                  cy="60"
                  r="50"
                  style={{
                    strokeDasharray: 314,
                    strokeDashoffset: 314 - (314 * attendanceRate) / 100
                  }}
                />
              </svg>
              <div className="radial-center-stats">
                <span className="radial-percentage">{attendanceRate}%</span>
                <span className="radial-label">Present</span>
              </div>
            </div>

            <div className="attendance-breakdown-list">
              <div className="breakdown-item">
                <div className="breakdown-label-row">
                  <span className="status-dot dot-present" />
                  <span>On Duty & Present</span>
                </div>
                <strong className="breakdown-val font-mono">{presentCount} staff</strong>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-label-row">
                  <span className="status-dot dot-halfday" />
                  <span>Half Day Approved</span>
                </div>
                <strong className="breakdown-val font-mono">{halfDayCount} staff</strong>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-label-row">
                  <span className="status-dot dot-leave" />
                  <span>On Leave / Absent</span>
                </div>
                <strong className="breakdown-val font-mono">{totalEmps - presentCount - halfDayCount} staff</strong>
              </div>

              <div className="attendance-quote">
                <Clock size={14} />
                <span>Office core hours: 09:30 AM to 06:30 PM IST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Projects Status Card */}
        <div className="dashboard-card card-projects-progress">
          <div className="dashboard-card-header">
            <div>
              <h3 className="card-title">Key Strategic Projects</h3>
              <p className="card-subtitle">Active deliverables and sprint completion rates</p>
            </div>
            <button className="card-action-btn" onClick={() => onNavigate("projects")}>
              <span>Kanban Board</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="projects-progress-list">
            {projects.slice(0, 4).map((proj) => (
              <div key={proj.id} className="project-progress-row">
                <div className="project-row-top">
                  <div className="project-title-group">
                    <strong className="project-name">{proj.name}</strong>
                    <span className="project-assignee">Lead: {proj.assigned_employee_name || "Dhanush Murugan"}</span>
                  </div>
                  <div className="project-badge-group">
                    <span className={`priority-tag priority-${String(proj.priority || 'Medium').toLowerCase()}`}>
                      {proj.priority || "Medium"}
                    </span>
                    <span className="project-percent font-mono">{proj.progress || 0}%</span>
                  </div>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${proj.progress >= 90 ? "fill-success" : proj.progress >= 50 ? "fill-primary" : "fill-warning"}`}
                    style={{ width: `${proj.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Feed & Official Notice Board */}
      <div className="dashboard-grid-row">
        {/* Notice Board */}
        <div className="dashboard-card card-announcements">
          <div className="dashboard-card-header">
            <div className="flex-row items-center gap-2">
              <Bell size={18} className="text-warning" />
              <div>
                <h3 className="card-title">Executive Notice Board</h3>
                <p className="card-subtitle">Company bulletins & urgent broadcasts</p>
              </div>
            </div>
            <button className="card-action-btn" onClick={() => onNavigate("announcements")}>
              <span>All Notices</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="announcements-feed">
            {announcements.slice(0, 3).map((item) => (
              <div key={item.id} className="announcement-card-snippet">
                <div className="announcement-snippet-header">
                  <span className={`announcement-category-pill pill-${String(item.category || 'General').toLowerCase()}`}>
                    {item.category || "Notice"}
                  </span>
                  <span className="announcement-date">
                    {new Date(item.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <h4 className="announcement-snippet-title">{item.title}</h4>
                <p className="announcement-snippet-body">{item.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Activity Feed */}
        <div className="dashboard-card card-activity-feed">
          <div className="dashboard-card-header">
            <div className="flex-row items-center gap-2">
              <Activity size={18} className="text-primary" />
              <div>
                <h3 className="card-title">Live Audit Trail</h3>
                <p className="card-subtitle">Recent HRMS and operations transactions</p>
              </div>
            </div>
            <span className="status-pill status-active">
              <span className="status-dot" /> Live Sync
            </span>
          </div>

          <div className="activity-timeline">
            <div className="timeline-item">
              <div className="timeline-marker marker-success">
                <CheckCircle2 size={14} />
              </div>
              <div className="timeline-content">
                <strong>Monthly Payroll Batch Disbursed</strong>
                <p>₹7,45,000 processed for September via HDFC/ICICI bank gateway.</p>
                <span className="timeline-time">Today, 09:30 AM</span>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker marker-primary">
                <Clock size={14} />
              </div>
              <div className="timeline-content">
                <strong>Attendance Check-In Completed</strong>
                <p>7 engineering and operations members checked in on schedule.</p>
                <span className="timeline-time">Today, 09:05 AM</span>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker marker-warning">
                <CalendarDays size={14} />
              </div>
              <div className="timeline-content">
                <strong>Leave Request Submitted</strong>
                <p>Karthik Subramanian requested 2 days Casual Leave (Family Wedding).</p>
                <span className="timeline-time">Yesterday, 04:15 PM</span>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker marker-violet">
                <Sparkles size={14} />
              </div>
              <div className="timeline-content">
                <strong>Muruga AI Agent Queried</strong>
                <p>Automated attendance analysis generated for executive committee.</p>
                <span className="timeline-time">Yesterday, 02:40 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
