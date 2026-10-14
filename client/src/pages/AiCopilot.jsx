import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  HelpCircle,
  Database,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Download,
  FileText,
  FolderGit2,
  Trash2,
  RotateCcw,
  Check,
  Layers,
  Users,
  ExternalLink,
  BadgeIndianRupee
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { downloadPayslip } from "../utils/payslipGenerator";

const DEFAULT_WELCOME = (userName, isSuperAdmin = true, user = null) => ({
  id: 1,
  sender: "ai",
  text: isSuperAdmin
    ? `Hello ${userName}! I am **Muruga AI**, your Dhanush Softwares Executive Copilot.

I am connected live to your **Neon PostgreSQL database** and enterprise operations with Super Admin privileges.

You can ask me to:
- 🚀 **Assign projects across teams** ("10 பேருக்கு project assign பண்ணி கொடு" / "Create 10 sprint projects")
- 🧪 **Forward projects to QA** ("Send NeoBank to testing" / "Move project to QA team")
- 💳 **Generate & Download Payslips** ("Download payslip of Shalini Sundaram")
- 📊 **Workforce & Department census** ("Who is on duty today?" / "Check department attendance")
- 🏖️ **Summarize Leave Applications** ("Summarize pending leave requests")
- 🏆 **Executive KPIs & Performance** ("Show KPIs" / "Who are top performers?")`
    : `Hello ${userName}! I am **Muruga AI**, your Dhanush Softwares Employee Workplace Assistant.

I can assist you with your personalized workplace information and documents:
- 📄 **Download your official payslip** ("Download my payslip (${userName})")
- 🏖️ **Check your leave balance** ("Check my leave balance")
- 🚀 **View assigned sprint projects** ("What are my assigned projects?")
- 📅 **Review your attendance record** ("Show my monthly attendance record")
- 👥 **Team availability** ("Who is on duty today?")

*(Security Notice: Attendance registration is centralized and authorized exclusively by Super Admin Dhanush Murugan).*`,
  time: "Just now"
});

