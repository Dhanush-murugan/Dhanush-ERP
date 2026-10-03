import React, { useState } from "react";
import {
  Award,
  Star,
  Plus,
  TrendingUp,
  Target,
  CheckCircle2,
  Users,
  MessageSquare,
  ShieldCheck,
  Zap,
  Code2,
  HeartHandshake,
  Search,
  Filter,
  Sparkles
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// Professional Luxury Metallic 3D Golden Star
function GoldenStar({ filled = false, size = 20, onClick, onMouseEnter, onMouseLeave, interactive = false }) {
  return (
    <span
      className={`golden-star-wrapper ${interactive ? "interactive-star" : ""} ${filled ? "is-filled" : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={interactive ? "Click to set rating" : ""}
      style={{ display: "inline-flex", cursor: interactive ? "pointer" : "default", transition: "transform 0.15s ease" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="golden-star-svg"
      >
        <defs>
          <linearGradient id="dsGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF7C2" />
            <stop offset="25%" stopColor="#FFD700" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <filter id="dsGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.55" />
          </filter>
        </defs>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={filled ? "url(#dsGoldGrad)" : "var(--star-empty-fill, rgba(255, 255, 255, 0.08))"}
          stroke={filled ? "#D97706" : "var(--star-empty-stroke, rgba(255, 255, 255, 0.25))"}
          strokeWidth="1.2"
          strokeLinejoin="round"
          filter={filled ? "url(#dsGoldGlow)" : "none"}
        />
      </svg>
    </span>
  );
}

function GoldenStarRating({ rating = 5, onRate, interactive = true, size = 20 }) {
  const [hoverRating, setHoverRating] = useState(0);
  const activeRating = hoverRating || rating;

  return (
    <div
      className="golden-star-rating-strip"
      onMouseLeave={() => setHoverRating(0)}
      style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
    >
      {[1, 2, 3, 4, 5].map((starIdx) => (
        <GoldenStar
          key={starIdx}
          size={size}
          filled={starIdx <= Math.round(activeRating)}
          interactive={interactive}
          onMouseEnter={() => interactive && setHoverRating(starIdx)}
          onClick={() => interactive && onRate && onRate(starIdx)}
        />
      ))}
    </div>
  );
}

export default function Performance({ performance = [], employees = [] }) {
  const { isManager, user } = useAuth();
  const { showToast } = useToast();

  const [isNewReviewOpen, setIsNewReviewOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState("Q3 2026");
  const [searchQuery, setSearchQuery] = useState("");

  const DEFAULT_APPRAISALS = [
    {
      id: 1,
      employee_id: 2,
      employee_name: "Aravind Swaminathan",
      designation: "VP of Engineering",
      department: "Engineering & Technology",
      quarter: "Q3 2026",
      overall_score: 4.9,
      tier: "Tier 1: Exceptional Leader",
      competencies: {
        architecture: 4.9,
        velocity: 4.8,
        mentorship: 5.0,
        quality: 4.9
      },
      comments: "Exceptional system design and architectural leadership on the NeoBank API rail. Spearheaded microservice transitions with 99.99% uptime.",
      reviewed_by_name: "Dhanush Murugan",
      reviewed_by_role: "Managing Director & CEO",
      review_date: "2026-09-30"
    },
    {
      id: 2,
      employee_id: 3,
      employee_name: "Meera Krishnan",
      designation: "Lead UI/UX Designer",
      department: "Product & UI/UX Design",
      quarter: "Q3 2026",
      overall_score: 4.8,
      tier: "Tier 1: Exceptional Leader",
      competencies: {
        architecture: 4.7,
        velocity: 4.9,
        mentorship: 4.8,
        quality: 5.0
      },
      comments: "Created complete executive Design Token library for ERP v2.0. Exceptional user empathy and rapid prototyping across 14 modules.",
      reviewed_by_name: "Dhanush Murugan",
      reviewed_by_role: "Managing Director & CEO",
      review_date: "2026-09-28"
    },
    {
      id: 3,
      employee_id: 4,
      employee_name: "Pooja Venkatesh",
      designation: "Head of People Operations",
      department: "Human Resources & Talent",
      quarter: "Q3 2026",
      overall_score: 4.7,
      tier: "Tier 2: Exceeds Expectations",
      competencies: {
        architecture: 4.5,
        velocity: 4.8,
        mentorship: 4.9,
        quality: 4.7
      },
      comments: "Flawlessly onboarded 35 senior tech hires and optimized the corporate payroll compliance cycle to zero audit findings.",
      reviewed_by_name: "Dhanush Murugan",
      reviewed_by_role: "Managing Director & CEO",
      review_date: "2026-09-25"
    },
    {
      id: 4,
      employee_id: 5,
      employee_name: "Vikram Raman",
      designation: "Lead Test Automation Architect",
      department: "QA & Cloud Operations",
      quarter: "Q3 2026",
      overall_score: 4.8,
      tier: "Tier 1: Exceptional Leader",
      competencies: {
        architecture: 4.8,
        velocity: 4.7,
        mentorship: 4.8,
        quality: 5.0
      },
      comments: "Engineered automated CI/CD synthetic testing suite running 4,500 tests in under 8 minutes. Slashed release regression time by 65%.",
      reviewed_by_name: "Aravind Swaminathan",
      reviewed_by_role: "VP of Engineering",
      review_date: "2026-09-22"
    },
    {
      id: 5,
      employee_id: 6,
      employee_name: "Ananya Balasubramanian",
      designation: "Senior Cloud Architect",
      department: "Engineering & Technology",
      quarter: "Q3 2026",
      overall_score: 4.6,
      tier: "Tier 2: Exceeds Expectations",
      competencies: {
        architecture: 4.8,
        velocity: 4.5,
        mentorship: 4.5,
        quality: 4.7
      },
      comments: "Led Kubernetes multi-region ingress configuration. Slashed AWS cloud infrastructure overhead by 22% while boosting peak resilience.",
      reviewed_by_name: "Aravind Swaminathan",
      reviewed_by_role: "VP of Engineering",
      review_date: "2026-09-20"
    }
  ];

  const [reviewsList, setReviewsList] = useState(DEFAULT_APPRAISALS);

  const [formData, setFormData] = useState({
    employee_id: employees[1]?.id || 2,
    quarter: "Q3 2026",
    architecture: 5,
    velocity: 5,
    mentorship: 5,
    quality: 5,
    comments: ""
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === Number(formData.employee_id)) || employees[0];
    const avgScore = Number(
      ((Number(formData.architecture) + Number(formData.velocity) + Number(formData.mentorship) + Number(formData.quality)) / 4).toFixed(1)
    );

    let tierLabel = "Tier 3: Meets Expectations";
    if (avgScore >= 4.8) tierLabel = "Tier 1: Exceptional Leader";
    else if (avgScore >= 4.5) tierLabel = "Tier 2: Exceeds Expectations";

    const newRev = {
      id: Date.now(),
      employee_id: emp.id,
      employee_name: emp.name,
      designation: emp.designation || "Senior Specialist",
      department: emp.department_name || "Engineering & Technology",
      quarter: formData.quarter,
      overall_score: avgScore,
      tier: tierLabel,
      competencies: {
        architecture: Number(formData.architecture),
        velocity: Number(formData.velocity),
        mentorship: Number(formData.mentorship),
        quality: Number(formData.quality)
      },
      comments: formData.comments || "Demonstrated outstanding professional competency and cross-functional leadership.",
      reviewed_by_name: user?.name || "Dhanush Murugan",
      reviewed_by_role: user?.designation || "Managing Director & CEO",
      review_date: new Date().toISOString().split("T")[0]
    };

    setReviewsList([newRev, ...reviewsList]);
    showToast({
      title: "Executive Appraisal Certified! ⭐",
      message: `Performance scorecard of ${avgScore} / 5.0 recorded for ${emp.name}.`,
      type: "success"
    });
    setIsNewReviewOpen(false);
  };

  const handleUpdateRating = (reviewId, newRating) => {
    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const score = Number(newRating).toFixed(1);
          let tier = "Tier 3: Meets Expectations";
          if (score >= 4.8) tier = "Tier 1: Exceptional Leader";
          else if (score >= 4.5) tier = "Tier 2: Exceeds Expectations";

          return {
            ...r,
            overall_score: Number(score),
            tier,
            competencies: {
              architecture: Math.min(5.0, Number((newRating * 0.98).toFixed(1))),
              velocity: Math.min(5.0, Number((newRating * 0.96).toFixed(1))),
              mentorship: Math.min(5.0, Number((newRating * 1.0).toFixed(1))),
              quality: Math.min(5.0, Number((newRating * 0.99).toFixed(1)))
            }
          };
        }
        return r;
      })
    );

    const targetRev = reviewsList.find((r) => r.id === reviewId);
    showToast({
      title: "Golden Star Rating Updated! ⭐",
      message: `${newRating}.0 / 5.0 Stars recorded for ${targetRev?.employee_name || "Employee"}.`,
      type: "success"
    });
  };

  const filteredReviews = reviewsList.filter((rev) => {
    const matchesSearch =
      !searchQuery ||
      rev.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuarter = !selectedQuarter || rev.quarter === selectedQuarter;
    return matchesSearch && matchesQuarter;
  });

  return (
    <div className="page-performance-container animate-fade-in">
      {/* Top OKR & Executive Highlights Row */}
      <div className="performance-summary-grid">
        <div className="performance-metric-card">
          <div className="metric-icon-box bg-indigo">
            <Award size={22} />
          </div>
          <div>
            <span className="metric-lbl">Corporate Performance Index</span>
            <div className="metric-val font-mono">4.84 / 5.0</div>
            <span className="metric-sub text-success">+0.24 vs Q2 FY26 (Top Quartile)</span>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon-box bg-emerald">
            <Target size={22} />
          </div>
          <div>
            <span className="metric-lbl">OKR Milestone Execution</span>
            <div className="metric-val font-mono">94.8%</div>
            <span className="metric-sub text-success">Ahead of quarterly roadmap</span>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon-box bg-amber">
            <Star size={22} />
          </div>
          <div>
            <span className="metric-lbl">Tier 1 Star Performers</span>
            <div className="metric-val font-mono">18 Members</div>
            <span className="metric-sub text-muted">Eligible for equity & bonuses</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="section-toolbar-card">
        <div>
          <h3 className="card-title">Employee Performance & Competency Matrix</h3>
          <p className="card-subtitle">
            Quarterly managerial reviews, competency benchmarks, and multi-factor appraisals
          </p>
        </div>

        <div className="flex-row items-center gap-3">
          {/* Quarter Filter */}
          <select
            className="form-select text-sm py-1 font-mono"
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
          >
            <option value="Q3 2026">Q3 FY26 (Current)</option>
            <option value="Q2 2026">Q2 FY26</option>
            <option value="Q1 2026">Q1 FY26</option>
          </select>

          {/* Search Box */}
          <div className="attendance-search-box">
            <Search size={14} className="text-muted" />
            <input
              type="text"
              className="attendance-search-input"
              placeholder="Search reviewed employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isManager() && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsNewReviewOpen(true)}>
              <Plus size={16} />
              <span>Submit Appraisal</span>
            </button>
          )}
        </div>
      </div>

      {/* Professional Review Scorecards Grid */}
      <div className="reviews-cards-grid">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="review-card individual-employee-card animate-scale-up">
            <div className="review-card-top">
              <div className="review-user-info">
                <div className="review-user-avatar">
                  {rev.employee_name ? rev.employee_name.charAt(0) : "U"}
                </div>
                <div>
                  <div className="flex-row items-center gap-2">
                    <h4 className="review-emp-name">{rev.employee_name}</h4>
                    <span className="emp-code-pill font-mono text-xs">EMP00{rev.employee_id || rev.id}</span>
                  </div>
                  <div className="review-emp-role">{rev.designation} • {rev.department}</div>
                  <span className="review-evaluator">
                    Evaluated by {rev.reviewed_by_name} ({rev.reviewed_by_role})
                  </span>
                </div>
              </div>

              <div className="review-score-badge-cluster">
                <div className="review-score-stars-box">
                  <div className="golden-stars-container">
                    <GoldenStarRating
                      rating={rev.overall_score}
                      onRate={(newRating) => handleUpdateRating(rev.id, newRating)}
                      interactive={true}
                      size={22}
                    />
                  </div>
                  <div className="review-score-details">
                    <span className="review-score-val font-mono">{rev.overall_score}</span>
                    <span className="review-score-max font-mono">/ 5.0</span>
                    <span className="interactive-rate-hint">Click star to change</span>
                  </div>
                </div>
                <span className={`review-tier-tag ${rev.overall_score >= 4.8 ? "tier-1" : "tier-2"}`}>
                  {rev.tier}
                </span>
              </div>
            </div>

            {/* Competency Metric Progress Bars */}
            <div className="competency-matrix-bars">
              <div className="competency-bar-item">
                <div className="competency-lbl-row">
                  <span className="competency-name">
                    <Code2 size={13} className="text-primary inline-icon" /> Architecture & Tech Excellence
                  </span>
                  <span className="competency-score font-mono">{rev.competencies?.architecture || 4.8} / 5.0</span>
                </div>
                <div className="competency-track">
                  <div
                    className="competency-fill fill-primary"
                    style={{ width: `${((rev.competencies?.architecture || 4.8) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="competency-bar-item">
                <div className="competency-lbl-row">
                  <span className="competency-name">
                    <Zap size={13} className="text-warning inline-icon" /> Sprint Velocity & Execution
                  </span>
                  <span className="competency-score font-mono">{rev.competencies?.velocity || 4.8} / 5.0</span>
                </div>
                <div className="competency-track">
                  <div
                    className="competency-fill fill-warning"
                    style={{ width: `${((rev.competencies?.velocity || 4.8) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="competency-bar-item">
                <div className="competency-lbl-row">
                  <span className="competency-name">
                    <HeartHandshake size={13} className="text-success inline-icon" /> Leadership & Mentorship
                  </span>
                  <span className="competency-score font-mono">{rev.competencies?.mentorship || 4.9} / 5.0</span>
                </div>
                <div className="competency-track">
                  <div
                    className="competency-fill fill-success"
                    style={{ width: `${((rev.competencies?.mentorship || 4.9) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="competency-bar-item">
                <div className="competency-lbl-row">
                  <span className="competency-name">
                    <ShieldCheck size={13} className="text-sky inline-icon" /> Code Quality & Security
                  </span>
                  <span className="competency-score font-mono">{rev.competencies?.quality || 4.9} / 5.0</span>
                </div>
                <div className="competency-track">
                  <div
                    className="competency-fill fill-sky"
                    style={{ width: `${((rev.competencies?.quality || 4.9) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Executive Manager Feedback */}
            <div className="review-feedback-quote">
              <p>"{rev.comments}"</p>
            </div>

            <div className="review-card-footer">
              <span className="review-date font-mono text-xs text-muted">
                Cycle: {rev.quarter} • Verified on {rev.review_date}
              </span>
              <span className="status-pill status-active">
                <CheckCircle2 size={12} /> Certified by Board
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comprehensive Appraisal Modal */}
      <Modal
        isOpen={isNewReviewOpen}
        onClose={() => setIsNewReviewOpen(false)}
        title="Submit Executive Appraisal Scorecard"
        maxWidth="640px"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Select Employee *</label>
              <select
                className="form-select"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code || `EMP${emp.id}`}) - {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Review Cycle Quarter *</label>
              <select
                className="form-select"
                value={formData.quarter}
                onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
              >
                <option value="Q3 2026">Q3 FY26 (Oct - Dec)</option>
                <option value="Q2 2026">Q2 FY26 (Jul - Sep)</option>
                <option value="Q1 2026">Q1 FY26 (Apr - Jun)</option>
              </select>
            </div>
          </div>

          {/* Competency Sliders */}
          <div className="competency-input-group space-y-3 p-3 bg-card-solid rounded-lg border border-subtle">
            <h4 className="text-xs font-bold tracking-wider uppercase text-muted">
              Core Competency Scores (1 to 5 Stars)
            </h4>

            <div className="flex-row items-center justify-between">
              <span className="text-sm font-medium">Architecture & Technical Execution</span>
              <div className="flex-row items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.architecture}
                  onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                  className="competency-range-slider"
                />
                <span className="font-mono font-bold text-sm w-8 text-right">{formData.architecture}</span>
              </div>
            </div>

            <div className="flex-row items-center justify-between">
              <span className="text-sm font-medium">Sprint Velocity & Milestone Delivery</span>
              <div className="flex-row items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.velocity}
                  onChange={(e) => setFormData({ ...formData, velocity: e.target.value })}
                  className="competency-range-slider"
                />
                <span className="font-mono font-bold text-sm w-8 text-right">{formData.velocity}</span>
              </div>
            </div>

            <div className="flex-row items-center justify-between">
              <span className="text-sm font-medium">Team Mentorship & Culture Alignment</span>
              <div className="flex-row items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.mentorship}
                  onChange={(e) => setFormData({ ...formData, mentorship: e.target.value })}
                  className="competency-range-slider"
                />
                <span className="font-mono font-bold text-sm w-8 text-right">{formData.mentorship}</span>
              </div>
            </div>

            <div className="flex-row items-center justify-between">
              <span className="text-sm font-medium">Code Quality & Zero-Vulnerability Standards</span>
              <div className="flex-row items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  className="competency-range-slider"
                />
                <span className="font-mono font-bold text-sm w-8 text-right">{formData.quality}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Executive Managerial Feedback & Strengths *</label>
            <textarea
              className="form-input"
              rows={3}
              required
              placeholder="Highlight notable achievements, sprint leadership, architectural contributions..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsNewReviewOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Certify Appraisal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
