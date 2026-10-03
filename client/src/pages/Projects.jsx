import React, { useState } from "react";
import {
  FolderGit2,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Users,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Award,
  Paperclip,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Eye,
  X,
  Search,
  CheckCheck,
  FlaskConical,
  Layers,
  Sparkles,
  ChevronRight,
  LayoutGrid,
  Filter,
  UserCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

export default function Projects({
  projects = [],
  employees = [],
  onReload,
  openNewDirectly = false
}) {
  const { isManager, user } = useAuth();
  const { showToast } = useToast();

  const [activeViewMode, setActiveViewMode] = useState("pipeline"); // "pipeline" | "groups"
  const [searchFilter, setSearchFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [isNewModalOpen, setIsNewModalOpen] = useState(openNewDirectly);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [activeProjectForRating, setActiveProjectForRating] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);

  // Project Files & Attachments Feature
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [activeProjectForFiles, setActiveProjectForFiles] = useState(null);
  const [projectFilesMap, setProjectFilesMap] = useState({
    1: [
      { id: "f1", name: "Dhanush_ERP_System_Architecture_v3.pdf", size: "3.4 MB", date: "2026-09-28", type: "pdf" },
      { id: "f2", name: "PostgreSQL_Database_ER_Schema.png", size: "1.8 MB", date: "2026-09-30", type: "image" },
      { id: "f3", name: "QA_Test_Automation_Suites.json", size: "620 KB", date: "2026-10-01", type: "code" }
    ],
    2: [
      { id: "f4", name: "NeoBank_NPCI_UPI_Compliance_Audit.pdf", size: "5.1 MB", date: "2026-09-15", type: "pdf" },
      { id: "f5", name: "UPI_Payment_Gateway_Webhook_Docs.docx", size: "1.2 MB", date: "2026-09-22", type: "doc" }
    ],
    3: [
      { id: "f6", name: "TeleConsult_HIPAA_ABDM_Protocols.pdf", size: "4.2 MB", date: "2026-09-18", type: "pdf" },
      { id: "f7", name: "QA_Regression_Signed_Report.pdf", size: "2.8 MB", date: "2026-09-24", type: "pdf" }
    ]
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadDocName, setUploadDocName] = useState("");

  // New Project Form Data with Multi-Team Roles
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    current_stage: "analysis",
    status: "backlog",
    progress: 15,
    lead_name: "Aravind Swaminathan",
    frontend_team: ["Meera Krishnan"],
    backend_team: ["Manoj Mudaliar"],
    testing_team: ["Karthik Sundaram"],
    priority: "High",
    budget: "₹15,00,000"
  });

  // Stages definition
  const STAGES = [
    { id: "analysis", label: "Analysis & Architecture", icon: "📋", badgeClass: "stage-analysis" },
    { id: "development", label: "Development (FE & BE)", icon: "💻", badgeClass: "stage-dev" },
    { id: "testing", label: "QA & Testing Verification", icon: "🧪", badgeClass: "stage-testing" },
    { id: "completed", label: "Delivered & Live", icon: "🚀", badgeClass: "stage-live" }
  ];

  // Helper to ensure an array for team assignments so methods like .some() and .join() never crash
  const ensureArray = (val, fallback = []) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.trim()) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
      return val.includes(",") ? val.split(",").map((s) => s.trim()).filter(Boolean) : [val.trim()];
    }
    return fallback;
  };

  // Helper to normalize project stage
  const getProjectStage = (proj) => {
    if (!proj) return "development";
    if (proj.status === "completed" || proj.current_stage === "completed") return "completed";
    if (proj.current_stage === "testing" || proj.status === "review") return "testing";
    if (proj.current_stage === "analysis" || proj.status === "backlog") return "analysis";
    return "development";
  };

  // Filter projects safely
  const filteredProjects = (projects || []).filter((proj) => {
    if (!proj) return false;
    const stage = getProjectStage(proj);
    const fe = ensureArray(proj.frontend_team, ["Shalini Sundaram"]);
    const be = ensureArray(proj.backend_team, ["Manoj Mudaliar"]);
    const qa = ensureArray(proj.testing_team, ["Karthik Sundaram"]);

    const matchesSearch =
      !searchFilter ||
      proj.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      proj.description?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      proj.lead_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      qa.some((t) => typeof t === "string" && t.toLowerCase().includes(searchFilter.toLowerCase())) ||
      fe.some((f) => typeof f === "string" && f.toLowerCase().includes(searchFilter.toLowerCase())) ||
      be.some((b) => typeof b === "string" && b.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesStage = stageFilter === "all" || stage === stageFilter;
    const matchesPriority = priorityFilter === "all" || (proj.priority || "Medium").toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStage && matchesPriority;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const assignedText = `${formData.lead_name} (Lead) + Multi-Team`;
      const leadEmp = (employees || []).find((emp) => emp.name === formData.lead_name);
      await api.createProject({
        ...formData,
        assigned_to: leadEmp ? leadEmp.id : 1,
        assigned_employee_name: assignedText,
        stage_details: {
          analysis: { status: formData.current_stage === "analysis" ? "in-progress" : "completed", lead: formData.lead_name },
          frontend: { status: formData.current_stage === "analysis" ? "pending" : "in-progress", members: formData.frontend_team },
          backend: { status: formData.current_stage === "analysis" ? "pending" : "in-progress", members: formData.backend_team },
          testing: { status: formData.current_stage === "testing" ? "in-progress" : "pending", members: formData.testing_team, test_cases: 30, passed: 0, bugs: 0 },
          deployment: { status: formData.current_stage === "completed" ? "completed" : "pending", lead: "Karthik Sundaram" }
        }
      });
      showToast({
        title: "Enterprise Project Initialized! 🚀",
        message: `'${formData.name}' created with Lead, Frontend, Backend & Testing assignments.`,
        type: "success"
      });
      setIsNewModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      showToast({
        title: "Creation Error",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Are you sure you want to delete project '${proj.name}'?`)) {
      return;
    }
    try {
      await api.deleteProject(proj.id);
      showToast({
        title: "Project Deleted 🗑️",
        message: `'${proj.name}' removed from enterprise pipeline.`,
        type: "info"
      });
      if (onReload) onReload();
    } catch (err) {
      showToast({
        title: "Delete Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  // Forward to Testing Team
  const handleForwardToTesting = async (proj) => {
    try {
      const updates = {
        current_stage: "testing",
        status: "review",
        progress: Math.max(proj.progress || 0, 85)
      };
      await api.updateProject(proj.id, updates);
      showToast({
        title: "Forwarded to QA & Testing! 🧪",
        message: `'${proj.name}' is now assigned to Testing Team: ${(proj.testing_team || ["Karthik Sundaram", "Priya Sharma"]).join(", ")}.`,
        type: "success"
      });
      onReload();
    } catch (err) {
      showToast({
        title: "Update Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  // Pass Testing & Mark Live
  const handlePassTesting = async (proj) => {
    try {
      const updates = {
        current_stage: "completed",
        status: "completed",
        progress: 100
      };
      await api.updateProject(proj.id, updates);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      showToast({
        title: "QA Testing Passed! 🚀",
        message: `'${proj.name}' certified by QA Team and deployed to Live Production.`,
        type: "success"
      });
      onReload();
    } catch (err) {
      showToast({
        title: "Update Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  // Flag Bug / Return to Development
  const handleFlagBugBackToDev = async (proj) => {
    try {
      const updates = {
        current_stage: "development",
        status: "in-progress",
        progress: Math.max((proj.progress || 80) - 15, 60)
      };
      await api.updateProject(proj.id, updates);
      showToast({
        title: "QA Bug Flagged ⚠️",
        message: `'${proj.name}' re-routed back to Frontend & Backend Devs for fixes.`,
        type: "info"
      });
      onReload();
    } catch (err) {
      showToast({
        title: "Update Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  // Move status generically
  const handleMoveStatus = async (projectId, newStage) => {
    try {
      const updates = {
        current_stage: newStage,
        status: newStage === "completed" ? "completed" : newStage === "testing" ? "review" : newStage === "analysis" ? "backlog" : "in-progress"
      };
      if (newStage === "completed") {
        updates.progress = 100;
        confetti({ particleCount: 70, spread: 60 });
      }
      await api.updateProject(projectId, updates);
      showToast({
        title: "Lifecycle Stage Updated",
        message: `Project transitioned to ${newStage.toUpperCase()} stage.`,
        type: "info"
      });
      onReload();
    } catch (err) {
      showToast({
        title: "Failed to update stage",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleOpenRating = (proj) => {
    setActiveProjectForRating(proj);
    setSelectedRating(proj.rating || 5);
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectForRating) return;
    try {
      await api.rateProject(activeProjectForRating.id, selectedRating);
      showToast({
        title: "Quality Review Recorded ⭐",
        message: `Awarded ${selectedRating} stars to '${activeProjectForRating.name}'.`,
        type: "success"
      });
      setIsRatingModalOpen(false);
      onReload();
    } catch (err) {
      showToast({
        title: "Rating Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleOpenFiles = (proj) => {
    setActiveProjectForFiles(proj);
    setIsFilesModalOpen(true);
    setUploadDocName("");
    setUploadedFile(null);
  };

  const handleUploadFileSubmit = (e) => {
    e.preventDefault();
    if (!uploadDocName.trim() && !uploadedFile) return;

    const fileName = uploadDocName.trim() || uploadedFile?.name || "Project_Specification.pdf";
    const fileSize = uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB` : "2.4 MB";
    const ext = fileName.split(".").pop().toLowerCase();

    const newDoc = {
      id: `f_${Date.now()}`,
      name: fileName,
      size: fileSize,
      date: new Date().toISOString().split("T")[0],
      type: ext
    };

    const projId = activeProjectForFiles.id;
    const existing = projectFilesMap[projId] || [];
    setProjectFilesMap({
      ...projectFilesMap,
      [projId]: [newDoc, ...existing]
    });

    showToast({
      title: "Document Attached 📎",
      message: `'${fileName}' saved to ${activeProjectForFiles.name} repository.`,
      type: "success"
    });

    setUploadDocName("");
    setUploadedFile(null);
  };

  const handleDeleteFile = (fileId) => {
    if (!activeProjectForFiles) return;
    const projId = activeProjectForFiles.id;
    const updated = (projectFilesMap[projId] || []).filter((f) => f.id !== fileId);
    setProjectFilesMap({
      ...projectFilesMap,
      [projId]: updated
    });
    showToast({
      title: "File Removed",
      message: "Document deleted from project repository.",
      type: "info"
    });
  };

  const handleDownloadFile = (file) => {
    showToast({
      title: "Downloading Document 📥",
      message: `Fetching '${file.name}' from secure enterprise cloud storage.`,
      type: "success"
    });
  };

  return (
    <div className="page-projects-container animate-fade-in">
      {/* Header Toolbar */}
      <div className="section-toolbar-card">
        <div className="flex-col gap-1">
          <div className="flex-row items-center gap-2">
            <h3 className="card-title">Enterprise Software Projects & Multi-Team Pipeline</h3>
            <span className="badge badge-primary font-mono text-xs">Enterprise Workflow</span>
          </div>
          <p className="card-subtitle">
            Lifecycle tracking: System Analysis ➔ Frontend & Backend Dev ➔ QA Testing Verification ➔ Production Live
          </p>
        </div>

        <div className="flex-row items-center gap-3 flex-wrap">
          {/* View Mode Switcher: Pipeline vs Group-wise */}
          <div className="project-view-switcher">
            <button
              type="button"
              className={`view-switcher-btn ${activeViewMode === "pipeline" ? "active" : ""}`}
              onClick={() => setActiveViewMode("pipeline")}
              title="Kanban Stages: Analysis ➔ Dev ➔ Testing ➔ Live"
            >
              <Layers size={14} />
              <span>Lifecycle Pipeline</span>
            </button>
            <button
              type="button"
              className={`view-switcher-btn ${activeViewMode === "groups" ? "active" : ""}`}
              onClick={() => setActiveViewMode("groups")}
              title="Group-wise view: Analysis Team, Frontend, Backend, QA Testing Team"
            >
              <Users size={14} />
              <span>Group-Wise Teams</span>
            </button>
          </div>

          <div className="kanban-summary-pill font-mono">
            <button
              type="button"
              className={`summary-pill-btn ${stageFilter === "all" ? "active font-bold" : ""}`}
              onClick={() => setStageFilter("all")}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 4px" }}
              title="Filter All Projects"
            >
              {projects.length} Total
            </button>
            <span>•</span>
            <button
              type="button"
              className={`summary-pill-btn text-warning font-semibold ${stageFilter === "testing" ? "underline" : ""}`}
              onClick={() => setStageFilter("testing")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
              title="Filter Projects in QA Testing"
            >
              {projects.filter((p) => getProjectStage(p) === "testing").length} In QA Testing 🧪
            </button>
            <span>•</span>
            <button
              type="button"
              className={`summary-pill-btn text-success font-semibold ${stageFilter === "completed" ? "underline" : ""}`}
              onClick={() => setStageFilter("completed")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
              title="Filter Live Deployed Projects"
            >
              {projects.filter((p) => getProjectStage(p) === "completed").length} Live 🚀
            </button>
          </div>

          {isManager() && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsNewModalOpen(true)}>
              <Plus size={16} />
              <span>Initialize Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="project-filters-row">
        <div className="project-search-wrap">
          <Search size={15} className="project-search-icon" />
          <input
            type="text"
            className="form-input project-search-input"
            placeholder="Search projects, lead, testing team (e.g. Karthik, Shalini)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          {searchFilter && (
            <button className="btn-icon-xs text-muted" onClick={() => setSearchFilter("")}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex-row items-center gap-2 flex-wrap">
          <div className="flex-row items-center gap-1 text-xs text-muted">
            <Filter size={13} />
            <span>Stage:</span>
          </div>
          <div className="filter-chips-scroll">
            <button
              className={`filter-chip ${stageFilter === "all" ? "active" : ""}`}
              onClick={() => setStageFilter("all")}
            >
              All Stages ({projects.length})
            </button>
            {STAGES.map((s) => {
              const count = projects.filter((p) => getProjectStage(p) === s.id).length;
              return (
                <button
                  key={s.id}
                  className={`filter-chip ${stageFilter === s.id ? "active" : ""}`}
                  onClick={() => setStageFilter(s.id)}
                >
                  <span>{s.icon} {s.label.split(" ")[0]}</span>
                  <span className="chip-count font-mono">{count}</span>
                </button>
              );
            })}
          </div>

          <select
            className="form-select text-xs py-1 px-2"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: LIFECYCLE PIPELINE (KANBAN COLUMNS) */}
      {activeViewMode === "pipeline" && (
        <div className="kanban-board-grid">
          {STAGES.map((stage) => {
            const stageProjects = filteredProjects.filter((p) => getProjectStage(p) === stage.id);

            return (
              <div key={stage.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="col-header-left">
                    <span className={`col-indicator col-indicator-${stage.badgeClass}`} />
                    <h4 className="col-title flex-row items-center gap-1.5">
                      <span>{stage.icon}</span>
                      <span>{stage.label}</span>
                    </h4>
                  </div>
                  <span className="col-count-badge font-mono">{stageProjects.length}</span>
                </div>

                <div className="kanban-cards-stack">
                  {stageProjects.length === 0 ? (
                    <div className="kanban-empty-dropzone">
                      <span>No deliverables currently in {stage.label}</span>
                    </div>
                  ) : (
                    stageProjects.map((proj) => {
                      const filesCount = (projectFilesMap[proj.id] || []).length;
                      const curStage = getProjectStage(proj);
                      const isTesting = curStage === "testing";
                      const isDev = curStage === "development";
                      const isLive = curStage === "completed";

                      const lead = proj.lead_name || proj.assigned_employee_name?.split("(")[0]?.trim() || "Aravind";
                      const feList = ensureArray(proj.frontend_team, ["Shalini Sundaram"]);
                      const beList = ensureArray(proj.backend_team, ["Manoj Mudaliar"]);
                      const qaList = ensureArray(proj.testing_team, ["Karthik Sundaram"]);

                      return (
                        <div key={proj.id} className={`kanban-project-card animate-scale-up ${isTesting ? "is-qa-testing-card" : ""}`}>
                          {/* Top Row: Priority & Actions */}
                          <div className="card-top-row">
                            <span className={`priority-tag priority-${String(proj.priority || "Medium").toLowerCase()}`}>
                              {proj.priority || "Medium"}
                            </span>

                            {/* Testing Active Pill */}
                            {isTesting && (
                              <span className="qa-active-badge animate-pulse">
                                🧪 QA Testing Active
                              </span>
                            )}

                            <div className="card-actions-wrapper">
                              <button
                                className="btn-icon-xs text-primary"
                                onClick={() => handleOpenFiles(proj)}
                                title="Project Architecture & Specifications"
                              >
                                <Paperclip size={13} />
                                {filesCount > 0 && <span className="card-file-count">{filesCount}</span>}
                              </button>

                              <button
                                className="btn-icon-xs text-warning"
                                onClick={() => handleOpenRating(proj)}
                                title="Rate Engineering Quality"
                              >
                                <Star size={14} className={proj.rating ? "fill-warning text-warning" : ""} />
                              </button>

                              {isManager() && (
                                <button
                                  className="btn-icon-xs text-danger"
                                  onClick={() => handleDeleteProject(proj)}
                                  title="Delete Project"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <h5 className="kanban-card-title">{proj.name}</h5>
                          <p className="kanban-card-desc">{proj.description}</p>

                          {/* Visual Stage Stepper Bar */}
                          <div className="stage-mini-stepper">
                            <div className={`step-node ${["analysis", "development", "testing", "completed"].includes(curStage) ? "done" : ""}`} title="1. Analysis">
                              <span>1</span>
                            </div>
                            <div className={`step-line ${["development", "testing", "completed"].includes(curStage) ? "done" : ""}`} />
                            <div className={`step-node ${["development", "testing", "completed"].includes(curStage) ? "done" : ""}`} title="2. Development">
                              <span>2</span>
                            </div>
                            <div className={`step-line ${["testing", "completed"].includes(curStage) ? "done" : ""}`} />
                            <div className={`step-node ${["testing", "completed"].includes(curStage) ? "done current" : ""}`} title="3. QA Testing">
                              <span>3</span>
                            </div>
                            <div className={`step-line ${curStage === "completed" ? "done" : ""}`} />
                            <div className={`step-node ${curStage === "completed" ? "done current" : ""}`} title="4. Live Production">
                              <span>4</span>
                            </div>
                          </div>

                          {/* Multi-Team Assignments Matrix */}
                          <div className="project-teams-matrix">
                            <div className="team-row">
                              <span className="team-role-tag role-lead">👑 Lead Analyst:</span>
                              <span className="team-names-val">{lead}</span>
                            </div>

                            <div className="team-row">
                              <span className="team-role-tag role-fe">🎨 Frontend:</span>
                              <span className="team-names-val">{feList.join(", ")}</span>
                            </div>

                            <div className="team-row">
                              <span className="team-role-tag role-be">⚙️ Backend:</span>
                              <span className="team-names-val">{beList.join(", ")}</span>
                            </div>

                            {/* Testing Team Highlighted */}
                            <div className={`team-row ${isTesting ? "highlight-testing" : ""}`}>
                              <span className="team-role-tag role-qa">🧪 QA & Testing:</span>
                              <span className="team-names-val font-semibold text-warning-light">
                                {qaList.join(", ")}
                              </span>
                            </div>
                          </div>

                          {/* If in QA Testing, show Test Status Checklist Box */}
                          {isTesting && (
                            <div className="qa-test-status-box">
                              <div className="flex-row items-center justify-between text-xs font-mono">
                                <span>🧪 QA Test Suite:</span>
                                <span className="text-success font-bold">44 / 48 Passed (92%)</span>
                              </div>
                              <div className="progress-track mt-1">
                                <div className="progress-fill fill-warning" style={{ width: "92%" }} />
                              </div>
                              <div className="qa-testing-notice text-xs text-muted mt-1">
                                Assigned to <strong>{qaList[0]}</strong> for security & API stress testing.
                              </div>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="kanban-progress-box">
                            <div className="progress-labels">
                              <span>Overall Progress</span>
                              <span className="font-mono">{proj.progress || 0}%</span>
                            </div>
                            <div className="progress-track">
                              <div
                                className={`progress-fill ${proj.progress >= 90 ? "fill-success" : isTesting ? "fill-warning" : "fill-primary"}`}
                                style={{ width: `${proj.progress || 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer with Due Date & Document Attachment */}
                          <div className="kanban-card-footer">
                            <button
                              type="button"
                              className="kanban-doc-pill"
                              onClick={() => handleOpenFiles(proj)}
                            >
                              <FileText size={11} />
                              <span>{filesCount > 0 ? `${filesCount} Files` : "Attach File"}</span>
                            </button>

                            {proj.end_date && (
                              <div className="kanban-due-date font-mono">
                                <Clock size={11} />
                                <span>{new Date(proj.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                              </div>
                            )}
                          </div>

                          {/* Workflow Stage Transitions Bar */}
                          <div className="kanban-workflow-actions">
                            {/* If in Development -> Button to Send to Testing */}
                            {isDev && (
                              <button
                                type="button"
                                className="btn-workflow btn-workflow-testing"
                                onClick={() => handleForwardToTesting(proj)}
                                title="Frontend/Backend complete -> Send to QA Testing Team"
                              >
                                <span>Send to Testing 🧪</span>
                                <ArrowRight size={13} />
                              </button>
                            )}

                            {/* If in QA Testing -> Pass or Flag Bug */}
                            {isTesting && (
                              <div className="flex-row items-center gap-2 w-full">
                                <button
                                  type="button"
                                  className="btn-workflow btn-workflow-pass flex-1"
                                  onClick={() => handlePassTesting(proj)}
                                  title="QA Passed -> Deploy to Production Live"
                                >
                                  <span>Pass QA & Deploy 🚀</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-workflow btn-workflow-bug"
                                  onClick={() => handleFlagBugBackToDev(proj)}
                                  title="Flag bug and return to Frontend/Backend Devs"
                                >
                                  <span>Bug ⚠️</span>
                                </button>
                              </div>
                            )}

                            {/* Quick Stage Jump Buttons */}
                            <div className="kanban-move-bar">
                              <span className="move-lbl">Shift:</span>
                              <div className="move-btns">
                                {curStage !== "analysis" && (
                                  <button className="move-btn" onClick={() => handleMoveStatus(proj.id, "analysis")}>
                                    Analysis
                                  </button>
                                )}
                                {curStage !== "development" && (
                                  <button className="move-btn" onClick={() => handleMoveStatus(proj.id, "development")}>
                                    Dev
                                  </button>
                                )}
                                {curStage !== "testing" && (
                                  <button className="move-btn" onClick={() => handleMoveStatus(proj.id, "testing")}>
                                    Testing
                                  </button>
                                )}
                                {curStage !== "completed" && (
                                  <button className="move-btn move-btn-complete" onClick={() => handleMoveStatus(proj.id, "completed")}>
                                    Live ✓
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: GROUP-WISE DEPARTMENT BREAKDOWN VIEW */}
      {activeViewMode === "groups" && (
        <div className="groups-breakdown-container space-y-6">
          {/* Group 1: Analysis & Architecture Team */}
          <div className="group-department-card">
            <div className="group-card-header header-analysis">
              <div className="flex-row items-center gap-2">
                <span className="group-icon">📋</span>
                <div>
                  <h4 className="group-title">Analysis & System Architecture Group</h4>
                  <p className="group-desc">Led by Principal Architects — Requirement Gathering, Tech Stacks & PRD Definition</p>
                </div>
              </div>
              <span className="badge badge-secondary font-mono">
                {filteredProjects.filter((p) => getProjectStage(p) === "analysis").length} Active Projects
              </span>
            </div>

            <div className="group-projects-grid">
              {filteredProjects
                .filter((p) => getProjectStage(p) === "analysis" || p.current_stage === "analysis")
                .map((proj) => (
                  <div key={proj.id} className="group-item-card">
                    <div className="flex-row items-center justify-between mb-2">
                      <span className="font-bold text-sm text-primary-light">{proj.name}</span>
                      <div className="flex-row items-center gap-1.5">
                        <span className={`priority-tag priority-${String(proj.priority || 'Medium').toLowerCase()}`}>
                          {proj.priority || "Medium"}
                        </span>
                        {isManager() && (
                          <button
                            type="button"
                            className="btn-icon-xs text-danger"
                            onClick={() => handleDeleteProject(proj)}
                            title="Delete Project"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-secondary line-clamp-2 mb-3">{proj.description}</p>
                    <div className="text-xs text-muted space-y-1 mb-3">
                      <div>👑 <strong>Lead Architect:</strong> {proj.lead_name || "Aravind Swaminathan"}</div>
                      <div>📅 <strong>Sprint Target:</strong> {proj.end_date || "2026-12-31"}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-xs w-full"
                      onClick={() => handleMoveStatus(proj.id, "development")}
                    >
                      Analysis Complete ➔ Hand over to Dev
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Group 2: Frontend Engineering Group */}
          <div className="group-department-card">
            <div className="group-card-header header-frontend">
              <div className="flex-row items-center gap-2">
                <span className="group-icon">🎨</span>
                <div>
                  <h4 className="group-title">Frontend Engineering & UI/UX Group</h4>
                  <p className="group-desc">Design System, React Client, Responsive Layouts & Micro-interactions</p>
                </div>
              </div>
              <span className="badge badge-primary font-mono">
                {filteredProjects.filter((p) => getProjectStage(p) === "development").length} Active in Dev
              </span>
            </div>

            <div className="group-projects-grid">
              {filteredProjects
                .filter((p) => getProjectStage(p) === "development")
                .map((proj) => (
                  <div key={proj.id} className="group-item-card">
                    <div className="flex-row items-center justify-between mb-2">
                      <span className="font-bold text-sm text-cyan">{proj.name}</span>
                      <div className="flex-row items-center gap-2">
                        <span className="font-mono text-xs">{proj.progress || 50}%</span>
                        {isManager() && (
                          <button
                            type="button"
                            className="btn-icon-xs text-danger"
                            onClick={() => handleDeleteProject(proj)}
                            title="Delete Project"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted mb-2">
                      🎨 <strong>Frontend Engineers:</strong> {ensureArray(proj.frontend_team, ["Meera Krishnan", "Shalini"]).join(", ")}
                    </div>
                    <div className="progress-track mb-3">
                      <div className="progress-fill fill-primary" style={{ width: `${proj.progress || 50}%` }} />
                    </div>
                    <button
                      type="button"
                      className="btn btn-warning btn-xs w-full"
                      onClick={() => handleForwardToTesting(proj)}
                    >
                      Frontend Ready ➔ Send to Testing 🧪
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Group 3: Backend & Database Engineering Group */}
          <div className="group-department-card">
            <div className="group-card-header header-backend">
              <div className="flex-row items-center gap-2">
                <span className="group-icon">⚙️</span>
                <div>
                  <h4 className="group-title">Backend & Database Infrastructure Group</h4>
                  <p className="group-desc">Neon PostgreSQL Schema, Express Microservices, Secure Auth & REST APIs</p>
                </div>
              </div>
              <span className="badge badge-secondary font-mono">
                {filteredProjects.filter((p) => getProjectStage(p) === "development").length} Services Building
              </span>
            </div>

            <div className="group-projects-grid">
              {filteredProjects
                .filter((p) => getProjectStage(p) === "development")
                .map((proj) => (
                  <div key={proj.id} className="group-item-card">
                    <div className="flex-row items-center justify-between mb-2">
                      <span className="font-bold text-sm text-indigo-300">{proj.name}</span>
                      <div className="flex-row items-center gap-2">
                        <span className="badge badge-xs badge-secondary font-mono">PostgreSQL</span>
                        {isManager() && (
                          <button
                            type="button"
                            className="btn-icon-xs text-danger"
                            onClick={() => handleDeleteProject(proj)}
                            title="Delete Project"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted mb-3">
                      ⚙️ <strong>Backend Team:</strong> {ensureArray(proj.backend_team, ["Manoj Mudaliar", "Dhanush"]).join(", ")}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs w-full"
                      onClick={() => handleForwardToTesting(proj)}
                    >
                      APIs Integrated ➔ Forward to QA Team 🧪
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Group 4: QA & Testing Verification Group (Crucial requirement!) */}
          <div className="group-department-card group-testing-highlight">
            <div className="group-card-header header-testing">
              <div className="flex-row items-center gap-2">
                <span className="group-icon">🧪</span>
                <div>
                  <h4 className="group-title text-warning-light">QA & Testing Engineering Team</h4>
                  <p className="group-desc">
                    Comprehensive Quality Assurance, End-to-End Test Automation, Security Audit & Regression
                  </p>
                </div>
              </div>
              <span className="badge badge-warning font-mono">
                {filteredProjects.filter((p) => getProjectStage(p) === "testing").length} Projects in Testing
              </span>
            </div>

            <div className="group-projects-grid">
              {filteredProjects
                .filter((p) => getProjectStage(p) === "testing")
                .map((proj) => (
                  <div key={proj.id} className="group-item-card card-testing-active">
                    <div className="flex-row items-center justify-between mb-2">
                      <span className="font-bold text-sm text-warning-light">{proj.name}</span>
                      <div className="flex-row items-center gap-2">
                        <span className="qa-active-badge">🧪 In Testing</span>
                        {isManager() && (
                          <button
                            type="button"
                            className="btn-icon-xs text-danger"
                            onClick={() => handleDeleteProject(proj)}
                            title="Delete Project"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted mb-2">
                      🧪 <strong>Assigned QA Specialists:</strong>{" "}
                      <span className="text-white font-semibold">
                        {ensureArray(proj.testing_team, ["Karthik Sundaram", "Priya Sharma"]).join(", ")}
                      </span>
                    </div>
                    <div className="qa-test-status-box mb-3">
                      <div className="flex-row items-center justify-between text-xs font-mono">
                        <span>Automated Test Cases:</span>
                        <span className="text-success font-bold">Passed 44 / 48 (92%)</span>
                      </div>
                    </div>
                    <div className="flex-row items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-success btn-xs flex-1"
                        onClick={() => handlePassTesting(proj)}
                      >
                        ✓ Pass Testing & Deploy
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => handleFlagBugBackToDev(proj)}
                      >
                        Bug ⚠️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Group 5: Delivered & Live Production */}
          <div className="group-department-card">
            <div className="group-card-header header-live">
              <div className="flex-row items-center gap-2">
                <span className="group-icon">🚀</span>
                <div>
                  <h4 className="group-title text-success">Live Production & Delivered Systems</h4>
                  <p className="group-desc">100% Tested, Deployed to Cloud and Monitored within Enterprise SLA</p>
                </div>
              </div>
              <span className="badge badge-success font-mono">
                {filteredProjects.filter((p) => getProjectStage(p) === "completed").length} Live
              </span>
            </div>

            <div className="group-projects-grid">
              {filteredProjects
                .filter((p) => getProjectStage(p) === "completed")
                .map((proj) => (
                  <div key={proj.id} className="group-item-card">
                    <div className="flex-row items-center justify-between mb-2">
                      <span className="font-bold text-sm text-success">{proj.name}</span>
                      <div className="flex-row items-center gap-2">
                        <span className="text-warning text-xs">{"★".repeat(proj.rating || 5)}</span>
                        {isManager() && (
                          <button
                            type="button"
                            className="btn-icon-xs text-danger"
                            onClick={() => handleDeleteProject(proj)}
                            title="Delete Project"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-secondary line-clamp-2 mb-2">{proj.description}</p>
                    <div className="text-xs text-muted">
                      <div>👑 <strong>Lead:</strong> {proj.lead_name || "Dhanush Murugan"}</div>
                      <div>🧪 <strong>Verified By QA:</strong> {ensureArray(proj.testing_team, ["Karthik"]).join(", ")}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Project Files Upload & Documentation Modal */}
      {isFilesModalOpen && activeProjectForFiles && (
        <Modal
          isOpen={isFilesModalOpen}
          onClose={() => setIsFilesModalOpen(false)}
          title={`Project Repository: ${activeProjectForFiles.name}`}
          maxWidth="680px"
        >
          <div className="project-files-modal-content space-y-4">
            <p className="text-secondary text-sm">
              Upload architecture specifications, wireframes, QA test reports, and source bundles.
            </p>

            <form onSubmit={handleUploadFileSubmit} className="file-upload-card">
              <div className="file-drop-area">
                <UploadCloud size={32} className="text-primary" />
                <div>
                  <h4 className="file-drop-title">Upload Project Documentation</h4>
                  <p className="file-drop-sub">Drag & drop or select files (PDF, DOCX, ZIP, JSON, PNG)</p>
                </div>
                <input
                  type="file"
                  id="project-file-input"
                  className="file-input-hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadedFile(f);
                      setUploadDocName(f.name);
                    }
                  }}
                />
                <label htmlFor="project-file-input" className="btn btn-secondary btn-sm">
                  Browse Files
                </label>
              </div>

              {uploadDocName && (
                <div className="file-upload-staging">
                  <div className="flex-row items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <input
                      type="text"
                      className="form-input flex-1 text-sm py-1"
                      value={uploadDocName}
                      onChange={(e) => setUploadDocName(e.target.value)}
                      placeholder="Document title..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Upload to Repository
                  </button>
                </div>
              )}
            </form>

            <div className="project-documents-list">
              <h4 className="text-xs font-bold text-muted tracking-wider uppercase mb-2">
                Attached Documents ({(projectFilesMap[activeProjectForFiles.id] || []).length})
              </h4>

              {(projectFilesMap[activeProjectForFiles.id] || []).length === 0 ? (
                <div className="text-center py-6 text-muted text-sm border border-dashed rounded-lg">
                  No files uploaded for this project yet. Use the upload area above.
                </div>
              ) : (
                <div className="space-y-2">
                  {(projectFilesMap[activeProjectForFiles.id] || []).map((file) => (
                    <div key={file.id} className="project-file-item">
                      <div className="flex-row items-center gap-3 overflow-hidden">
                        <div className="file-ext-badge font-mono">
                          {file.type ? file.type.toUpperCase() : "DOC"}
                        </div>
                        <div className="overflow-hidden">
                          <div className="file-item-name truncate">{file.name}</div>
                          <div className="file-item-meta font-mono">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>Uploaded {file.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-row items-center gap-2">
                        <button
                          className="btn-icon-xs text-primary"
                          onClick={() => handleDownloadFile(file)}
                          title="Download Document"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn-icon-xs text-danger"
                          onClick={() => handleDeleteFile(file.id)}
                          title="Delete Document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => setIsFilesModalOpen(false)}
              >
                Close Repository
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Project Modal with Multi-Team Assignments */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Initialize Enterprise Software Project"
        maxWidth="720px"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. AI-Powered Customer Intelligence Suite"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Project Objective & Architecture Scope</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Microservices architecture, PostgreSQL schema, compliance requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Multi-Team Assignments Grid */}
          <div className="p-3 bg-subtle rounded-lg border border-subtle space-y-3">
            <h4 className="text-xs font-bold text-primary-light uppercase tracking-wider">
              👥 Company Multi-Team Assignment Matrix
            </h4>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">👑 Lead Analyst / Architect *</label>
                <select
                  className="form-select"
                  value={formData.lead_name}
                  onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                >
                  {employees.map((emp) => (
                    <option key={`lead-${emp.id}`} value={emp.name}>
                      {emp.name} ({emp.designation || "Architect"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">🧪 QA & Testing Specialist *</label>
                <select
                  className="form-select"
                  value={formData.testing_team[0] || ""}
                  onChange={(e) => setFormData({ ...formData, testing_team: [e.target.value] })}
                >
                  {employees.map((emp) => (
                    <option key={`qa-${emp.id}`} value={emp.name}>
                      {emp.name} ({emp.designation || "QA Specialist"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">🎨 Frontend Engineers</label>
                <select
                  className="form-select"
                  value={formData.frontend_team[0] || ""}
                  onChange={(e) => setFormData({ ...formData, frontend_team: [e.target.value] })}
                >
                  {employees.map((emp) => (
                    <option key={`fe-${emp.id}`} value={emp.name}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">⚙️ Backend & API Engineers</label>
                <select
                  className="form-select"
                  value={formData.backend_team[0] || ""}
                  onChange={(e) => setFormData({ ...formData, backend_team: [e.target.value] })}
                >
                  {employees.map((emp) => (
                    <option key={`be-${emp.id}`} value={emp.name}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Stage</label>
              <select
                className="form-select"
                value={formData.current_stage}
                onChange={(e) => {
                  const stage = e.target.value;
                  setFormData({
                    ...formData,
                    current_stage: stage,
                    status: stage === "analysis" ? "backlog" : stage === "testing" ? "review" : stage === "completed" ? "completed" : "in-progress"
                  });
                }}
              >
                <option value="analysis">📋 Analysis & Architecture</option>
                <option value="development">💻 Frontend & Backend Dev</option>
                <option value="testing">🧪 QA & Testing Verification</option>
                <option value="completed">🚀 Live Production</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Budget Allocation</label>
              <input
                type="text"
                className="form-input"
                placeholder="₹15,00,000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Completion Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Initialize Project & Dispatch Roles
            </button>
          </div>
        </form>
      </Modal>

      {/* Rating Modal */}
      <Modal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        title="Rate Project Quality & Velocity"
        maxWidth="450px"
      >
        <form onSubmit={handleRatingSubmit} className="space-y-4">
          <p className="text-secondary text-sm">
            Rate the engineering execution for <strong>{activeProjectForRating?.name}</strong>.
          </p>

          <div className="flex-row justify-center gap-3 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="btn-icon"
                onClick={() => setSelectedRating(star)}
              >
                <Star
                  size={28}
                  className={star <= selectedRating ? "fill-warning text-warning" : "text-muted"}
                />
              </button>
            ))}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRatingModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Quality Rating
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
