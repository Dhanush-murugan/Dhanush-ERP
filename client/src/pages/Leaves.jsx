import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  HeartPulse,
  Palmtree,
  Plane,
  Briefcase
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

export default function Leaves({ leaves = [], onReload, openApplyDirectly = false }) {
  const { user, isManager, isAdmin } = useAuth();
  const { showToast } = useToast();

  // Super Admin Dhanush check: Founder & CEO never applies for leave; he manages company-wide leaves
  const isSuperAdmin =
    (user?.role === "admin" &&
      (user?.id === 1 ||
        user?.email?.toLowerCase().includes("dhanush") ||
        user?.name?.toLowerCase().includes("dhanush"))) ||
    isAdmin();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(openApplyDirectly && !isSuperAdmin);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("emp_id"); // "emp_id" | "pending_first" | "newest" | "duration"

  const [formData, setFormData] = useState({
    leave_type: "Casual Leave",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    days: 1,
    reason: ""
  });

  const handleDateChange = (start, end) => {
    let daysCount = 1;
    if (start && end) {
      const diffTime = Math.abs(new Date(end) - new Date(start));
      daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (isNaN(daysCount) || daysCount < 1) daysCount = 1;
    }
    setFormData((prev) => ({
      ...prev,
      start_date: start,
      end_date: end,
      days: daysCount
    }));
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showToast({
        title: "Reason Required",
        message: "Please enter the purpose of your leave request.",
        type: "warning"
      });
      return;
    }

    try {
      await api.applyLeave({
        ...formData,
        employee_id: user?.id || 14,
        employee_name: user?.name || "Staff Member"
      });
      showToast({
        title: "Leave Application Submitted!",
        message: `Your request for ${formData.days} day(s) has been routed to Super Admin Dhanush.`,
        type: "success"
      });
      setIsApplyModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      showToast({
        title: "Submission Error",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleUpdateStatus = async (id, status, empName) => {
    try {
      await api.updateLeaveStatus(id, status);
      showToast({
        title: status === "approved" ? "Leave Approved ✅" : "Leave Rejected ❌",
        message: `Leave application for ${empName} was marked as ${status.toUpperCase()}.`,
        type: status === "approved" ? "success" : "info"
      });
      if (onReload) onReload();
    } catch (err) {
      showToast({
        title: "Action Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  // For Super Admin Dhanush: views company-wide leaves.
  // For Regular Employees: STRICTLY views ONLY their own leave requests & balances.
  const myLeaves = useMemo(() => {
    if (isSuperAdmin) return leaves;
    const curId = Number(user?.id || 0);
    const curName = (user?.name || "").trim().toLowerCase();
    const curEmail = (user?.email || "").trim().toLowerCase();

    return leaves.filter((l) => {
      const empId = Number(l.employee_id || 0);
      const empName = (l.employee_name || "").trim().toLowerCase();
      const empEmail = (l.employee_email || "").trim().toLowerCase();
      return (
        (curId > 0 && empId === curId) ||
        (curName && empName && empName === curName) ||
        (curEmail && empEmail && empEmail === curEmail)
      );
    });
  }, [leaves, isSuperAdmin, user]);

  // Active leave dataset for the current user view
  const activeLeaveSet = isSuperAdmin ? leaves : myLeaves;

  // Real-time personal balance calculations based on approved leaves
  const myApprovedLeaves = myLeaves.filter((l) => l.status === "approved");
  const usedCL = myApprovedLeaves.filter((l) => (l.leave_type || "").toLowerCase().includes("casual")).reduce((s, l) => s + Number(l.days || 1), 0);
  const usedSL = myApprovedLeaves.filter((l) => (l.leave_type || "").toLowerCase().includes("sick")).reduce((s, l) => s + Number(l.days || 1), 0);
  const usedPL = myApprovedLeaves.filter((l) => (l.leave_type || "").toLowerCase().includes("privilege")).reduce((s, l) => s + Number(l.days || 1), 0);
  const usedCO = myApprovedLeaves.filter((l) => (l.leave_type || "").toLowerCase().includes("comp")).reduce((s, l) => s + Number(l.days || 1), 0);

  const remCL = Math.max(0, 12 - usedCL);
  const remSL = Math.max(0, 10 - usedSL);
  const remPL = Math.max(0, 18 - usedPL);
  const remCO = Math.max(0, 2 - usedCO);

  // Category counts based strictly on active leave set (prevents leaking company counts to employees)
  const clCount = activeLeaveSet.filter((l) => (l.leave_type || "").toLowerCase().includes("casual")).length;
  const slCount = activeLeaveSet.filter((l) => (l.leave_type || "").toLowerCase().includes("sick")).length;
  const plCount = activeLeaveSet.filter((l) => (l.leave_type || "").toLowerCase().includes("privilege")).length;
  const coCount = activeLeaveSet.filter((l) => (l.leave_type || "").toLowerCase().includes("comp")).length;

  const pendingLeaves = activeLeaveSet.filter((l) => l.status === "pending");
  const approvedLeaves = activeLeaveSet.filter((l) => l.status === "approved");
  const rejectedLeaves = activeLeaveSet.filter((l) => l.status === "rejected");

  // Filtering & Order-wise Sorting strictly scoped to the active leave set
  const filteredLeaves = useMemo(() => {
    let result = activeLeaveSet.filter((l) => {
      const matchesStatus = filterStatus === "all" || l.status === filterStatus;

      const matchesCategory =
        filterCategory === "all" ||
        (filterCategory === "CL" && (l.leave_type || "").toLowerCase().includes("casual")) ||
        (filterCategory === "SL" && (l.leave_type || "").toLowerCase().includes("sick")) ||
        (filterCategory === "PL" && (l.leave_type || "").toLowerCase().includes("privilege")) ||
        (filterCategory === "CO" && (l.leave_type || "").toLowerCase().includes("comp"));

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (l.employee_name || "").toLowerCase().includes(query) ||
        (l.employee_code || "").toLowerCase().includes(query) ||
        (l.leave_type || "").toLowerCase().includes(query) ||
        (l.reason || "").toLowerCase().includes(query);

      return matchesStatus && matchesCategory && matchesSearch;
    });

    // Order-wise sorting
    result.sort((a, b) => {
      if (sortBy === "emp_id") {
        const idA = Number(a.employee_id || a.id || 0);
        const idB = Number(b.employee_id || b.id || 0);
        if (idA !== idB) return idA - idB;
        return (a.employee_code || "").localeCompare(b.employee_code || "", undefined, { numeric: true });
      }
      if (sortBy === "pending_first") {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return new Date(b.created_at || b.start_date || 0).getTime() - new Date(a.created_at || a.start_date || 0).getTime();
      }
      if (sortBy === "newest") {
        return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
      }
      if (sortBy === "duration") {
        return Number(b.days || 1) - Number(a.days || 1);
      }
      return 0;
    });

    return result;
  }, [activeLeaveSet, filterStatus, filterCategory, searchQuery, sortBy]);

  return (
    <div className="page-leaves-container animate-fade-in">
      {/* VIEW 1: SUPER ADMIN DHANUSH - EXECUTIVE COMPANY COMMAND CENTER */}
      {isSuperAdmin ? (
        <>
          {/* Executive Banner */}
          <div className="section-toolbar-card mb-4" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)", borderColor: "rgba(16, 185, 129, 0.25)" }}>
            <div>
              <div className="flex-row items-center gap-2 mb-1">
                <span className="ig-verified-badge" style={{ fontSize: "14px", width: "20px", height: "20px" }}>✓</span>
                <h3 className="card-title text-base font-bold text-primary-light">
                  Company Leave Command Center — Super Admin View
                </h3>
                <span className="status-pill status-active font-mono text-xs">
                  Dhanush Softwares Enterprise
                </span>
              </div>
              <p className="card-subtitle text-xs">
                All employee leave applications categorized by type and ordered by Employee ID (EMP001 → EMP100) for instant executive review.
              </p>
            </div>
          </div>

          {/* Metric Cards: Overall Leave Health */}
          <div className="leave-balances-grid mb-4">
            <div className="balance-card balance-cl">
              <div className="balance-header">
                <span className="balance-name">Total Applications</span>
                <span className="balance-badge">All Time</span>
              </div>
              <div className="balance-number font-mono">
                <strong>{leaves.length}</strong>
                <span>Requests</span>
              </div>
              <span className="balance-note">From all 100 enterprise employees</span>
            </div>

            <div className="balance-card balance-sl" style={{ borderColor: pendingLeaves.length > 0 ? "rgba(245, 158, 11, 0.4)" : "" }}>
              <div className="balance-header">
                <span className="balance-name">Pending Review</span>
                <span className="balance-badge" style={{ background: "#f59e0b", color: "#000" }}>Action Req</span>
              </div>
              <div className="balance-number font-mono">
                <strong className={pendingLeaves.length > 0 ? "text-warning" : ""}>{pendingLeaves.length}</strong>
                <span>Awaiting Decision</span>
              </div>
              <span className="balance-note">Requires Super Admin approval</span>
            </div>

            <div className="balance-card balance-pl">
              <div className="balance-header">
                <span className="balance-name">Approved Leaves</span>
                <span className="balance-badge">Authorized</span>
              </div>
              <div className="balance-number font-mono">
                <strong className="text-success">{approvedLeaves.length}</strong>
                <span>Approved</span>
              </div>
              <span className="balance-note">Duly confirmed on company roster</span>
            </div>

            <div className="balance-card balance-co">
              <div className="balance-header">
                <span className="balance-name">Rejected / Closed</span>
                <span className="balance-badge">Declined</span>
              </div>
              <div className="balance-number font-mono">
                <strong>{rejectedLeaves.length}</strong>
                <span>Closed</span>
              </div>
              <span className="balance-note">Conflict or high-deliverable period</span>
            </div>
          </div>

          {/* Category-Wise Breakdown Cards ("கேட்டகரி வைஸ்") */}
          <div className="dashboard-card mb-4">
            <div className="dashboard-card-header pb-2">
              <div className="flex-row items-center gap-2">
                <Filter size={16} className="text-primary" />
                <h4 className="card-title text-sm font-semibold">Category-Wise Leave Breakdown</h4>
              </div>
              <span className="text-xs text-muted font-mono">4 Standard Categories</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", padding: "12px 16px 16px" }}>
              <div
                onClick={() => setFilterCategory(filterCategory === "CL" ? "all" : "CL")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: filterCategory === "CL" ? "rgba(99, 102, 241, 0.18)" : "var(--bg-card-secondary, rgba(255,255,255,0.03))",
                  border: filterCategory === "CL" ? "1px solid #6366f1" : "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div className="flex-row items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary-light flex-row items-center gap-1">
                    <Palmtree size={14} className="text-primary" /> Casual Leave (CL)
                  </span>
                  <span className="font-mono text-sm font-bold">{clCount}</span>
                </div>
                <div className="text-xs text-muted">Planned personal time-off</div>
              </div>

              <div
                onClick={() => setFilterCategory(filterCategory === "SL" ? "all" : "SL")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: filterCategory === "SL" ? "rgba(239, 68, 68, 0.18)" : "var(--bg-card-secondary, rgba(255,255,255,0.03))",
                  border: filterCategory === "SL" ? "1px solid #ef4444" : "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div className="flex-row items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary-light flex-row items-center gap-1">
                    <HeartPulse size={14} className="text-rose" /> Sick Leave (SL)
                  </span>
                  <span className="font-mono text-sm font-bold">{slCount}</span>
                </div>
                <div className="text-xs text-muted">Medical / health recovery</div>
              </div>

              <div
                onClick={() => setFilterCategory(filterCategory === "PL" ? "all" : "PL")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: filterCategory === "PL" ? "rgba(16, 185, 129, 0.18)" : "var(--bg-card-secondary, rgba(255,255,255,0.03))",
                  border: filterCategory === "PL" ? "1px solid #10b981" : "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div className="flex-row items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary-light flex-row items-center gap-1">
                    <Plane size={14} className="text-success" /> Privilege Leave (PL)
                  </span>
                  <span className="font-mono text-sm font-bold">{plCount}</span>
                </div>
                <div className="text-xs text-muted">Earned annual vacation</div>
              </div>

              <div
                onClick={() => setFilterCategory(filterCategory === "CO" ? "all" : "CO")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: filterCategory === "CO" ? "rgba(245, 158, 11, 0.18)" : "var(--bg-card-secondary, rgba(255,255,255,0.03))",
                  border: filterCategory === "CO" ? "1px solid #f59e0b" : "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div className="flex-row items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary-light flex-row items-center gap-1">
                    <Briefcase size={14} className="text-warning" /> Compensatory Off
                  </span>
                  <span className="font-mono text-sm font-bold">{coCount}</span>
                </div>
                <div className="text-xs text-muted">Credited for weekend release</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* VIEW 2: REGULAR EMPLOYEE - PERSONAL LEAVE BALANCES */
        <div className="leave-balances-grid mb-4">
          <div className="balance-card balance-cl">
            <div className="balance-header">
              <span className="balance-name">Casual Leave (CL)</span>
              <span className="balance-badge">Annual</span>
            </div>
            <div className="balance-number font-mono">
              <strong>{remCL < 10 ? `0${remCL}` : remCL}</strong>
              <span>/ 12 Available</span>
            </div>
            <div className="balance-progress-track">
              <div className="balance-progress-fill" style={{ width: `${Math.round((remCL / 12) * 100)}%` }} />
            </div>
            <span className="balance-note">{usedCL} day(s) used this fiscal year</span>
          </div>

          <div className="balance-card balance-sl">
            <div className="balance-header">
              <span className="balance-name">Sick Leave (SL)</span>
              <span className="balance-badge">Medical</span>
            </div>
            <div className="balance-number font-mono">
              <strong>{remSL < 10 ? `0${remSL}` : remSL}</strong>
              <span>/ 10 Available</span>
            </div>
            <div className="balance-progress-track">
              <div className="balance-progress-fill fill-sl" style={{ width: `${Math.round((remSL / 10) * 100)}%` }} />
            </div>
            <span className="balance-note">{usedSL} day(s) used this fiscal year</span>
          </div>

          <div className="balance-card balance-pl">
            <div className="balance-header">
              <span className="balance-name">Privilege Leave (PL)</span>
              <span className="balance-badge">Encashable</span>
            </div>
            <div className="balance-number font-mono">
              <strong>{remPL < 10 ? `0${remPL}` : remPL}</strong>
              <span>/ 18 Available</span>
            </div>
            <div className="balance-progress-track">
              <div className="balance-progress-fill fill-pl" style={{ width: `${Math.round((remPL / 18) * 100)}%` }} />
            </div>
            <span className="balance-note">{usedPL} day(s) used this fiscal year</span>
          </div>

          <div className="balance-card balance-co">
            <div className="balance-header">
              <span className="balance-name">Compensatory Off</span>
              <span className="balance-badge">Extra Shift</span>
            </div>
            <div className="balance-number font-mono">
              <strong>{remCO < 10 ? `0${remCO}` : remCO}</strong>
              <span>/ 02 Available</span>
            </div>
            <div className="balance-progress-track">
              <div className="balance-progress-fill fill-co" style={{ width: `${Math.round((remCO / 2) * 100)}%` }} />
            </div>
            <span className="balance-note">{usedCO} day(s) used this fiscal year</span>
          </div>
        </div>
      )}

      {/* FILTER & ORDER-WISE TOOLBAR */}
      <div className="section-toolbar-card">
        <div className="toolbar-left-group" style={{ flexWrap: "wrap" }}>
          {/* Search box */}
          <div className="input-with-icon search-input-box">
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input search-control"
              placeholder="Search applicant, ID, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Dropdown */}
          <select
            className="form-select filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            title="Filter by Category"
          >
            <option value="all">All Categories ({activeLeaveSet.length})</option>
            <option value="CL">🌴 Casual Leave ({clCount})</option>
            <option value="SL">🩺 Sick Leave ({slCount})</option>
            <option value="PL">✈️ Privilege Leave ({plCount})</option>
            <option value="CO">⏱️ Comp-Off ({coCount})</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            className="form-select filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            title="Filter by Status"
          >
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending Approval ({pendingLeaves.length})</option>
            <option value="approved">✅ Approved ({approvedLeaves.length})</option>
            <option value="rejected">❌ Rejected ({rejectedLeaves.length})</option>
          </select>

          {/* Order-Wise Sort Dropdown */}
          <div className="flex-row items-center gap-1">
            <ArrowUpDown size={14} className="text-muted" />
            <select
              className="form-select filter-select font-mono"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Order-wise Sort"
            >
              <option value="emp_id">Order by Employee ID (EMP001 → EMP100)</option>
              <option value="pending_first">Order by Priority (Pending First)</option>
              <option value="newest">Order by Date (Newest First)</option>
              <option value="duration">Order by Duration (Days Descending)</option>
            </select>
          </div>
        </div>

        {/* Regular employee has "Apply for Leave" button; Dhanush does not need it */}
        {!isSuperAdmin && (
          <div className="toolbar-right-group">
            <button className="btn btn-primary btn-sm" onClick={() => setIsApplyModalOpen(true)}>
              <Plus size={16} />
              <span>Apply for Leave</span>
            </button>
          </div>
        )}
      </div>

      {/* PENDING APPROVAL INBOX (STRICTLY SUPER ADMIN ONLY) */}
      {isSuperAdmin && pendingLeaves.length > 0 && filterStatus !== "approved" && filterStatus !== "rejected" && (
        <div className="dashboard-card border-warning mb-4 animate-scale-up">
          <div className="dashboard-card-header">
            <div className="flex-row items-center gap-2">
              <Clock size={18} className="text-warning" />
              <div>
                <h3 className="card-title text-warning">
                  Pending Approvals Requiring Super Admin Decision ({pendingLeaves.length})
                </h3>
                <p className="card-subtitle">Review employee leave reason and authorize with one click</p>
              </div>
            </div>
            <span className="status-pill status-warning font-mono">Immediate Action</span>
          </div>

          <div className="pending-leaves-grid">
            {pendingLeaves.map((l) => (
              <div key={l.id} className="pending-leave-card animate-fade-in">
                <div className="pending-card-top">
                  <div>
                    <strong className="pending-emp-name">{l.employee_name}</strong>
                    <span className="pending-emp-code font-mono">
                      {l.employee_code || (l.employee_id ? `EMP${String(l.employee_id).padStart(3, "0")}` : "EMP")}
                    </span>
                  </div>
                  <span className="leave-type-pill">{l.leave_type}</span>
                </div>

                <div className="pending-dates-row">
                  <div className="date-item">
                    <span className="lbl">Dates:</span>
                    <strong>{l.start_date} → {l.end_date}</strong>
                  </div>
                  <div className="date-item">
                    <span className="lbl">Duration:</span>
                    <strong className="text-primary font-mono">{l.days} Day(s)</strong>
                  </div>
                </div>

                <div className="pending-reason-box">
                  <span className="reason-lbl">Reason:</span>
                  <p className="reason-text">"{l.reason}"</p>
                </div>

                <div className="pending-actions-row">
                  <button
                    className="btn btn-secondary btn-sm btn-reject"
                    onClick={() => handleUpdateStatus(l.id, "rejected", l.employee_name)}
                  >
                    <XCircle size={15} />
                    <span>Reject</span>
                  </button>
                  <button
                    className="btn btn-primary btn-sm btn-approve"
                    onClick={() => handleUpdateStatus(l.id, "approved", l.employee_name)}
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve Request</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETE COMPANY LEAVE REGISTER TABLE */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h3 className="card-title">
              {isSuperAdmin ? "Company Employee Leave Master Register" : "My Leave History & Status"}
            </h3>
            <p className="card-subtitle">
              Showing {filteredLeaves.length} records sorted {sortBy === "emp_id" ? "by Employee ID (EMP001 → EMP100)" : "order-wise"}
            </p>
          </div>
          <span className="text-secondary text-sm font-mono">{filteredLeaves.length} Total</span>
        </div>

        <div className="table-responsive-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Leave Category</th>
                <th>Duration</th>
                <th>From → To</th>
                <th>Reason for Absence</th>
                <th>Applied Date</th>
                <th>Status</th>
                {isSuperAdmin && <th>Quick Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="text-center py-8 text-muted">
                    No leave applications found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const empCodeFormatted =
                    l.employee_code ||
                    (l.employee_id ? `EMP${String(l.employee_id).padStart(3, "0")}` : "EMP");

                  return (
                    <tr key={l.id}>
                      <td className="font-mono font-semibold text-primary-light">
                        {empCodeFormatted}
                      </td>
                      <td>
                        <strong>{l.employee_name}</strong>
                      </td>
                      <td>
                        <span className="leave-type-pill">{l.leave_type}</span>
                      </td>
                      <td className="font-mono font-semibold">{l.days} day(s)</td>
                      <td className="font-mono text-sm">
                        {l.start_date} → {l.end_date}
                      </td>
                      <td className="max-w-xs truncate" title={l.reason}>
                        {l.reason}
                      </td>
                      <td className="text-muted text-sm font-mono">{l.applied_on || l.start_date || "2026-10-01"}</td>
                      <td>
                        <span className={`status-pill status-${l.status}`}>
                          <span className="status-dot" />
                          {l.status}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td>
                          {l.status === "pending" ? (
                            <div className="flex-row gap-2">
                              <button
                                className="btn-icon-xs text-success"
                                onClick={() => handleUpdateStatus(l.id, "approved", l.employee_name)}
                                title="Approve Request"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                className="btn-icon-xs text-danger"
                                onClick={() => handleUpdateStatus(l.id, "rejected", l.employee_name)}
                                title="Reject Request"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted text-xs font-mono">
                              {l.status === "approved" ? "Authorized" : "Closed"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPLY LEAVE MODAL (Available for Employees with dynamic personal balances) */}
      {!isSuperAdmin && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Submit Leave Application"
          maxWidth="580px"
        >
          <div className="applicant-info-card mb-4 p-3 rounded" style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <div className="flex-row items-center justify-between">
              <div>
                <span className="text-xs text-muted block">Applicant Name & ID:</span>
                <strong className="text-sm text-primary-light font-semibold">
                  {user?.name || "Employee"} ({user?.employee_code || (user?.id ? `EMP${String(user.id).padStart(3, "0")}` : "EMP002")})
                </strong>
              </div>
              <span className="status-pill status-active font-mono text-xs">
                Verified Staff
              </span>
            </div>
          </div>

          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Leave Category *</label>
              <select
                className="form-select"
                value={formData.leave_type}
                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              >
                <option value="Casual Leave">Casual Leave (CL) — {remCL} Days Available</option>
                <option value="Sick Leave">Sick Leave (SL) — {remSL} Days Available</option>
                <option value="Privilege Leave">Privilege Leave (PL) — {remPL} Days Available</option>
                <option value="Compensatory Off">Compensatory Off — {remCO} Days Available</option>
              </select>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">From Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.start_date}
                  onChange={(e) => handleDateChange(e.target.value, formData.end_date)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">To Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.end_date}
                  onChange={(e) => handleDateChange(formData.start_date, e.target.value)}
                />
              </div>
            </div>

            <div className="leave-calc-box">
              <span>Calculated Working Days:</span>
              <strong className="font-mono text-primary">{formData.days} Day(s)</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Absence *</label>
              <textarea
                className="form-input"
                rows={3}
                required
                placeholder="e.g. Attending family wedding, doctor consultation, personal travel..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            <div className="modal-actions-row">
              <button type="button" className="btn btn-secondary" onClick={() => setIsApplyModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Leave Request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
