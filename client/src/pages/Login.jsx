import React, { useState } from "react";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  KeyRound,
  Eye,
  EyeOff,
  Users,
  FolderGit2,
  BadgeIndianRupee
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import BrandLogo from "../components/BrandLogo";

export default function Login() {
  const { login, loading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("dhanush@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast({
        title: "Required Fields",
        message: "Please enter your email and password.",
        type: "warning"
      });
      return;
    }

    try {
      const res = await login(email, password);
      showToast({
        title: `Welcome back, ${res.user?.name || "User"}! 👋`,
        message: "Logged into Dhanush Softwares ERP successfully.",
        type: "success"
      });
    } catch (err) {
      showToast({
        title: "Sign In Failed",
        message: err.message || "Invalid credentials. Please verify your password.",
        type: "error"
      });
    }
  };

  const fillQuickDemo = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword("123456");
    setLoading(true);
    try {
      await login(demoEmail, "123456");
      showToast({
        title: "Welcome to Dhanush Softwares ERP",
        message: `Signed in as ${demoRole}`,
        type: "success"
      });
    } catch (err) {
      showToast({
        title: "Sign In Error",
        message: err.message || "Invalid credentials.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    showToast({
      title: "Password Reset Link Dispatched",
      message: `If an account matches ${forgotEmail}, a secure password recovery link has been sent.`,
      type: "success"
    });
    setIsForgotModalOpen(false);
    setForgotEmail("");
  };

  return (
    <div className="login-page-container">
      {/* Dynamic Background Mesh */}
      <div className="login-bg-mesh" />
      <div className="login-bg-grid" />

      <div className="login-content-wrapper">
        {/* Left Side: Brand Visual & Value Pillars */}
        <div className="login-brand-panel animate-fade-in">
          <div className="login-brand-badge">
            <Sparkles size={16} />
            <span>Next-Generation Enterprise ERP v2.0</span>
          </div>

          <div className="login-hero-logo">
            <div className="login-orbital-graphic-container">
              <div className="graphic-circle-orbit login-orbit-size">
                <div className="graphic-node node-1" title="Workforce Management">
                  <Users size={16} />
                </div>
                <div className="graphic-node node-2" title="Sprint Projects & Agile">
                  <FolderGit2 size={16} />
                </div>
                <div className="graphic-node node-3" title="Payroll & Operations">
                  <BadgeIndianRupee size={16} />
                </div>
                <div className="graphic-center-logo">
                  <BrandLogo collapsed={true} size={46} />
                </div>
              </div>
            </div>
            <div className="login-brand-text-col">
              <h1 className="login-hero-title">Dhanush Softwares</h1>
              <p className="login-hero-tagline">Intelligent Enterprise Resource Planning</p>
            </div>
          </div>

          <h2 className="login-hero-headline">
            Powering High-Velocity Teams with Modern HRMS & AI Operations
          </h2>

          <div className="login-features-list">
            <div className="login-feature-item">
              <div className="feature-item-icon">
                <CheckCircle size={18} />
              </div>
              <div>
                <strong>Smart Attendance & Geofencing</strong>
                <p>Real-time clock-in with running shift counters & monthly presence heatmaps.</p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="feature-item-icon">
                <CheckCircle size={18} />
              </div>
              <div>
                <strong>Automated Payroll & Tax Engine</strong>
                <p>1-Click salary disbursements, statutory deductions, and printable official payslips.</p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="feature-item-icon">
                <CheckCircle size={18} />
              </div>
              <div>
                <strong>Interactive Agile Kanban & Projects</strong>
                <p>Milestone progress tracking, sprint task boards, and member ratings.</p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="feature-item-icon">
                <CheckCircle size={18} />
              </div>
              <div>
                <strong>Muruga AI Enterprise Copilot</strong>
                <p>Groq/Gemini-powered neural assistant for HR analytics, drafting notices & SQL queries.</p>
              </div>
            </div>
          </div>

          <div className="login-compliance-row">
            <ShieldCheck size={16} className="text-success" />
            <span>256-Bit SSL Encrypted • Neon PostgreSQL Cloud • Role-Based RBAC</span>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="login-card-panel animate-scale-up">
          <div className="login-card-header">
            <h3>Sign in to Dashboard</h3>
            <p>Access your employee workspace, projects, and records</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Corporate Email Address
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="login-password">
                  Security Password
                </label>
                <button
                  type="button"
                  className="link-btn-text"
                  onClick={() => setIsForgotModalOpen(true)}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-trailing-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="btn-spinner" />
              ) : (
                <>
                  <span>Sign In to ERP Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for College Presentation */}
          <div className="quick-demo-section">
            <div className="quick-demo-title">
              <KeyRound size={14} />
              <span>One-Click Demo Profiles</span>
            </div>
            <div className="quick-demo-buttons-grid">
              <button
                id="demo-btn-dhanush"
                type="button"
                className="demo-pill-btn demo-pill-primary"
                onClick={() => fillQuickDemo("dhanush@gmail.com", "Super Admin")}
              >
                <div className="demo-pill-avatar">D</div>
                <div className="demo-pill-text">
                  <strong>Dhanush Murugan</strong>
                  <span>Super Admin & CEO</span>
                </div>
              </button>

              <button
                id="demo-btn-shalini"
                type="button"
                className="demo-pill-btn demo-pill-tech"
                onClick={() => fillQuickDemo("shalinisundaram@gmail.com", "Engineering Lead")}
              >
                <div className="demo-pill-avatar avatar-tech">S</div>
                <div className="demo-pill-text">
                  <strong>Shalini Sundaram</strong>
                  <span>Lead Architect & Engineer</span>
                </div>
              </button>

              <button
                id="demo-btn-monika"
                type="button"
                className="demo-pill-btn demo-pill-hr"
                onClick={() => fillQuickDemo("monikachoudhury@gmail.com", "HR Specialist")}
              >
                <div className="demo-pill-avatar avatar-hr">M</div>
                <div className="demo-pill-text">
                  <strong>Monika Choudhury</strong>
                  <span>HR & Talent Specialist</span>
                </div>
              </button>

              <button
                id="demo-btn-manoj"
                type="button"
                className="demo-pill-btn demo-pill-dev"
                onClick={() => fillQuickDemo("manojmudaliar@gmail.com", "Full Stack Developer")}
              >
                <div className="demo-pill-avatar avatar-dev">M</div>
                <div className="demo-pill-text">
                  <strong>Manoj Mudaliar</strong>
                  <span>Full Stack Developer</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-secondary text-sm">
            Enter your registered employee email. Our security verification service will transmit an OTP recovery token.
          </p>
          <div className="form-group">
            <label className="form-label">Registered Corporate Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="name@gmail.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Recovery Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
