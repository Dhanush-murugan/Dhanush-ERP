import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Grid,
  List,
  Mail,
  Phone,
  Building,
  Shield,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Star,
  MapPin,
  CreditCard,
  Briefcase,
  Key,
  FileSpreadsheet
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

export default function Employees({
  employees = [],
  departments = [],
  onReload,
  openAddDirectly = false
}) {
  const { isManager, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  const [isAddModalOpen, setIsAddModalOpen] = useState(openAddDirectly);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    employee_code: "",
    name: "",
    email: "",
    password: "Password@123",
    role: "employee",
    department_name: "Engineering & IT",
    designation: "",
    phone: "",
    salary: "",
    aadhaar_no: "",
    address: "",
    status: "active"
  });

  const handleOpenAdd = () => {
    setFormData({
      employee_code: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      name: "",
      email: "",
      password: "Password@123",
      role: "employee",
      department_name: "Engineering & IT",
      designation: "Software Engineer",
      phone: "+91 ",
      salary: "65000",
      aadhaar_no: "",
      address: "Chennai, Tamil Nadu",
      status: "active"
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setActiveEmployee(emp);
    setFormData({
      employee_code: emp.employee_code || `EMP${emp.id}`,
      name: emp.name || "",
      email: emp.email || "",
      password: "password123",
      role: emp.role || "employee",
      department_name: emp.department_name || "Engineering & IT",
      designation: emp.designation || "",
      phone: emp.phone || "",
      salary: String(emp.salary || ""),
      aadhaar_no: emp.aadhaar_no || "",
      address: emp.address || "",
      status: emp.status || "active"
    });
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const handleOpenProfile = (emp) => {
    setActiveEmployee(emp);
    setIsProfileModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addEmployee(formData);
      showToast({
        title: "Employee Onboarded!",
        message: `${formData.name} added to the ERP directory.`,
        type: "success"
      });
      setIsAddModalOpen(false);
      onReload();
    } catch (err) {
      showToast({
        title: "Action Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeEmployee) return;
    try {
      await api.updateEmployee(activeEmployee.id, formData);
      showToast({
        title: "Profile Updated",
        message: `Changes saved for ${formData.name}.`,
        type: "success"
      });
      setIsEditModalOpen(false);
      onReload();
    } catch (err) {
      showToast({
        title: "Update Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleToggleStatus = async (emp) => {
    try {
      await api.toggleEmployeeStatus(emp.id);
      showToast({
        title: "Status Updated",
        message: `${emp.name} is now ${emp.status === "active" ? "Inactive" : "Active"}.`,
        type: "info"
      });
      onReload();
    } catch (err) {
      showToast({
        title: "Action Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee Code",
      "Full Name",
      "Official Email",
      "Access Role",
      "Designation",
      "Department",
      "Monthly Salary (INR)",
      "Status",
      "Mobile Phone",
      "Date of Joining",
      "Aadhaar Number",
      "Residential Address"
    ];

    const escapeCsv = (val) => {
      const str = String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = employees.map((e) =>
      [
        escapeCsv(e.employee_code || `EMP${e.id}`),
        escapeCsv(e.name),
        escapeCsv(e.email),
        escapeCsv(e.role),
        escapeCsv(e.designation),
        escapeCsv(e.department_name || "Engineering"),
        escapeCsv(e.salary || 0),
        escapeCsv(e.status || "active"),
        escapeCsv(e.phone),
        escapeCsv(e.joining_date),
        escapeCsv(e.aadhaar_no),
        escapeCsv(e.address)
      ].join(",")
    );

    // UTF-8 BOM (\uFEFF) forces Microsoft Excel on Windows to open in correct columns without encoding issues
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Dhanush_Softwares_Employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: "Excel / CSV Downloaded! 📊",
      message: `Exported ${employees.length} employee records to Excel-ready CSV.`,
      type: "success"
    });
  };

  // Filtering & Strict Employee ID Order (EMP001 -> EMP100)
  const filtered = employees
    .filter((emp) => {
      const matchesSearch =
        emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(search.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(search.toLowerCase());

      const matchesDept =
        selectedDept === "all" ||
        emp.department_name?.toLowerCase() === selectedDept.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" ||
        emp.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    })
    .sort((a, b) => {
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      if (idA !== idB) return idA - idB;
      return (a.employee_code || "").localeCompare(b.employee_code || "", undefined, { numeric: true });
    });

  return (
    <div className="page-employees-container animate-fade-in">
      {/* Top Controls Row */}
      <div className="section-toolbar-card">
        <div className="toolbar-left-group">
          {/* Search Box */}
          <div className="input-with-icon search-input-box">
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input search-control"
              placeholder="Search by name, role, email, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <select
            className="form-select filter-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-select filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Staff</option>
            <option value="inactive">Inactive Staff</option>
          </select>
        </div>

        <div className="toolbar-right-group">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid Card View"
            >
              <Grid size={16} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table List View"
            >
              <List size={16} />
            </button>
          </div>

          {/* Export CSV */}
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          {/* Add Employee Button */}
          {isManager() && (
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Employees Count Header */}
      <div className="results-count-bar">
        <span>Showing <strong>{filtered.length}</strong> of <strong>{employees.length}</strong> enterprise members</span>
        <div className="results-tags">
          {selectedDept !== "all" && <span className="filter-pill">{selectedDept}</span>}
          {selectedStatus !== "all" && <span className="filter-pill">{selectedStatus}</span>}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="employees-grid">
          {filtered.map((emp) => (
            <div key={emp.id} className="employee-card animate-fade-in">
              <div className="emp-card-header">
                <div className="emp-card-avatar-wrapper">
                  <div className="emp-card-avatar">
                    {emp.name ? emp.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className={`emp-presence-dot dot-${emp.status === "active" ? "active" : "inactive"}`} />
                </div>

                <div className="emp-card-actions">
                  <button
                    className="emp-icon-action"
                    onClick={() => handleOpenProfile(emp)}
                    title="View Profile Details"
                  >
                    <Eye size={15} />
                  </button>
                  {isManager() && (
                    <button
                      className="emp-icon-action"
                      onClick={() => handleOpenEdit(emp)}
                      title="Edit Employee"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="emp-card-body">
                <h4 className="emp-card-name" onClick={() => handleOpenProfile(emp)}>
                  {emp.name}
                </h4>
                <div className="emp-card-code font-mono">{emp.employee_code || `EMP${emp.id}`}</div>
                <div className="emp-card-designation">{emp.designation || "Staff Member"}</div>
                <div className="emp-card-dept">
                  <Building size={13} />
                  <span>{emp.department_name || "Engineering & IT"}</span>
                </div>

                <div className="emp-card-meta-list">
                  <div className="meta-item">
                    <Mail size={13} />
                    <span>{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="meta-item">
                      <Phone size={13} />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="emp-card-footer">
                <div className="emp-role-badge-row">
                  <span className={`role-badge role-${String(emp.role || "employee").toLowerCase()}`}>
                    {emp.role || "Employee"}
                  </span>
                  <span className={`status-badge status-${emp.status === "active" ? "active" : "inactive"}`}>
                    {emp.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="emp-salary font-mono">
                  ₹{Number(emp.salary || 50000).toLocaleString("en-IN")}/mo
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="table-responsive-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Compensation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-mono text-muted">{emp.employee_code || `EMP${emp.id}`}</td>
                  <td>
                    <div className="table-user-cell" onClick={() => handleOpenProfile(emp)}>
                      <div className="table-user-avatar">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <strong className="table-user-name">{emp.name}</strong>
                        <div className="table-user-email">{emp.email} • {emp.designation}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dept-tag">{emp.department_name || "General"}</span>
                  </td>
                  <td>
                    <span className={`role-badge role-${emp.role || "employee"}`}>
                      {emp.role || "Employee"}
                    </span>
                  </td>
                  <td className="font-mono font-semibold">
                    ₹{Number(emp.salary || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span className={`status-pill status-${emp.status === "active" ? "active" : "inactive"}`}>
                      <span className="status-dot" />
                      {emp.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="table-action-btns">
                      <button
                        className="btn-icon-xs"
                        onClick={() => handleOpenProfile(emp)}
                        title="View Profile"
                      >
                        <Eye size={14} />
                      </button>
                      {isManager() && (
                        <button
                          className="btn-icon-xs"
                          onClick={() => handleOpenEdit(emp)}
                          title="Edit Details"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {isAdmin() && (
                        <button
                          className="btn-icon-xs text-warning"
                          onClick={() => handleToggleStatus(emp)}
                          title="Toggle Status"
                        >
                          {emp.status === "active" ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Employee"
        maxWidth="700px"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Anand Murugan"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employee Code *</label>
              <input
                type="text"
                className="form-input font-mono"
                required
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="EMP008"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Corporate Email Address *</label>
              <input
                type="email"
                className="form-input"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="anandkumar@gmail.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Portal Password *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Role Access</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR Director</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                type="text"
                className="form-input"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Full Stack Engineer"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Monthly Salary (CTC ₹)</label>
              <input
                type="number"
                className="form-input font-mono"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="75000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Contact</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Aadhaar Card No (Confidential)</label>
              <input
                type="text"
                className="form-input font-mono"
                value={formData.aadhaar_no}
                onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                placeholder="4521 8963 1245"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Chennai, Tamil Nadu"
              />
            </div>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm & Onboard Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Employee Record"
        maxWidth="700px"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {/* System Login & Access Credentials Card */}
          <div className="credentials-box-card">
            <div className="credentials-box-header">
              <Key size={14} className="text-primary" />
              <span>Portal Login & Security Credentials</span>
              <span className="credentials-code-tag font-mono">{formData.employee_code}</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">System Username / Email</label>
                <input
                  type="email"
                  className="form-input font-mono"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Portal Password
                  <span className="text-xs text-muted" style={{ marginLeft: "6px" }}>(Default: password123)</span>
                </label>
                <div className="input-with-action">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input font-mono"
                    value={formData.password}
                    placeholder="Enter new password to update"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                type="text"
                className="form-input"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR Director</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Monthly Salary (₹)</label>
              <input
                type="number"
                className="form-input font-mono"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Aadhaar Card No</label>
              <input
                type="text"
                className="form-input font-mono"
                value={formData.aadhaar_no}
                onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                placeholder="4521 8963 1245"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Chennai, Tamil Nadu"
              />
            </div>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Profile Detailed Drawer Modal */}
      {activeEmployee && (
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title={`Employee Dossier: ${activeEmployee.name}`}
          maxWidth="680px"
        >
          <div className="profile-detail-card">
            <div className="profile-header-strip">
              <div className="profile-avatar-large">
                {activeEmployee.name.charAt(0)}
              </div>
              <div className="profile-header-text">
                <h3>{activeEmployee.name}</h3>
                <p className="profile-header-role">{activeEmployee.designation || "Staff Specialist"}</p>
                <div className="profile-tags-row">
                  <span className="code-pill font-mono">{activeEmployee.employee_code || `EMP${activeEmployee.id}`}</span>
                  <span className={`role-badge role-${activeEmployee.role}`}>{activeEmployee.role}</span>
                  <span className={`status-badge status-${activeEmployee.status}`}>{activeEmployee.status}</span>
                </div>
              </div>
            </div>

            <div className="profile-info-sections">
              <div className="info-block">
                <h4><Briefcase size={15} /> Professional Profile</h4>
                <div className="info-keyval-grid">
                  <div>
                    <span className="lbl">Department</span>
                    <strong>{activeEmployee.department_name || "Engineering & IT"}</strong>
                  </div>
                  <div>
                    <span className="lbl">Joining Date</span>
                    <strong>{activeEmployee.joining_date || "2024-01-15"}</strong>
                  </div>
                  <div>
                    <span className="lbl">Corporate Email</span>
                    <strong>{activeEmployee.email}</strong>
                  </div>
                  <div>
                    <span className="lbl">Contact Number</span>
                    <strong>{activeEmployee.phone || "+91 98765 43210"}</strong>
                  </div>
                </div>
              </div>

              <div className="info-block">
                <h4><CreditCard size={15} /> Financial & Identity Records</h4>
                <div className="info-keyval-grid">
                  <div>
                    <span className="lbl">Monthly Gross CTC</span>
                    <strong className="text-success font-mono">₹{Number(activeEmployee.salary || 65000).toLocaleString("en-IN")}/mo</strong>
                  </div>
                  <div>
                    <span className="lbl">Aadhaar Card No</span>
                    <strong className="font-mono">{activeEmployee.aadhaar_no || "•••• •••• 8921"}</strong>
                  </div>
                  <div className="grid-col-span-2">
                    <span className="lbl">Registered Address</span>
                    <span>{activeEmployee.address || "14/A, Anna Nagar, Chennai, Tamil Nadu"}</span>
                  </div>
                </div>
              </div>

              <div className="info-block">
                <h4><Star size={15} className="text-warning" /> Performance & Standing</h4>
                <div className="profile-performance-row">
                  <div className="rating-pill">
                    <Star size={14} className="fill-warning text-warning" />
                    <strong>{activeEmployee.rating || "4.8"} / 5.0 Rating</strong>
                  </div>
                  <span className="text-secondary text-sm">
                    Reviewed by Executive Committee • Top Contributor
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-actions-row">
              <button className="btn btn-secondary" onClick={() => setIsProfileModalOpen(false)}>
                Close
              </button>
              {isManager() && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleOpenEdit(activeEmployee);
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
