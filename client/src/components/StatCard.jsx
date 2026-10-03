import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  colorScheme = "indigo",
  subtitle
}) {
  return (
    <div className={`stat-card stat-card-${colorScheme} animate-fade-in`}>
      <div className="stat-card-header">
        <div className="stat-icon-wrapper">
          {Icon && <Icon size={22} />}
        </div>
        {change && (
          <div className={`stat-trend-badge ${isPositive ? "trend-up" : "trend-down"}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change}</span>
          </div>
        )}
      </div>

      <div className="stat-card-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>

      <div className="stat-card-glow" />
    </div>
  );
}