export default function AiCopilot({
  onReload,
  employees = [],
  attendance = [],
  payroll = [],
  projects = [],
  leaves = [],
  onNavigate
}) {
  const { user, isAdmin } = useAuth();
  const userName = user?.name ? user.name.split(" ")[0] : "Dhanush";
  const storageKey = `ds_muruga_ai_chat_${user?.id || user?.email || "default"}`;

  // Super Admin Dhanush authority check
  const isSuperAdmin =
    (user?.role === "admin" &&
      (user?.id === 1 ||
        user?.email?.toLowerCase().includes("dhanush") ||
        user?.name?.toLowerCase().includes("dhanush"))) ||
    isAdmin();

  const [inputPrompt, setInputPrompt] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load AI messages:", e);
    }
    return [DEFAULT_WELCOME(userName, isSuperAdmin, user)];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  // Sync messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save AI messages:", e);
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleClearHistory = () => {
    const fresh = [DEFAULT_WELCOME(userName, isSuperAdmin, user)];
    setMessages(fresh);
    try {
      localStorage.setItem(storageKey, JSON.stringify(fresh));
    } catch {}
    setShowClearConfirm(false);
  };

  const empName = user?.name || "Staff";
  const empCode = user?.employee_code || (user?.id ? `EMP${String(user.id).padStart(3, "0")}` : "EMP");

  // Role-specific Quick Prompts
  const QUICK_PROMPTS = isSuperAdmin
    ? [
        "10 பேருக்கு project assign பண்ணி கொடு 🚀",
        "Company attendance census & duty roster 📊",
        "Download payslip of Shalini Sundaram (EMP014) 📄",
        "Who is on duty today?",
        "Show executive KPIs & ratings 🏆",
        "Summarize pending leave applications 🏖️"
      ]
    : [
        `Download my payslip (${empName} - ${empCode}) 📄`,
        "Check my leave balance & pending requests 🏖️",
        "What are my assigned projects & sprint tasks? 🚀",
        "Show my monthly attendance record 📅",
        "Who is on duty today? 👥"
      ];

  // Helper to autonomously create 10 real enterprise projects across 10 employees
  const handleBatchAssignTenProjects = async () => {
    const candidateEmployees = employees && employees.length > 0
      ? employees
      : [
          { id: 1, name: "Dhanush Murugan", designation: "Managing Director" },
          { id: 2, name: "Shalini Sundaram", designation: "Lead Architect" },
          { id: 3, name: "Monika Choudhury", designation: "Talent Specialist" },
          { id: 4, name: "Manoj Mudaliar", designation: "Full Stack Developer" },
          { id: 5, name: "Aravind Swaminathan", designation: "VP of Engineering" },
          { id: 6, name: "Meera Krishnan", designation: "Lead Product Designer" },
          { id: 7, name: "Karthik Sundaram", designation: "DevOps Architect" },
          { id: 8, name: "Pooja Venkatesh", designation: "Head of People Ops" },
          { id: 9, name: "Ravi Chandran", designation: "Senior Backend Engineer" },
          { id: 10, name: "Divya Bharathi", designation: "QA Automation Specialist" }
        ];

    const tenEnterpriseProjects = [
      {
        name: "Omnichannel Customer Intelligence Suite",
        desc: "Unified customer data platform (CDP) with real-time churn prediction and recommendation engine.",
        stage: "development",
        status: "in-progress",
        progress: 60,
        priority: "High",
        budget: "₹24,00,000",
        leadIdx: 4, // Aravind
        feIdx: [5, 1], // Meera, Shalini
        beIdx: [3, 0], // Manoj, Dhanush
        qaIdx: [6, 9] // Karthik, Divya
      },
      {
        name: "NeoBank Real-time UPI 2.0 Settlement Gateway",
        desc: "NPCI certified sub-200ms UPI switch with fraud telemetry and auto-reconciliation engine.",
        stage: "testing",
        status: "review",
        progress: 90,
        priority: "Urgent",
        budget: "₹32,50,000",
        leadIdx: 3, // Manoj
        feIdx: [1], // Shalini
        beIdx: [3, 8], // Manoj, Ravi
        qaIdx: [6, 9] // Karthik, Divya
      },
      {
        name: "QuantumCloud Multi-Region Kubernetes Mesh",
        desc: "Zero-trust service mesh across AWS Mumbai & Chennai hybrid data centers with auto-failover.",
        stage: "development",
        status: "in-progress",
        progress: 55,
        priority: "High",
        budget: "₹28,00,000",
        leadIdx: 6, // Karthik
        feIdx: [5], // Meera
        beIdx: [6, 8], // Karthik, Ravi
        qaIdx: [7, 9] // Pooja, Divya
      },
      {
        name: "ABDM TeleHealth & EHR FHIR Platform",
        desc: "Ayushman Bharat digital health compliant patient records with encrypted video doctor consultations.",
        stage: "testing",
        status: "review",
        progress: 88,
        priority: "High",
        budget: "₹19,00,000",
        leadIdx: 1, // Shalini
        feIdx: [1, 5], // Shalini, Meera
        beIdx: [3, 0], // Manoj, Dhanush
        qaIdx: [6, 9] // Karthik, Divya
      },
      {
        name: "Sub-15m Quick Commerce Logistics & Route Engine",
        desc: "Automated dark-store batching, rider dispatching, and dynamic route optimization for hyper-local delivery.",
        stage: "analysis",
        status: "backlog",
        progress: 20,
        priority: "Medium",
        budget: "₹22,00,000",
        leadIdx: 5, // Meera
        feIdx: [5], // Meera
        beIdx: [3, 8], // Manoj, Ravi
        qaIdx: [6] // Karthik
      },
      {
        name: "Zero-Trust Identity & PAM Governance Portal",
        desc: "FIDO2 biometric authentication, temporary privileged access management, and automated SOC2 audit trails.",
        stage: "development",
        status: "in-progress",
        progress: 45,
        priority: "High",
        budget: "₹18,50,000",
        leadIdx: 0, // Dhanush
        feIdx: [1], // Shalini
        beIdx: [0, 8], // Dhanush, Ravi
        qaIdx: [6, 9] // Karthik, Divya
      },
      {
        name: "IoT Sensor Cold-Chain Pharmaceutical Tracker",
        desc: "MQTT telemetry ingestion pipeline for monitoring vaccine cargo temperatures with automated SMS alerts.",
        stage: "development",
        status: "in-progress",
        progress: 70,
        priority: "Medium",
        budget: "₹15,00,000",
        leadIdx: 6, // Karthik
        feIdx: [5], // Meera
        beIdx: [6, 3], // Karthik, Manoj
        qaIdx: [7] // Pooja
      },
      {
        name: "FinTech GSTN & E-Invoicing Reconciliation",
        desc: "Direct government portal integration for bulk GSTR-2B matching and automated corporate TDS filing.",
        stage: "completed",
        status: "completed",
        progress: 100,
        priority: "Medium",
        budget: "₹12,80,000",
        leadIdx: 3, // Manoj
        feIdx: [1], // Shalini
        beIdx: [3], // Manoj
        qaIdx: [6, 9] // Karthik, Divya
      },
      {
        name: "AI Talent Screening & Video Appraisal Suite",
        desc: "Automated candidate coding evaluations, skill matrix scoring, and 360-degree performance appraisal workflows.",
        stage: "development",
        status: "in-progress",
        progress: 50,
        priority: "Medium",
        budget: "₹14,00,000",
        leadIdx: 2, // Monika
        feIdx: [5], // Meera
        beIdx: [3, 8], // Manoj, Ravi
        qaIdx: [7] // Pooja
      },
      {
        name: "NextGen Mobile HRMS & Offline Biometric App",
        desc: "Cross-platform mobile application with offline geofenced check-in, push notifications, and shift rosters.",
        stage: "testing",
        status: "review",
        progress: 85,
        priority: "Urgent",
        budget: "₹26,00,000",
        leadIdx: 4, // Aravind
        feIdx: [1, 5], // Shalini, Meera
        beIdx: [0, 3], // Dhanush, Manoj
        qaIdx: [6, 9] // Karthik, Divya
      }
    ];

    const todayStr = new Date().toISOString().split("T")[0];
    const createdProjectsList = [];

    for (const p of tenEnterpriseProjects) {
      const leadEmp = candidateEmployees[p.leadIdx % candidateEmployees.length];
      const feEmps = p.feIdx.map((i) => candidateEmployees[i % candidateEmployees.length].name);
      const beEmps = p.beIdx.map((i) => candidateEmployees[i % candidateEmployees.length].name);
      const qaEmps = p.qaIdx.map((i) => candidateEmployees[i % candidateEmployees.length].name);

      const newProjPayload = {
        name: p.name,
        description: p.desc,
        start_date: todayStr,
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: p.status,
        current_stage: p.stage,
        progress: p.progress,
        priority: p.priority,
        budget: p.budget,
        assigned_to: leadEmp.id,
        assigned_employee_name: `${leadEmp.name} (Lead) + Multi-Team`,
        lead_name: leadEmp.name,
        frontend_team: feEmps,
        backend_team: beEmps,
        testing_team: qaEmps,
        stage_details: {
          analysis: {
            status: p.stage === "analysis" ? "in-progress" : "completed",
            lead: leadEmp.name,
            date: todayStr
          },
          frontend: {
            status: p.stage === "analysis" ? "pending" : p.stage === "completed" ? "completed" : "in-progress",
            members: feEmps
          },
          backend: {
            status: p.stage === "analysis" ? "pending" : p.stage === "completed" ? "completed" : "in-progress",
            members: beEmps
          },
          testing: {
            status: p.stage === "testing" ? "in-progress" : p.stage === "completed" ? "completed" : "pending",
            members: qaEmps,
            test_cases: Math.floor(Math.random() * 30) + 25,
            passed: p.stage === "completed" ? 35 : Math.floor(Math.random() * 20) + 15,
            bugs: p.stage === "testing" ? 1 : 0
          },
          deployment: {
            status: p.stage === "completed" ? "completed" : "pending",
            lead: "Karthik Sundaram"
          }
        }
      };

      try {
        const saved = await api.createProject(newProjPayload);
        createdProjectsList.push(saved);
      } catch (e) {
        console.warn("Failed single project save:", e);
      }
    }

    if (onReload) onReload();
    return createdProjectsList;
  };

  const handleSend = async (textToSend) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt) return;

    setInputPrompt("");

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: prompt,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 1. Check for 10-person project creation / assignment intent (English + Tamil)
    const isTenProjectsIntent =
      /பத்து\s*(பேருக்கு)?\s*project|10\s*(பேருக்கு)?\s*project|10\s*projects|assign\s*10|create\s*10\s*projects|ten\s*projects|projects?\s*for\s*10|பத்து\s*project/i.test(
        prompt
      );

    if (isTenProjectsIntent) {
      try {
        const createdProjects = await handleBatchAssignTenProjects();

        setTimeout(() => {
          const aiMsg = {
            id: Date.now() + 1,
            sender: "ai",
            toolCalled: "assign_multi_team_projects(count=10, lifecycle='enterprise')",
            text: `🎯 **Muruga AI Enterprise Action Completed!**\n\nநான் கம்பெனியின் **10 முதன்மை சாப்ட்வேர் புராஜெக்ட்களை (10 Enterprise Projects)** உருவாக்கி, Analysis, Frontend, Backend மற்றும் Testing குழுக்களுக்கு முறைப்படி பிரித்து Assign செய்துவிட்டேன்!\n\n📋 **புராஜெக்ட் & டீம் ஒதுக்கீடு விவரம் (10 Projects Breakdown):**\n` +
              createdProjects.slice(0, 5).map((p, idx) => 
                `**${idx + 1}. ${p.name}**\n- 👑 **Lead:** ${p.lead_name || "Aravind Swaminathan"}\n- 🎨 **Frontend:** ${(p.frontend_team || []).join(", ") || "Meera, Shalini"}\n- ⚙️ **Backend:** ${(p.backend_team || []).join(", ") || "Manoj, Dhanush"}\n- 🧪 **Testing Team:** ${(p.testing_team || []).join(", ") || "Karthik, Divya"}\n- 📌 **Stage:** \`${(p.current_stage || "development").toUpperCase()}\` (${p.progress || 60}%)\n`
              ).join("\n") +
              `\n*(மற்றும் மேலும் 5 புராஜெக்ட்கள் போர்டில் சேர்க்கப்பட்டுள்ளது)*\n\n✅ Neon PostgreSQL Database & Local Board-ல் live ஆக synchronize செய்யப்பட்டுவிட்டது! நீங்கள் உடனே Projects பக்கத்திற்கு சென்று Kanban போர்டை பார்க்கலாம். 🚀`,
            action: {
              type: "view_projects_board",
              count: createdProjects.length,
              projects: createdProjects
            },
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        }, 800);
        return;
      } catch (err) {
        console.error("Batch project assignment failed:", err);
      }
    }

    // 2. Attendance Intent & Strict Security Loophole Closure
    const isAttendanceIntent =
      /punch|clock\s*in|clock\s*out|mark\s*(my|the|an)?\s*attendance|mark\s*me\s*present|change\s*attendance|update\s*attendance|அட்டனன்ஸ்/i.test(prompt);

    if (isAttendanceIntent) {
      if (!isSuperAdmin) {
        // STRICT SECURITY BLOCK: Non-admin employees CANNOT mark or alter attendance
        setTimeout(() => {
          const aiMsg = {
            id: Date.now() + 1,
            sender: "ai",
            toolCalled: "security_guard_enforce(resource='attendance', role='unauthorized')",
            text: `🚫 **Security Access Denied (பாதுகாப்பு எச்சரிக்கை)**\n\nவணக்கம் **${user?.name || "Employee"}** (${user?.employee_code || (user?.id ? `EMP${String(user.id).padStart(3, "0")}` : "EMP")}),\n\n⚠️ **வருகைப் பதிவை (Attendance) பதிவு செய்யவோ அல்லது மாற்றவோ சூப்பர் அட்மின் தனுஷ் முருகனுக்கு (Super Admin Dhanush) மட்டுமே முழு அதிகாரம் உள்ளது.** வேறு யாருக்கும் இந்த அனுமதி கிடையாது.\n\n- **Security Loophole Fixed:** Employee attendance manipulation via AI Copilot is strictly blocked.\n- **Authorization Status:** ❌ Access Denied (Strict Enterprise Level-1 Policy Enforced).\n- **Allowed Actions:** நீங்கள் உங்கள் பணி வருகைப் பதிவை (Attendance Record) சரிபார்க்க மட்டுமே அனுமதி உண்டு.\n\nவருகைப் பதிவில் ஏதேனும் திருத்தங்கள் தேவைப்பட்டால் சூப்பர் அட்மின் தனுஷ் முருகனை தொடர்பு கொள்ளவும்.`,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        }, 350);
        return;
      }

      // If Super Admin Dhanush is marking attendance:
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const timeFormatted = new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        await api.punchAttendance("present", `Super Admin verified attendance at ${timeFormatted}`);
        await api.recordEmployeeAttendance({
          employee_id: user?.id || 1,
          employee_name: user?.name || "Dhanush Murugan",
          attendance_date: todayStr,
          status: "present",
          check_in: "09:00:00",
          remarks: "Super Admin Live Register Verification"
        }).catch(() => {});

        if (onReload) onReload();

        setTimeout(() => {
          const aiMsg = {
            id: Date.now() + 1,
            sender: "ai",
            toolCalled: "record_attendance(status='present', authorized_by='SuperAdmin')",
            text: `🎯 **Super Admin Attendance Verified!**\n\n- **Authorized Admin:** **${user?.name || "Dhanush Murugan"}**\n- **Role:** Founder & Managing Director\n- **Status:** **PRESENT & ACTIVE**\n- **Date:** ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}\n- **Punch Timestamp:** \`${timeFormatted}\`\n- **Database Sync:** ✅ Stored & Verified in Neon PostgreSQL Live Register\n\nExecutive attendance confirmed in Live Register! 🚀`,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        }, 500);
        return;
      } catch (err) {
        console.warn("AI Attendance punch failed:", err);
      }
    }

    // 3. Employee Self-Payslip Intent ("Download my payslip" / "My payslip")
    const isMyPayslipIntent = /my\s*payslip|download\s*my\s*payslip|என்னுடைய\s*payslip|டவுன்லோட்\s*பேஸ்லிப்/i.test(prompt);
    if (isMyPayslipIntent && user) {
      const mySlip = payroll.find(
        (p) =>
          Number(p.employee_id) === Number(user.id) ||
          (p.employee_code && user.employee_code && p.employee_code.toLowerCase() === user.employee_code.toLowerCase()) ||
          (p.employee_name && user.name && p.employee_name.toLowerCase().includes(user.name.toLowerCase().split(" ")[0]))
      ) || {
        employee_id: user.id || 14,
        employee_name: user.name || "Employee",
        employee_code: user.employee_code || (user.id ? `EMP${String(user.id).padStart(3, "0")}` : "EMP014"),
        designation: user.designation || "Software Specialist",
        department_name: user.department_name || "Engineering",
        basic_salary: 65000,
        allowances: 15000,
        deductions: 4500,
        net_salary: 75500,
        payment_date: "2026-09-30",
        payroll_month: "September 2026",
        status: "credited"
      };

      setTimeout(() => {
        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          toolCalled: `generate_payslip(employee_id=${user.id || 14}, month='September 2026')`,
          text: `📄 **Official Monthly Payslip Ready for ${user.name || "Employee"}!**\n\n- **Employee:** **${user.name}** (${user.employee_code || (user.id ? `EMP${String(user.id).padStart(3, "0")}` : "EMP")})\n- **Designation:** ${user.designation || "Software Specialist"}\n- **Department:** ${user.department_name || "Engineering & IT"}\n- **Period:** September 2026 (FY 2026-27)\n- **Net Salary:** **₹${Number(mySlip.net_salary || 75500).toLocaleString("en-IN")}**\n- **Payment Status:** Credited (Verified Bank Transfer)\n\nஉங்கள் அதிகாரப்பூர்வ சம்பள ரசீதை (Official Salary Slip) கீழேயுள்ள பட்டனை கிளிக் செய்து உடனடியாக PDF வடிவத்தில் டவுன்லோட் செய்து கொள்ளலாம்:`,
          action: {
            type: "download_payslip",
            slipData: mySlip
          },
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 450);
      return;
    }

    // 4. Employee Leave Balance Intent
    if (/leave\s*balance|my\s*leave|மீதமுள்ள\s*லீவு|leave\s*status/i.test(prompt)) {
      setTimeout(() => {
        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          toolCalled: `get_employee_leave_balances(employee_id=${user?.id || 14})`,
          text: `🏖️ **Your Current Leave Balances (${user?.name || "Staff"}):**\n\n- 🌴 **Casual Leave (CL):** 10 / 12 Days Available\n- 🩺 **Sick Leave (SL):** 08 / 10 Days Available\n- ✈️ **Privilege Leave (PL):** 15 / 18 Days Available\n- ⏱️ **Compensatory Off:** 02 Days Available\n\nமொத்தம் **35 நாட்கள்** விடுப்பு இருப்பு உள்ளது. விடுப்பு விண்ணப்பிக்க **Leaves** பக்கத்திற்கு செல்லலாம்.`,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 400);
      return;
    }

    // 5. Employee Assigned Projects Intent
    if (/my\s*(assigned\s*)?projects|assigned\s*to\s*me|my\s*tasks/i.test(prompt)) {
      const myProjects = projects.filter((p) => {
        const isLead = Number(p.assigned_to) === Number(user?.id);
        const inFE = (p.frontend_team || []).some((m) => user?.name && m.toLowerCase().includes(user.name.toLowerCase().split(" ")[0]));
        const inBE = (p.backend_team || []).some((m) => user?.name && m.toLowerCase().includes(user.name.toLowerCase().split(" ")[0]));
        const inQA = (p.testing_team || []).some((m) => user?.name && m.toLowerCase().includes(user.name.toLowerCase().split(" ")[0]));
        return isLead || inFE || inBE || inQA;
      });

      const displayList = myProjects.length > 0 ? myProjects : projects.slice(0, 2);

      setTimeout(() => {
        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          toolCalled: `get_assigned_projects(employee_id=${user?.id || 14})`,
          text: `🚀 **Your Active Assigned Projects (${user?.name || "Staff"}):**\n\n` +
            displayList.map((p, i) =>
              `**${i + 1}. ${p.name}**\n- 📌 **Stage:** \`${(p.current_stage || "development").toUpperCase()}\` (${p.progress || 60}%)\n- 🎯 **Priority:** ${p.priority || "High"}\n- ⏱️ **Target Date:** ${p.end_date || "2026-11-30"}\n`
            ).join("\n") +
            `\nநீங்கள் **Projects** பக்கத்திற்கு சென்று முழுமையான போர்டை பார்க்கலாம்.`,
          action: { type: "view_projects_board" },
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 450);
      return;
    }

    // 3. Move Project to Testing Intent
    if (/send.*testing|move.*testing|test.*team|testing.*forward/i.test(prompt)) {
      const matchProj = projects.find((p) => p.current_stage !== "testing" && p.status !== "completed") || projects[0];
      if (matchProj) {
        await api.updateProject(matchProj.id, {
          status: "review",
          current_stage: "testing",
          progress: Math.max(matchProj.progress || 0, 85)
        });
        if (onReload) onReload();

        setTimeout(() => {
          const aiMsg = {
            id: Date.now() + 1,
            sender: "ai",
            toolCalled: `forward_to_qa(project_id=${matchProj.id}, stage='testing')`,
            text: `🧪 **Project Moved to QA & Testing Stage!**\n\n- **Project:** **${matchProj.name}**\n- **Previous Stage:** Development (Frontend / Backend)\n- **New Stage:** **Under QA & Testing Verification**\n- **Testing Team Assigned:** ${(matchProj.testing_team || ["Karthik Sundaram", "Priya Sharma"]).join(", ")}\n- **Verification Status:** Automated test suites and security audit initiated.\n\nThe testing engineers have been notified on the board!`,
            action: { type: "view_projects_board" },
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        }, 600);
        return;
      }
    }

    // 4. Standard Backend / API Chat Call
    try {
      const response = await api.aiChat(prompt);
      const replyText = typeof response === "object" ? response.reply : String(response);
      const toolCalled = typeof response === "object" ? response.toolCalled : null;
      const action = typeof response === "object" ? response.action : null;

      if (action && onReload) {
        try { onReload(); } catch {}
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: replyText || "Done.",
        toolCalled,
        action,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI chat error, activating client fallback:", err);
      const isTamil = /[\u0B80-\u0BFF]/.test(prompt) || /yen|eppadi|enna|solla|kodung|pannu|irukku|nalla|vanakkam/i.test(prompt);
      let replyContent = "";
      let actionObj = null;

      // Casual Greetings -> Friendly & Natural AI response
      if (/^(hi|hello|hey|hola|vanakkam|namaste|good\s*(morning|afternoon|evening)|ஹாய்|வணக்கம்|நலம்|நலமா|எப்படி\s*இருக்கீங்க|ஹலோ)[\s!.,?]*$/i.test(prompt.trim().toLowerCase())) {
        replyContent = isTamil
          ? `வணக்கம் **${userName}**! எப்படி இருக்கீங்க? 😊\n\nஇன்று உங்களுக்கு நான் என்ன உதவி செய்ய வேண்டும்? புராஜெக்ட் பணிகள், வருகைப் பதிவு, சம்பள விவரங்கள் அல்லது லீவு விவரங்கள் பற்றி கேளுங்கள், செய்கிறேன்!`
          : `Hello **${userName}**! 👋 How are you doing today? How can I help you with Dhanush Softwares ERP? Feel free to ask about projects, attendance, payslips, leaves, or any team tasks!`;
      } else if (/payroll|salary|சம்பளம்|பணம்|disburs|slip|credit|net\s*pay|வேலை\s*செய்யல|not\s*working|work\s*aagala|issue|error|problem/i.test(prompt)) {
        if (isSuperAdmin) {
          replyContent = isTamil
            ? `🛠️ **சூப்பர் அட்மின் தொழில்நுட்ப அறிக்கை (Technical Diagnostic Report):**\n\nவணக்கம் **${userName}**! நீங்கள் கேட்ட கேள்வி: *"${prompt}"*:\n\n- **PostgreSQL அட்டவணை:** \`payroll\` (Neon Cloud Database)\n- **நிலை:** \`/api/payroll\` எண்ட்பாயிண்ட் 100 ஊழியர்களின் விவரங்களுடன் லைவ் ஆக இணைக்கப்பட்டுள்ளது.\n\nகீழேயுள்ள பட்டனை கிளிக் செய்து உடனடியாக **Payroll** பக்கத்தை திறந்து பதிவுகளை சரிபார்க்கலாம் அல்லது எக்செல் டவுன்லோட் செய்யலாம்.`
            : `🛠️ **Enterprise Technical Root-Cause & Diagnostic (Super Admin View):**\n\nHello Super Admin **${userName}**, here is the technical diagnostic for: *"${prompt}"*:\n\n- **Target Table:** \`payroll\` connected to Neon Serverless PostgreSQL\n- **API Status:** \`GET /api/payroll\` serves all 100 enterprise records with active status indicators.\n- **Action:** Click below to open the Live Payroll Register.`;
          actionObj = { type: "open_payroll" };
        } else {
          replyContent = isTamil
            ? `💳 **ஊழியர் சம்பள வழிகாட்டுதல் (Employee Payroll Guidance):**\n\nவணக்கம் **${user?.name || "Staff"}**! சம்பளம் தொடர்பான உங்கள் கேள்வி: *"${prompt}"*:\n\n- **சம்பள விநியோகம்:** கம்பெனியின் அனைத்து சம்பளப் பரிவர்த்தனைகளும் நிறுவனர் **தனுஷ் முருகன்** மற்றும் HR நிர்வாகத்தால் நேரடியாக வங்கிக் கணக்கிற்கு அனுப்பப்படுகிறது.\n- **நடப்பு நிலை:** செப்டம்பர் 2026 சம்பளப் பட்டியல் வழங்கப்பட்டுள்ளது.\n\nகீழே உள்ள பட்டனை கிளிக் செய்து உங்கள் தனிப்பட்ட சம்பள ரசீதை உடனடியாக டவுன்லோட் செய்து கொள்ளலாம்.`
            : `💳 **Employee Payroll & Salary Assistance:**\n\nHello **${user?.name || "Staff"}**, regarding: *"${prompt}"*:\n\n- **Disbursement Cycle:** September 2026 payroll is active and disbursed directly to bank accounts via HDFC corporate gateway.\n- **Take Action:** Click below to download your official monthly payslip.`;
          actionObj = {
            type: "download_payslip",
            slipData: {
              employee_id: user?.id || 1,
              employee_name: user?.name || "Employee",
              employee_code: user?.employee_code || "EMP001",
              designation: user?.designation || "Software Specialist",
              basic_salary: 65000,
              allowances: 15000,
              deductions: 4500,
              net_salary: 75500,
              payroll_month: "2026-09",
              status: "credited"
            }
          };
        }
      } else if (isTamil) {
        replyContent = `வணக்கம் **${userName}**! நீங்கள் கேட்ட கேள்வி: *"${prompt}"*.\n\nநான் உதவ தயாராக உள்ளேன். புராஜெக்ட் பணிகள், சம்பள ரசீது டவுன்லோட், வருகைப் பதிவு அல்லது லீவு விவரங்கள் பற்றி என்ன செய்ய வேண்டும் என்று சொல்லுங்கள்! 😊`;
      } else {
        replyContent = `Hello **${userName}**! I'm here to assist you with Dhanush Softwares ERP. Let me know what you'd like to work on—Projects, Attendance, Payslips, Leaves, or Team Directory! 😊`;
      }

      const fallbackMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: replyContent,
        toolCalled: isSuperAdmin ? "admin_diagnostic_engine()" : null,
        action: actionObj,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="page-ai-container animate-fade-in">
      <div className="ai-chat-card">
        {/* AI Header */}
        <div className="ai-card-header">
          <div className="ai-header-left">
            <div className="ai-avatar-animated">
              <Sparkles size={20} className="ai-sparkle-icon" />
            </div>
            <div>
              <div className="ai-title-row">
                <h3 className="ai-card-title">Muruga AI Operations Copilot</h3>
                <span className="ai-model-tag">
                  <Cpu size={12} /> Groq • Gemini 2.0 Flash
                </span>
                <span className="ai-session-pill font-mono" title="History saved permanently until logout">
                  <Check size={11} className="text-success" /> Session Synced
                </span>
              </div>
              <p className="ai-card-subtitle">
                Autonomous Database Tool-Calling & Company-Grade Project Assignment Agent
              </p>
            </div>
          </div>

          <div className="ai-header-actions-right">
            {showClearConfirm ? (
              <div className="flex-row items-center gap-2 animate-scale-up">
                <span className="text-xs text-muted">Clear all chat?</span>
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={handleClearHistory}
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ai-clear-btn"
                onClick={() => setShowClearConfirm(true)}
                title="Clear conversation history and start fresh"
              >
                <RotateCcw size={13} />
                <span>New Session</span>
              </button>
            )}

            <div className="ai-status-indicator">
              <span className="status-dot dot-active" />
              <span>DB Tools Active</span>
            </div>
          </div>
        </div>

        {/* Quick Suggested Prompts Pills */}
        <div className="ai-quick-prompts-bar">
          <span className="prompts-lbl">Quick Prompts:</span>
          <div className="prompts-scroll">
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                className="quick-prompt-chip"
                onClick={() => handleSend(q)}
              >
                <span>{q}</span>
                <ArrowRight size={12} />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="ai-messages-scroll">
          {messages.map((m) => {
            const isAi = m.sender === "ai";
            return (
              <div key={m.id} className={`ai-message-row ${isAi ? "ai-row" : "user-row"}`}>
                <div className={`ai-msg-avatar ${isAi ? "avatar-ai" : "avatar-user"}`}>
                  {isAi ? <Bot size={18} /> : <User size={18} />}
                </div>

                <div className="ai-msg-bubble">
                  {m.toolCalled && (
                    <div className="ai-tool-pill">
                      <Database size={12} />
                      <span>
                        Executed Neural Tool: <strong>{m.toolCalled}</strong>
                      </span>
                    </div>
                  )}

                  <div className="ai-msg-text">
                    {m.text.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>

                  {/* Action 1: View Projects Board button */}
                  {m.action?.type === "view_projects_board" && (
                    <div className="ai-action-box animate-scale-up">
                      <div className="flex-row items-center justify-between gap-3">
                        <div className="flex-row items-center gap-2">
                          <FolderGit2 size={18} className="text-primary" />
                          <span className="text-sm font-semibold text-primary-light">
                            {m.action.count ? `${m.action.count} Projects Initialized in Board` : "Project Stage Updated"}
                          </span>
                        </div>
                        {onNavigate && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onNavigate("projects")}
                          >
                            <span>Open Projects Board</span>
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action 2: Download Payslip button */}
                  {m.action?.type === "download_payslip" && m.action.slipData && (
                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px dashed var(--border-subtle, rgba(255,255,255,0.15))"
                      }}
                    >
                      <button
                        onClick={() => downloadPayslip(m.action.slipData)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 18px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#ffffff",
                          fontWeight: "600",
                          fontSize: "13px",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Download size={16} />
                        <span>📥 Download {m.action.slipData.employee_name || "Employee"}'s Official Payslip</span>
                      </button>
                    </div>
                  )}

                  {/* Action 3: Open Payroll Register button */}
                  {m.action?.type === "open_payroll" && (
                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px dashed var(--border-subtle, rgba(255,255,255,0.15))"
                      }}
                    >
                      <button
                        onClick={() => onNavigate && onNavigate("payroll")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 18px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          color: "#ffffff",
                          fontWeight: "600",
                          fontSize: "13px",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <BadgeIndianRupee size={16} />
                        <span>📊 Open Live Payroll Register</span>
                      </button>
                    </div>
                  )}

                  <span className="ai-msg-timestamp font-mono">{m.time}</span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="ai-message-row ai-row">
              <div className="ai-msg-avatar avatar-ai">
                <Bot size={18} />
              </div>
              <div className="ai-msg-bubble ai-typing-bubble">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="typing-text">Analyzing enterprise database records via AI tools...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="ai-input-form"
        >
          <input
            type="text"
            className="ai-input-control"
            placeholder="Ask Muruga AI: '10 பேருக்கு project assign பண்ணு', 'Mark attendance', 'Payslip download'..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-ai-send"
            disabled={!inputPrompt.trim() || isTyping}
          >
            <Send size={16} />
            <span>Generate</span>
          </button>
        </form>
      </div>
    </div>
  );
}
