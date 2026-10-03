import React, { useState, useEffect } from "react";
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  FolderGit2,
  MessageSquare,
  BadgeIndianRupee,
  Bell,
  Sparkles,
  Settings,
  BarChart3,
  Award,
  ArrowRight,
  X
} from "lucide-react";

export default function CommandPalette({ isOpen, onClose, onNavigate, employees = [] }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onNavigate(null, true); // trigger open
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  if (!isOpen) return null;

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", desc: "Executive metrics, attendance radial & KPI feed", icon: LayoutDashboard },
    { id: "employees", label: "Employee Directory", desc: "Manage staff, add new hires & view profiles", icon: Users },
    { id: "attendance", label: "Attendance & Logs", desc: "Clock in, daily logs & monthly calendar", icon: CalendarCheck },
    { id: "leaves", label: "Leave Management", desc: "Leave balance, applications & approvals", icon: CalendarDays },
    { id: "projects", label: "Project & Kanban Board", desc: "Sprint tasks, deliverables & milestone progress", icon: FolderGit2 },
    { id: "chat", label: "Team Messaging", desc: "Internal channels & direct employee chats", icon: MessageSquare },
    { id: "payroll", label: "Payroll & Slips", desc: "Disbursements, CTC breakdown & PDF slips", icon: BadgeIndianRupee },
    { id: "performance", label: "Performance & OKRs", desc: "Appraisals, feedback & scorecards", icon: Award },
    { id: "announcements", label: "Company Notice Board", desc: "Official updates, events & policy alerts", icon: Bell },
    { id: "reports", label: "BI Reports & Analytics", desc: "HR metrics, salary burn & export CSV/PDF", icon: BarChart3 },
    { id: "ai", label: "Dhanush AI Assistant", desc: "Intelligent HR Assistant & database query agent", icon: Sparkles }
  ];

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(query.toLowerCase()) ||
    emp.email?.toLowerCase().includes(query.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette-box animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="command-search-bar">
          <Search size={20} className="command-search-icon" />
          <input
            type="text"
            className="command-search-input"
            placeholder="Type a command, page, or employee name... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="command-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="command-results-container">
          <div className="command-section-title">Navigation & Tools</div>
          {filteredNav.length === 0 ? (
            <div className="command-empty">No matching pages found</div>
          ) : (
            <div className="command-items-list">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="command-item"
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                  >
                    <div className="command-item-left">
                      <div className="command-item-icon">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="command-item-title">{item.label}</div>
                        <div className="command-item-desc">{item.desc}</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="command-item-arrow" />
                  </div>
                );
              })}
            </div>
          )}

          {query.trim() && filteredEmployees.length > 0 && (
            <>
              <div className="command-section-title">Employees</div>
              <div className="command-items-list">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="command-item"
                    onClick={() => {
                      onNavigate("employees", false, emp);
                      onClose();
                    }}
                  >
                    <div className="command-item-left">
                      <div className="command-item-avatar">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="command-item-title">{emp.name}</div>
                        <div className="command-item-desc">{emp.designation} • {emp.email}</div>
                      </div>
                    </div>
                    <span className="command-badge">{emp.role}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="command-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵ Enter</kbd></span>
          <span>Close with <kbd>Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}
