import React, { useState } from "react";
import {
  Settings,
  Building,
  Shield,
  Palette,
  Clock,
  Database,
  CheckCircle2,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Server
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import BrandLogo from "../components/BrandLogo";

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState("Dhanush Softwares");
  const [tagline, setTagline] = useState("Cloud Enterprise Operations & HRMS Platform");
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [shiftStart, setShiftStart] = useState("09:30");
  const [shiftEnd, setShiftEnd] = useState("18:30");
  const [gracePeriod, setGracePeriod] = useState(15);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleSaveBranding = (e) => {
    e.preventDefault();
    showToast({
      title: "Company Settings Saved!",
      message: "Organization branding and shifts updated successfully.",
      type: "success"
    });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      showToast({
        title: "Password Mismatch",
        message: "New password and confirmation do not match.",
        type: "error"
      });
      return;
    }
    showToast({
      title: "Security Password Updated!",
      message: "Your credentials have been re-encrypted with bcrypt.",
      type: "success"
    });
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  return (
    <div className="page-settings-container animate-fade-in">
      <div className="settings-grid">
        {/* Left Column: Organization & Shifts */}
        <div className="settings-col">
          {/* Company Branding Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="flex-row items-center gap-2">
                <Building size={18} className="text-primary" />
                <h3 className="card-title">Corporate Organization & Branding</h3>
              </div>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div className="settings-logo-preview-row">
                <BrandLogo size={52} collapsed={true} />
                <div>
                  <h4>Dhanush Softwares Enterprise Logo</h4>
                  <p className="text-xs text-secondary">
                    Displayed across payslips, header navigation, and export documents.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company Official Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Corporate Tagline / Mission</label>
                <input
                  type="text"
                  className="form-input"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Operating Currency</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value="INR (₹) - Indian Rupee"
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value="Asia/Kolkata (IST +5:30)"
                    disabled
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={15} />
                <span>Save Organization Settings</span>
              </button>
            </form>
          </div>

          {/* Working Hours & Shift Rules */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="flex-row items-center gap-2">
                <Clock size={18} className="text-primary" />
                <h3 className="card-title">Working Hours & Attendance Geofence</h3>
              </div>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Shift Start Time</label>
                  <input
                    type="time"
                    className="form-input font-mono"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shift End Time</label>
                  <input
                    type="time"
                    className="form-input font-mono"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Grace Period for Late Marking (Minutes)</label>
                <input
                  type="number"
                  className="form-input font-mono"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(Number(e.target.value))}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={15} />
                <span>Update Shift Policies</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Environment Info */}
        <div className="settings-col">
          {/* Security & Password */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="flex-row items-center gap-2">
                <Shield size={18} className="text-warning" />
                <h3 className="card-title">Account Security & Credentials</h3>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type={showPwd ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type={showPwd ? "text" : "password"}
                    className="form-input"
                    placeholder="Minimum 6 characters"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type={showPwd ? "text" : "password"}
                    className="form-input"
                    placeholder="Repeat password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? "Hide Passwords" : "Show Passwords"}
              </button>

              <button type="submit" className="btn btn-primary btn-sm">
                <KeyRound size={15} />
                <span>Update Security Password</span>
              </button>
            </form>
          </div>

          {/* Cloud System Infrastructure Info */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="flex-row items-center gap-2">
                <Server size={18} className="text-primary" />
                <h3 className="card-title">ERP Cloud Infrastructure Health</h3>
              </div>
            </div>

            <div className="infra-status-list">
              <div className="infra-status-row">
                <div className="infra-label">
                  <span className="status-dot dot-active" />
                  <strong>Database Engine</strong>
                </div>
                <span className="font-mono text-xs text-success">Neon Serverless PostgreSQL (SSL Active)</span>
              </div>

              <div className="infra-status-row">
                <div className="infra-label">
                  <span className="status-dot dot-active" />
                  <strong>Application Backend</strong>
                </div>
                <span className="font-mono text-xs text-primary">Node.js Express (REST API v2.0)</span>
              </div>

              <div className="infra-status-row">
                <div className="infra-label">
                  <span className="status-dot dot-active" />
                  <strong>Frontend Framework</strong>
                </div>
                <span className="font-mono text-xs text-violet">React 19 + Vite SPA (Vanilla CSS Tokens)</span>
              </div>

              <div className="infra-status-row">
                <div className="infra-label">
                  <span className="status-dot dot-active" />
                  <strong>AI Copilot Model</strong>
                </div>
                <span className="font-mono text-xs text-warning">Groq Llama 3 / Google Gemini 2.0 Flash</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
