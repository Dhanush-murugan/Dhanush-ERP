import React from "react";

export default function BrandLogo({
  collapsed = false,
  size = 38,
  showText = !collapsed,
  className = "",
  variant = "default"
}) {
  return (
    <div
      className={`ds-brand-component ${collapsed ? "is-collapsed" : ""} ${className}`}
      data-variant={variant}
    >
      <div
        className="ds-brand-symbol"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="ds-logo-svg"
        >
          <defs>
            {/* Background Gradient */}
            <linearGradient id="dsBgGradComponent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b0f19" />
              <stop offset="50%" stopColor="#15172b" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            {/* Outer Neon Border Gradient */}
            <linearGradient id="dsBorderGradComponent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="35%" stopColor="#8b5cf6" />
              <stop offset="70%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Bow Primary Gradient (Dhanush Arc) */}
            <linearGradient id="dsBowGradComponent" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="30%" stopColor="#6366f1" />
              <stop offset="70%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Arrow / Velocity Golden Gradient */}
            <linearGradient id="dsArrowGradComponent" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* S Flow Gradient */}
            <linearGradient id="dsFlowGradComponent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="dsCoreGlowComponent" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base Rounded Squircle with Subtle Neon Rim */}
          <rect
            x="6"
            y="6"
            width="108"
            height="108"
            rx="26"
            fill="url(#dsBgGradComponent)"
            stroke="url(#dsBorderGradComponent)"
            strokeWidth="2.5"
          />

          {/* Inner Ambient Glow Mesh */}
          <circle cx="60" cy="60" r="36" fill="url(#dsBowGradComponent)" fillOpacity="0.12" filter="url(#dsCoreGlowComponent)" />
          <circle cx="76" cy="48" r="20" fill="#06b6d4" fillOpacity="0.14" />

          {/* Futuristic Dhanush Bow Tension Arc (Stylized 'D' Backing) */}
          <path
            d="M 60 22 C 34 22 22 40 22 60 C 22 80 34 98 60 98"
            fill="none"
            stroke="url(#dsBowGradComponent)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#dsCoreGlowComponent)"
          />

          {/* High-Precision Bow String Line */}
          <line
            x1="60"
            y1="22"
            x2="60"
            y2="98"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Forward Velocity & Quantum 'S' Loop */}
          <path
            d="M 52 34 C 68 34 82 40 82 50 C 82 58 72 62 60 62 C 48 62 38 66 38 74 C 38 84 52 86 68 86"
            fill="none"
            stroke="url(#dsFlowGradComponent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Golden Arrow Head & Central Delta */}
          <path
            d="M 44 60 L 76 60 M 76 60 L 64 52 M 76 60 L 64 68"
            fill="none"
            stroke="url(#dsArrowGradComponent)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#dsCoreGlowComponent)"
          />

          {/* Arrow Core Diamond Tip */}
          <polygon points="84,60 76,56 74,60 76,64" fill="#fbbf24" />

          {/* Connected Quantum Nodes */}
          <circle cx="60" cy="22" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="60" cy="98" r="4.5" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="82" cy="50" r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />
          <circle cx="38" cy="74" r="3.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />

          {/* Central Pulse Nucleus */}
          <circle cx="60" cy="60" r="4" fill="#ffffff" filter="url(#dsCoreGlowComponent)" />
          <circle cx="60" cy="60" r="2" fill="#0b0f19" />
        </svg>
      </div>

      {showText && (
        <div className="ds-brand-meta">
          <div className="ds-brand-name-row">
            <span className="ds-brand-primary-name">Dhanush</span>
            <span className="ds-brand-secondary-name">Softwares</span>
          </div>
          <div className="ds-brand-badge-row">
            <span className="ds-enterprise-tag">ENTERPRISE ERP</span>
            <span className="ds-version-pill">v3.0</span>
          </div>
        </div>
      )}
    </div>
  );
}
