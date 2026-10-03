import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Smile,
  CheckCheck,
  Phone,
  Video,
  Info,
  Heart,
  Image as ImageIcon,
  Mic,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Paperclip,
  Users,
  Building2,
  Clock,
  Check,
  UserCheck,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// Format date divider for WhatsApp style message grouping
const formatDividerDate = (dateStr) => {
  if (!dateStr) return "Today";
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "TODAY";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase();
};

export default function Chat({ employees = [], onUnreadCountChange }) {
  const { user } = useAuth();

  const currentUserId = Number(user?.id || 1);
  const currentUserName = (user?.name || "").trim().toLowerCase();

  // Instant 0ms cached loading so Chat opens with zero delay
  const [chatUsers, setChatUsers] = useState(() => api.getCachedChatUsers(currentUserId));
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [likedMessages, setLikedMessages] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Persistent tracking of active conversations so contacts never vanish
  const [openedContactIds, setOpenedContactIds] = useState(() => {
    try {
      const saved = localStorage.getItem("ds_erp_opened_chats");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(Number) : [1, 2, 3, 4, 5, 14, 33, 100];
    } catch {
      return [1, 2, 3, 4, 5, 14, 33, 100];
    }
  });

  const markContactOpened = (contactId) => {
    const cId = Number(contactId);
    if (!cId) return;
    setOpenedContactIds((prev) => {
      if (prev.includes(cId)) return prev;
      const next = [...prev, cId];
      try {
        localStorage.setItem("ds_erp_opened_chats", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Tab switcher in sidebar: "recent" (WhatsApp recent chats) vs "directory" (All company employees)
  const [sidebarTab, setSidebarTab] = useState("recent"); // "recent" | "directory"
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const messagesEndRef = useRef(null);

  // Background refresh of contacts & messages (Optimized, Non-destructive & Smooth)
  const refreshUsersAndMessages = useCallback(async () => {
    try {
      const refreshedUsers = await api.getChatUsers(currentUserId);
      if (Array.isArray(refreshedUsers) && refreshedUsers.length > 0) {
        setChatUsers((prev) => {
          if (!prev || prev.length === 0) return refreshedUsers;
          const freshMap = new Map();
          refreshedUsers.forEach((u) => freshMap.set(Number(u.id), u));

          return prev.map((p) => {
            const fresh = freshMap.get(Number(p.id));
            if (!fresh) return p;
            return {
              ...p,
              ...fresh,
              unread_count: fresh.unread_count !== undefined ? fresh.unread_count : p.unread_count,
              latest_message: fresh.latest_message || p.latest_message,
              latest_message_time: fresh.latest_message_time || p.latest_message_time,
              latest_message_sender_id: fresh.latest_message_sender_id || p.latest_message_sender_id
            };
          });
        });
      }

      if (activeContact?.id) {
        const freshMsgs = await api.getChatMessages(activeContact.id, currentUserId);
        if (Array.isArray(freshMsgs) && freshMsgs.length > 0) {
          setMessages((prevMsgs) => {
            const map = new Map();
            prevMsgs.forEach((m) => map.set(`${m.id || ""}-${m.created_at}`, m));
            freshMsgs.forEach((m) => {
              const norm = {
                ...m,
                text: m.message || m.text || "",
                created_at: m.created_at || new Date().toISOString()
              };
              map.set(`${norm.id || ""}-${norm.created_at}`, norm);
            });
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      }

      if (onUnreadCountChange) {
        const count = await api.getChatUnreadCount(currentUserId);
        onUnreadCountChange(count);
      }
    } catch {}
  }, [currentUserId, activeContact?.id, onUnreadCountChange]);

  // Initial load and instant event synchronization (Graceful & Non-destructive)
  useEffect(() => {
    refreshUsersAndMessages();

    const handleSync = () => {
      const cached = api.getCachedChatUsers(currentUserId);
      if (Array.isArray(cached) && cached.length > 0) {
        setChatUsers((prev) => {
          if (!prev || prev.length === 0) return cached;
          const cachedMap = new Map();
          cached.forEach((c) => cachedMap.set(Number(c.id), c));
          return prev.map((p) => {
            const c = cachedMap.get(Number(p.id));
            if (!c) return p;
            return {
              ...p,
              unread_count: c.unread_count !== undefined ? c.unread_count : p.unread_count,
              latest_message: p.latest_message || c.latest_message,
              latest_message_time: p.latest_message_time || c.latest_message_time,
              latest_message_sender_id: p.latest_message_sender_id || c.latest_message_sender_id
            };
          });
        });
      }
      if (activeContact?.id) {
        const localMsgs = api.getCachedChatMessages(activeContact.id, currentUserId);
        if (Array.isArray(localMsgs) && localMsgs.length > 0) {
          setMessages(
            localMsgs.map((m) => ({
              ...m,
              text: m.message || m.text || "",
              created_at: m.created_at || new Date().toISOString()
            }))
          );
        }
      }
    };

    window.addEventListener("ds_chat_sync", handleSync);
    window.addEventListener("storage", handleSync);

    const interval = setInterval(refreshUsersAndMessages, 2500);

    return () => {
      window.removeEventListener("ds_chat_sync", handleSync);
      window.removeEventListener("storage", handleSync);
      clearInterval(interval);
    };
  }, [currentUserId, activeContact?.id, refreshUsersAndMessages]);

  // Merge employee data when employees prop updates
  useEffect(() => {
    if (employees && employees.length > 0) {
      setChatUsers((prev) => {
        if (!prev || prev.length <= 1) return api.getCachedChatUsers(currentUserId);
        return prev;
      });
    }
  }, [employees, currentUserId]);

  // All contacts pool except current logged-in user
  const contactPool = chatUsers && chatUsers.length > 0 ? chatUsers : employees;
  const filteredContacts = contactPool.filter((emp) => {
    const isCurrent =
      Number(emp.id) === currentUserId ||
      (emp.name && currentUserName && emp.name.trim().toLowerCase() === currentUserName) ||
      (emp.email && user?.email && emp.email.trim().toLowerCase() === user.email.trim().toLowerCase());
    if (isCurrent) return false;
    return (
      !searchContact ||
      emp.name?.toLowerCase().includes(searchContact.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchContact.toLowerCase()) ||
      emp.department_name?.toLowerCase().includes(searchContact.toLowerCase())
    );
  });

  // Default prominent teammates that should ALWAYS be in recent conversations for instant 1-click chatting:
  // Super Admin Dhanush (1), Staff Frontend Shalini (14), Lead Architect Aravind (2),
  // Senior UI Karthik (3), HR Meera (4), Lead QA Pooja (5), Staff Manoj (33), Kumaran (100)
  const CORE_TEAM_IDS = [1, 2, 3, 4, 5, 14, 33, 100];

  // Recent Chats: NEVER vanishes. Shows contacts with messages, unread, actively selected, opened, or core team
  const recentChats = filteredContacts
    .filter((emp) => {
      const empId = Number(emp.id);
      if (empId === currentUserId) return false;
      const hasMessages = emp.latest_message && String(emp.latest_message).trim().length > 0;
      const hasUnread = Number(emp.unread_count || 0) > 0;
      const isSelected = activeContact && Number(activeContact.id) === empId;
      const isOpened = openedContactIds.includes(empId);
      const isCoreTeam = CORE_TEAM_IDS.includes(empId);
      return hasMessages || hasUnread || isSelected || isOpened || isCoreTeam;
    })
    .sort((a, b) => {
      // Keep actively selected contact pinned at top while chatting
      if (activeContact && Number(a.id) === Number(activeContact.id)) return -1;
      if (activeContact && Number(b.id) === Number(activeContact.id)) return 1;

      const unreadA = Number(a.unread_count || 0);
      const unreadB = Number(b.unread_count || 0);
      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadB > 0 && unreadA === 0) return 1;
      const timeA = a.latest_message_time ? new Date(a.latest_message_time).getTime() : 0;
      const timeB = b.latest_message_time ? new Date(b.latest_message_time).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return Number(a.id) - Number(b.id);
    });

  // Auto-select initial contact on mount so conversation pane is never an empty void
  useEffect(() => {
    if (!activeContact) {
      const candidate = recentChats[0] || filteredContacts[0];
      if (candidate) {
        handleSelectContact(candidate);
      }
    }
  }, []);

  // All Employees Directory: Clean list strictly ordered by Employee ID (EMP001 -> EMP100)
  const allEmployeesList = (employees && employees.length > 0 ? employees : contactPool)
    .filter((emp) => {
      const isCurrent =
        Number(emp.id) === currentUserId ||
        (emp.name && currentUserName && emp.name.trim().toLowerCase() === currentUserName);
      if (isCurrent) return false;

      const matchesSearch =
        !searchContact ||
        emp.name?.toLowerCase().includes(searchContact.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchContact.toLowerCase()) ||
        emp.department_name?.toLowerCase().includes(searchContact.toLowerCase());

      const matchesDept =
        departmentFilter === "All" ||
        (emp.department_name && emp.department_name.toLowerCase().includes(departmentFilter.toLowerCase()));

      return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      if (idA !== idB) return idA - idB;
      return (a.employee_code || "").localeCompare(b.employee_code || "", undefined, { numeric: true });
    });

  const totalUnreadCount = recentChats.reduce(
    (sum, emp) => sum + Number(emp.unread_count || 0),
    0
  );

  const getEmployeePresence = (emp) => {
    if (!emp) return { status: "offline", label: "Offline" };
    const role = (emp.role || "").toLowerCase();
    if (role === "admin" || Number(emp.id) === 2 || emp.status === "active") {
      return { status: "online", label: "Online" };
    }
    return { status: "offline", label: "Last seen recently" };
  };

  const handleSelectContact = async (contact) => {
    if (!contact) return;
    const contactId = Number(contact.id);
    const normalizedContact = { ...contact, id: contactId };
    setActiveContact(normalizedContact);
    setShowMobileList(false);
    markContactOpened(contactId);

    // Instant local messages for selected contact (0ms latency)
    const localMsgs = api.getCachedChatMessages(contactId, currentUserId);
    if (localMsgs.length > 0) {
      setMessages(
        localMsgs.map((m) => ({
          ...m,
          text: m.message || m.text || "",
          created_at: m.created_at || new Date().toISOString()
        }))
      );
    }

    // Mark as read immediately in UI
    setChatUsers((prev) =>
      prev.map((c) => (Number(c.id) === contactId ? { ...c, unread_count: 0 } : c))
    );

    // Mark as read on server & update badge
    try {
      await api.markChatRead(contactId, currentUserId);
      const remaining = await api.getChatUnreadCount(currentUserId);
      if (onUnreadCountChange) onUnreadCountChange(remaining);
    } catch {}

    // Background fetch fresh messages - merge smoothly with local
    try {
      const fresh = await api.getChatMessages(contactId, currentUserId);
      if (Array.isArray(fresh) && fresh.length > 0) {
        setMessages((prevMsgs) => {
          const map = new Map();
          prevMsgs.forEach((m) => map.set(`${m.id || ""}-${m.created_at}`, m));
          fresh.forEach((m) => {
            const norm = {
              ...m,
              text: m.message || m.text || "",
              created_at: m.created_at || new Date().toISOString()
            };
            map.set(`${norm.id || ""}-${norm.created_at}`, norm);
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    } catch {}
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleHeartMessage = (msgId) => {
    setLikedMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Instant Send Message (0ms Latency Optimistic Update)
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeContact) return;

    setInputText("");
    setShowEmojiPicker(false);

    const curId = Number(user?.id || 1);
    const curName = user?.name || "Dhanush Murugan";
    const nowIso = new Date().toISOString();
    const contactId = Number(activeContact.id);

    const newMsg = {
      id: Date.now(),
      sender_id: curId,
      sender_name: curName,
      receiver_id: contactId,
      text,
      message: text,
      created_at: nowIso,
      is_read: true
    };

    // 1. Optimistic UI update immediately
    setMessages((prev) => [...prev, newMsg]);
    markContactOpened(contactId);

    // 2. Immediately bump active contact to the very TOP of the Recent chats list
    setChatUsers((prev) => {
      const updated = prev.map((c) =>
        Number(c.id) === contactId
          ? {
              ...c,
              latest_message: text,
              latest_message_time: nowIso,
              latest_message_sender_id: curId
            }
          : c
      );
      return updated;
    });

    // 3. Fire background save
    try {
      await api.sendChatMessage(contactId, text, curId, curName);
    } catch {
      // Local message retained
    }
  };

  const sendQuickHeart = () => {
    handleSendMessage("❤️");
  };

  const activePresence = activeContact ? getEmployeePresence(activeContact) : null;
  const COMMON_EMOJIS = ["❤️", "🔥", "🙌", "👏", "🚀", "✨", "💯", "👍", "🎉", "😄"];

  // Group messages by Date for WhatsApp style date headers
  const groupedMessageBlocks = [];
  let lastDateGroup = null;
  messages.forEach((m) => {
    const dStr = new Date(m.created_at || Date.now()).toDateString();
    if (dStr !== lastDateGroup) {
      lastDateGroup = dStr;
      groupedMessageBlocks.push({ type: "date_divider", date: dStr });
    }
    groupedMessageBlocks.push({ type: "message", data: m });
  });

  return (
    <div className="page-chat-container animate-fade-in">
      <div className="ig-chat-shell whatsapp-shell">
        {/* Left Side: Conversations & Employee Directory Sidebar */}
        <div className={`ig-chat-sidebar whatsapp-sidebar ${!showMobileList ? "hide-on-mobile-chat" : ""}`}>
          {/* Header */}
          <div className="ig-sidebar-header whatsapp-sidebar-header">
            <div className="ig-user-profile-title">
              <span className="ig-username">{user?.name || "Dhanush Murugan"}</span>
              <span className="ig-verified-badge" title="Verified Enterprise Account">✓</span>
            </div>

            {totalUnreadCount > 0 ? (
              <span className="whatsapp-header-unread-tag font-mono">
                {totalUnreadCount} Unread
              </span>
            ) : (
              <span className="text-xs text-muted font-mono">{recentChats.length} Chats</span>
            )}
          </div>

          {/* Top Switcher Tabs: WhatsApp Recent Chats vs All Employees */}
          <div className="whatsapp-sidebar-tabs">
            <button
              type="button"
              className={`whatsapp-tab-btn ${sidebarTab === "recent" ? "active" : ""}`}
              onClick={() => setSidebarTab("recent")}
            >
              <MessageSquare size={14} />
              <span>Recent Chats</span>
              {totalUnreadCount > 0 && (
                <span className="whatsapp-tab-badge font-mono">{totalUnreadCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`whatsapp-tab-btn ${sidebarTab === "directory" ? "active" : ""}`}
              onClick={() => setSidebarTab("directory")}
            >
              <Users size={14} />
              <span>All Employees</span>
              <span className="whatsapp-tab-count font-mono">{allEmployeesList.length}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="ig-search-box-wrap">
            <div className="ig-search-box">
              <Search size={15} className="ig-search-icon" />
              <input
                type="text"
                className="ig-search-input"
                placeholder={sidebarTab === "recent" ? "Search recent chats..." : "Search all colleagues..."}
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
              />
              {searchContact && (
                <button
                  type="button"
                  className="ig-search-clear"
                  onClick={() => setSearchContact("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Department Filter Pills (Visible when in Directory tab) */}
          {sidebarTab === "directory" && (
            <div className="chat-dept-filter-bar">
              {["All", "Engineering", "QA", "Design", "HR", "Finance"].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`chat-dept-chip ${departmentFilter === dept ? "active" : ""}`}
                  onClick={() => setDepartmentFilter(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}

          {/* TAB 1: WHATSAPP RECENT CHATS LIST */}
          {sidebarTab === "recent" && (
            <div className="ig-conversations-list whatsapp-conversations-list">
              {recentChats.length === 0 ? (
                <div className="whatsapp-empty-recent-box p-4 text-center">
                  <div className="text-sm font-semibold text-primary-light mb-1">Start a Conversation</div>
                  <p className="text-xs text-muted mb-3">Choose a team colleague below to start chatting</p>
                  <div className="quick-start-colleagues flex flex-col gap-2">
                    {filteredContacts.slice(0, 5).map((colleague) => (
                      <div
                        key={`quick-${colleague.id}`}
                        className="quick-chat-emp-card flex items-center justify-between p-2 rounded cursor-pointer"
                        onClick={() => handleSelectContact(colleague)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="ig-contact-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                            {colleague.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-xs text-primary-light">{colleague.name}</span>
                        </div>
                        <span className="btn-chat-direct font-mono text-xs">💬 Chat</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                recentChats.map((emp) => {
                  const isSelected = Number(activeContact?.id) === Number(emp.id);
                  const presence = getEmployeePresence(emp);
                  const unreadCount = Number(emp.unread_count || 0);
                  const hasUnread = unreadCount > 0;
                  const timeStr = formatMessageTime(emp.latest_message_time);
                  const isSentByMe = Number(emp.latest_message_sender_id) === currentUserId;
                  const senderPrefix = emp.latest_message
                    ? isSentByMe
                      ? "You: "
                      : `${(emp.name || "Staff").split(" ")[0]}: `
                    : "";
                  const latestSnippet = emp.latest_message
                    ? emp.latest_message
                    : (presence.status === "online" ? "Active now" : (emp.department_name || emp.designation || "Colleague"));

                  return (
                    <div
                      key={emp.id}
                      className={`ig-conversation-item whatsapp-item ${isSelected ? "selected" : ""} ${hasUnread ? "has-unread-item" : ""}`}
                      onClick={() => handleSelectContact(emp)}
                    >
                      <div className="ig-contact-avatar-wrap">
                        <div className="ig-contact-avatar">
                          {emp.profile_image ? (
                            <img
                              src={emp.profile_image}
                              alt={emp.name}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <span style={{ display: emp.profile_image ? "none" : "flex" }}>
                            {emp.name.charAt(0)}
                          </span>
                        </div>
                        {presence.status === "online" && <span className="ig-active-dot" />}
                      </div>

                      <div className="ig-contact-info">
                        <div className="ig-contact-name-row">
                          <span className={`ig-contact-name ${hasUnread ? "font-bold text-white" : ""}`}>
                            {emp.name}
                          </span>
                          {timeStr && (
                            <span className={`ig-contact-time font-mono ${hasUnread ? "has-unread" : ""}`}>
                              {timeStr}
                            </span>
                          )}
                        </div>
                        <div className="ig-contact-preview-row">
                          <span className={`ig-contact-preview ${hasUnread ? "is-unread" : ""}`}>
                            {emp.latest_message ? (
                              <>
                                {isSentByMe && (
                                  <CheckCheck size={14} className="whatsapp-sent-ticks inline-icon" />
                                )}
                                <span className={isSentByMe ? "ig-you-tag" : "text-primary font-medium"}>
                                  {senderPrefix}
                                </span>
                                <span>{latestSnippet}</span>
                              </>
                            ) : (
                              <span className="text-muted">{latestSnippet}</span>
                            )}
                          </span>
                          {hasUnread && (
                            <span className="whatsapp-unread-badge font-mono" title={`${unreadCount} new unread message(s)`}>
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: ALL EMPLOYEES DIRECTORY (Dhanush can easily browse all colleagues) */}
          {sidebarTab === "directory" && (
            <div className="all-employees-chat-directory">
              {allEmployeesList.length === 0 ? (
                <div className="text-center py-10 text-muted text-sm px-4">
                  No employees found matching filter.
                </div>
              ) : (
                allEmployeesList.map((emp) => {
                  const isSelected = Number(activeContact?.id) === Number(emp.id);
                  const presence = getEmployeePresence(emp);

                  return (
                    <div
                      key={`dir-${emp.id}`}
                      className={`directory-emp-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        handleSelectContact(emp);
                        setSidebarTab("recent");
                      }}
                    >
                      <div className="ig-contact-avatar-wrap">
                        <div className="ig-contact-avatar">
                          {emp.profile_image ? (
                            <img src={emp.profile_image} alt={emp.name} />
                          ) : (
                            <span>{emp.name.charAt(0)}</span>
                          )}
                        </div>
                        {presence.status === "online" && <span className="ig-active-dot" />}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm text-primary-light truncate">{emp.name}</div>
                        <div className="text-xs text-muted truncate">
                          {emp.designation || "Software Specialist"} • {emp.department_name || "Engineering"}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-chat-direct font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectContact(emp);
                          setSidebarTab("recent");
                        }}
                      >
                        💬 Chat
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Side: WhatsApp-Styled Conversation Feed */}
        <div className={`ig-chat-main whatsapp-chat-feed ${showMobileList ? "hide-on-mobile-chat" : ""}`}>
          {activeContact ? (
            <>
              {/* WhatsApp Active Top Bar */}
              <div className="ig-active-header whatsapp-active-header">
                <div className="ig-header-left">
                  <button
                    className="ig-mobile-back-btn mobile-only"
                    onClick={() => setShowMobileList(true)}
                    title="Back to contacts"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="ig-header-avatar-wrap">
                    <div className="ig-header-avatar">
                      {activeContact.profile_image ? (
                        <img
                          src={activeContact.profile_image}
                          alt={activeContact.name}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span style={{ display: activeContact.profile_image ? "none" : "flex" }}>
                        {activeContact.name.charAt(0)}
                      </span>
                    </div>
                    {activePresence?.status === "online" && <span className="ig-active-dot" />}
                  </div>

                  <div className="ig-header-info">
                    <h4 className="ig-header-name">
                      {activeContact.name}
                      <span className="ig-header-role-pill">{activeContact.designation || "Staff"}</span>
                    </h4>
                    <span className="ig-header-presence">
                      {activePresence?.status === "online" ? "online" : activePresence?.label}
                    </span>
                  </div>
                </div>

                <div className="ig-header-actions">
                  <button className="ig-icon-action-btn" title="Voice call">
                    <Phone size={18} />
                  </button>
                  <button className="ig-icon-action-btn" title="Video conference">
                    <Video size={19} />
                  </button>
                  <button className="ig-icon-action-btn" title="Contact info">
                    <Info size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Container with WhatsApp Background Pattern */}
              <div className="ig-messages-container whatsapp-wallpaper">
                {/* Hero profile box */}
                <div className="ig-conversation-hero">
                  <div className="ig-hero-avatar">
                    {activeContact.profile_image ? (
                      <img src={activeContact.profile_image} alt={activeContact.name} />
                    ) : (
                      <span>{activeContact.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="ig-hero-name">{activeContact.name}</h3>
                  <p className="ig-hero-meta">{activeContact.designation} • Dhanush Softwares Private Network</p>
                  <div className="ig-hero-encrypted-badge font-mono">
                    <ShieldCheck size={12} className="text-success" />
                    <span>Messages are end-to-end encrypted across enterprise nodes</span>
                  </div>
                </div>

                {/* Message Group Feed with WhatsApp Date Dividers */}
                {messages.length === 0 ? (
                  <div className="ig-empty-hint">
                    No conversation history yet. Send a greeting or sprint update below!
                  </div>
                ) : (
                  groupedMessageBlocks.map((block, idx) => {
                    if (block.type === "date_divider") {
                      return (
                        <div key={`divider-${idx}`} className="whatsapp-date-divider-wrap">
                          <span className="whatsapp-date-divider font-mono">
                            {formatDividerDate(block.date)}
                          </span>
                        </div>
                      );
                    }

                    const m = block.data;
                    const loggedInId = Number(user?.id || 1);
                    const loggedInName = (user?.name || "").trim().toLowerCase();
                    const loggedInEmail = (user?.email || "").trim().toLowerCase();

                    const msgSenderId = Number(m.sender_id || 0);
                    const msgSenderName = (m.sender_name || "").trim().toLowerCase();

                    const isMe =
                      (msgSenderId > 0 && msgSenderId === loggedInId) ||
                      (msgSenderName && loggedInName && msgSenderName === loggedInName) ||
                      (loggedInEmail && m.sender_email && m.sender_email.toLowerCase() === loggedInEmail) ||
                      (loggedInId === 1 && msgSenderId === 1);

                    const msgContent = m.message || m.text || "";
                    const isLiked = likedMessages[m.id];
                    const time = new Date(m.created_at || Date.now()).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    });

                    return (
                      <div
                        key={m.id || `msg-${idx}`}
                        className={`ig-message-row whatsapp-bubble-row ${isMe ? "outgoing" : "incoming"}`}
                      >
                        {!isMe && (
                          <div className="ig-bubble-avatar">
                            {activeContact.name.charAt(0)}
                          </div>
                        )}

                        <div className="ig-bubble-wrapper whatsapp-bubble-wrapper">
                          <div
                            className={`ig-bubble whatsapp-bubble ${isMe ? "whatsapp-bubble-outgoing" : "whatsapp-bubble-incoming"}`}
                            onDoubleClick={() => toggleHeartMessage(m.id)}
                            title="Double click to like ❤️"
                          >
                            {!isMe && (
                              <div className="whatsapp-bubble-sender-name font-semibold text-xs text-primary mb-1">
                                {m.sender_name || activeContact.name || "Colleague"}
                              </div>
                            )}

                            <span className="ig-bubble-text">{msgContent}</span>

                            {/* WhatsApp Timestamp & Blue Double Checkmarks inside bubble */}
                            <div className="whatsapp-bubble-tail-meta font-mono">
                              <span className="tail-time">{time}</span>
                              {isMe && (
                                <CheckCheck size={14} className="whatsapp-double-check text-blue" />
                              )}
                            </div>

                            {/* Floating Heart Reaction Pill */}
                            {isLiked && (
                              <div
                                className="ig-bubble-reaction-badge animate-scale-up"
                                onClick={() => toggleHeartMessage(m.id)}
                                title="Remove reaction"
                              >
                                ❤️
                              </div>
                            )}
                          </div>

                          <div className="ig-bubble-meta">
                            <button
                              type="button"
                              className={`ig-heart-react-btn ${isLiked ? "is-active" : ""}`}
                              onClick={() => toggleHeartMessage(m.id)}
                              title={isLiked ? "Liked" : "Like message"}
                            >
                              <Heart
                                size={12}
                                fill={isLiked ? "#f43f5e" : "none"}
                                color={isLiked ? "#f43f5e" : "currentColor"}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Quick Bar */}
              {showEmojiPicker && (
                <div className="ig-emoji-quickbar animate-scale-up">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="ig-quick-emoji-btn"
                      onClick={() => handleSendMessage(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* WhatsApp Style Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="ig-input-bar-container whatsapp-input-container"
              >
                <div className="ig-input-pill whatsapp-input-pill">
                  <button
                    type="button"
                    className="ig-pill-icon-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Insert emoji / reactions"
                  >
                    <Smile size={20} />
                  </button>

                  <input
                    type="text"
                    className="ig-text-input"
                    placeholder={`Type a message to ${activeContact.name.split(" ")[0]}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                  />

                  {inputText.trim() ? (
                    <button
                      type="submit"
                      className="whatsapp-send-circle-btn font-semibold"
                      title="Send message"
                    >
                      <Send size={16} />
                    </button>
                  ) : (
                    <div className="ig-pill-trailing-icons">
                      <button
                        type="button"
                        className="ig-pill-icon-btn"
                        title="Attach sprint deliverable / file"
                        onClick={() => handleSendMessage("📁 Shared Sprint Architecture Document")}
                      >
                        <Paperclip size={18} />
                      </button>
                      <button
                        type="button"
                        className="ig-pill-icon-btn"
                        title="Voice audio note"
                        onClick={() => handleSendMessage("🎙️ Voice note (0:15)")}
                      >
                        <Mic size={18} />
                      </button>
                      <button
                        type="button"
                        className="ig-pill-icon-btn ig-quick-heart-btn"
                        title="Send heart reaction"
                        onClick={sendQuickHeart}
                      >
                        <Heart size={19} className="text-rose" />
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="ig-no-selection whatsapp-no-selection">
              <div className="whatsapp-empty-icon-wrap">
                <MessageSquare size={52} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary-light">Dhanush Softwares Team Messenger</h3>
              <p className="text-sm text-secondary max-w-md">
                Select a colleague from <strong>Recent Chats</strong> or browse <strong>All Employees</strong> directory to initiate real-time sprint conversations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
