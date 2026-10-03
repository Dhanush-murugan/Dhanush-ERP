import React, { useState } from "react";
import {
  Bell,
  Plus,
  Pin,
  Calendar,
  User,
  Sparkles,
  ShieldAlert,
  Tag,
  CheckCircle2,
  Trash2
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

export default function Announcements({ announcements = [], onReload }) {
  const { isManager, user } = useAuth();
  const { showToast } = useToast();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "General",
    priority: "Normal",
    pinned: false
  });

  const handleDeleteAnnouncement = async (item) => {
    if (!window.confirm(`Are you sure you want to delete notice '${item.title}'?`)) {
      return;
    }
    try {
      await api.deleteAnnouncement(item.id);
      showToast({
        title: "Announcement Deleted 🗑️",
        message: `'${item.title}' removed from corporate board.`,
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createAnnouncement({
        ...formData,
        created_by_name: user?.name || "Dhanush Murugan"
      });
      showToast({
        title: "Announcement Broadcasted! 📢",
        message: "Notice published to all company employees.",
        type: "success"
      });
      setIsNewModalOpen(false);
      setFormData({ title: "", message: "", category: "General", priority: "Normal", pinned: false });
      onReload();
    } catch (err) {
      showToast({
        title: "Publish Failed",
        message: err.message,
        type: "error"
      });
    }
  };

  const filtered = announcements.filter((ann) => {
    if (selectedCategory === "all") return true;
    return (ann.category || "General").toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="page-announcements-container animate-fade-in">
      {/* Top Banner Toolbar */}
      <div className="section-toolbar-card">
        <div>
          <h3 className="card-title">Corporate Notice Board & Official Broadcasts</h3>
          <p className="card-subtitle">Company bulletins, policy updates, hackathons, and executive milestones</p>
        </div>

        <div className="flex-row items-center gap-3">
          <select
            className="form-select filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Bulletins ({announcements.length})</option>
            <option value="Event">Events & Hackathons</option>
            <option value="Policy">HR Policies</option>
            <option value="Recognition">Awards & Recognition</option>
            <option value="General">General</option>
          </select>

          {isManager() && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsNewModalOpen(true)}>
              <Plus size={16} />
              <span>Broadcast Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="announcements-cards-stream">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`announcement-full-card animate-scale-up ${item.pinned ? "card-pinned" : ""}`}
          >
            <div className="ann-card-header">
              <div className="ann-card-badges">
                {item.pinned && (
                  <span className="pinned-badge">
                    <Pin size={13} /> Pinned
                  </span>
                )}
                <span className={`category-tag tag-${String(item.category || "General").toLowerCase()}`}>
                  {item.category || "General"}
                </span>
                <span className={`priority-tag priority-${String(item.priority || "Normal").toLowerCase()}`}>
                  {item.priority || "Normal"} Priority
                </span>
              </div>

              <div className="flex-row items-center gap-2">
                <div className="ann-card-timestamp font-mono text-xs">
                  {new Date(item.created_at || Date.now()).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
                {isManager() && (
                  <button
                    type="button"
                    className="btn-icon-xs text-danger"
                    onClick={() => handleDeleteAnnouncement(item)}
                    title="Delete Notice"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <h4 className="ann-card-title">{item.title}</h4>
            <p className="ann-card-body-text">{item.message}</p>

            <div className="ann-card-footer">
              <div className="ann-author-info">
                <div className="ann-author-avatar">
                  {item.created_by_name ? item.created_by_name.charAt(0) : "D"}
                </div>
                <span>Published by <strong>{item.created_by_name || "Dhanush Murugan"}</strong></span>
              </div>

              <span className="ann-read-status">
                <CheckCircle2 size={14} className="text-success" /> Verified Notice
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Broadcast Company Announcement"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Notice Title *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Q4 Townhall & Product Strategy Showcase"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Event">Event</option>
                <option value="Policy">Policy</option>
                <option value="Recognition">Recognition</option>
                <option value="Technical">Technical</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent Broadcast</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Announcement Content *</label>
            <textarea
              className="form-input"
              rows={4}
              required
              placeholder="Detailed announcement content..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="form-checkbox-row">
            <input
              type="checkbox"
              id="pin-check"
              checked={formData.pinned}
              onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
            />
            <label htmlFor="pin-check">Pin this notice to top of dashboard & notice board</label>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
