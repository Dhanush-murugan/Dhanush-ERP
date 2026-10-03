/* =========================================================
   DHANUSH SOFTWARES ERP
   script.js

   Connected with:
   - Neon PostgreSQL backend
   - JWT authentication
   - Employees
   - Attendance
   - Leaves
   - Projects
   - Chat
   - Dashboard
   - Theme
   - Responsive sidebar

   IMPORTANT:
   Replace the COMPLETE old script.js with this file.
========================================================= */

"use strict";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let authToken = localStorage.getItem("erp_token");

let allEmployees = [];
let allAttendance = [];
let allLeaves = [];
let allProjects = [];
let allDepartments = [];

let currentChatUserId = null;
let currentChatMessages = [];

let chatRefreshTimer = null;
let datingChatMode = false;


/* =========================================================
   BASIC HELPERS
========================================================= */

const $ = (id) =>
    document.getElementById(id);


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getInitial(name) {
    return String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase();
}


function isAdmin() {
    return (
        currentUser &&
        String(currentUser.role || "").toLowerCase() === "admin"
    );
}


function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


function todayString() {
    const now = new Date();

    return (
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0")
    );
}


function currentMonthString() {
    const now = new Date();

    return (
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0")
    );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "success") {
    let box = $("toastBox");

    if (!box) {
        box = document.createElement("div");

        box.id = "toastBox";

        box.style.position = "fixed";
        box.style.right = "20px";
        box.style.bottom = "20px";
        box.style.zIndex = "99999";

        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.gap = "10px";

        document.body.appendChild(box);
    }

    const toast = document.createElement("div");

    toast.style.padding = "12px 16px";
    toast.style.borderRadius = "10px";
    toast.style.background =
        type === "error"
            ? "#ef4444"
            : type === "warning"
                ? "#f59e0b"
                : "#10b981";

    toast.style.color = "#fff";
    toast.style.fontSize = "13px";
    toast.style.boxShadow =
        "0 8px 25px rgba(0,0,0,.18)";

    toast.innerHTML =
        `<i class="fa-solid fa-circle-info"></i> ${escapeHTML(message)}`;

    box.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


/* =========================================================
   API HELPER
========================================================= */

async function api(
    url,
    options = {}
) {
    const headers = {
        ...(options.headers || {})
    };

    if (
        options.body &&
        typeof options.body !== "string"
    ) {
        headers["Content-Type"] =
            "application/json";

        options.body =
            JSON.stringify(
                options.body
            );
    }

    if (authToken) {
        headers["Authorization"] =
            `Bearer ${authToken}`;
    }

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (
        response.status === 401
    ) {
        authToken = null;
        localStorage.removeItem(
            "erp_token"
        );

        if (
            currentUser
        ) {
            currentUser = null;
            showLoginScreen();
        }

        throw new Error(
            data.message ||
            "Session expired. Please login again."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "Request failed."
        );
    }

    return data;
}


/* =========================================================
   THEME
========================================================= */

function initTheme() {
    let theme =
        localStorage.getItem(
            "erp_theme"
        );

    if (!theme) {
        theme =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";
    }

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    updateThemeIcon();
}


function toggleTheme() {
    const current =
        document.documentElement.getAttribute(
            "data-theme"
        );

    const next =
        current === "dark"
            ? "light"
            : "dark";

    document.documentElement.setAttribute(
        "data-theme",
        next
    );

    localStorage.setItem(
        "erp_theme",
        next
    );

    updateThemeIcon();
}


function updateThemeIcon() {
    const icon =
        document.querySelector(
            "#themeToggleBtn i"
        );

    if (!icon) return;

    const theme =
        document.documentElement.getAttribute(
            "data-theme"
        );

    if (theme === "dark") {
        icon.className =
            "fa-solid fa-sun";
    } else {
        icon.className =
            "fa-solid fa-moon";
    }
}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {
    const sidebar =
        $("sidebar");

    const overlay =
        $("sidebarOverlay");

    if (!sidebar) return;

    if (
        window.innerWidth <= 850
    ) {
        const open =
            sidebar.classList.contains(
                "open"
            );

        if (open) {
            sidebar.classList.remove(
                "open"
            );

            if (overlay) {
                overlay.style.display =
                    "none";
            }
        } else {
            sidebar.classList.add(
                "open"
            );

            if (overlay) {
                overlay.style.display =
                    "block";
            }
        }
    } else {
        sidebar.classList.toggle(
            "closed"
        );
    }
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

const pageTitles = {
    dashboard: "Dashboard",
    employees: "Employees Directory",
    attendance: "Attendance Tracker",
    leaves: "Leave Management",
    projects: "Projects & Tasks",
    chat: "Chat"
};


function switchTab(tabId) {
    const section =
        $(tabId);

    if (!section) {
        showToast(
            `Page "${tabId}" is not available in index.html.`,
            "warning"
        );

        return;
    }

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(sectionItem => {
            sectionItem.classList.remove(
                "active-section"
            );
        });

    section.classList.add(
        "active-section"
    );


    document
        .querySelectorAll(
            ".nav-links li"
        )
        .forEach(item => {
            item.classList.remove(
                "active"
            );

            const onclick =
                item.getAttribute(
                    "onclick"
                ) || "";

            if (
                onclick.includes(
                    `switchTab('${tabId}')`
                )
            ) {
                item.classList.add(
                    "active"
                );
            }
        });


    const title =
        $("page-header-title");

    if (title) {
        title.innerText =
            pageTitles[tabId] ||
            tabId;
    }


    if (
        window.innerWidth <= 850
    ) {
        const sidebar =
            $("sidebar");

        const overlay =
            $("sidebarOverlay");

        if (sidebar) {
            sidebar.classList.remove(
                "open"
            );
        }

        if (overlay) {
            overlay.style.display =
                "none";
        }
    }


    if (
        tabId === "dashboard"
    ) {
        loadDashboard();
    }

    if (
        tabId === "employees"
    ) {
        loadEmployees();
    }

    if (
        tabId === "attendance"
    ) {
        loadAttendance();
    }

    if (
        tabId === "leaves"
    ) {
        loadLeaves();
    }

    if (
        tabId === "projects"
    ) {
        loadProjects();
    }

    if (
        tabId === "chat"
    ) {
        setupChatUI();
    }
}


/* =========================================================
   AUTH SCREEN
========================================================= */

function showLoginScreen() {
    const login = document.getElementById("loginPage");

    if (login) {
        login.style.display = "flex";
    }

    const pageContainer = document.getElementById("pageContainer");

    if (pageContainer) {
        pageContainer.style.display = "none";
    }

    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.style.display = "none";
    }

    const mainContent = document.querySelector(".main-content");

    if (mainContent) {
        mainContent.style.display = "none";
    }
}


function showMainApp() {
    const login = document.getElementById("loginPage");

    if (login) {
        login.style.display = "none";
    }

    const pageContainer = document.getElementById("pageContainer");

    if (pageContainer) {
        pageContainer.style.display = "";
    }

    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.style.display = "";
    }

    const mainContent = document.querySelector(".main-content");

    if (mainContent) {
        mainContent.style.display = "";
    }
}

/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {
    event.preventDefault();

const email = $("loginEmail")?.value.trim();
const password = $("loginPassword")?.value;
const errorBox = $("loginMessage");

    if (!email || !password) {
        if (errorBox) {
            errorBox.innerText =
                "Enter email and password.";

            errorBox.style.display =
                "block";
        }

        return;
    }


    const button =
        event.submitter ||
        event.target.querySelector(
            "button[type='submit']"
        );

    const oldText =
        button?.innerHTML;


    try {
        if (button) {
            button.disabled =
                true;

            button.innerHTML =
                "Signing in...";
        }

        const data =
            await api(
                "/api/auth/login",
                {
                    method: "POST",
                    body: {
                        email,
                        password
                    }
                }
            );

        authToken =
            data.token;

        localStorage.setItem(
            "erp_token",
            authToken
        );

        currentUser =
            data.user;

        if (errorBox) {
            errorBox.style.display =
                "none";
        }

        showMainApp();

        setupUserUI();

        setDefaultDates();

        await loadEverything();

        showToast(
            "Login successful."
        );

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        if (errorBox) {
            errorBox.innerText =
                error.message ||
                "Invalid credentials.";

            errorBox.style.display =
                "block";
        }

    } finally {
        if (button) {
            button.disabled =
                false;

            button.innerHTML =
                oldText ||
                "Login securely";
        }
    }
}


/* =========================================================
   RESTORE LOGIN SESSION
========================================================= */

async function restoreSession() {
    if (!authToken) {
        showLoginScreen();
        return;
    }

    try {
        const data =
            await api(
                "/api/auth/me"
            );

        currentUser =
            data.user;

        showMainApp();

        setupUserUI();

        setDefaultDates();

        await loadEverything();

        switchTab(
            "dashboard"
        );

    } catch (error) {
        console.log(
            "No active session."
        );

        authToken = null;

        localStorage.removeItem(
            "erp_token"
        );

        currentUser = null;

        showLoginScreen();
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {
    if (
        !confirm(
            "Do you want to sign out?"
        )
    ) {
        return;
    }

    authToken = null;
    currentUser = null;

    localStorage.removeItem(
        "erp_token"
    );

    if (chatRefreshTimer) {
        clearInterval(
            chatRefreshTimer
        );

        chatRefreshTimer =
            null;
    }

    location.reload();
}


/* =========================================================
   USER UI
========================================================= */

function setupUserUI() {
    if (!currentUser) return;

    const name =
        currentUser.name ||
        "User";

    const initial =
        getInitial(name);


    if ($("headerAvatar")) {
        $("headerAvatar").innerText =
            initial;
    }

    if ($("profileAvatar")) {
        $("profileAvatar").innerText =
            initial;
    }

    if ($("welcomeText")) {
        $("welcomeText").innerText =
            `Welcome back, ${name}! 👋`;
    }

    if ($("profileName")) {
        $("profileName").innerText =
            name;
    }

    if ($("profileRole")) {
        $("profileRole").innerText =
            currentUser.designation ||
            currentUser.role ||
            "Employee";
    }

    if ($("profileDetails")) {
        $("profileDetails").innerText =
            `Email: ${currentUser.email || "-"} | Phone: ${currentUser.phone || "-"} | ID: ${currentUser.employee_code || "-"}`;
    }


    document
        .querySelectorAll(
            ".ceo-only"
        )
        .forEach(element => {
            element.style.display =
                isAdmin()
                    ? ""
                    : "none";
        });


    document
        .querySelectorAll(
            ".emp-only"
        )
        .forEach(element => {
            element.style.display =
                isAdmin()
                    ? "none"
                    : "";
        });
}


/* =========================================================
   DEFAULT DATES
========================================================= */

function setDefaultDates() {
    if ($("calendarMonth")) {
        $("calendarMonth").value =
            currentMonthString();
    }

    if ($("attendanceDate")) {
        $("attendanceDate").value =
            todayString();
    }
}


/* =========================================================
   LOAD EVERYTHING
========================================================= */

async function loadEverything() {
    await Promise.allSettled([
        loadDepartments(),
        loadEmployees(),
        loadAttendance(),
        loadLeaves(),
        loadProjects(),
        loadDashboard()
    ]);
}


/* =========================================================
   DEPARTMENTS
========================================================= */

async function loadDepartments() {
    try {
        const data =
            await api(
                "/api/departments"
            );

        allDepartments =
            data.departments || [];

    } catch (error) {
        console.error(
            "Departments:",
            error
        );
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {
    try {
        const data =
            await api(
                "/api/dashboard"
            );

        const dashboard =
            data.dashboard || {};

        if ($("dash-projects")) {
            $("dash-projects").innerText =
                dashboard.totalProjects ??
                0;
        }


        if ($("best-emp-name")) {
            if (isAdmin()) {
                $("best-emp-name").innerText =
                    dashboard.activeEmployees !==
                    undefined
                        ? `${dashboard.activeEmployees} Active Employees`
                        : "ERP Active";
            } else {
                $("best-emp-name").innerText =
                    currentUser?.name ||
                    "Employee";
            }
        }


        if ($("best-emp-score")) {
            $("best-emp-score").innerText =
                `${dashboard.pendingLeaves || 0} Pending Leaves`;
        }


        const recent =
            dashboard.recentEmployees ||
            [];

        renderDashboardRecentEmployees(
            recent
        );

    } catch (error) {
        console.error(
            "Dashboard:",
            error
        );
    }
}


function renderDashboardRecentEmployees(
    employees
) {
    /*
     Current index.html does not have
     a dedicated recent-employees
     container.

     Therefore we intentionally do not
     inject extra HTML into the design.
    */
}


/* =========================================================
   EMPLOYEES
========================================================= */

async function loadEmployees() {
    try {
        const data =
            await api(
                "/api/employees"
            );

        allEmployees =
            data.employees || [];

        renderEmployees(
            allEmployees
        );

        populateEmployeeSelects();

    } catch (error) {
        console.error(
            "Employees:",
            error
        );

        showToast(
            error.message,
            "error"
        );
    }
}


function populateEmployeeSelects() {
    const employees =
        allEmployees.filter(
            employee =>
                Number(employee.id) !==
                Number(currentUser?.id)
        );


    const options =
        employees.map(
            employee =>
                `<option value="${employee.id}">
                    ${escapeHTML(employee.name)}
                </option>`
        ).join("");


    const projectSelect =
        $("proj_emp_id");

    if (projectSelect) {
        projectSelect.innerHTML =
            options;
    }


    const calendarSelect =
        $("calendarEmpSelect");

    if (calendarSelect) {
        calendarSelect.innerHTML =
            `<option value="ALL">All Employees</option>` +
            options;
    }
}


function renderEmployees(
    employees
) {
    const container =
        $("employee-list");

    if (!container) return;


    if (!isAdmin()) {
        container.innerHTML =
            `<div class="card-box">
                <p>You do not have permission to view the employee directory.</p>
            </div>`;

        return;
    }


    const visibleEmployees =
        employees.filter(
            employee =>
                Number(employee.id) !==
                Number(currentUser?.id)
        );


    if (!visibleEmployees.length) {
        container.innerHTML =
            `<div class="card-box">
                <p>No employees found.</p>
            </div>`;

        return;
    }


    container.innerHTML =
        visibleEmployees.map(
            employee => {

                const status =
                    String(
                        employee.status ||
                        "active"
                    ).toLowerCase();

                const statusClass =
                    status === "active"
                        ? "badge-green"
                        : "badge-orange";


                return `
                <div class="employee-card">

                    <div style="
                        display:flex;
                        gap:15px;
                        align-items:center;
                        flex-wrap:wrap;
                    ">

                        <div class="avatar">
                            ${escapeHTML(
                                getInitial(
                                    employee.name
                                )
                            )}
                        </div>

                        <div>

                            <h4 style="
                                font-size:15px;
                                margin-bottom:3px;
                                color:var(--text-color);
                            ">
                                ${escapeHTML(
                                    employee.name
                                )}

                                <span style="
                                    font-size:12px;
                                    color:var(--text-muted);
                                ">
                                    -
                                    ${escapeHTML(
                                        employee.designation ||
                                        "Employee"
                                    )}
                                </span>
                            </h4>

                            <p style="
                                font-size:13px;
                                color:var(--text-muted);
                            ">
                                ID:
                                ${escapeHTML(
                                    employee.employee_code ||
                                    "-"
                                )}
                                |
                                ${escapeHTML(
                                    employee.department_name ||
                                    "-"
                                )}
                                |
                                📱
                                ${escapeHTML(
                                    employee.phone ||
                                    "-"
                                )}
                            </p>

                            <p style="
                                font-size:11px;
                                color:var(--text-muted);
                            ">
                                Email:
                                <strong>
                                    ${escapeHTML(
                                        employee.email
                                    )}
                                </strong>
                            </p>

                            <span class="badge ${statusClass}">
                                ${escapeHTML(
                                    status
                                )}
                            </span>

                        </div>

                    </div>


                    <div
                        class="action-btns"
                        style="margin-top:10px;"
                    >

                        <button
                            class="btn-icon"
                            style="
                                background:rgba(79,70,229,.1);
                                color:var(--primary);
                                font-size:12px;
                                padding:5px 10px;
                            "
                            onclick="viewIDCard(${employee.id})"
                        >
                            <i class="fa-solid fa-id-badge"></i>
                            ID
                        </button>


                        <button
                            class="btn-icon btn-edit"
                            onclick="openEditModal(${employee.id})"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>


                        <button
                            class="btn-icon btn-delete"
                            onclick="deleteEmployee(${employee.id})"
                        >
                            <i class="fa-solid fa-user-slash"></i>
                        </button>

                    </div>

                </div>
                `;
            }
        ).join("");
}


/* =========================================================
   EMPLOYEE SEARCH
========================================================= */

function initEmployeeSearch() {
    const input =
        $("employeeSearchInput");

    const suggestions =
        $("searchSuggestions");

    if (!input) return;


    input.addEventListener(
        "input",
        () => {

            const value =
                input.value
                    .trim()
                    .toLowerCase();


            if (!value) {
                if (suggestions) {
                    suggestions.style.display =
                        "none";
                }

                renderEmployees(
                    allEmployees
                );

                return;
            }


            const filtered =
                allEmployees.filter(
                    employee => {

                        const name =
                            String(
                                employee.name ||
                                ""
                            ).toLowerCase();

                        const code =
                            String(
                                employee.employee_code ||
                                ""
                            ).toLowerCase();

                        const role =
                            String(
                                employee.role ||
                                ""
                            ).toLowerCase();

                        const designation =
                            String(
                                employee.designation ||
                                ""
                            ).toLowerCase();

                        return (
                            name.includes(value) ||
                            code.includes(value) ||
                            role.includes(value) ||
                            designation.includes(value)
                        );
                    }
                );


            if (
                suggestions &&
                filtered.length
            ) {
                suggestions.style.display =
                    "block";

                suggestions.innerHTML =
                    filtered
                        .slice(0, 6)
                        .map(
                            employee =>
                                `<div
                                    class="suggestion-item"
                                    onclick="selectEmployeeSearch(${employee.id})"
                                >
                                    ${escapeHTML(
                                        employee.name
                                    )}
                                    -
                                    ${escapeHTML(
                                        employee.employee_code ||
                                        "-"
                                    )}
                                </div>`
                        )
                        .join("");

            } else if (suggestions) {
                suggestions.style.display =
                    "none";
            }


            renderEmployees(
                filtered
            );
        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                suggestions &&
                !event.target.closest(
                    ".search-container"
                )
            ) {
                suggestions.style.display =
                    "none";
            }

        }
    );
}


function selectEmployeeSearch(
    id
) {
    const employee =
        allEmployees.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    const input =
        $("employeeSearchInput");

    const suggestions =
        $("searchSuggestions");

    if (
        employee &&
        input
    ) {
        input.value =
            employee.name;

        renderEmployees(
            [employee]
        );
    }

    if (suggestions) {
        suggestions.style.display =
            "none";
    }
}


/* =========================================================
   ADD EMPLOYEE
========================================================= */

function openAddModal() {
    if (!isAdmin()) {
        showToast(
            "Administrator permission required.",
            "error"
        );

        return;
    }

    const modal =
        $("addModal");

    if (modal) {
        modal.style.display =
            "flex";
    }
}


function closeAddModal() {
    const modal =
        $("addModal");

    if (modal) {
        modal.style.display =
            "none";
    }
}


async function handleAddEmployee(
    event
) {
    event.preventDefault();

    try {
        const departmentText =
            $("add_emp_dept")?.value.trim();

        const department =
            allDepartments.find(
                item =>
                    String(item.name)
                        .toLowerCase() ===
                    String(departmentText)
                        .toLowerCase()
            );


        const employee = {
            employee_code:
                $("add_emp_code")?.value.trim(),

            name:
                $("add_emp_name")?.value.trim(),

            email:
                $("add_emp_email")?.value.trim(),

            password:
                $("add_emp_pass")?.value,

            role:
                "employee",

            department_id:
                department?.id ||
                null,

            designation:
                $("add_emp_desig")?.value.trim(),

            phone:
                $("add_emp_phone")?.value.trim(),

            joining_date:
                $("add_emp_join")?.value ||
                null,

            status:
                "active"
        };


        if (
            !employee.name ||
            !employee.email ||
            !employee.password
        ) {
            showToast(
                "Name, email and password are required.",
                "error"
            );

            return;
        }


        await api(
            "/api/employees",
            {
                method: "POST",
                body: employee
            }
        );


        closeAddModal();

        $("addEmployeeForm")?.reset();

        await loadEmployees();

        showToast(
            "Employee created successfully."
        );

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}


/* =========================================================
   EDIT EMPLOYEE
========================================================= */

function openEditModal(id) {
    if (!isAdmin()) {
        showToast(
            "Administrator permission required.",
            "error"
        );

        return;
    }


    const employee =
        allEmployees.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!employee) {
        showToast(
            "Employee not found.",
            "error"
        );

        return;
    }


    const setValue =
        (elementId, value) => {
            const element =
                $(elementId);

            if (element) {
                element.value =
                    value ?? "";
            }
        };


    setValue(
        "edit_db_id",
        employee.id
    );

    setValue(
        "edit_emp_code",
        employee.employee_code
    );

    setValue(
        "edit_emp_name",
        employee.name
    );

    setValue(
        "edit_emp_dept",
        employee.department_name
    );

    setValue(
        "edit_emp_desig",
        employee.designation
    );

    setValue(
        "edit_emp_phone",
        employee.phone
    );

    setValue(
        "edit_emp_email",
        employee.email
    );

    setValue(
        "edit_emp_join",
        employee.joining_date
            ? String(
                employee.joining_date
            ).slice(0, 10)
            : ""
    );


    const modal =
        $("editModal");

    if (modal) {
        modal.style.display =
            "flex";
    }
}


function closeEditModal() {
    const modal =
        $("editModal");

    if (modal) {
        modal.style.display =
            "none";
    }
}


async function handleEditEmployee(
    event
) {
    event.preventDefault();

    try {
        const id =
            $("edit_db_id")?.value;

        if (!id) {
            return;
        }


        const departmentText =
            $("edit_emp_dept")?.value.trim();

        const department =
            allDepartments.find(
                item =>
                    String(item.name)
                        .toLowerCase() ===
                    String(departmentText)
                        .toLowerCase()
            );


        const employee = {
            employee_code:
                $("edit_emp_code")?.value.trim(),

            name:
                $("edit_emp_name")?.value.trim(),

            email:
                $("edit_emp_email")?.value.trim(),

            role:
                "employee",

            department_id:
                department?.id ||
                null,

            designation:
                $("edit_emp_desig")?.value.trim(),

            phone:
                $("edit_emp_phone")?.value.trim(),

            joining_date:
                $("edit_emp_join")?.value ||
                null
        };


        await api(
            `/api/employees/${id}`,
            {
                method: "PUT",
                body: employee
            }
        );


        closeEditModal();

        await loadEmployees();

        showToast(
            "Employee updated successfully."
        );

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}


/* =========================================================
   EMPLOYEE STATUS
========================================================= */

async function deleteEmployee(
    id
) {
    if (!isAdmin()) {
        showToast(
            "Administrator permission required.",
            "error"
        );

        return;
    }


    const employee =
        allEmployees.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!employee) return;


    const confirmed =
        confirm(
            `Set ${employee.name} as inactive?`
        );

    if (!confirmed) return;


    try {
        await api(
            `/api/employees/${id}/status`,
            {
                method: "PATCH",
                body: {
                    status: "inactive"
                }
            }
        );

        await loadEmployees();

        showToast(
            "Employee marked inactive."
        );

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}


/* =========================================================
   EMPLOYEE CSV
========================================================= */

function exportEmployeesCSV() {
    if (!isAdmin()) {
        showToast(
            "Administrator permission required.",
            "error"
        );

        return;
    }


    const rows = [
        [
            "Employee ID",
            "Name",
            "Email",
            "Role",
            "Department",
            "Designation",
            "Phone",
            "Joining Date",
            "Status"
        ]
    ];


    allEmployees.forEach(
        employee => {
            rows.push([
                employee.employee_code || "",
                employee.name || "",
                employee.email || "",
                employee.role || "",
                employee.department_name || "",
                employee.designation || "",
                employee.phone || "",
                employee.joining_date || "",
                employee.status || ""
            ]);
        }
    );


    downloadCSV(
        "employees.csv",
        rows
    );
}


/* =========================================================
   ID CARD
========================================================= */

function viewIDCard(id) {
    const employee =
        allEmployees.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!employee) return;


    const qrData =
        encodeURIComponent(
            `EMP_ID:${employee.employee_code || employee.id},NAME:${employee.name}`
        );


    const qrURL =
        `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;


    const details =
        $("idCardDetails");

    if (!details) return;


    details.innerHTML = `
        <div style="
            text-align:center;
            padding:20px;
            border:2px solid var(--primary);
            border-radius:12px;
            background:var(--card-bg);
        ">

            <h3 style="
                color:var(--primary);
                margin-bottom:10px;
            ">
                DHANUSH SOFTWARES
            </h3>

            <img
                src="logo.svg"
                style="
                    width:45px;
                    height:45px;
                    object-fit:cover;
                    border-radius:8px;
                    margin-bottom:10px;
                "
            >

            <div style="
                width:75px;
                height:75px;
                background:rgba(79,70,229,.1);
                color:var(--primary);
                border-radius:50%;
                display:flex;
                justify-content:center;
                align-items:center;
                font-size:28px;
                font-weight:bold;
                margin:0 auto 10px;
            ">
                ${escapeHTML(
                    getInitial(
                        employee.name
                    )
                )}
            </div>

            <h2 style="
                margin:0;
                color:var(--text-color);
            ">
                ${escapeHTML(
                    employee.name
                )}
            </h2>

            <p style="
                color:var(--text-muted);
                font-size:13px;
            ">
                ${escapeHTML(
                    employee.designation ||
                    "Employee"
                )}
            </p>

            <img
                src="${qrURL}"
                alt="Employee QR"
                style="
                    margin:10px;
                    border:3px solid var(--border-color);
                    padding:5px;
                "
            >

            <p style="
                font-size:12px;
                color:var(--text-color);
            ">
                <strong>ID:</strong>
                ${escapeHTML(
                    employee.employee_code ||
                    employee.id
                )}
            </p>

            <p style="
                font-size:12px;
                color:var(--text-color);
            ">
                <strong>Email:</strong>
                ${escapeHTML(
                    employee.email
                )}
            </p>

        </div>
    `;


    const modal =
        $("idModal");

    if (modal) {
        modal.style.display =
            "flex";
    }
}


function viewMyID() {
    if (currentUser) {
        viewIDCard(
            currentUser.id
        );
    }
}


/* =========================================================
   PRINT
========================================================= */

function printDiv(
    divId
) {
    const element =
        $(divId);

    if (!element) return;


    const printWindow =
        window.open(
            "",
            "",
            "width=500,height=700"
        );

    if (!printWindow) {
        showToast(
            "Please allow popups to print.",
            "warning"
        );

        return;
    }


    printWindow.document.write(`
        <html>
        <head>
            <title>Dhanush Softwares</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 25px;
                }
            </style>
        </head>

        <body>
            ${element.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
    }, 300);
}


/* =========================================================
   PAYSLIP
========================================================= */

async function downloadPayslip(
    id
) {
    try {
        const data =
            await api(
                "/api/payroll"
            );

        const payroll =
            data.payroll || [];

        const employeePayroll =
            payroll.filter(
                item =>
                    Number(
                        item.employee_id
                    ) === Number(id)
            );


        const employee =
            allEmployees.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            ) ||
            (
                Number(
                    currentUser?.id
                ) === Number(id)
                    ? currentUser
                    : null
            );


        if (!employee) {
            showToast(
                "Employee not found.",
                "error"
            );

            return;
        }


        const latest =
            employeePayroll[0];


        const win =
            window.open(
                "",
                "",
                "width=800,height=700"
            );


        if (!win) {
            showToast(
                "Please allow popups.",
                "warning"
            );

            return;
        }


        win.document.write(`
            <html>
            <head>
                <title>
                    Payslip - ${escapeHTML(
                        employee.name
                    )}
                </title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 40px;
                        color: #111827;
                    }

                    .header {
                        text-align:center;
                        border-bottom:2px solid #111827;
                        padding-bottom:15px;
                    }

                    table {
                        width:100%;
                        border-collapse:collapse;
                        margin-top:25px;
                    }

                    th,
                    td {
                        border:1px solid #ddd;
                        padding:12px;
                        text-align:left;
                    }

                    button {
                        margin-top:20px;
                        padding:10px 18px;
                        cursor:pointer;
                    }
                </style>
            </head>

            <body>

                <div class="header">
                    <h2>
                        DHANUSH SOFTWARES ERP
                    </h2>

                    <p>
                        Official Payslip
                    </p>
                </div>

                <h3>
                    Employee:
                    ${escapeHTML(
                        employee.name
                    )}
                </h3>

                <p>
                    Employee ID:
                    ${escapeHTML(
                        employee.employee_code ||
                        employee.id
                    )}
                </p>

                <p>
                    Designation:
                    ${escapeHTML(
                        employee.designation ||
                        "-"
                    )}
                </p>

                <table>

                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>

                    <tr>
                        <td>Basic Salary</td>
                        <td>
                            ₹${latest?.basic_salary || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Allowances</td>
                        <td>
                            ₹${latest?.allowances || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Deductions</td>
                        <td>
                            ₹${latest?.deductions || 0}
                        </td>
                    </tr>

                    <tr>
                        <th>Net Salary</th>
                        <th>
                            ₹${latest?.net_salary || 0}
                        </th>
                    </tr>

                </table>

                <button onclick="window.print()">
                    Print / Save PDF
                </button>

            </body>
            </html>
        `);

        win.document.close();

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}


/* =========================================================
   ATTENDANCE
========================================================= */

async function loadAttendance() {
    try {
        const data =
            await api(
                "/api/attendance"
            );

        allAttendance =
            data.attendance || [];

        renderAttendanceList(
            allEmployees
        );

        buildAttendanceCalendar();

    } catch (error) {
        console.error(
            "Attendance:",
            error
        );

        showToast(
            error.message,
            "error"
        );
    }
}


function renderAttendanceList(
    employees
) {
    const container =
        $("attendance-list");

    if (!container) return;


    const list =
        isAdmin()
            ? employees.filter(
                employee =>
                    String(
                        employee.status
                    ).toLowerCase() ===
                    "active" &&
                    Number(employee.id) !==
                    Number(currentUser?.id)
            )
            : [currentUser];


    if (!list.length) {
        container.innerHTML =
            "<p>No employees available.</p>";

        return;
    }


    container.innerHTML =
        list.map(
            employee => {

                const existing =
                    allAttendance.find(
                        attendance =>
                            Number(
                                attendance.employee_id
                            ) ===
                            Number(
                                employee.id
                            ) &&
                            String(
                                attendance.attendance_date
                            ).slice(0, 10) ===
                            todayString()
                    );


                const currentStatus =
                    existing?.status ||
                    "present";


                return `
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        padding:10px 0;
                        border-bottom:1px solid var(--border-color);
                        gap:10px;
                    ">

                        <span style="
                            font-size:14px;
                            font-weight:500;
                        ">
                            ${escapeHTML(
                                employee.name
                            )}
                        </span>

                        <select
                            class="input-field att-status"
                            data-id="${employee.id}"
                            style="
                                padding:6px;
                                width:130px;
                                font-size:13px;
                            "
                        >

                            <option
                                value="present"
                                ${currentStatus === "present" ? "selected" : ""}
                            >
                                Present
                            </option>

                            <option
                                value="absent"
                                ${currentStatus === "absent" ? "selected" : ""}
                            >
                                Absent
                            </option>

                            <option
                                value="leave"
                                ${currentStatus === "leave" ? "selected" : ""}
                            >
                                Leave
                            </option>

                        </select>

                    </div>
                `;
            }
        ).join("");
}


function markAllLeave() {
    document
        .querySelectorAll(
            ".att-status"
        )
        .forEach(select => {
            select.value =
                "leave";
        });
}


async function saveAttendance(
    event
) {
    event.preventDefault();

    const button =
        $("saveAttBtn");

    const records =
        Array.from(
            document.querySelectorAll(
                ".att-status"
            )
        );


    if (!records.length) {
        showToast(
            "No employees available.",
            "warning"
        );

        return;
    }


    const date =
        $("attendanceDate")?.value ||
        todayString();


    try {
        if (button) {
            button.disabled =
                true;

            button.innerHTML =
                "Saving...";
        }


        for (
            const select
            of records
        ) {
            await api(
                "/api/attendance",
                {
                    method: "POST",
                    body: {
                        employee_id:
                            Number(
                                select.dataset.id
                            ),

                        attendance_date:
                            date,

                        status:
                            select.value
                    }
                }
            );
        }


        await loadAttendance();

        showToast(
            "Attendance saved successfully."
        );

    } catch (error) {
        showToast(
            error.message,
            "error"
        );

    } finally {
        if (button) {
            button.disabled =
                false;

            button.innerHTML =
                `<i class="fa-solid fa-floppy-disk"></i> Save Attendance`;
        }
    }
}


/* =========================================================
   ATTENDANCE CALENDAR
========================================================= */

function buildAttendanceCalendar() {
    const container =
        $("calendar-grid-container");

    if (!container) return;


    const monthValue =
        $("calendarMonth")?.value ||
        currentMonthString();


    const [
        year,
        month
    ] =
        monthValue.split("-");


    const days =
        new Date(
            Number(year),
            Number(month),
            0
        ).getDate();


    let employees =
        [];


    if (isAdmin()) {
        const selected =
            $("calendarEmpSelect")?.value ||
            "ALL";

        if (selected === "ALL") {
            employees =
                allEmployees.filter(
                    employee =>
                        Number(
                            employee.id
                        ) !==
                        Number(
                            currentUser?.id
                        )
                );
        } else {
            employees =
                allEmployees.filter(
                    employee =>
                        Number(
                            employee.id
                        ) ===
                        Number(selected)
                );
        }
    } else {
        employees =
            currentUser
                ? [currentUser]
                : [];
    }


    if (!employees.length) {
        container.innerHTML =
            "<p>No attendance data.</p>";

        return;
    }


    container.innerHTML = "";


    employees.forEach(
        employee => {

            const employeeAttendance =
                allAttendance.filter(
                    record =>
                        Number(
                            record.employee_id
                        ) ===
                        Number(
                            employee.id
                        ) &&
                        String(
                            record.attendance_date
                        ).startsWith(
                            monthValue
                        )
                );


            let present = 0;


            let grid =
                `<div class="att-grid">`;


            for (
                let day = 1;
                day <= days;
                day++
            ) {
                const date =
                    `${year}-${month}-${String(day).padStart(2, "0")}`;


                const record =
                    employeeAttendance.find(
                        item =>
                            String(
                                item.attendance_date
                            ).slice(0, 10) ===
                            date
                    );


                let className =
                    "bg-holiday";


                if (record) {
                    if (
                        record.status ===
                        "present"
                    ) {
                        className =
                            "bg-present";

                        present++;
                    }

                    if (
                        record.status ===
                        "absent"
                    ) {
                        className =
                            "bg-absent";
                    }

                    if (
                        record.status ===
                        "leave"
                    ) {
                        className =
                            "bg-leave";
                    }
                }


                grid += `
                    <div
                        class="att-day-box ${className}"
                        title="${date}"
                    >
                        ${day}
                    </div>
                `;
            }


            grid += "</div>";


            const percentage =
                Math.round(
                    (present / days) *
                    100
                );


            container.innerHTML += `
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-top:15px;
                    margin-bottom:10px;
                ">

                    <h4 style="
                        font-size:14px;
                    ">
                        🧑‍💻
                        ${escapeHTML(
                            employee.name
                        )}
                    </h4>

                    <span class="badge badge-blue">
                        Attendance:
                        ${percentage}%
                    </span>

                </div>

                ${grid}
            `;
        }
    );
}


/* =========================================================
   ATTENDANCE CSV
========================================================= */

function exportAttendanceCSV() {
    const month =
        $("calendarMonth")?.value ||
        currentMonthString();


    const [
        year,
        monthNumber
    ] =
        month.split("-");


    const days =
        new Date(
            Number(year),
            Number(monthNumber),
            0
        ).getDate();


    const employees =
        isAdmin()
            ? allEmployees
            : [currentUser];


    const rows = [
        [
            "Employee Name",
            "Employee ID",
            ...Array.from(
                {
                    length: days
                },
                (_, index) =>
                    index + 1
            ),
            "Present",
            "Absent",
            "Leave",
            "Percentage"
        ]
    ];


    employees.forEach(
        employee => {

            const attendance =
                allAttendance.filter(
                    record =>
                        Number(
                            record.employee_id
                        ) ===
                        Number(
                            employee.id
                        ) &&
                        String(
                            record.attendance_date
                        ).startsWith(
                            month
                        )
                );


            let present = 0;
            let absent = 0;
            let leave = 0;


            const daily = [];


            for (
                let day = 1;
                day <= days;
                day++
            ) {

                const date =
                    `${year}-${monthNumber}-${String(day).padStart(2, "0")}`;


                const record =
                    attendance.find(
                        item =>
                            String(
                                item.attendance_date
                            ).slice(0, 10) ===
                            date
                    );


                if (!record) {
                    daily.push("-");
                    continue;
                }


                if (
                    record.status ===
                    "present"
                ) {
                    daily.push("P");
                    present++;
                }

                else if (
                    record.status ===
                    "absent"
                ) {
                    daily.push("A");
                    absent++;
                }

                else if (
                    record.status ===
                    "leave"
                ) {
                    daily.push("L");
                    leave++;
                }

                else {
                    daily.push("-");
                }
            }


            const percentage =
                Math.round(
                    (present / days) *
                    100
                );


            rows.push([
                employee.name || "",
                employee.employee_code || "",
                ...daily,
                present,
                absent,
                leave,
                `${percentage}%`
            ]);
        }
    );


    downloadCSV(
        `Attendance_${month}.csv`,
        rows
    );
}


/* =========================================================
   LEAVES
========================================================= */

async function loadLeaves() {
    try {
        const data =
            await api(
                "/api/leaves"
            );

        allLeaves =
            data.leaves || [];

        renderLeaves(
            allLeaves
        );

    } catch (error) {
        console.error(
            "Leaves:",
            error
        );

        showToast(
            error.message,
            "error"
        );
    }
}


function renderLeaves(
    leaves
) {
    const container =
        $("leaves-list");

    if (!container) return;


    let visible =
        leaves;


    if (!isAdmin()) {
        visible =
            leaves.filter(
                leave =>
                    Number(
                        leave.employee_id
                    ) ===
                    Number(
                        currentUser?.id
                    )
            );
    }


    if (!visible.length) {
        container.innerHTML =
            `<tr>
                <td colspan="6"
                    style="text-align:center;">
                    No leave requests found.
                </td>
            </tr>`;

        return;
    }


    container.innerHTML =
        visible.map(
            leave => {

                const status =
                    String(
                        leave.status ||
                        "pending"
                    ).toLowerCase();


                let statusHTML;


                if (
                    status ===
                    "approved"
                ) {
                    statusHTML =
                        `<span
                            style="
                                color:#10b981;
                                font-weight:bold;
                            "
                        >
                            <i class="fa-solid fa-check"></i>
                            Approved
                        </span>`;
                }

                else if (
                    status ===
                    "rejected"
                ) {
                    statusHTML =
                        `<span class="badge badge-orange">
                            Rejected
                        </span>`;
                }

                else {
                    statusHTML =
                        `<span class="badge badge-blue">
                            Pending
                        </span>`;
                }


                let actionHTML =
                    "";


                if (isAdmin()) {

                    if (
                        status ===
                        "pending"
                    ) {
                        actionHTML = `
                            <button
                                onclick="updateLeave(${leave.id}, 'approved')"
                                style="
                                    color:white;
                                    background:#10b981;
                                    border:none;
                                    padding:5px 8px;
                                    border-radius:5px;
                                    cursor:pointer;
                                    margin-right:4px;
                                "
                            >
                                Approve
                            </button>

                            <button
                                onclick="updateLeave(${leave.id}, 'rejected')"
                                style="
                                    color:white;
                                    background:#ef4444;
                                    border:none;
                                    padding:5px 8px;
                                    border-radius:5px;
                                    cursor:pointer;
                                "
                            >
                                Reject
                            </button>
                        `;
                    } else {
                        actionHTML =
                            `<span
                                style="
                                    color:var(--text-muted);
                                    font-size:11px;
                                "
                            >
                                Done
                            </span>`;
                    }

                }


                return `
                    <tr>

                        <td>
                            ${escapeHTML(
                                leave.employee_name ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                leave.leave_type ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                leave.reason ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${statusHTML}
                        </td>

                        <td>
                            ${formatDate(
                                leave.start_date
                            )}
                        </td>

                        <td>
                            ${actionHTML}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


/* =========================================================
   APPLY LEAVE
========================================================= */

async function applyLeave(
    event
) {
    event.preventDefault();


    const leaveType =
        $("leave_type")?.value;

    const reason =
        $("leave_reason")?.value.trim();


    if (
        !leaveType ||
        !reason
    ) {
        showToast(
            "Please enter leave details.",
            "error"
        );

        return;
    }


    try {
        await api(
            "/api/leaves",
            {
                method: "POST",
                body: {
                    leave_type:
                        leaveType,

                    start_date:
                        todayString(),

                    end_date:
                        todayString(),

                    reason:
                        reason
                }
            }
        );


        $("applyLeaveForm")?.reset();

        await loadLeaves();

        showToast(
            "Leave request submitted."
        );

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}


/* =========================================================
   UPDATE LEAVE
========================================================= */

async function updateLeave(
    id,
    status
) {
    if (!isAdmin()) {
        showToast(
            "Administrator permission required.",
            "error"
        );

        return;
    }


    try {
        await api(
            `/api/leaves/${id}/status`,
            {
                method: "PATCH",
                body: {
                    status
                }
            }
        );


        await loadLeaves();

        await loadDashboard();

        showToast(
            `Leave ${status}.`
        );
        document.querySelectorAll(`#leavesTableBody tr`).forEach(row => {
            const badge = row.querySelector(".status-badge");
            if (badge && badge.textContent.trim().toLowerCase() === String(status).toLowerCase()) {
                badge.classList.add("status-updated");
                setTimeout(() => badge.classList.remove("status-updated"), 900);
            }
        });

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {
    try {
        const data =
            await api(
                "/api/projects"
            );

        allProjects =
            data.projects || [];

        renderProjects();

    } catch (error) {
        console.error(
            "Projects:",
            error
        );

        showToast(
            error.message,
            "error"
        );
    }
}


function renderProjects() {
    const container =
        $("projects-list");

    if (!container) return;


    if (!allProjects.length) {
        container.innerHTML =
            `<tr>
                <td colspan="5"
                    style="text-align:center;">
                    No projects found.
                </td>
            </tr>`;

        return;
    }


    container.innerHTML =
        allProjects.map(
            project => {

                const status =
                    String(
                        project.status ||
                        "planned"
                    ).toLowerCase();


                const badge =
                    status === "completed"
                        ? "badge-green"
                        : "badge-blue";


                return `
                    <tr>

                        <td>
                            ${escapeHTML(
                                project.created_by_name ||
                                "Management"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                project.name ||
                                "-"
                            )}
                        </td>

                        <td>
                            <span class="badge ${badge}">
                                ${escapeHTML(
                                    project.status ||
                                    "planned"
                                )}
                            </span>
                        </td>

                        <td>
                            ${formatDate(
                                project.start_date
                            )}
                        </td>

                        <td>
                            ${
                                project.progress !==
                                undefined
                                    ? `
                                        <span
                                            style="
                                                font-size:12px;
                                                color:var(--text-muted);
                                            "
                                        >
                                            Progress:
                                            ${project.progress}%
                                        </span>
                                      `
                                    : "-"
                            }
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


/* =========================================================
   CREATE PROJECT
========================================================= */

async function createProject(
    event
) {
    event.preventDefault();


    if (!isAdmin()) {
        showToast(
            "Administrator permission required.",
            "error"
        );

        return;
    }


    const name =
        $("proj_name")?.value.trim();


    if (!name) {
        showToast(
            "Project name is required.",
            "error"
        );

        return;
    }


    try {
        await api(
            "/api/projects",
            {
                method: "POST",
                body: {
                    name,
                    description:
                        "Created from ERP dashboard.",
                    start_date:
                        todayString(),
                    status:
                        "planned",
                    progress:
                        0
                }
            }
        );


        $("projectForm")?.reset();

        await loadProjects();

        await loadDashboard();

        showToast(
            "Project created successfully."
        );

    } catch (error) {
        showToast(
            error.message,
            "error"
        );
    }
}


/* =========================================================
   CHAT
========================================================= */

async function setupChatUI() {
    const list =
        $("chat-contact-list");

    if (!list) return;


    try {
        const data =
            await api(
                "/api/chat/users"
            );

        const users =
            data.users || [];


        if (!users.length) {
            list.innerHTML =
                `<p style="
                    padding:20px;
                    color:var(--text-muted);
                    text-align:center;
                ">
                    No other active employees.
                </p>`;

            return;
        }


        list.innerHTML =
            users.map(
                user => `
                    <div
                        class="chat-contact"
                        data-user-id="${user.id}"
                        onclick="selectChat(${user.id}, '${escapeHTML(
                            String(user.name)
                                .replace(/'/g, "\\'")
                        )}')"
                    >

                        <div
                            class="avatar"
                            style="
                                width:30px;
                                height:30px;
                                font-size:12px;
                            "
                        >
                            ${escapeHTML(
                                getInitial(
                                    user.name
                                )
                            )}
                        </div>

                        <div style="flex:1;">
                            <h4>
                                ${escapeHTML(
                                    user.name
                                )}
                            </h4>

                            ${
                                Number(
                                    user.unread_count
                                ) > 0
                                    ? `
                                        <span
                                            class="badge badge-blue"
                                        >
                                            ${user.unread_count}
                                        </span>
                                      `
                                    : ""
                            }
                        </div>

                    </div>
                `
            ).join("");


        const history =
            $("chat-history");

        if (history) {
            history.innerHTML =
                `<p style="
                    text-align:center;
                    color:var(--text-muted);
                    margin-top:50px;
                ">
                    Select a contact to chat.
                </p>`;
        }


        const input =
            $("chatMessageInput");

        const send =
            $("chatSendBtn");

        if (input) {
            input.disabled =
                true;
        }

        if (send) {
            send.disabled =
                true;
        }


        currentChatUserId =
            null;


        if (
            chatRefreshTimer
        ) {
            clearInterval(
                chatRefreshTimer
            );
        }


        chatRefreshTimer =
            setInterval(
                () => {
                    if (
                        currentUser &&
                        currentChatUserId
                    ) {
                        loadChatMessages(
                            currentChatUserId,
                            false
                        );
                    }
                },
                5000
            );

    } catch (error) {
        console.error(
            "Chat users:",
            error
        );

        list.innerHTML =
            `<p style="
                padding:20px;
                color:#ef4444;
            ">
                ${escapeHTML(
                    error.message
                )}
            </p>`;
    }
}


/* =========================================================
   SELECT CHAT
========================================================= */

async function selectChat(
    userId,
    name
) {
    currentChatUserId =
        Number(userId);


    if ($("chat-active-name")) {
        $("chat-active-name").innerText =
            name;
    }


    if ($("chatMessageInput")) {
        $("chatMessageInput").disabled =
            false;

        $("chatMessageInput").focus();
    }


    if ($("chatSendBtn")) {
        $("chatSendBtn").disabled =
            false;
    }


    document
        .querySelectorAll(
            ".chat-contact"
        )
        .forEach(
            element => {

                element.classList.toggle(
                    "active",
                    Number(
                        element.dataset.userId
                    ) ===
                    currentChatUserId
                );

            }
        );


    await loadChatMessages(
        currentChatUserId,
        true
    );
}


/* =========================================================
   LOAD CHAT MESSAGES
========================================================= */

async function loadChatMessages(
    userId,
    markRead = true
) {
    if (!userId) return;


    try {
        const data =
            await api(
                `/api/chat/messages/${userId}`
            );

        currentChatMessages =
            data.messages || [];


        renderChatHistory();


        if (markRead) {
            await api(
                `/api/chat/messages/${userId}`
            );
        }

    } catch (error) {
        console.error(
            "Chat messages:",
            error
        );
    }
}


/* =========================================================
   RENDER CHAT
========================================================= */

function renderChatHistory() {
    const history =
        $("chat-history");

    if (!history) return;


    const messages =
        currentChatMessages;


    if (!messages.length) {
        history.innerHTML =
            `<p style="
                text-align:center;
                color:var(--text-muted);
                margin-top:50px;
            ">
                No messages yet.
            </p>`;

        return;
    }


    history.innerHTML =
        messages.map(
            message => {

                const mine =
                    Number(
                        message.sender_id
                    ) ===
                    Number(
                        currentUser?.id
                    );


                const time =
                    formatTime(
                        message.created_at
                    );


                return `
                    <div
                        class="msg-bubble ${
                            mine
                                ? "msg-sent"
                                : "msg-received"
                        }"
                    >

                        <div>
                            ${escapeHTML(
                                message.message
                            )}
                        </div>

                        <span
                            class="msg-time"
                            style="
                                color:${
                                    mine
                                        ? "#4b5563"
                                        : "var(--text-muted)"
                                };
                            "
                        >
                            ${time}

                            ${
                                mine
                                    ? `
                                        <i
                                            class="fa-solid fa-check"
                                            style="
                                                color:${
                                                    message.is_read
                                                        ? "#3b82f6"
                                                        : "#9ca3af"
                                                };
                                                margin-left:4px;
                                            "
                                        ></i>
                                      `
                                    : ""
                            }

                        </span>

                    </div>
                `;
            }
        ).join("");


    history.scrollTop =
        history.scrollHeight;
}


/* =========================================================
   SEND CHAT MESSAGE
========================================================= */

async function sendChatMessage(
    event
) {
    event.preventDefault();


    if (!currentChatUserId) {
        showToast(
            "Select a contact first.",
            "warning"
        );

        return;
    }


    const input =
        $("chatMessageInput");

    const message =
        input?.value.trim();


    if (!message) return;


    const button =
        $("chatSendBtn");


    try {
        if (button) {
            button.disabled =
                true;
        }


        await api(
            "/api/chat/messages",
            {
                method: "POST",
                body: {
                    receiver_id:
                        currentChatUserId,

                    message
                }
            }
        );


        if (input) {
            input.value = "";
        }


        await loadChatMessages(
            currentChatUserId,
            false
        );

    } catch (error) {
        showToast(
            error.message,
            "error"
        );

    } finally {
        if (button) {
            button.disabled =
                false;
        }
    }
}


/* =========================================================
   CHAT MENU
========================================================= */

function toggleChatHeaderMenu() {
    const menu =
        $("chat-header-dropdown");

    if (!menu) return;

    menu.style.display =
        menu.style.display === "none" ||
        menu.style.display === ""
            ? "block"
            : "none";
}


/*
 The current new server does not expose
 delete/clear-chat endpoints.

 We therefore do NOT make fake database
 requests here.
*/

function clearChatHistory() {
    showToast(
        "Clear chat is not enabled in the current backend.",
        "warning"
    );

    const menu =
        $("chat-header-dropdown");

    if (menu) {
        menu.style.display =
            "none";
    }
}


function openMsgAction() {
    showToast(
        "Message deletion is not enabled in the current backend.",
        "warning"
    );
}


function deleteSelectedMessage() {
    showToast(
        "Message deletion is not enabled in the current backend.",
        "warning"
    );
}


/* =========================================================
   CSV DOWNLOAD
========================================================= */

function csvEscape(
    value
) {
    const text =
        String(value ?? "");

    return `"${text.replace(
        /"/g,
        '""'
    )}"`;
}


function downloadCSV(
    filename,
    rows
) {
    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            csvEscape
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initEventListeners() {

    /* LOGIN */

    const loginForm =
        $("loginForm");

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            handleLogin
        );
    }
    // SIDEBAR NAVIGATION
document
    .querySelectorAll(".nav-item[data-page]")
    .forEach(button => {
        button.addEventListener("click", () => {
            const page =
                button.getAttribute("data-page");

            if (page) {
                switchTab(page);
            }
        });
    });


    /* ADD EMPLOYEE */

    const addForm =
        $("addEmployeeForm");

    if (addForm) {
        addForm.addEventListener(
            "submit",
            handleAddEmployee
        );
    }


    /* EDIT EMPLOYEE */

    const editForm =
        $("editEmployeeForm");

    if (editForm) {
        editForm.addEventListener(
            "submit",
            handleEditEmployee
        );
    }


    /* ATTENDANCE */

    const attendanceForm =
        $("attendanceForm");

    if (attendanceForm) {
        attendanceForm.addEventListener(
            "submit",
            saveAttendance
        );
    }


    /* LEAVE */

    const leaveForm =
        $("applyLeaveForm");

    if (leaveForm) {
        leaveForm.addEventListener(
            "submit",
            applyLeave
        );
    }


    /* PROJECT */

    const projectForm =
        $("projectForm");

    if (projectForm) {
        projectForm.addEventListener(
            "submit",
            createProject
        );
    }


    /* CHAT */

    const chatForm =
        $("chatForm");

    if (chatForm) {
        chatForm.addEventListener(
            "submit",
            sendChatMessage
        );
    }


    /* SEARCH */

    initEmployeeSearch();


    /* MONTH CHANGE */

    const month =
        $("calendarMonth");

    if (month) {
        month.addEventListener(
            "change",
            buildAttendanceCalendar
        );
    }


    /* EMPLOYEE SELECT */

    const employeeSelect =
        $("calendarEmpSelect");

    if (employeeSelect) {
        employeeSelect.addEventListener(
            "change",
            buildAttendanceCalendar
        );
    }
}


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth > 850
        ) {
            const overlay =
                $("sidebarOverlay");

            if (overlay) {
                overlay.style.display =
                    "none";
            }
        }

    }
);


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    event => {

        document
            .querySelectorAll(
                ".modal-overlay"
            )
            .forEach(
                modal => {

                    if (
                        event.target ===
                        modal
                    ) {
                        modal.style.display =
                            "none";
                    }

                }
            );

    }
);


/* =========================================================
   FINAL UI COMPATIBILITY + PROFESSIONAL LAYER
   This block matches the current index.html exactly.
========================================================= */

function isAdmin() {
    const role = String(currentUser?.role || "").toLowerCase();
    return role === "admin" || role === "super_admin" || role === "superadmin";
}

function isManager() {
    const role = String(currentUser?.role || "").toLowerCase();
    return role === "admin" || role === "hr" || role === "manager" || role === "super_admin";
}

function roleLabel(role) {
    const value = String(role || "").toLowerCase();
    if (value === "admin" || value === "super_admin") return "Super Admin";
    if (value === "hr") return "HR";
    if (value === "manager") return "Manager";
    return "Employee";
}

function setFormMessage(id, message, type = "error") {
    const box = $(id);
    if (!box) return;
    box.textContent = message || "";
    box.classList.remove("hidden");
    box.classList.toggle("error", type === "error");
    box.classList.toggle("success", type === "success");
}

function clearFormMessage(id) {
    const box = $(id);
    if (!box) return;
    box.textContent = "";
    box.classList.add("hidden");
    box.classList.remove("error", "success");
}

function switchTab(tabId) {
    const section = document.getElementById(`page-${tabId}`);
    if (!section) {
        showToast(`Page "${tabId}" is not available.`, "warning");
        return;
    }

    document.querySelectorAll(".page-section").forEach(page => {
        page.classList.remove("active", "active-section");
    });
    section.classList.add("active", "active-section");

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === tabId);
    });

    const title = $("currentPageTitle");
    const subtitle = $("currentPageSubtitle");
    const titles = {
        dashboard: ["Dashboard", "Overview of your employee management system"],
        employees: ["Employees", "Create and manage employee accounts"],
        attendance: ["Attendance", "Track daily employee attendance"],
        leaves: ["Leave Management", "Manage employee leave requests"],
        projects: ["Projects", "Track projects and progress"],
        chat: ["Internal Chat", "Communicate securely with employees"],
        payroll: ["Payroll", "Salary and payroll information"],
        performance: ["Performance", "Employee performance and reviews"],
        goals: ["Goals", "Track employee goals and progress"],
        training: ["Training", "Employee learning and development"],
        assets: ["Assets", "Manage company assets"],
        documents: ["Documents", "Manage employee documents"],
        recruitment: ["Recruitment", "Manage recruitment activities"],
        announcements: ["Announcements", "Company announcements"],
        reports: ["Reports", "View ERP reports"],
        ai: ["AI Assistant", "AI-powered assistant"],
        settings: ["Settings", "Manage your account and ERP preferences"]
    };
    const meta = titles[tabId] || ["ERP", ""];
    if (title) title.textContent = meta[0];
    if (subtitle) subtitle.textContent = meta[1];

    if (window.innerWidth <= 850) {
        $("sidebar")?.classList.remove("open");
        if ($("sidebarOverlay")) $("sidebarOverlay").style.display = "none";
    }

    const loaders = {
        dashboard: loadDashboard,
        employees: loadEmployees,
        attendance: loadAttendance,
        leaves: loadLeaves,
        projects: loadProjects,
        chat: setupChatUI,
        settings: setupSettingsPage,
        payroll: () => loadSimpleModule("payroll", "payrollTableBody"),
        performance: () => loadSimpleModule("performance", "performanceTableBody"),
        goals: () => loadSimpleModule("goals", "goalsTableBody"),
        training: () => loadSimpleModule("training", "trainingGrid"),
        assets: () => loadSimpleModule("assets", "assetsTableBody"),
        documents: () => loadSimpleModule("documents", "documentsTableBody"),
        recruitment: () => loadSimpleModule("recruitment", "recruitmentTableBody"),
        announcements: () => loadSimpleModule("announcements", "announcementsTableBody")
    };
    if (loaders[tabId]) Promise.resolve(loaders[tabId]()).catch(error => console.error(tabId, error));
}

function showLoginScreen() {
    const login = $("loginPage");
    const app = $("erpApp");
    if (login) login.style.display = "flex";
    if (app) {
        app.classList.add("hidden");
        app.style.display = "none";
    }
}

function showMainApp() {
    const login = $("loginPage");
    const app = $("erpApp");
    if (login) login.style.display = "none";
    if (app) {
        app.classList.remove("hidden");
        app.style.display = "flex";
    }
}

function setupUserUI() {
    if (!currentUser) return;
    const name = currentUser.name || "User";
    const initial = getInitial(name);
    const avatar = currentUser.profile_image;

    ["sidebarUserAvatar", "topbarUserAvatar"].forEach(id => {
        const el = $(id);
        if (!el) return;
        if (avatar) {
            el.innerHTML = `<img src="${escapeHTML(avatar)}" alt="Profile">`;
            el.classList.add("has-photo");
        } else {
            el.textContent = initial;
            el.classList.remove("has-photo");
        }
    });

    if ($("topbarUserName")) $("topbarUserName").textContent = name;
    if ($("topbarUserRole")) $("topbarUserRole").textContent = roleLabel(currentUser.role);
    if ($("settingsProfile")) {
        $("settingsProfile").innerHTML = `
            <div class="settings-profile-preview">
                <div class="profile-large-avatar">${avatar ? `<img src="${escapeHTML(avatar)}" alt="Profile">` : escapeHTML(initial)}</div>
                <div>
                    <strong>${escapeHTML(name)}</strong>
                    <span>${escapeHTML(roleLabel(currentUser.role))}</span>
                    <small>${escapeHTML(currentUser.email || "-")}</small>
                </div>
            </div>`;
    }

    document.querySelectorAll(".admin-only").forEach(el => {
        el.style.display = isAdmin() ? "" : "none";
    });
    document.querySelectorAll(".employee-only").forEach(el => {
        el.style.display = isManager() ? "none" : "";
    });
}

function setDefaultDates() {
    if ($("attendanceDate")) $("attendanceDate").value = todayString();
    document.querySelectorAll("input[type='date']").forEach(input => {
        if (!input.value && /date|joining|deadline/i.test(input.id)) {
            // Only set operational date fields; leave/employee fields remain user-controlled.
            if (input.id === "attendanceDate") input.value = todayString();
        }
    });
}

async function loadEverything() {
    await Promise.allSettled([
        loadDepartments(), loadEmployees(), loadAttendance(), loadLeaves(), loadProjects(), loadDashboard(), loadNotifications()
    ]);
}

async function loadDashboard() {
    try {
        const data = await api("/api/dashboard");
        const d = data.dashboard || {};
        if ($("dashboardCurrentDate")) $("dashboardCurrentDate").textContent = new Date().toLocaleDateString("en-IN", {day:"2-digit", month:"long", year:"numeric"});
        if ($("statTotalEmployees")) $("statTotalEmployees").textContent = d.totalEmployees ?? 0;
        if ($("statActiveEmployees")) $("statActiveEmployees").textContent = d.activeEmployees ?? 0;
        if ($("statPendingLeaves")) $("statPendingLeaves").textContent = d.pendingLeaves ?? 0;
        if ($("statActiveProjects")) $("statActiveProjects").textContent = d.totalProjects ?? 0;
        if ($("statMyAttendance")) $("statMyAttendance").textContent = d.myAttendance ?? "-";
        if ($("statMyLeaves")) $("statMyLeaves").textContent = d.myLeaves ?? 0;
        if ($("statMyProjects")) $("statMyProjects").textContent = d.myProjects ?? 0;
        if ($("dashboardAttendance")) $("dashboardAttendance").textContent = d.activeEmployees !== undefined ? `${d.activeEmployees} active employees` : "No attendance summary";
        if ($("dashboardLeaves")) $("dashboardLeaves").textContent = `${d.pendingLeaves || 0} pending leave requests`;
        if ($("dashboardProjects")) $("dashboardProjects").textContent = `${d.totalProjects || 0} active projects`;
        if ($("dashboardAnnouncements")) $("dashboardAnnouncements").textContent = `${(d.announcements || []).length} announcements`;
    } catch (error) { console.error("Dashboard:", error); }
}

async function loadEmployees() {
    try {
        const data = await api("/api/employees");
        allEmployees = data.employees || [];
        renderEmployees(allEmployees);
        populateEmployeeSelects();
    } catch (error) { showToast(error.message, "error"); }
}

function populateEmployeeSelects() {
    const active = allEmployees.filter(e => String(e.status).toLowerCase() === "active" && Number(e.id) !== Number(currentUser?.id));
    const opts = active.map(e => `<option value="${e.id}">${escapeHTML(e.name)}${e.employee_code ? ` · ${escapeHTML(e.employee_code)}` : ""}</option>`).join("");
    if ($("projectEmployee")) $("projectEmployee").innerHTML = `<option value="">Select employee</option>${opts}`;
    if ($("assetEmployee")) $("assetEmployee").innerHTML = `<option value="">Select employee</option>${opts}`;
    if ($("documentEmployee")) $("documentEmployee").innerHTML = `<option value="">Select employee</option>${opts}`;
    if ($("employeeDepartment")) $("employeeDepartment").innerHTML = `<option value="">Select Department</option>` + allDepartments.map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)}</option>`).join("");
    if ($("employeeDepartmentFilter")) $("employeeDepartmentFilter").innerHTML = `<option value="">All Departments</option>` + allDepartments.map(d => `<option value="${escapeHTML(d.name)}">${escapeHTML(d.name)}</option>`).join("");
}

function employeeAvatar(employee, sizeClass = "") {
    const image = employee.profile_image;
    return image ? `<div class="employee-avatar ${sizeClass}"><img src="${escapeHTML(image)}" alt="Profile"></div>` : `<div class="employee-avatar ${sizeClass}">${escapeHTML(getInitial(employee.name))}</div>`;
}

function renderEmployees(employees) {
    const body = $("employeesTableBody");
    if (!body) return;
    if (!isManager()) {
        body.innerHTML = `<tr><td colspan="8" class="empty-state-cell">Employee directory is available to management only.</td></tr>`;
        return;
    }
    const search = String($("employeeSearch")?.value || "").trim().toLowerCase();
    const dept = String($("employeeDepartmentFilter")?.value || "").toLowerCase();
    const status = String($("employeeStatusFilter")?.value || "").toLowerCase();
    const role = String($("employeeRoleFilter")?.value || "").toLowerCase();
    const filtered = employees.filter(e => {
        const hay = `${e.name||""} ${e.email||""} ${e.employee_code||""} ${e.designation||""}`.toLowerCase();
        return (!search || hay.includes(search)) && (!dept || String(e.department_name||"").toLowerCase() === dept) && (!status || String(e.status||"").toLowerCase() === status) && (!role || String(e.role||"").toLowerCase() === role);
    });
    if ($("employeeCount")) $("employeeCount").textContent = `${filtered.length} employee${filtered.length === 1 ? "" : "s"}`;
    if (!filtered.length) { body.innerHTML = `<tr><td colspan="8" class="empty-state-cell">No employees found.</td></tr>`; return; }
    body.innerHTML = filtered.map(e => {
        const active = String(e.status || "active").toLowerCase() === "active";
        const actions = Number(e.id) === Number(currentUser?.id) ? `<span class="muted-label">Current account</span>` : `
            <button class="table-action" type="button" onclick="openEditModal(${Number(e.id)})">✏️ Edit</button>
            <button class="table-action ${active ? "danger" : "success"}" type="button" onclick="deleteEmployee(${Number(e.id)})">${active ? "⏸ Disable" : "▶ Activate"}</button>`;
        return `<tr>
            <td><div class="employee-cell">${employeeAvatar(e)}<div><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.email || "-")}</small></div></div></td>
            <td>${escapeHTML(e.employee_code || "-")}</td>
            <td>${escapeHTML(e.department_name || "-")}</td>
            <td>${escapeHTML(e.designation || "Employee")}</td>
            <td>${escapeHTML(roleLabel(e.role))}</td>
            <td><span class="status-badge ${active ? "active" : "inactive"}">${active ? "Active" : "Inactive"}</span></td>
            <td>${formatDate(e.joining_date)}</td>
            <td><div class="table-actions">${actions}</div></td>
        </tr>`;
    }).join("");
}

function readProfileImage() {
    return new Promise((resolve, reject) => {
        const input = $("employeeImage");
        const file = input?.files?.[0];
        if (!file) return resolve(undefined);
        if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) return reject(new Error("Use JPG, PNG or WebP for the profile photo."));
        if (file.size > 1024 * 1024) return reject(new Error("Profile photo must be smaller than 1 MB."));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read the profile photo."));
        reader.readAsDataURL(file);
    });
}

function previewEmployeeImage() {
    const input = $("employeeImage");
    const preview = $("employeeImagePreview");
    const file = input?.files?.[0];
    if (!preview) return;
    if (!file) { preview.innerHTML = "<span>👤</span>"; return; }
    const reader = new FileReader();
    reader.onload = () => { preview.innerHTML = `<img src="${escapeHTML(reader.result)}" alt="Preview">`; };
    reader.readAsDataURL(file);
}

function resetEmployeeForm() {
    $("employeeForm")?.reset();
    $("employeeId").value = "";
    $("employeeRole").value = "EMPLOYEE";
    $("employeeAccountStatus").value = "Active";
    $("employeeImagePreview").innerHTML = "<span>👤</span>";
    clearFormMessage("employeeFormMessage");
}

function openAddModal() {
    if (!isManager()) return showToast("Management permission required.", "error");
    resetEmployeeForm();
    $("employeeModalTitle").textContent = "Add Employee";
    $("employeePassword").required = true;
    $("employeeModal")?.classList.remove("hidden");
    $("employeeModal")?.setAttribute("aria-hidden", "false");
}

function closeAddModal() { closeModal("employeeModal"); }

function openEditModal(id) {
    if (!isManager()) return showToast("Management permission required.", "error");
    const e = allEmployees.find(x => Number(x.id) === Number(id));
    if (!e) return showToast("Employee not found.", "error");
    $("employeeForm")?.reset();
    $("employeeId").value = e.id;
    $("employeeCode").value = e.employee_code || "";
    $("employeeName").value = e.name || "";
    $("employeeEmail").value = e.email || "";
    $("employeeDepartment").value = e.department_id || "";
    $("employeeDesignation").value = e.designation || "";
    $("employeePhone").value = e.phone || "";
    $("employeeRole").value = String(e.role || "employee").toLowerCase() === "admin" ? "SUPER_ADMIN" : String(e.role || "employee").toUpperCase();
    $("employeeJoiningDate").value = e.joining_date ? String(e.joining_date).slice(0,10) : "";
    $("employeeSalary").value = e.salary ?? "";
    $("employeeAccountStatus").value = String(e.status || "active").toLowerCase() === "inactive" ? "Inactive" : "Active";
    $("employeeAadhaar").value = e.aadhaar_no || "";
    $("employeeAddress").value = e.address || "";
    $("employeePassword").value = "";
    $("employeePassword").required = false;
    $("employeeImagePreview").innerHTML = e.profile_image ? `<img src="${escapeHTML(e.profile_image)}" alt="Profile">` : "<span>👤</span>";
    clearFormMessage("employeeFormMessage");
    $("employeeModalTitle").textContent = "Edit Employee";
    $("employeeModal")?.classList.remove("hidden");
    $("employeeModal")?.setAttribute("aria-hidden", "false");
}

function closeEditModal() { closeModal("employeeModal"); }

async function handleEmployeeForm(event) {
    event.preventDefault();
    if (!isManager()) return showToast("Management permission required.", "error");
    const id = $("employeeId")?.value;
    const password = $("employeePassword")?.value || "";
    if (!$("employeeName")?.value.trim() || !$("employeeEmail")?.value.trim()) return setFormMessage("employeeFormMessage", "Name and email are required.");
    if (!id && password.length < 6) return setFormMessage("employeeFormMessage", "Password must contain at least 6 characters.");
    if (id && password && password.length < 6) return setFormMessage("employeeFormMessage", "Password must contain at least 6 characters.");
    try {
        const image = await readProfileImage();
        const departmentId = $("employeeDepartment")?.value || null;
        const role = $("employeeRole")?.value || "EMPLOYEE";
        const payload = {
            employee_code: $("employeeCode")?.value.trim() || null,
            name: $("employeeName")?.value.trim(),
            email: $("employeeEmail")?.value.trim(),
            role,
            department_id: departmentId,
            designation: $("employeeDesignation")?.value.trim() || null,
            phone: $("employeePhone")?.value.trim() || null,
            joining_date: $("employeeJoiningDate")?.value || null,
            salary: $("employeeSalary")?.value || null,
            aadhaar_no: $("employeeAadhaar")?.value.trim() || null,
            address: $("employeeAddress")?.value.trim() || null,
            status: String($("employeeAccountStatus")?.value || "Active").toLowerCase()
        };
        if (image !== undefined) payload.profile_image = image;
        if (!id) payload.password = password;
        const data = await api(id ? `/api/employees/${id}` : "/api/employees", { method: id ? "PUT" : "POST", body: payload });
        if (data.employee) {
            showToast(id ? "Employee updated successfully." : "Employee created successfully.");
        }
        closeModal("employeeModal");
        await loadEmployees();
        await loadDashboard();
    } catch (error) { setFormMessage("employeeFormMessage", error.message || "Unable to save employee."); }
}

async function handleAddEmployee(event) { return handleEmployeeForm(event); }
async function handleEditEmployee(event) { return handleEmployeeForm(event); }

async function deleteEmployee(id) {
    if (!isManager()) return showToast("Management permission required.", "error");
    const e = allEmployees.find(x => Number(x.id) === Number(id));
    if (!e) return;
    const active = String(e.status || "active").toLowerCase() === "active";
    if (!confirm(`${active ? "Deactivate" : "Activate"} ${e.name}?`)) return;
    try {
        await api(`/api/employees/${id}/status`, { method: "PATCH", body: { status: active ? "inactive" : "active" } });
        await loadEmployees();
        await loadDashboard();
        showToast(active ? "Employee deactivated." : "Employee activated.");
    } catch (error) { showToast(error.message, "error"); }
}

function exportEmployeesCSV() {
    if (!isManager()) return showToast("Management permission required.", "error");
    const rows = [["Employee ID","Name","Email","Role","Department","Designation","Phone","Joining Date","Status"]];
    allEmployees.forEach(e => rows.push([e.employee_code||"",e.name||"",e.email||"",roleLabel(e.role),e.department_name||"",e.designation||"",e.phone||"",e.joining_date||"",e.status||""]));
    downloadCSV("employees.csv", rows);
}

async function loadAttendance() {
    try {
        const date = $("attendanceDate")?.value || todayString();
        const data = await api(`/api/attendance?date=${encodeURIComponent(date)}`);
        allAttendance = data.attendance || [];
        renderAttendanceList(allAttendance);
    } catch (error) { showToast(error.message, "error"); }
}

function renderAttendanceList(rows) {
    const body = $("attendanceTableBody");
    if (!body) return;
    const counts = {present:0, absent:0, leave:0, "half-day":0, half_day:0};
    rows.forEach(r => counts[String(r.status||"").toLowerCase()] = (counts[String(r.status||"").toLowerCase()] || 0) + 1);
    if ($("attendancePresentCount")) $("attendancePresentCount").textContent = counts.present || 0;
    if ($("attendanceAbsentCount")) $("attendanceAbsentCount").textContent = counts.absent || 0;
    if ($("attendanceLeaveCount")) $("attendanceLeaveCount").textContent = counts.leave || 0;
    if ($("attendanceHalfDayCount")) $("attendanceHalfDayCount").textContent = (counts["half-day"] || counts.half_day || 0);
    body.innerHTML = rows.length ? rows.map(r => `<tr><td>${escapeHTML(r.employee_name||"-")}</td><td>${formatDate(r.attendance_date)}</td><td><span class="status-badge">${escapeHTML(r.status||"-")}</span></td><td>${escapeHTML(r.check_in||"-")}</td><td>${escapeHTML(r.check_out||"-")}</td><td>${escapeHTML(r.department_name||"-")}</td></tr>`).join("") : `<tr><td colspan="6" class="empty-state-cell">No attendance records for this date.</td></tr>`;
}

async function saveAttendance() {
    if (!isManager()) return showToast("Management permission required.", "error");
    const employee = allEmployees.find(e => String(e.status).toLowerCase() === "active" && Number(e.id) !== Number(currentUser?.id));
    if (!employee) return showToast("No active employee is available to mark attendance.", "warning");
    try {
        await api("/api/attendance", { method:"POST", body:{employee_id:employee.id, attendance_date:$("attendanceDate")?.value || todayString(), status:"present"} });
        await loadAttendance();
        showToast(`Attendance marked present for ${employee.name}.`);
    } catch (error) { showToast(error.message,"error"); }
}

async function loadLeaves() {
    try { const data = await api("/api/leaves"); allLeaves = data.leaves || []; renderLeaves(allLeaves); } catch (error) { showToast(error.message,"error"); }
}

function renderLeaves(rows) {
    const body=$("leavesTableBody"); if(!body) return;
    const sf=String($("leaveStatusFilter")?.value||"").toLowerCase(); const tf=String($("leaveTypeFilter")?.value||"").toLowerCase();
    const filtered=rows.filter(r=>(!sf||String(r.status||"").toLowerCase()===sf)&&(!tf||String(r.leave_type||"").toLowerCase()===tf));
    if($("leaveCount")) $("leaveCount").textContent=`${filtered.length} request${filtered.length===1?"":"s"}`;
    body.innerHTML=filtered.length?filtered.map(r=>{const mine=Number(r.employee_id)===Number(currentUser?.id); const actions=isManager()&&!mine?`<button class="table-action success" type="button" onclick="updateLeave(${Number(r.id)},'approved')">Approve</button><button class="table-action danger" type="button" onclick="updateLeave(${Number(r.id)},'rejected')">Reject</button>`:`<span class="muted-label">—</span>`; return `<tr><td>${escapeHTML(r.employee_name||"-")}</td><td>${escapeHTML(r.leave_type||"-")}</td><td>${formatDate(r.start_date)}</td><td>${formatDate(r.end_date)}</td><td>${escapeHTML(r.reason||"-")}</td><td><span class="status-badge ${String(r.status).toLowerCase()}">${escapeHTML(r.status||"-")}</span></td><td>${formatDate(r.created_at)}</td><td><div class="table-actions">${actions}</div></td></tr>`;}).join(""):`<tr><td colspan="8" class="empty-state-cell">No leave requests found.</td></tr>`;
}

async function applyLeave(event) {
    event.preventDefault();
    try { await api("/api/leaves",{method:"POST",body:{leave_type:$("leaveType")?.value,start_date:$("leaveFromDate")?.value,end_date:$("leaveToDate")?.value,reason:$("leaveReason")?.value.trim()}}); closeModal("leaveModal"); $("leaveForm")?.reset(); await loadLeaves(); await loadDashboard(); showToast("Leave request submitted."); } catch(error){ setFormMessage("leaveFormMessage",error.message); }
}

async function updateLeave(id,status) { try { await api(`/api/leaves/${id}/status`,{method:"PATCH",body:{status}}); await loadLeaves(); await loadDashboard(); showToast(`Leave ${status}.`); } catch(error){showToast(error.message,"error");} }

async function loadProjects() {
    try { const data=await api("/api/projects"); allProjects=data.projects||[]; renderProjects(); populateEmployeeSelects(); } catch(error){showToast(error.message,"error");}
}

function renderProjects() {
    const grid=$("projectsGrid"); if(!grid)return;
    const rows=allProjects;
    if(!rows.length){grid.innerHTML=`<div class="empty-state-card">No projects found.</div>`;return;}
    grid.innerHTML=rows.map(p=>`<article class="project-card"><div class="project-card-top"><span class="status-badge">${escapeHTML(p.status||"planned")}</span><span>${escapeHTML(p.priority||"Medium")}</span></div><h3>${escapeHTML(p.name||"Untitled project")}</h3><p>${escapeHTML(p.description||"No description")}</p><div class="project-meta"><span>👤 ${escapeHTML(p.assigned_employee_name||"Unassigned")}</span><span>📅 ${formatDate(p.end_date)}</span></div><div class="progress-track"><span style="width:${Math.max(0,Math.min(100,Number(p.progress)||0))}%"></span></div><small>${Number(p.progress)||0}% complete</small></article>`).join("");
}

async function createProject(event) {
    event.preventDefault();
    if(!isManager()) return showToast("Management permission required.","error");
    try { await api("/api/projects",{method:"POST",body:{name:$("projectName")?.value.trim(),description:`Priority: ${$("projectPriority")?.value||"Medium"}`,start_date:todayString(),end_date:$("projectDeadline")?.value||null,status:"planned",progress:0,assigned_to:$("projectEmployee")?.value||null,priority:$("projectPriority")?.value||"Medium"}}); closeModal("projectModal"); $("projectForm")?.reset(); await loadProjects(); await loadDashboard(); showToast("Project assigned successfully."); } catch(error){setFormMessage("projectFormMessage",error.message);}
}

async function setupChatUI() {
    const list=$("chatUserList"); if(!list)return;
    if (window.innerWidth <= 650) $("chatContainer")?.classList.add("show-chat-users");
    try { const data=await api("/api/chat/users"); const users=data.users||[]; list.innerHTML=users.length?users.map(u=>`<button type="button" class="chat-user" data-user-id="${Number(u.id)}"><span class="user-avatar small">${escapeHTML(getInitial(u.name))}</span><span><strong>${escapeHTML(u.name)}</strong><small>${Number(u.unread_count)>0?`${u.unread_count} unread`:"Available"}</small></span></button>`).join(""):`<div class="empty-state-card">No other active employees.</div>`; list.querySelectorAll(".chat-user").forEach(el=>el.addEventListener("click",()=>selectChat(Number(el.dataset.userId),el.querySelector("strong")?.textContent||"Employee"))); } catch(error){list.innerHTML=`<div class="empty-state-card">${escapeHTML(error.message)}</div>`;}
}

async function selectChat(userId,name) {
    currentChatUserId=Number(userId); if($("selectedChatName")) $("selectedChatName").textContent=name; if($("selectedChatAvatar")) $("selectedChatAvatar").textContent=getInitial(name); if($("selectedChatStatus")) $("selectedChatStatus").textContent="Online conversation"; if($("chatMessageInput")) $("chatMessageInput").disabled=false; if($("chatSendButton")) $("chatSendButton").disabled=false; await loadChatMessages(currentChatUserId,true);
}

async function loadChatMessages(userId,markRead=true){ if(!userId)return; try{const data=await api(`/api/chat/messages/${userId}`); currentChatMessages=data.messages||[]; renderChatHistory();}catch(error){showToast(error.message,"error");} }

function renderChatHistory(){const box=$("chatMessages");if(!box)return;if(!currentChatMessages.length){box.innerHTML=`<div class="chat-empty-state"><div>💬</div><h3>No messages yet</h3><p>Send the first message.</p></div>`;return;}box.innerHTML=currentChatMessages.map(m=>{const mine=Number(m.sender_id)===Number(currentUser?.id);return `<div class="msg-bubble ${mine?"msg-sent":"msg-received"}"><div>${escapeHTML(m.message)}</div><span class="msg-time">${formatTime(m.created_at)}</span></div>`;}).join("");box.scrollTop=box.scrollHeight;}

async function sendChatMessage(event){event.preventDefault();if(!currentChatUserId)return showToast("Select an employee first.","warning");const input=$("chatMessageInput");const message=input?.value.trim();if(!message)return;try{await api("/api/chat/messages",{method:"POST",body:{receiver_id:currentChatUserId,message}});input.value="";await loadChatMessages(currentChatUserId,false);}catch(error){showToast(error.message,"error");}}
function clearChatHistory(){showToast("Chat history cannot be deleted from this screen.","warning");}
function toggleChatHeaderMenu(){return;}
function openMsgAction(){return;}
function deleteSelectedMessage(){return;}

async function loadNotifications(){
    try{const data=await api("/api/notifications");const rows=data.notifications||[];if($("notificationBadge")){const unread=rows.filter(n=>!n.is_read).length;$("notificationBadge").textContent=unread;$("notificationBadge").classList.toggle("hidden",unread===0);}if($("notificationCountText"))$("notificationCountText").textContent=`${rows.length} notifications`;if($("notificationList"))$("notificationList").innerHTML=rows.length?rows.map(n=>`<div class="notification-item"><strong>${escapeHTML(n.title||"Notification")}</strong><p>${escapeHTML(n.message||"")}</p></div>`).join(""):`<div class="empty-state-card">No notifications</div>`;}catch(error){console.error("Notifications:",error);}
}

async function setupSettingsPage(){if(!currentUser)return;setupUserUI();}

async function changePassword(event){event.preventDefault();const current=$("currentPassword")?.value;const next=$("newPassword")?.value;const confirm=$("confirmNewPassword")?.value;if(!current||!next||!confirm)return setFormMessage("changePasswordMessage","All password fields are required.");if(next.length<6)return setFormMessage("changePasswordMessage","New password must contain at least 6 characters.");if(next!==confirm)return setFormMessage("changePasswordMessage","New passwords do not match.");try{await api("/api/auth/change-password",{method:"POST",body:{currentPassword:current,newPassword:next}});$("changePasswordForm")?.reset();setFormMessage("changePasswordMessage","Password changed successfully.","success");}catch(error){setFormMessage("changePasswordMessage",error.message);}}

async function forgotPassword(event){event.preventDefault();try{const data=await api("/api/auth/forgot-password",{method:"POST",body:{email:$("forgotEmail")?.value.trim()}});setFormMessage("forgotPasswordMessage",data.message||"Reset request created.","success");if(data.resetToken){$("resetToken").textContent=data.resetToken;$("resetTokenInput").value=data.resetToken;$("resetTokenContainer").classList.remove("hidden");$("resetPasswordForm").classList.remove("hidden");}}catch(error){setFormMessage("forgotPasswordMessage",error.message);}}
async function resetPassword(event){event.preventDefault();const token=$("resetTokenInput")?.value;const p=$("newResetPassword")?.value;const c=$("confirmResetPassword")?.value;if(p!==c)return setFormMessage("forgotPasswordMessage","Passwords do not match.");try{const data=await api("/api/auth/reset-password",{method:"POST",body:{token,password:p}});setFormMessage("forgotPasswordMessage",data.message||"Password reset successfully.","success");$("resetPasswordForm")?.reset();}catch(error){setFormMessage("forgotPasswordMessage",error.message);}}

async function loadSimpleModule(endpoint, bodyId){
    const body=$(bodyId); if(!body)return;
    try{const data=await api(`/api/${endpoint}`);const key=endpoint;const rows=data[key]||data[endpoint.replace(/s$/,'')]||[];if(Array.isArray(rows)){body.innerHTML=rows.length?rows.slice(0,100).map(row=>`<tr>${Object.values(row).slice(0,8).map(v=>`<td>${escapeHTML(v)}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="8" class="empty-state-cell">No records found.</td></tr>`;}}catch(error){console.error(endpoint,error);}
}

function closeModal(id){const modal=$(id);if(!modal)return;modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");}
function openModal(id){const modal=$(id);if(!modal)return;modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");}

function enhancePasswordField(inputId, buttonId) {
    const input=$(inputId); if(!input || input.dataset.passwordEnhanced)return;
    const parent=input.parentElement; if(!parent)return;
    const wrapper=document.createElement("div"); wrapper.className="password-field-wrapper";
    parent.insertBefore(wrapper,input); wrapper.appendChild(input);
    const button=document.createElement("button"); button.type="button"; button.className="password-toggle generated-password-toggle"; button.id=buttonId||`toggle-${inputId}`; button.textContent="👁"; button.setAttribute("aria-label","Show password");
    button.addEventListener("click",()=>{const visible=input.type==="text";input.type=visible?"password":"text";button.textContent=visible?"👁":"🙈";button.setAttribute("aria-label",visible?"Show password":"Hide password");}); wrapper.appendChild(button); input.dataset.passwordEnhanced="1";
}

function initEventListeners() {
    $("loginForm")?.addEventListener("submit",handleLogin);
    $("toggleLoginPassword")?.addEventListener("click",()=>{const i=$("loginPassword"),b=$("toggleLoginPassword");const v=i.type==="text";i.type=v?"password":"text";b.textContent=v?"👁":"🙈";b.setAttribute("aria-label",v?"Show password":"Hide password");});
    document.querySelectorAll(".nav-item[data-page]").forEach(btn=>btn.addEventListener("click",()=>switchTab(btn.dataset.page)));
    $("addEmployeeButton")?.addEventListener("click",openAddModal);
    $("employeeForm")?.addEventListener("submit",handleEmployeeForm);
    $("employeeImage")?.addEventListener("change",previewEmployeeImage);
    $("refreshEmployees")?.addEventListener("click",loadEmployees);
    ["employeeSearch","employeeDepartmentFilter","employeeStatusFilter","employeeRoleFilter"].forEach(id=>$(id)?.addEventListener("input",()=>renderEmployees(allEmployees)));
    $("attendanceDate")?.addEventListener("change",loadAttendance);
    $("saveAttendanceButton")?.addEventListener("click",saveAttendance);
    $("applyLeaveButton")?.addEventListener("click",()=>{clearFormMessage("leaveFormMessage");$("leaveForm")?.reset();openModal("leaveModal");});
    $("leaveForm")?.addEventListener("submit",applyLeave);
    ["leaveStatusFilter","leaveTypeFilter"].forEach(id=>$(id)?.addEventListener("change",()=>renderLeaves(allLeaves)));
    $("addProjectButton")?.addEventListener("click",()=>{clearFormMessage("projectFormMessage");$("projectForm")?.reset();populateEmployeeSelects();openModal("projectModal");});
    $("projectForm")?.addEventListener("submit",createProject);
    $("chatForm")?.addEventListener("submit",sendChatMessage);
    $("refreshChatUsers")?.addEventListener("click",setupChatUI);
    $("clearChatButton")?.addEventListener("click",clearChatHistory);
    $("chatUserSearch")?.addEventListener("input",()=>{const q=$("chatUserSearch").value.toLowerCase();document.querySelectorAll(".chat-user").forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q)?"":"none");});
    $("notificationButton")?.addEventListener("click",()=>$("notificationPanel")?.classList.toggle("hidden"));
    $("markNotificationsRead")?.addEventListener("click",async()=>{const rows=await api("/api/notifications").catch(()=>({notifications:[]}));for(const n of rows.notifications||[]){if(!n.is_read)await api(`/api/notifications/${n.id}/read`,{method:"PATCH"}).catch(()=>{});}await loadNotifications();});
    $("changePasswordForm")?.addEventListener("submit",changePassword);
    $("forgotPasswordButton")?.addEventListener("click",()=>openModal("forgotPasswordModal"));
    $("forgotPasswordForm")?.addEventListener("submit",forgotPassword);
    $("resetPasswordForm")?.addEventListener("submit",resetPassword);
    $("copyResetToken")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("resetToken")?.textContent||"");showToast("Reset token copied.");}catch{showToast("Copy failed.","warning");}});
    document.querySelectorAll("[data-close-modal]").forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.closeModal)));
    document.querySelectorAll(".modal-overlay").forEach(overlay=>overlay.addEventListener("click",()=>overlay.parentElement?.parentElement && closeModal(overlay.parentElement.parentElement.id)));
    ["currentPassword","newPassword","confirmNewPassword","employeePassword","newResetPassword","confirmResetPassword"].forEach(id=>enhancePasswordField(id));
}

/* =========================================================
   INITIALIZE APPLICATION
========================================================= */
async function initializeERP() {
    try {
        initTheme();
        initEventListeners();
        setDefaultDates();
        await restoreSession();
    } catch (error) {
        console.error("ERP initialization error:", error);
        showLoginScreen();
    } finally {
        const loader = $("appLoader");

        if (loader) {
            loader.style.display = "none";
        }
    }
}

/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeERP
    );

} else {

    initializeERP();

}


/* =========================================================
   GLOBAL FUNCTIONS
   Required by inline onclick="" in index.html
========================================================= */

window.toggleSidebar =
    toggleSidebar;

window.toggleTheme =
    toggleTheme;

window.switchTab =
    switchTab;

window.logout =
    logout;

window.viewMyID =
    viewMyID;

window.viewIDCard =
    viewIDCard;

window.printDiv =
    printDiv;

window.downloadPayslip =
    downloadPayslip;

window.exportEmployeesCSV =
    exportEmployeesCSV;

window.exportAttendanceCSV =
    exportAttendanceCSV;

window.openAddModal =
    openAddModal;

window.closeAddModal =
    closeAddModal;

window.openEditModal =
    openEditModal;

window.closeEditModal =
    closeEditModal;

window.deleteEmployee =
    deleteEmployee;

window.markAllLeave =
    markAllLeave;

window.buildAttendanceCalendar =
    buildAttendanceCalendar;

window.updateLeave =
    updateLeave;

window.selectChat =
    selectChat;

window.toggleChatHeaderMenu =
    toggleChatHeaderMenu;

window.clearChatHistory =
    clearChatHistory;

window.openMsgAction =
    openMsgAction;

window.deleteSelectedMessage =
    deleteSelectedMessage;

window.selectEmployeeSearch =
    selectEmployeeSearch;
/* =========================================================
   FINAL INTEGRATION PATCH
   This block intentionally overrides older duplicated
   functions so the current index.html IDs stay synchronized.
========================================================= */

const DS_FINAL = {
    branding: { logo: null, companyName: "Dhanush Softwares" },
    monthlyAttendance: [],
    reports: {}
};

function indiaDateString(value = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(value);
}

function indiaMonthString(value = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit" }).formatToParts(value);
    const y = parts.find(p => p.type === "year")?.value;
    const m = parts.find(p => p.type === "month")?.value;
    return `${y}-${m}`;
}

function monthDays(month) {
    const [y, m] = String(month).split("-").map(Number);
    return new Date(y, m, 0).getDate();
}

function formatIndiaDateTime(value) {
    if (!value) return "Never";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Never";
    return d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function statusCode(status) {
    const s = String(status || "").toLowerCase().replace("_", "-");
    if (s === "present") return "P";
    if (s === "absent") return "A";
    if (s === "leave") return "L";
    if (s === "half-day" || s === "halfday") return "HD";
    return "-";
}

function calculateAttendance(rows) {
    const counts = { present: 0, absent: 0, leave: 0, halfDay: 0 };
    rows.forEach(r => {
        const s = String(r.status || "").toLowerCase().replace("_", "-");
        if (s === "present") counts.present++;
        else if (s === "absent") counts.absent++;
        else if (s === "leave") counts.leave++;
        else if (s === "half-day") counts.halfDay++;
    });
    const denominator = counts.present + counts.absent + counts.leave + counts.halfDay;
    const effective = counts.present + counts.halfDay * 0.5;
    return { ...counts, total: denominator, percentage: denominator ? Math.round((effective / denominator) * 10000) / 100 : 0 };
}

function setElementHTML(id, html) {
    const el = $(id);
    if (el) el.innerHTML = html;
    return el;
}

function hideAllModals() {
    document.querySelectorAll(".modal").forEach(m => {
        m.classList.add("hidden");
        m.setAttribute("aria-hidden", "true");
    });
}

function setBrandingUI(branding) {
    DS_FINAL.branding = branding || { logo: null, companyName: "Dhanush Softwares" };
    const logo = DS_FINAL.branding.logo;
    const authPage = $("loginPage");
    if (authPage) authPage.style.setProperty("--login-logo-bg", logo ? `url("${logo}")` : "none");
    ["loginBrandLogo", "sidebarBrandLogo", "settingsLogoPreview"].forEach(id => {
        const img = $(id);
        if (!img) return;
        if (logo) {
            img.onerror = () => {
                if (img.dataset.fallbackApplied !== "1" && /Dhanush\.jpg/i.test(img.src)) {
                    img.dataset.fallbackApplied = "1";
                    img.src = "/logo.svg";
                    const auth = $("loginPage");
                    if (auth) auth.style.setProperty("--login-logo-bg", 'url("/logo.svg")');
                    return;
                }
                img.style.display = id === "settingsLogoPreview" ? "none" : "none";
            };
            img.src = logo;
            img.style.display = "block";
        } else {
            img.removeAttribute("src");
            img.style.display = id === "settingsLogoPreview" ? "none" : "none";
        }
    });
    document.querySelectorAll(".brand-logo-fallback").forEach(el => el.style.display = logo ? "none" : "flex");
    document.querySelectorAll(".sidebar-brand-text strong").forEach(el => el.textContent = DS_FINAL.branding.companyName || "Dhanush");
    document.querySelectorAll(".login-brand h1").forEach(el => el.textContent = DS_FINAL.branding.companyName || "Dhanush Softwares");
}

async function loadBranding() {
    try {
        const data = await fetch("/api/public/branding", { cache: "no-store" }).then(r => r.json());
        setBrandingUI(data.branding || { logo: null, companyName: "Dhanush Softwares" });
    } catch {
        const cached = localStorage.getItem("ds_branding");
        if (cached) { try { setBrandingUI(JSON.parse(cached)); } catch {} } else { setBrandingUI({ logo: null, companyName: "Dhanush Softwares" }); }
    }
}

function toggleSidebar() {
    const sidebar = $("sidebar");
    const overlay = $("sidebarOverlay");
    if (!sidebar) return;
    if (window.innerWidth <= 900) {
        const willOpen = !sidebar.classList.contains("open");
        sidebar.classList.toggle("open", willOpen);
        document.body.classList.toggle("sidebar-open", willOpen);
        if (overlay) overlay.style.display = willOpen ? "block" : "none";
    } else {
        sidebar.classList.toggle("closed");
        document.body.classList.remove("sidebar-open");
        if (overlay) overlay.style.display = "none";
    }
}

function updateThemeIcon() {
    const el = $("themeToggleIcon");
    if (!el) return;
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    el.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z"></path></svg>';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("erp_theme", next);
    updateThemeIcon();
}

function initTheme() {
    const saved = localStorage.getItem("erp_theme");
    const theme = saved || "light";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon();
}

function updateBurgerIcon() {
    const el = $("sidebarToggleIcon");
    if (!el) return;
    el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';
}

function switchTab(tabId) {
    const section = document.getElementById(`page-${tabId}`);
    if (!section) {
        showToast(`Page "${tabId}" is not available.`, "warning");
        return;
    }
    document.querySelectorAll(".page-section").forEach(p => p.classList.remove("active", "active-section"));
    section.classList.add("active", "active-section");
    document.querySelectorAll(".nav-item[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === tabId));
    const meta = {
        dashboard: ["Dashboard", "Overview of your employee management system"], employees: ["Employees", "Create and manage employee accounts"],
        attendance: ["Attendance", "Mark and review daily attendance"], leaves: ["Leave Management", "Attendance review and leave requests"],
        projects: ["Projects", "Assign, complete and rate projects"], chat: ["Internal Chat", "Fast employee-to-employee communication"],
        payroll: ["Payroll", "Salary credits and payslips"], performance: ["Performance", "Employee performance and project ratings"],
        announcements: ["Announcements", "Company announcements"], reports: ["Reports", "Management reports from Neon PostgreSQL"],
        ai: ["AI Assistant", "Gemini-powered ERP assistant"], settings: ["Settings", "Profile, branding and security"]
    }[tabId] || ["ERP", ""];
    if ($("currentPageTitle")) $("currentPageTitle").textContent = meta[0];
    if ($("currentPageSubtitle")) $("currentPageSubtitle").textContent = meta[1];
    if (window.innerWidth <= 850) {
        $("sidebar")?.classList.remove("open");
        if ($("sidebarOverlay")) $("sidebarOverlay").style.display = "none";
    }
    const loaders = { dashboard: loadDashboard, employees: loadEmployees, attendance: loadAttendance, leaves: loadLeaves, projects: loadProjects, chat: setupChatUI, payroll: loadPayroll, performance: loadPerformance, reports: loadReportsPage, ai: initAIPage, settings: setupSettingsPage };
    if (loaders[tabId]) Promise.resolve(loaders[tabId]()).catch(e => console.error(tabId, e));
}

function showLoginScreen() {
    $("loginPage")?.classList.remove("hidden");
    if ($("loginPage")) $("loginPage").style.display = "flex";
    const app = $("erpApp");
    if (app) { app.classList.add("hidden"); app.style.display = "none"; }
}

function showMainApp() {
    $("loginPage")?.classList.add("hidden");
    if ($("loginPage")) $("loginPage").style.display = "none";
    const app = $("erpApp");
    if (app) { app.classList.remove("hidden"); app.style.display = "flex"; }
    if ($("appLoader")) $("appLoader").style.display = "none";
}

function setupUserUI() {
    if (!currentUser) return;
    const name = currentUser.name || "User";
    const image = currentUser.profile_image;
    ["sidebarUserAvatar", "topbarUserAvatar"].forEach(id => {
        const el = $(id); if (!el) return;
        el.innerHTML = image ? `<img src="${escapeHTML(image)}" alt="Profile">` : escapeHTML(getInitial(name));
        el.classList.toggle("has-photo", !!image);
    });
    if ($("sidebarUserName")) $("sidebarUserName").textContent = name;
    if ($("sidebarUserRole")) $("sidebarUserRole").textContent = roleLabel(currentUser.role);
    if ($("topbarUserName")) $("topbarUserName").textContent = name;
    if ($("topbarUserRole")) $("topbarUserRole").textContent = roleLabel(currentUser.role);
    if ($("settingsProfile")) {
        $("settingsProfile").innerHTML = `<div class="settings-profile-preview"><div class="profile-large-avatar">${image ? `<img src="${escapeHTML(image)}" alt="Profile">` : escapeHTML(getInitial(name))}</div><div><strong>${escapeHTML(name)}</strong><span>${escapeHTML(roleLabel(currentUser.role))}</span><small>${escapeHTML(currentUser.email || "-")}</small></div></div>`;
    }
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = isAdmin() ? "" : "none");
    document.querySelectorAll(".employee-only").forEach(el => el.style.display = isManager() ? "none" : "");
    document.querySelectorAll(".manager-only").forEach(el => el.style.display = isManager() ? "" : "none");
}

function setDefaultDates() {
    if ($("attendanceDate")) $("attendanceDate").value = todayString();
    if ($("leaveAttendanceMonth")) $("leaveAttendanceMonth").value = indiaMonthString();
    if ($("payrollMonth") && !$("payrollMonth").value) $("payrollMonth").value = indiaMonthString();
}

async function loadEverything() {
    await Promise.allSettled([loadBranding(), loadDepartments(), loadEmployees(), loadAttendance(), loadLeaves(), loadProjects(), loadDashboard(), loadNotifications()]);
}

async function loadDashboard() {
    try {
        const data = await api("/api/dashboard");
        const d = data.dashboard || {};
        if ($("dashboardCurrentDate")) $("dashboardCurrentDate").textContent = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });
        if ($("statTotalEmployees")) $("statTotalEmployees").textContent = d.totalEmployees ?? 0;
        if ($("statActiveEmployees")) $("statActiveEmployees").textContent = d.activeEmployees ?? 0;
        if ($("statPendingLeaves")) $("statPendingLeaves").textContent = d.pendingLeaves ?? 0;
        if ($("statActiveProjects")) $("statActiveProjects").textContent = d.totalProjects ?? 0;
        if ($("dashboardLeaves")) $("dashboardLeaves").innerHTML = (d.pendingLeaves || 0) ? `<div class="dashboard-highlight">${d.pendingLeaves} pending leave request${d.pendingLeaves === 1 ? "" : "s"}</div>` : `<div class="empty-state-card">No pending leave requests.</div>`;
        if ($("dashboardAnnouncements")) $("dashboardAnnouncements").innerHTML = (d.announcements || []).length ? d.announcements.map(a => `<div class="announcement-preview"><strong>${escapeHTML(a.title || "Announcement")}</strong><span>${escapeHTML(a.message || "")}</span><small>${formatIndiaDateTime(a.created_at)}</small></div>`).join("") : `<div class="empty-state-card">No announcements yet.</div>`;
        if ($("dashboardProjects")) {
            const projects = allProjects.slice(0, 5);
            $("dashboardProjects").innerHTML = projects.length ? projects.map(p => `<div class="dashboard-row"><div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.assigned_employee_name || "Unassigned")}</small></div><span class="status-badge ${String(p.status || "").toLowerCase()}">${escapeHTML(p.status || "planned")}</span></div>`).join("") : `<div class="empty-state-card">No projects yet.</div>`;
        }
        if ($("dashboardAttendance")) {
            const rows = allAttendance.filter(r => String(r.attendance_date).slice(0,10) === todayString());
            const c = calculateAttendance(rows);
            $("dashboardAttendance").innerHTML = `<div class="dashboard-highlight"><strong>${c.present}</strong> present · <strong>${c.absent}</strong> absent · <strong>${c.leave}</strong> leave</div>`;
        }
        if (currentUser && !isManager()) await renderEmployeeDashboardPersonal();
        else if (currentUser) await renderAdminDashboardPersonal();
    } catch (error) { console.error("Dashboard:", error); }
}

async function renderAdminDashboardPersonal() {
    const card = $("dashboardIdCard")?.closest(".id-card-panel");
    const slip = $("dashboardPayslip")?.closest(".payslip-panel");
    if (card) card.style.display = "none";
    if (slip) slip.style.display = "none";
}

async function renderEmployeeDashboardPersonal() {
    const employee = currentUser;
    const idBox = $("dashboardIdCard");
    if (idBox) idBox.innerHTML = `<div class="mini-id-card"><div class="mini-id-photo">${employee.profile_image ? `<img src="${escapeHTML(employee.profile_image)}" alt="Profile">` : escapeHTML(getInitial(employee.name))}</div><div><strong>${escapeHTML(employee.name)}</strong><span>${escapeHTML(employee.designation || "Employee")}</span><small>${escapeHTML(employee.employee_code || "EMP")}</small></div></div>`;
    if ($("dashboardIdButton")) $("dashboardIdButton").onclick = () => showIDCardPreview(employee);
    if ($("dashboardHeaderIdButton")) $("dashboardHeaderIdButton").onclick = () => showIDCardPreview(employee);
    if ($("dashboardHeaderPayslipButton")) $("dashboardHeaderPayslipButton").onclick = () => showPayslipPreview(employee.id);
    await renderLatestPayslip(employee.id);
}

async function renderLatestPayslip(employeeId) {
    const box = $("dashboardPayslip");
    if (!box) return;
    try {
        const data = await api("/api/payroll");
        const rows = (data.payroll || []).filter(p => Number(p.employee_id) === Number(employeeId)).sort((a,b) => String(b.payroll_month).localeCompare(String(a.payroll_month)));
        const latest = rows[0];
        if (!latest) { box.innerHTML = `<div class="empty-state-card">No salary slip yet.</div>`; return; }
        const month = String(latest.payroll_month).slice(0,7);
        const att = await api(`/api/attendance/monthly?month=${encodeURIComponent(month)}&employee_id=${employeeId}`);
        const stats = calculateAttendance(att.attendance || []);
        const projects = allProjects.filter(p => Number(p.assigned_to) === Number(employeeId) && String(p.status).toLowerCase() === "completed");
        box.innerHTML = `<div class="slip-summary"><div><span>Month</span><strong>${escapeHTML(month)}</strong></div><div><span>Net Salary</span><strong>₹${Number(latest.net_salary || 0).toLocaleString("en-IN")}</strong></div><div><span>Attendance</span><strong>${stats.percentage}%</strong></div><div><span>Projects</span><strong>${projects.length}</strong></div></div><div class="slip-projects">${projects.length ? projects.map(p => `<span>${escapeHTML(p.name)}</span>`).join("") : "No completed projects"}</div>`;
        if ($("dashboardPayslipButton")) $("dashboardPayslipButton").onclick = () => showPayslipPreview(employeeId);
    } catch (error) { box.innerHTML = `<div class="empty-state-card">Unable to load salary slip.</div>`; }
}

async function loadEmployees() {
    try { const data = await api("/api/employees"); allEmployees = data.employees || []; renderEmployees(allEmployees); populateEmployeeSelects(); } catch (error) { showToast(error.message, "error"); }
}

function populateEmployeeSelects() {
    const active = allEmployees.filter(e => String(e.status || "active").toLowerCase() === "active" && Number(e.id) !== Number(currentUser?.id));
    const opts = active.map(e => `<option value="${e.id}">${escapeHTML(e.name)}${e.employee_code ? ` · ${escapeHTML(e.employee_code)}` : ""}</option>`).join("");
    if ($("projectEmployee")) $("projectEmployee").innerHTML = `<option value="">Select employee</option>${opts}`;
    if ($("payrollEmployee")) $("payrollEmployee").innerHTML = `<option value="">Select employee</option>${opts}`;
    if ($("employeeDepartment")) $("employeeDepartment").innerHTML = `<option value="">Select Department</option>${allDepartments.map(d => `<option value="${d.id}">${escapeHTML(d.name)}</option>`).join("")}`;
    if ($("employeeDepartmentFilter")) $("employeeDepartmentFilter").innerHTML = `<option value="">All Departments</option>${allDepartments.map(d => `<option value="${escapeHTML(d.name)}">${escapeHTML(d.name)}</option>`).join("")}`;
    if ($("leaveAttendanceEmployee")) $("leaveAttendanceEmployee").innerHTML = `<option value="ALL">All Employees</option>${active.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join("")}`;
}

function employeeAvatar(employee, sizeClass = "") {
    return employee.profile_image ? `<div class="employee-avatar ${sizeClass}"><img src="${escapeHTML(employee.profile_image)}" alt="Profile"></div>` : `<div class="employee-avatar ${sizeClass}">${escapeHTML(getInitial(employee.name))}</div>`;
}

function renderEmployees(employees) {
    const body = $("employeesTableBody"); if (!body) return;
    if (!isManager()) { body.innerHTML = `<tr><td colspan="9" class="empty-state-cell">Employee directory is available to management only.</td></tr>`; return; }
    const q = String($("employeeSearch")?.value || "").toLowerCase().trim();
    const status = String($("employeeStatusFilter")?.value || "").toLowerCase();
    const role = String($("employeeRoleFilter")?.value || "").toLowerCase();
    const dept = String($("employeeDepartmentFilter")?.value || "").toLowerCase();
    const filtered = employees.filter(e => { const hay = `${e.name || ""} ${e.email || ""} ${e.employee_code || ""} ${e.designation || ""}`.toLowerCase(); return (!q || hay.includes(q)) && (!status || String(e.status).toLowerCase() === status) && (!role || String(e.role).toLowerCase() === role) && (!dept || String(e.department_name || "").toLowerCase() === dept); });
    body.innerHTML = filtered.length ? filtered.map(e => { const active = String(e.status || "active").toLowerCase() === "active"; return `<tr><td>${employeeAvatar(e, "table-avatar")}</td><td><strong>${escapeHTML(e.employee_code || "-")}</strong></td><td>${escapeHTML(e.name)}</td><td>${escapeHTML(e.email)}</td><td>${escapeHTML(e.department_name || "-")}</td><td>${escapeHTML(e.designation || "-")}</td><td><span class="status-badge ${active ? "active" : "inactive"}">${active ? "Active" : "Inactive"}</span></td><td>${formatDate(e.joining_date)}</td><td><div class="table-actions"><button class="table-action" onclick="viewIDCard(${Number(e.id)})">ID</button><button class="table-action" onclick="openEditModal(${Number(e.id)})">Edit</button><button class="table-action ${active ? "danger" : "success"}" onclick="deleteEmployee(${Number(e.id)})">${active ? "Deactivate" : "Activate"}</button></div></td></tr>`; }).join("") : `<tr><td colspan="9" class="empty-state-cell">No employees found.</td></tr>`;
}

async function readProfileImage() {
    const file = $("employeeImage")?.files?.[0];
    if (!file) return undefined;
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) throw new Error("Use JPG, PNG or WebP.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Profile photo must be 10MB or smaller.");
    return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Unable to read image.")); reader.readAsDataURL(file); });
}

function previewEmployeeImage() {
    const file = $("employeeImage")?.files?.[0]; const preview = $("employeeImagePreview"); if (!preview) return;
    if (!file) { preview.innerHTML = "<span>👤</span>"; return; }
    if (file.size > 10 * 1024 * 1024) { preview.innerHTML = "<span>10MB max</span>"; return; }
    const reader = new FileReader(); reader.onload = () => preview.innerHTML = `<img src="${escapeHTML(reader.result)}" alt="Preview">`; reader.readAsDataURL(file);
}

async function loadAttendance() {
    try {
        const date = $("attendanceDate")?.value || todayString();
        const data = await api(`/api/attendance?date=${encodeURIComponent(date)}`);
        allAttendance = data.attendance || [];
        renderAttendanceList(allEmployees);
    } catch (error) { showToast(error.message, "error"); }
}

function renderAttendanceList(employees) {
    const body = $("attendanceTableBody"); if (!body) return;
    const date = $("attendanceDate")?.value || todayString();
    const activeEmployees = employees.filter(e => String(e.status || "active").toLowerCase() === "active" && (isManager() || Number(e.id) === Number(currentUser?.id)));
    const records = new Map(allAttendance.map(r => [Number(r.employee_id), r]));
    const visibleRows = isManager() ? activeEmployees : [currentUser];
    const counts = calculateAttendance(allAttendance);
    $("attendancePresentCount") && ($("attendancePresentCount").textContent = counts.present);
    $("attendanceAbsentCount") && ($("attendanceAbsentCount").textContent = counts.absent);
    $("attendanceLeaveCount") && ($("attendanceLeaveCount").textContent = counts.leave);
    $("attendanceHalfDayCount") && ($("attendanceHalfDayCount").textContent = counts.halfDay);
    body.innerHTML = visibleRows.length ? visibleRows.map(e => { const r = records.get(Number(e.id)); const status = String(r?.status || "present").toLowerCase().replace("_", "-"); const control = isManager() ? `<select class="attendance-status-select" data-employee-id="${e.id}"><option value="present" ${status === "present" ? "selected" : ""}>Present</option><option value="absent" ${status === "absent" ? "selected" : ""}>Absent</option><option value="leave" ${status === "leave" ? "selected" : ""}>Leave</option><option value="half-day" ${status === "half-day" ? "selected" : ""}>Half Day</option></select>` : `<span class="status-badge ${status}">${escapeHTML(status)}</span>`; return `<tr><td><div class="employee-cell">${employeeAvatar(e, "table-avatar")}<div><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.employee_code || "")}</small></div></div></td><td>${formatDate(date)}</td><td>${control}</td><td>${escapeHTML(r?.check_in || "-")}</td><td>${escapeHTML(r?.check_out || "-")}</td><td>${escapeHTML(e.department_name || "-")}</td></tr>`; }).join("") : `<tr><td colspan="6" class="empty-state-cell">No employees found.</td></tr>`;
}

async function saveAttendance() {
    if (!isManager()) return showToast("Only management can save attendance.", "error");
    const date = $("attendanceDate")?.value || todayString();
    const controls = [...document.querySelectorAll(".attendance-status-select")];
    if (!controls.length) return showToast("No employees available.", "warning");
    const button = $("saveAttendanceButton"); if (button) { button.disabled = true; button.textContent = "Saving..."; }
    try {
        await Promise.all(controls.map(select => api("/api/attendance", { method: "POST", body: { employee_id: Number(select.dataset.employeeId), attendance_date: date, status: select.value } })));
        await loadAttendance();
        showToast("Attendance saved for all employees.");
    } catch (error) { showToast(error.message, "error"); }
    finally { if (button) { button.disabled = false; button.textContent = "💾 Save Attendance"; } }
}

async function loadLeaveAttendanceReview() {
    const month = $("leaveAttendanceMonth")?.value || indiaMonthString();
    const employeeId = $("leaveAttendanceEmployee")?.value || "ALL";
    try {
        const data = await api(`/api/attendance/monthly?month=${encodeURIComponent(month)}&employee_id=${encodeURIComponent(employeeId)}`);
        DS_FINAL.monthlyAttendance = data.attendance || [];
        const selectedEmployees = employeeId === "ALL" ? allEmployees.filter(e => String(e.status || "active").toLowerCase() === "active") : allEmployees.filter(e => Number(e.id) === Number(employeeId));
        const body = $("leaveAttendanceTableBody");
        const days = monthDays(month);
        const summaries = selectedEmployees.map(e => { const rows = DS_FINAL.monthlyAttendance.filter(r => Number(r.employee_id) === Number(e.id)); const s = calculateAttendance(rows); return { e, rows, s, days }; });
        if ($("leaveAttendanceSummary")) $("leaveAttendanceSummary").innerHTML = `<div class="review-summary-strip">${summaries.map(x => `<div><span>${escapeHTML(x.e.name)}</span><strong>${x.s.percentage}%</strong><small>${x.s.present} P · ${x.s.absent} A · ${x.s.leave} L · ${x.s.halfDay} HD</small></div>`).join("") || "<span>No employees found.</span>"}</div>`;
        if (body) body.innerHTML = summaries.length ? summaries.map(x => `<tr><td>${escapeHTML(x.e.name)}</td><td>${days}</td><td>${x.s.present}</td><td>${x.s.absent}</td><td>${x.s.leave}</td><td>${x.s.halfDay}</td><td><strong>${x.s.percentage}%</strong></td></tr>`).join("") : `<tr><td colspan="7" class="empty-state-cell">No attendance found.</td></tr>`;
    } catch (error) { showToast(error.message, "error"); }
}

function downloadAttendanceExcel() {
    const month = $("leaveAttendanceMonth")?.value || indiaMonthString();
    const employeeId = $("leaveAttendanceEmployee")?.value || "ALL";
    const days = monthDays(month);
    const employees = employeeId === "ALL" ? allEmployees.filter(e => String(e.status || "active").toLowerCase() === "active") : allEmployees.filter(e => Number(e.id) === Number(employeeId));
    const header = ["Employee ID", "Employee Name", ...Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, "0")), "Total Days", "Present", "Absent", "Leave", "Half Day", "Attendance %"];
    const rows = employees.map(e => { const records = new Map(DS_FINAL.monthlyAttendance.filter(r => Number(r.employee_id) === Number(e.id)).map(r => [Number(String(r.attendance_date).slice(-2)), statusCode(r.status)])); const daily = Array.from({ length: days }, (_, i) => records.get(i + 1) || "-"); const stats = calculateAttendance(DS_FINAL.monthlyAttendance.filter(r => Number(r.employee_id) === Number(e.id))); return [e.employee_code || e.id, e.name, ...daily, days, stats.present, stats.absent, stats.leave, stats.halfDay, `${stats.percentage}%`]; });
    const table = `<table border="1"><thead><tr>${header.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${escapeHTML(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const blob = new Blob([`<html><head><meta charset="utf-8"></head><body><h2>Dhanush Softwares Attendance - ${escapeHTML(month)}</h2>${table}</body></html>`], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `attendance-${month}.xls`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function loadLeaves() {
    try { const data = await api("/api/leaves"); allLeaves = data.leaves || []; renderLeaves(allLeaves); await loadLeaveAttendanceReview(); } catch (error) { showToast(error.message, "error"); }
}

function renderLeaves(rows) {
    const body = $("leavesTableBody"); if (!body) return;
    const sf = String($("leaveStatusFilter")?.value || "").toLowerCase(); const tf = String($("leaveTypeFilter")?.value || "").toLowerCase();
    const filtered = rows.filter(r => (!sf || String(r.status || "").toLowerCase() === sf) && (!tf || String(r.leave_type || "").toLowerCase() === tf));
    if ($("leaveCount")) $("leaveCount").textContent = `${filtered.length} request${filtered.length === 1 ? "" : "s"}`;
    body.innerHTML = filtered.length ? filtered.map(r => { const actions = isManager() ? `<button class="table-action success" onclick="updateLeave(${Number(r.id)},'approved')">Approve</button><button class="table-action danger" onclick="updateLeave(${Number(r.id)},'rejected')">Reject</button>` : "<span class='muted-label'>—</span>"; return `<tr><td>${escapeHTML(r.employee_name || "-")}</td><td>${escapeHTML(r.leave_type || "-")}</td><td>${formatDate(r.start_date)}</td><td>${formatDate(r.end_date)}</td><td>${escapeHTML(r.reason || "-")}</td><td><span class="status-badge ${String(r.status || "").toLowerCase()}">${escapeHTML(r.status || "-")}</span></td><td>${formatDate(r.created_at)}</td><td><div class="table-actions">${actions}</div></td></tr>`; }).join("") : `<tr><td colspan="8" class="empty-state-cell">No leave requests found.</td></tr>`;
}

async function loadProjects() {
    const grid = $("projectsGrid");
    if (grid) grid.innerHTML = `<div class="loading-placeholder">Loading projects...</div>`;
    try {
        const data = await api(`/api/projects?ts=${Date.now()}`, { cache: "no-store" });
        allProjects = Array.isArray(data.projects) ? data.projects : [];
        renderProjects();
        populateEmployeeSelects();
        if ($("dashboardProjects")) {
            const recent = allProjects.slice(0, 5);
            $("dashboardProjects").innerHTML = recent.length ? recent.map(p => `<div class="dashboard-row"><div><strong>${escapeHTML(p.name || "Untitled project")}</strong><small>${escapeHTML(p.assigned_employee_name || "Unassigned")}</small></div><span class="status-badge">${escapeHTML(p.status || "planned")}</span></div>`).join("") : `<div class="empty-state-card">No projects yet.</div>`;
        }
    } catch (error) {
        console.error("Projects load failed:", error);
        if (grid) grid.innerHTML = `<div class="empty-state-card"><strong>Unable to load projects.</strong><p>${escapeHTML(error.message || "Please try again.")}</p><button type="button" class="secondary-button" onclick="loadProjects()">Retry</button></div>`;
        showToast(error.message || "Unable to load projects.", "error");
    }
}

function renderProjects() {
    const grid = $("projectsGrid"); if (!grid) return;
    const rows = Array.isArray(allProjects) ? allProjects : [];
    const assigned = rows.filter(p => Number(p.assigned_to) === Number(currentUser?.id));
    if ($("projectAssignedCount")) $("projectAssignedCount").textContent = isManager() ? rows.length : assigned.length;
    if ($("projectProgressCount")) $("projectProgressCount").textContent = rows.filter(p => ["in progress","planned"].includes(String(p.status || "").toLowerCase())).length;
    if ($("projectReviewCount")) $("projectReviewCount").textContent = rows.filter(p => String(p.status || "").toLowerCase() === "completed" && !p.latest_rating).length;
    if ($("projectCompletedCount")) $("projectCompletedCount").textContent = rows.filter(p => String(p.status || "").toLowerCase() === "completed").length;
    const visible = isManager() ? rows : assigned;
    grid.innerHTML = visible.length ? visible.map(p => {
        const mine = Number(p.assigned_to) === Number(currentUser?.id);
        const completed = String(p.status || "").toLowerCase() === "completed";
        const actions = mine && !completed ? `<button class="table-action success" onclick="completeProject(${Number(p.id)})">✓ Mark Complete</button>` : "";
        const rate = isManager() && completed ? `<button class="table-action" onclick="rateProject(${Number(p.id)})">⭐ Rate</button>` : "";
        const rating = p.latest_rating ? `<span class="project-rating">⭐ ${Number(p.latest_rating).toFixed(1)}/5</span>` : "";
        return `<article class="project-card"><div class="project-card-top"><span class="status-badge">${escapeHTML(p.status || "planned")}</span><span>${escapeHTML(p.priority || "Medium")}</span></div><h3>${escapeHTML(p.name || "Untitled project")}</h3><p>${escapeHTML(p.description || "No description")}</p><div class="project-meta"><span>👤 ${escapeHTML(p.assigned_employee_name || "Unassigned")}</span><span>📅 ${formatDate(p.end_date)}</span></div><div class="progress-track"><span style="width:${Math.max(0, Math.min(100, Number(p.progress) || 0))}%"></span></div><small>${Number(p.progress) || 0}% complete ${rating}</small><div class="table-actions project-actions">${actions}${rate}</div></article>`;
    }).join("") : `<div class="empty-state-card">No projects assigned.</div>`;
}

async function completeProject(id) {
    if (!confirm("Mark this project as completed?")) return;
    try { await api(`/api/projects/${id}/complete`, { method: "PATCH" }); await loadProjects(); await loadDashboard(); showToast("Project marked completed."); } catch (error) { showToast(error.message, "error"); }
}

function rateProject(id) {
    const project = allProjects.find(p => Number(p.id) === Number(id)); if (!project) return;
    const overlay = document.createElement("div"); overlay.className = "rating-dialog-overlay"; overlay.innerHTML = `<div class="rating-dialog"><button class="modal-close" type="button">×</button><h3>Rate ${escapeHTML(project.name)}</h3><p>Give the employee a project performance rating.</p><div class="rating-stars">${[1,2,3,4,5].map(n => `<button type="button" data-score="${n}">★</button>`).join("")}</div><textarea id="ratingComment" placeholder="Optional feedback..."></textarea><button id="saveRatingButton" class="primary-button">Save Rating</button></div>`; document.body.appendChild(overlay); let score = 5; overlay.querySelectorAll("[data-score]").forEach(b => b.addEventListener("click", () => { score = Number(b.dataset.score); overlay.querySelectorAll("[data-score]").forEach(x => x.classList.toggle("selected", Number(x.dataset.score) <= score)); })); overlay.querySelector("[data-score='5']")?.classList.add("selected"); overlay.querySelector(".modal-close").onclick = () => overlay.remove(); overlay.querySelector("#saveRatingButton").onclick = async () => { try { await api(`/api/projects/${id}/rating`, { method: "POST", body: { score, comments: $("ratingComment")?.value || "" } }); overlay.remove(); await loadProjects(); showToast("Project rating saved."); } catch (error) { showToast(error.message, "error"); } };
}

async function loadPayroll() {
    try {
        const data = await api("/api/payroll"); const rows = data.payroll || []; const mine = isManager() ? rows : rows.filter(p => Number(p.employee_id) === Number(currentUser?.id));
        const body = $("payrollTableBody");
        const total = mine.reduce((s,p) => s + Number(p.net_salary || 0), 0);
        if ($("payrollTotal")) $("payrollTotal").textContent = `₹${total.toLocaleString("en-IN")}`;
        if ($("payrollNetSalary")) $("payrollNetSalary").textContent = mine.length ? `₹${Number(mine[0].net_salary || 0).toLocaleString("en-IN")}` : "₹0";
        if ($("payrollProcessedCount")) $("payrollProcessedCount").textContent = mine.filter(p => String(p.status).toLowerCase() === "credited").length;
        if ($("payrollPendingCount")) $("payrollPendingCount").textContent = mine.filter(p => String(p.status).toLowerCase() !== "credited").length;
        if (body) body.innerHTML = mine.length ? mine.map(p => `<tr><td>${escapeHTML(p.employee_name || "-")}</td><td>${escapeHTML(String(p.payroll_month).slice(0,7))}</td><td>₹${Number(p.basic_salary || 0).toLocaleString("en-IN")}</td><td>₹${Number(p.allowances || 0).toLocaleString("en-IN")}</td><td>₹0</td><td>₹${Number(p.deductions || 0).toLocaleString("en-IN")}</td><td><strong>₹${Number(p.net_salary || 0).toLocaleString("en-IN")}</strong></td><td><span class="status-badge ${String(p.status || "pending").toLowerCase()}">${escapeHTML(p.status || "pending")}</span> ${!isManager() ? `<button class="table-action" onclick="downloadPayslip(${Number(p.employee_id)})">Slip</button>` : ""}</td></tr>`).join("") : `<tr><td colspan="8" class="empty-state-cell">No payroll records.</td></tr>`;
        if (isManager()) ensurePayrollButton();
        if (!isManager()) await renderLatestPayslip(currentUser.id);
    } catch (error) {
        const body = $("payrollTableBody");
        if (body) body.innerHTML = `<tr><td colspan="8" class="empty-state-cell"><strong>Unable to load payroll.</strong><br><small>${escapeHTML(error.message || "Please try again.")}</small><br><button type="button" class="secondary-button" onclick="loadPayroll()">Retry</button></td></tr>`;
        showToast(error.message || "Unable to load payroll.", "error");
    }
}

function ensurePayrollButton() {
    if ($("openPayrollButton")) return;
    const header = $("page-payroll")?.querySelector(".page-section-header"); if (!header) return;
    const button = document.createElement("button");
    button.id = "openPayrollButton";
    button.className = "primary-button";
    button.textContent = "＋ Credit Salary";
    button.onclick = async () => {
        try {
            if (!allEmployees.length) await loadEmployees();
            populateEmployeeSelects();
            $("payrollMonth").value = indiaMonthString();
            openModal("payrollModal");
        } catch (error) {
            showToast(error.message || "Unable to open payroll.", "error");
        }
    };
    header.appendChild(button);
}

async function savePayroll(event) {
    event.preventDefault(); if (!isManager()) return showToast("Management permission required.", "error");
    const basic = Number($("payrollBasic")?.value || 0), allowances = Number($("payrollAllowances")?.value || 0), deductions = Number($("payrollDeductions")?.value || 0), net = basic + allowances - deductions;
    try { await api("/api/payroll", { method: "POST", body: { employee_id: Number($("payrollEmployee")?.value), payroll_month: $("payrollMonth")?.value, basic_salary: basic, allowances, deductions, net_salary: net, status: $("payrollStatus")?.value || "credited" } }); closeModal("payrollModal"); await loadPayroll(); showToast("Salary credited successfully."); } catch (error) { setFormMessage("payrollFormMessage", error.message); }
}

async function downloadPayslip(id) {
    try {
        const data = await api(`/api/payroll?ts=${Date.now()}`, { cache: "no-store" });
        const row = (data.payroll || []).filter(p => Number(p.employee_id) === Number(id)).sort((a,b)=>String(b.payroll_month).localeCompare(String(a.payroll_month)))[0];
        const employee = allEmployees.find(e=>Number(e.id)===Number(id)) || (Number(currentUser?.id)===Number(id)?currentUser:null);
        if (!employee || !row) return showToast("No salary slip found.", "warning");
        const month=String(row.payroll_month).slice(0,7);
        const att=await api(`/api/attendance/monthly?month=${encodeURIComponent(month)}&employee_id=${id}`, {cache:"no-store"});
        const stats=calculateAttendance(att.attendance||[]);
        const projects=allProjects.filter(p=>Number(p.assigned_to)===Number(id)&&String(p.status||"").toLowerCase()==="completed");
        const html=`<!doctype html><html><head><meta charset="utf-8"><title>Payslip - ${escapeHTML(employee.name)}</title><style>body{font-family:Inter,Arial,sans-serif;padding:28px;background:#f5f7fb;color:#172033}.sheet{max-width:780px;margin:auto;background:#fff;border:1px solid #dbe4f0;border-radius:20px;padding:28px;box-shadow:0 16px 40px rgba(15,23,42,.08)}.head{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:14px}.person{display:flex;gap:14px;align-items:center;margin:20px 0}.photo{width:76px;height:76px;border-radius:50%;overflow:hidden;background:#e8efff;display:grid;place-items:center;font-weight:800;font-size:26px}.photo img{width:100%;height:100%;object-fit:cover}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.grid div{border:1px solid #e2e8f0;border-radius:12px;padding:11px}.grid small{display:block;color:#64748b}.grid strong{display:block;margin-top:4px}.sheet table{width:100%;border-collapse:collapse;margin-top:18px}.sheet th,.sheet td{border:1px solid #dbe2ea;padding:9px;text-align:left}@media(max-width:650px){.grid{grid-template-columns:1fr 1fr}}@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border:0}}</style></head><body><div class="sheet"><div class="head"><h1>${escapeHTML(DS_FINAL.branding.companyName||"Dhanush Softwares")}</h1><p>Employee Salary Slip</p></div><div class="person"><div class="photo">${employee.profile_image?`<img src="${escapeHTML(employee.profile_image)}">`:escapeHTML(getInitial(employee.name))}</div><div><h2>${escapeHTML(employee.name)}</h2><p>${escapeHTML(employee.employee_code||"")} · ${escapeHTML(employee.designation||"Employee")}</p></div></div><div class="grid"><div><small>Month</small><strong>${escapeHTML(month)}</strong></div><div><small>Attendance</small><strong>${stats.percentage}%</strong></div><div><small>Projects Completed</small><strong>${projects.length}</strong></div><div><small>Net Salary</small><strong>₹${Number(row.net_salary||0).toLocaleString("en-IN")}</strong></div></div><table><tr><th>Project</th><th>Rating</th></tr>${projects.length?projects.map(p=>`<tr><td>${escapeHTML(p.name)}</td><td>${p.latest_rating?`${Number(p.latest_rating).toFixed(1)}/5`:"-"}</td></tr>`).join(""):`<tr><td colspan="2">No completed projects</td></tr>`}</table><table><tr><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net</th></tr><tr><td>₹${Number(row.basic_salary||0).toLocaleString("en-IN")}</td><td>₹${Number(row.allowances||0).toLocaleString("en-IN")}</td><td>₹${Number(row.deductions||0).toLocaleString("en-IN")}</td><td>₹${Number(row.net_salary||0).toLocaleString("en-IN")}</td></tr></table></div></body></html>`;
        const blob=new Blob([html],{type:"text/html;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`Payslip_${employee.employee_code||employee.id}_${month}.html`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); showToast("Payslip downloaded.");
    } catch(error){showToast(error.message||"Unable to download payslip.","error");}
}

async function loadPerformance() {
    const body = $("performanceTableBody");
    if (body) body.innerHTML = `<tr><td colspan="5" class="empty-state-cell">Loading performance...</td></tr>`;
    try { const data = await api(`/api/performance?ts=${Date.now()}`, { cache: "no-store" }); const rows = data.performance || []; const body = $("performanceTableBody"); if (body) body.innerHTML = rows.length ? rows.map(r => `<tr><td>${escapeHTML(r.employee_name || "-")}</td><td><strong>${escapeHTML(r.score || "-")}</strong></td><td>${escapeHTML(r.comments || "-")}</td><td>${formatDate(r.review_date || r.created_at)}</td><td>${escapeHTML(r.reviewed_by_name || r.reviewed_by || "-")}</td></tr>`).join("") : `<tr><td colspan="5" class="empty-state-cell">No performance reviews yet.</td></tr>`; if ($("performanceCards")) $("performanceCards").innerHTML = rows.length ? `<div class="performance-card-highlight"><strong>${(rows.reduce((s,r)=>s+Number(r.score||0),0)/rows.length).toFixed(1)}/5</strong><span>Average rating</span></div>` : `<div class="performance-card-highlight"><strong>—</strong><span>No ratings yet</span></div>`; } catch (error) {
        if (body) body.innerHTML = `<tr><td colspan="5" class="empty-state-cell"><strong>Unable to load performance records.</strong><br><small>${escapeHTML(error.message || "Please try again.")}</small><br><button type="button" class="secondary-button" onclick="loadPerformance()">Retry</button></td></tr>`;
        showToast(error.message || "Unable to load performance records.", "error");
    }
}

async function loadReportsPage() {
    if (!isAdmin()) return;
    document.querySelectorAll(".report-card").forEach(card => { if (!card.dataset.bound) { card.dataset.bound = "1"; card.addEventListener("click", () => showReport(card.dataset.report)); } });
}

async function showReport(type) {
    if (!isAdmin()) return showToast("Reports are available to Super Admin only.", "error");
    const box = $("reportResult"); if (!box) return;
    try {
        const response = await fetch(`/api/reports/${encodeURIComponent(type)}`, { headers: { Authorization: `Bearer ${authToken}` } }); const text = await response.text(); if (!response.ok) throw new Error("Unable to generate report.");
        const rows = parseCSV(text); DS_FINAL.reports[type] = text; const title = type.charAt(0).toUpperCase() + type.slice(1) + " Report";
        if ($("reportResultTitle")) $("reportResultTitle").textContent = title; if ($("reportResultCount")) $("reportResultCount").textContent = `${Math.max(0, rows.length - 1)} records`;
        if ($("reportTableHead")) $("reportTableHead").innerHTML = rows[0]?.map(v => `<th>${escapeHTML(v)}</th>`).join("") || ""; if ($("reportTableBody")) $("reportTableBody").innerHTML = rows.slice(1,101).map(r => `<tr>${r.map(v => `<td>${escapeHTML(v)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="8" class="empty-state-cell">No records.</td></tr>`; box.classList.remove("hidden");
        let btn = $("downloadReportButton"); if (!btn) { btn = document.createElement("button"); btn.id = "downloadReportButton"; btn.className = "secondary-button"; $("reportResult")?.querySelector(".data-card-header")?.appendChild(btn); } btn.textContent = "📥 Download CSV"; btn.onclick = () => { const blob = new Blob([DS_FINAL.reports[type]], { type: "text/csv;charset=utf-8" }); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${type}-report.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); };
    } catch (error) { showToast(error.message, "error"); }
}

function parseCSV(text) {
    const rows = []; let row = [], cell = "", quoted = false;
    for (let i=0;i<text.length;i++) { const c=text[i], n=text[i+1]; if (c === '"') { if (quoted && n === '"') { cell += '"'; i++; } else quoted = !quoted; } else if (c === "," && !quoted) { row.push(cell); cell=""; } else if ((c === "\n" || c === "\r") && !quoted) { if (c === "\r" && n === "\n") i++; row.push(cell); if (row.some(v=>v!=="")) rows.push(row); row=[]; cell=""; } else cell += c; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows;
}

async function setupSettingsPage() {
    setupUserUI();
    if ($("companyLogoInput") && !$('companyLogoInput').dataset.bound) { $('companyLogoInput').dataset.bound = "1"; $('companyLogoInput').addEventListener("change", async () => { const f=$('companyLogoInput').files?.[0]; if(!f)return; if(f.size>10*1024*1024)return showToast("Logo must be 10MB or smaller.","error"); const reader=new FileReader(); reader.onload=()=>{DS_FINAL.pendingLogo=reader.result; if($('settingsLogoPreview')){$('settingsLogoPreview').src=reader.result;$('settingsLogoPreview').style.display='block';}}; reader.readAsDataURL(f); }); }
}

async function saveBranding() {
    if (!isAdmin()) return showToast("Only Super Admin can change company branding.", "error");
    if (!DS_FINAL.pendingLogo && !DS_FINAL.branding.logo) return showToast("Choose a logo first.", "warning");
    try { const data = await api("/api/branding", { method: "POST", body: { logo: DS_FINAL.pendingLogo || DS_FINAL.branding.logo, companyName: "Dhanush Softwares" } }); setBrandingUI(data.branding); localStorage.setItem("ds_branding", JSON.stringify(data.branding)); DS_FINAL.pendingLogo = null; showToast("Company logo saved."); } catch (error) { setFormMessage("brandingMessage", error.message); }
}

async function saveSelfProfile() {
    const file = $("selfProfileImage")?.files?.[0]; if (!file) return showToast("Choose a profile photo first.", "warning"); if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) return showToast("Use JPG, PNG or WebP.", "error"); if (file.size > 10*1024*1024) return showToast("Profile photo must be 10MB or smaller.", "error");
    const image = await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("Unable to read image."));r.readAsDataURL(file);});
    try { const data=await api("/api/auth/profile",{method:"PATCH",body:{profile_image:image}}); currentUser=data.user; setupUserUI(); showToast("Profile photo updated."); } catch(error){showToast(error.message,"error");}
}

async function sendAIMessage(message, target = "page") {
    const clean = String(message || "").trim();
    if (!clean) return;
    const container = target === "floating" ? $("floatingAiMessages") : $("aiMessages");
    if (!container) return;
    const userBubble = document.createElement("div");
    userBubble.className = "ai-user-message";
    userBubble.textContent = clean;
    container.appendChild(userBubble);
    const loading = document.createElement("div");
    loading.className = "ai-loading-message";
    loading.textContent = datingChatMode ? "Typing something cute… 💬" : "Working…";
    container.appendChild(loading);
    container.scrollTop = container.scrollHeight;
    try {
        const data = await api("/api/ai/chat", { method:"POST", body:{ message:clean, dating_mode:datingChatMode } });
        loading.remove();
        const reply = document.createElement("div");
        reply.className = "ai-bot-message";
        reply.innerHTML = escapeHTML(data.reply || "I'm here 😊").replace(/\n/g,"<br>");
        container.appendChild(reply);
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        loading.remove();
        const err = document.createElement("div");
        err.className = "ai-error-message";
        err.innerHTML = `${escapeHTML(error.message || "AI request failed.")} <button type="button" class="ai-retry-button">Retry</button>`;
        container.appendChild(err);
        err.querySelector(".ai-retry-button")?.addEventListener("click", () => { err.remove(); sendAIMessage(clean,target); });
    }
}

function initAIPage() {
    const datingBtn = $("datingChatButton");
    if (datingBtn && !datingBtn.dataset.bound) { datingBtn.dataset.bound = "1"; datingBtn.addEventListener("click", () => { datingChatMode = !datingChatMode; datingBtn.classList.toggle("active", datingChatMode); datingBtn.textContent = datingChatMode ? "💗 Dating Chat ON" : "💗 Dating Chat"; }); }
    document.querySelectorAll(".ai-suggestion").forEach(btn => { if(btn.dataset.bound)return; btn.dataset.bound="1"; btn.addEventListener("click",()=>sendAIMessage(btn.dataset.aiQuestion,"page")); });
}

function initFloatingAI() {
    const button=$("floatingAiButton"), panel=$("floatingAiPanel"), close=$("floatingAiClose"), form=$("floatingAiForm");
    if(!button || !panel || !form || button.dataset.bound)return; button.dataset.bound="1"; button.onclick=()=>panel.classList.toggle("hidden"); close && (close.onclick=()=>panel.classList.add("hidden")); form.addEventListener("submit",e=>{e.preventDefault();sendAIMessage($("floatingAiInput")?.value,"floating");});
}

async function setupChatUI() {
    const list=$("chatUserList"); if(!list)return;
    if (window.innerWidth <= 650) $("chatContainer")?.classList.add("show-chat-users");
    try { const data=await api("/api/chat/users"); const users=data.users||[]; list.innerHTML=users.length?users.map(u=>`<button type="button" class="chat-user" data-user-id="${Number(u.id)}"><span class="user-avatar small">${u.profile_image?`<img src="${escapeHTML(u.profile_image)}" alt="Profile">`:escapeHTML(getInitial(u.name))}</span><span><strong>${escapeHTML(u.name)}</strong><small>${Number(u.unread_count)>0?`${u.unread_count} unread`: `Last active ${formatIndiaDateTime(u.last_login_at)}`}</small></span></button>`).join(""):`<div class="empty-state-card">No other active employees.</div>`; list.querySelectorAll(".chat-user").forEach(el=>el.addEventListener("click",()=>selectChat(Number(el.dataset.userId),el.querySelector("strong")?.textContent||"Employee"))); if($("chatUnreadBadge")){const unread=users.reduce((s,u)=>s+Number(u.unread_count||0),0);$("chatUnreadBadge").textContent=unread;$("chatUnreadBadge").classList.toggle("hidden",!unread);} } catch(error){list.innerHTML=`<div class="empty-state-card">${escapeHTML(error.message)}</div>`;}
}

async function selectChat(userId,name) {
    currentChatUserId=Number(userId);
    if (window.innerWidth <= 650) $("chatContainer")?.classList.remove("show-chat-users");
    if($("selectedChatName"))$("selectedChatName").textContent=name; if($("selectedChatStatus"))$("selectedChatStatus").textContent="Loading conversation..."; if($("chatMessageInput"))$("chatMessageInput").disabled=false; if($("chatSendButton"))$("chatSendButton").disabled=false; await loadChatMessages(currentChatUserId,true);
}

async function loadChatMessages(userId) {
    if(!userId)return; try{const data=await api(`/api/chat/messages/${userId}`);currentChatMessages=data.messages||[];renderChatHistory();if($("selectedChatStatus"))$("selectedChatStatus").textContent="Seen messages are marked ✓✓"; }catch(error){showToast(error.message,"error");}
}

function renderChatHistory(){
    const box=$("chatMessages");
    if(!box)return;
    if(!currentChatMessages.length){
        box.innerHTML=`<div class="chat-empty-state"><div>💬</div><h3>No messages yet</h3><p>Send the first message.</p></div>`;
        return;
    }
    box.innerHTML=currentChatMessages.map(m=>{
        const mine=Number(m.sender_id)===Number(currentUser?.id);
        return `<div class="msg-bubble ${mine?"msg-sent":"msg-received"}">
            <div>${escapeHTML(m.message)}</div>
            <span class="msg-time">
                ${formatIndiaDateTime(m.created_at)}
                ${mine?`<span class="seen-mark">${m.is_read?"✓✓":"✓"}</span>
                <button type="button" class="msg-delete" title="Delete message" aria-label="Delete message" onclick="deleteChatMessage(${Number(m.id)})">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h6l1-13M10 11v6m4-6v6"></path></svg>
                </button>`:""}
            </span>
        </div>`;
    }).join("");
    box.scrollTop=box.scrollHeight;
}

async function sendChatMessage(event){event.preventDefault();if(!currentChatUserId)return showToast("Select an employee first.","warning");const input=$("chatMessageInput");const message=input?.value.trim();if(!message)return;const btn=$("chatSendButton");if(btn)btn.disabled=true;try{await api("/api/chat/messages",{method:"POST",body:{receiver_id:currentChatUserId,message}});if(input)input.value="";await loadChatMessages(currentChatUserId,false);await loadNotifications();}catch(error){showToast(error.message,"error");}finally{if(btn)btn.disabled=false;}}

async function loadNotifications(){try{const data=await api("/api/notifications");const rows=data.notifications||[];const unread=rows.filter(n=>!n.is_read).length;if($("notificationBadge")){ $("notificationBadge").textContent=unread;$("notificationBadge").classList.toggle("hidden",unread===0);}if($("notificationList"))$("notificationList").innerHTML=rows.length?rows.map(n=>`<div class="notification-item"><strong>${escapeHTML(n.title||"Notification")}</strong><p>${escapeHTML(n.message||"")}</p><small>${formatIndiaDateTime(n.created_at)}</small></div>`).join(""):`<div class="empty-state-card">No notifications.</div>`;}catch{}}

function renderNotificationButton(){const b=$("notificationButton");if(!b)return;b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"></path><circle cx="18" cy="6" r="2.5"></circle></svg><span id="notificationBadge" class="notification-badge hidden">0</span>';}

function ensureIDModal(){if($("idModal"))return;const modal=document.createElement("div");modal.id="idModal";modal.className="modal hidden";modal.innerHTML='<div class="modal-overlay"></div><div class="modal-card small"><button type="button" class="modal-close">×</button><div id="idCardDetails"></div><button type="button" class="primary-button" id="printIdCardButton">Print ID Card</button></div>';document.body.appendChild(modal);modal.querySelector(".modal-close").onclick=()=>closeModal("idModal");modal.querySelector(".modal-overlay").onclick=()=>closeModal("idModal");modal.querySelector("#printIdCardButton").onclick=()=>printDiv("idCardDetails");}

function viewIDCard(id){ensureIDModal();const employee=allEmployees.find(e=>Number(e.id)===Number(id)) || (Number(currentUser?.id)===Number(id)?currentUser:null);if(!employee)return showToast("Employee not found.","error");const logo=DS_FINAL.branding.logo;$("idCardDetails").innerHTML=`<div class="professional-id-card"><div class="id-card-top">${logo?`<img src="${escapeHTML(logo)}" alt="Logo">`:`<div class="id-card-logo">DS</div>`}<div><strong>${escapeHTML(DS_FINAL.branding.companyName || "Dhanush Softwares")}</strong><span>Employee Identity Card</span></div></div><div class="id-card-body"><div class="id-photo">${employee.profile_image?`<img src="${escapeHTML(employee.profile_image)}" alt="Profile">`:escapeHTML(getInitial(employee.name))}</div><h2>${escapeHTML(employee.name)}</h2><p>${escapeHTML(employee.designation || "Employee")}</p><div class="id-details"><span><b>ID</b>${escapeHTML(employee.employee_code || employee.id)}</span><span><b>Email</b>${escapeHTML(employee.email || "-")}</span><span><b>Phone</b>${escapeHTML(employee.phone || "-")}</span><span><b>Status</b>${escapeHTML(employee.status || "Active")}</span></div></div></div>`;openModal("idModal");}

async function loadReportsPageInit(){if(!isAdmin())return;document.querySelectorAll(".report-card").forEach(c=>{if(c.dataset.bound)return;c.dataset.bound="1";c.addEventListener("click",()=>showReport(c.dataset.report));});}

function ensureChatMobileBackButton() {
    const header = document.querySelector("#page-chat .chat-header");
    if (!header || header.querySelector(".chat-mobile-back")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button chat-mobile-back";
    button.title = "Back to conversations";
    button.setAttribute("aria-label", "Back to conversations");
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>';
    button.addEventListener("click", () => $("chatContainer")?.classList.add("show-chat-users"));
    header.insertBefore(button, header.firstChild);
}

function bindGlobalActions(){
    ensureChatMobileBackButton();
    $("sidebarToggle")?.addEventListener("click",toggleSidebar);
    $("sidebarToggleIcon") && updateBurgerIcon();
    $("sidebarOverlay")?.addEventListener("click",toggleSidebar);
    $("themeToggleBtn")?.addEventListener("click",toggleTheme);
    $("sidebarLogoutButton")?.addEventListener("click",logout);
    $("notificationButton")?.addEventListener("click",()=>$("notificationPanel")?.classList.toggle("hidden"));
    $("markNotificationsRead")?.addEventListener("click",async()=>{const data=await api("/api/notifications").catch(()=>({notifications:[]}));for(const n of data.notifications||[]){if(!n.is_read)await api(`/api/notifications/${n.id}/read`,{method:"PATCH"}).catch(()=>{});}await loadNotifications();});
    $("chatForm")?.addEventListener("submit",sendChatMessage);
    $("refreshChatUsers")?.addEventListener("click",setupChatUI);
    $("chatUserSearch")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();document.querySelectorAll(".chat-user").forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?"":"none");});
    $("saveAttendanceButton")?.addEventListener("click",saveAttendance);
    $("attendanceDate")?.addEventListener("change",loadAttendance);
    $("leaveAttendanceMonth")?.addEventListener("change",loadLeaveAttendanceReview);
    $("leaveAttendanceEmployee")?.addEventListener("change",loadLeaveAttendanceReview);
    $("exportLeavePageAttendance")?.addEventListener("click",async()=>{await loadLeaveAttendanceReview();downloadAttendanceExcel();});
    $("payrollForm")?.addEventListener("submit",savePayroll);
    ["payrollBasic","payrollAllowances","payrollDeductions"].forEach(id=>$(id)?.addEventListener("input",()=>{const n=Number($("payrollBasic")?.value||0)+Number($("payrollAllowances")?.value||0)-Number($("payrollDeductions")?.value||0);if($("payrollNet"))$("payrollNet").value=Math.max(0,n).toFixed(2);}));
    $("saveBrandingButton")?.addEventListener("click",saveBranding);
    $("saveSelfProfileButton")?.addEventListener("click",saveSelfProfile);
    $("aiForm")?.addEventListener("submit",e=>{e.preventDefault();sendAIMessage($("aiMessageInput")?.value,"page");});
    if ($("floatingAiButton") && !$("floatingAiButton").dataset.bound) {
        $("floatingAiButton").dataset.bound = "1";
        $("floatingAiButton").addEventListener("click",()=>$("floatingAiPanel")?.classList.toggle("hidden"));
        $("floatingAiClose")?.addEventListener("click",()=>$("floatingAiPanel")?.classList.add("hidden"));
        $("floatingAiForm")?.addEventListener("submit",e=>{e.preventDefault();sendAIMessage($("floatingAiInput")?.value,"floating");});
    }
    $("dashboardIdButton")?.addEventListener("click",()=>viewMyID());
    document.querySelectorAll(".nav-item[data-page]").forEach(btn=>btn.addEventListener("click",()=>switchTab(btn.dataset.page)));
    document.querySelectorAll("[data-navigate]").forEach(btn=>btn.addEventListener("click",()=>switchTab(btn.dataset.navigate)));
    document.querySelectorAll("[data-close-modal]").forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.closeModal)));
    document.querySelectorAll(".modal-overlay").forEach(overlay=>overlay.addEventListener("click",()=>{const modal=overlay.closest(".modal");if(modal)closeModal(modal.id);}));
    ["currentPassword","newPassword","confirmNewPassword","employeePassword","newResetPassword","confirmResetPassword"].forEach(id=>enhancePasswordField(id));
    $("loginForm")?.addEventListener("submit",handleLogin);
    $("toggleLoginPassword")?.addEventListener("click",()=>{const input=$("loginPassword");const btn=$("toggleLoginPassword");if(!input||!btn)return;const visible=input.type==="text";input.type=visible?"password":"text";btn.textContent=visible?"👁":"🙈";});
    $("addEmployeeButton")?.addEventListener("click",openAddModal);
    $("employeeForm")?.addEventListener("submit",handleEmployeeForm);
    $("employeeImage")?.addEventListener("change",previewEmployeeImage);
    $("refreshEmployees")?.addEventListener("click",loadEmployees);
    ["employeeSearch","employeeDepartmentFilter","employeeStatusFilter","employeeRoleFilter"].forEach(id=>$(id)?.addEventListener("input",()=>renderEmployees(allEmployees)));
    $("applyLeaveButton")?.addEventListener("click",()=>openModal("leaveModal"));
    $("leaveForm")?.addEventListener("submit",applyLeave);
    ["leaveStatusFilter","leaveTypeFilter"].forEach(id=>$(id)?.addEventListener("change",()=>renderLeaves(allLeaves)));
    $("addProjectButton")?.addEventListener("click",()=>{populateEmployeeSelects();openModal("projectModal");});
    $("projectForm")?.addEventListener("submit",createProject);
}

async function initializeERP() {
    try {
        initTheme(); updateBurgerIcon(); renderNotificationButton(); hideAllModals(); await loadBranding(); bindGlobalActions(); setDefaultDates(); initAIPage();
        if ($("appLoader")) $("appLoader").style.display = "none";
        await restoreSession();
    } catch (error) { console.error("ERP initialization error", error); showLoginScreen(); if ($("appLoader")) $("appLoader").style.display = "none"; }
}

// Ensure current global inline handlers point to the final implementations.
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.switchTab = switchTab;
window.logout = logout;
window.viewMyID = viewMyID;
window.viewIDCard = viewIDCard;
window.printDiv = printDiv;
window.downloadPayslip = downloadPayslip;
window.exportEmployeesCSV = exportEmployeesCSV;
window.exportAttendanceCSV = downloadAttendanceExcel;
window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.deleteEmployee = deleteEmployee;
window.markAllLeave = markAllLeave;
window.buildAttendanceCalendar = buildAttendanceCalendar;
window.updateLeave = updateLeave;
window.selectChat = selectChat;
window.toggleChatHeaderMenu = toggleChatHeaderMenu;
window.clearChatHistory = clearChatHistory;
window.openMsgAction = openMsgAction;
window.deleteSelectedMessage = deleteSelectedMessage;
window.completeProject = completeProject;
window.rateProject = rateProject;
window.loadPayroll = loadPayroll;


/* Final announcement integration */
async function loadAnnouncements() {
    const grid = $("announcementsGrid");
    try {
        const data = await api("/api/announcements");
        const rows = data.announcements || [];
        if (grid) grid.innerHTML = rows.length ? rows.map(a => `<article class="announcement-card"><div class="announcement-card-icon">📢</div><div><h3>${escapeHTML(a.title || "Announcement")}</h3><p>${escapeHTML(a.message || "")}</p><small>${formatIndiaDateTime(a.created_at)}</small></div></article>`).join("") : `<div class="empty-state-card">No announcements yet.</div>`;
    } catch (error) { if (grid) grid.innerHTML = `<div class="empty-state-card">${escapeHTML(error.message)}</div>`; }
}

async function publishAnnouncement(event) {
    event.preventDefault();
    if (!isAdmin()) return showToast("Only Super Admin can publish announcements.", "error");
    try {
        await api("/api/announcements", { method: "POST", body: { title: $("announcementTitle")?.value.trim(), message: $("announcementMessage")?.value.trim() } });
        closeModal("announcementModal");
        $("announcementForm")?.reset();
        await loadAnnouncements();
        await loadDashboard();
        showToast("Announcement published.");
    } catch (error) { showToast(error.message, "error"); }
}

// Patch the final navigation loader to include announcements.
const _originalFinalSwitchTab = switchTab;
switchTab = function(tabId) {
    _originalFinalSwitchTab(tabId);
    if (tabId === "announcements") Promise.resolve(loadAnnouncements()).catch(console.error);
};
window.switchTab = switchTab;

// Patch the final event binder once the DOM exists.
const _finalBoot = initializeERP;
initializeERP = async function() {
    await _finalBoot();
    $("addAnnouncementButton")?.addEventListener("click", () => openModal("announcementModal"));
    $("announcementForm")?.addEventListener("submit", publishAnnouncement);
    initFloatingAI();
    loadAnnouncements().catch(() => {});
};

window.initializeERP = initializeERP;

// DOM is loaded at the bottom of index.html; bind late-added actions safely.
if (document.readyState !== "loading") {
    $("addAnnouncementButton")?.addEventListener("click", () => openModal("announcementModal"));
    $("announcementForm")?.addEventListener("submit", publishAnnouncement);
    initFloatingAI();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        $("addAnnouncementButton")?.addEventListener("click", () => openModal("announcementModal"));
        $("announcementForm")?.addEventListener("submit", publishAnnouncement);
        initFloatingAI();
    }, { once: true });
}


/* =========================================================
   V4 FINAL FIXES — authoritative overrides
========================================================= */

function toggleSidebar() {
    const sidebar = $("sidebar");
    const overlay = $("sidebarOverlay");
    if (!sidebar) return;
    if (window.innerWidth <= 850) {
        const open = sidebar.classList.toggle("open");
        if (overlay) overlay.style.display = open ? "block" : "none";
    } else {
        sidebar.classList.toggle("closed");
    }
}

function switchTab(tabId) {
    const section = document.getElementById(`page-${tabId}`);
    if (!section) { showToast(`Page "${tabId}" is not available.`, "warning"); return; }
    document.querySelectorAll(".page-section").forEach(p => p.classList.remove("active","active-section"));
    section.classList.add("active","active-section");
    document.querySelectorAll(".nav-item[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === tabId));
    const meta = {
        dashboard:["Dashboard","Overview of your employee management system"], employees:["Employees","Create and manage employee accounts"],
        attendance:["Attendance","Mark and review daily attendance"], leaves:["Leave Management","Attendance calendar and leave requests"],
        projects:["Projects","Assign, complete and rate projects"], chat:["Internal Chat","WhatsApp-style employee communication"], payroll:["Payroll","Salary credits and payslips"],
        announcements:["Announcements","Company announcements"], reports:["Reports","Management reports"],
        ai:["AI Assistant","Gemini-powered ERP assistant"], settings:["Settings","Profile, branding and security"]
    }[tabId] || ["ERP",""];
    if ($("currentPageTitle")) $("currentPageTitle").textContent = meta[0];
    if ($("currentPageSubtitle")) $("currentPageSubtitle").textContent = meta[1];
    if (window.innerWidth <= 900) {
        $("sidebar")?.classList.remove("open");
        document.body.classList.remove("sidebar-open");
        if ($("sidebarOverlay")) $("sidebarOverlay").style.display="none";
    }
    const loaders = {dashboard:loadDashboard,employees:loadEmployees,attendance:loadAttendance,leaves:loadLeaves,projects:loadProjects,chat:setupChatUI,payroll:loadPayroll,announcements:loadAnnouncements,reports:loadReportsPage,ai:initAIPage,settings:setupSettingsPage};
    if (loaders[tabId]) Promise.resolve(loaders[tabId]()).catch(err=>console.error(tabId,err));
    removeStrayPageImages();
}

function setupUserUI() {
    if (!currentUser) return;
    const name=currentUser.name||"User", image=currentUser.profile_image||"", initial=getInitial(name);
    ["sidebarUserAvatar","topbarUserAvatar"].forEach(id=>{const el=$(id);if(!el)return;if(image){el.innerHTML=`<img src="${escapeHTML(image)}" alt="Profile">`;el.classList.add("has-photo");}else{el.textContent=initial;el.classList.remove("has-photo");}});
    const selectedAvatar=$("selectedChatAvatar");
    if(selectedAvatar && !currentChatUserId){selectedAvatar.innerHTML="";selectedAvatar.textContent="";selectedAvatar.classList.remove("has-photo");}
    if($("sidebarUserName"))$("sidebarUserName").textContent=name;
    if($("sidebarUserRole"))$("sidebarUserRole").textContent=roleLabel(currentUser.role);
    if($("topbarUserName"))$("topbarUserName").textContent=name;
    if($("topbarUserRole"))$("topbarUserRole").textContent=roleLabel(currentUser.role);
    document.querySelectorAll(".admin-only").forEach(el=>el.style.display=isAdmin()?"":"none");
    document.querySelectorAll(".employee-only").forEach(el=>el.style.display=isManager()?"none":"");
    document.querySelectorAll(".manager-only").forEach(el=>el.style.display=isManager()?"":"none");
}

function renderAttendanceCalendar(employees, month, records) {
    const box=$("attendanceCalendarGrid"); if(!box)return;
    const days=monthDays(month), selectedId=$("leaveAttendanceEmployee")?.value||"ALL";
    const today=todayString();
    const byDate=new Map(records.map(r=>[String(r.attendance_date).slice(0,10),String(r.status||"").toLowerCase()]));
    const [y,m]=month.split("-").map(Number);
    let html=`<div class="att-calendar-legend"><span><i style="background:#86efac"></i>Present</span><span><i style="background:#fca5a5"></i>Absent</span><span><i style="background:#fdba74"></i>Leave</span><span><i style="background:#cbd5e1"></i>No record</span></div>`;
    for(let d=1;d<=days;d++){
        const date=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const status=byDate.get(date)||"";
        const cls=status.replace(/\s+/g,"-")||((date>today)?"future":"empty");
        const label=status?status:"No record";
        html+=`<div class="att-day ${cls}"><span class="att-day-number">${d}</span><span class="att-day-status">${escapeHTML(label)}</span></div>`;
    }
    box.innerHTML=html;
}

async function loadLeaveAttendanceReview() {
    const month=$("leaveAttendanceMonth")?.value||indiaMonthString(), employeeId=$("leaveAttendanceEmployee")?.value||"ALL";
    try{
        const data=await api(`/api/attendance/monthly?month=${encodeURIComponent(month)}&employee_id=${encodeURIComponent(employeeId)}`);
        DS_FINAL.monthlyAttendance=data.attendance||[];
        const selected=employeeId==="ALL"?allEmployees.filter(e=>String(e.status||"active").toLowerCase()==="active"):allEmployees.filter(e=>Number(e.id)===Number(employeeId));
        const days=monthDays(month);
        const summaries=selected.map(e=>{const rows=DS_FINAL.monthlyAttendance.filter(r=>Number(r.employee_id)===Number(e.id));return {e,rows,s:calculateAttendance(rows)};});
        if($("leaveAttendanceSummary"))$("leaveAttendanceSummary").innerHTML=`<div class="review-summary-strip">${summaries.map(x=>`<div><span>${escapeHTML(x.e.name)}</span><strong>${x.s.percentage}%</strong><small>${x.s.present} P · ${x.s.absent} A · ${x.s.leave} L · ${x.s.halfDay} HD</small></div>`).join("")||"<span>No employees found.</span>"}</div>`;
        renderAttendanceCalendar(selected,month,DS_FINAL.monthlyAttendance);
        const body=$("leaveAttendanceTableBody");
        if(body)body.innerHTML=summaries.length?summaries.map(x=>`<tr><td>${escapeHTML(x.e.name)}</td><td>${days}</td><td>${x.s.present}</td><td>${x.s.absent}</td><td>${x.s.leave}</td><td>${x.s.halfDay}</td><td><strong>${x.s.percentage}%</strong></td></tr>`).join(""):`<tr><td colspan="7" class="empty-state-cell">No attendance found.</td></tr>`;
    }catch(error){showToast(error.message,"error");}
}

function downloadAttendanceExcel(){
    const month=$("leaveAttendanceMonth")?.value||indiaMonthString(), employeeId=$("leaveAttendanceEmployee")?.value||"ALL", days=monthDays(month);
    const employees=employeeId==="ALL"?allEmployees.filter(e=>String(e.status||"active").toLowerCase()==="active"):allEmployees.filter(e=>Number(e.id)===Number(employeeId));
    const header=["Employee ID","Employee Name",...Array.from({length:days},(_,i)=>String(i+1).padStart(2,"0")),"Total Working Days","Present","Absent","Leave","Half Day","Attendance %"];
    const rows=employees.map(e=>{const rec=DS_FINAL.monthlyAttendance.filter(r=>Number(r.employee_id)===Number(e.id));const map=new Map(rec.map(r=>[Number(String(r.attendance_date).slice(-2)),String(r.status||"").toLowerCase()]));let p=0,a=0,l=0,h=0;const daily=[];for(let d=1;d<=days;d++){const st=map.get(d);if(st==="present"){daily.push("P");p++;}else if(st==="absent"){daily.push("A");a++;}else if(st==="leave"){daily.push("L");l++;}else if(st==="half day"||st==="half-day"||st==="half_day"){daily.push("HD");h++;}else daily.push("-");}const pct=days?Math.round((p/days)*100):0;return [e.employee_code||e.id,e.name,...daily,days,p,a,l,h,`${pct}%`];});
    const table=`<table border="1"><thead><tr>${header.map(h=>`<th>${escapeHTML(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${escapeHTML(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const blob=new Blob([`<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial}th,td{padding:6px;border:1px solid #bbb;text-align:center}th{background:#e8efff}</style></head><body><h2>Dhanush Softwares Attendance - ${escapeHTML(month)}</h2>${table}</body></html>`],{type:"application/vnd.ms-excel"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Attendance_${month}.xls`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

async function loadPayroll(){
    const body = $("payrollTableBody");
    if (body) body.innerHTML = `<tr><td colspan="8" class="empty-state-cell">Loading payroll...</td></tr>`;
    try {
        const data = await api(`/api/payroll?ts=${Date.now()}`, { cache: "no-store" });
        const rows = Array.isArray(data.payroll) ? data.payroll : [];
        const mine = isManager() ? rows : rows.filter(p => Number(p.employee_id) === Number(currentUser?.id));
        const total = mine.reduce((s,p)=>s+Number(p.net_salary||0),0);
        if ($("payrollTotal")) $("payrollTotal").textContent = `₹${total.toLocaleString("en-IN")}`;
        if ($("payrollNetSalary")) $("payrollNetSalary").textContent = mine.length ? `₹${Number(mine[0].net_salary||0).toLocaleString("en-IN")}` : "₹0";
        if ($("payrollProcessedCount")) $("payrollProcessedCount").textContent = mine.filter(p=>String(p.status||"").toLowerCase()==="credited").length;
        if ($("payrollPendingCount")) $("payrollPendingCount").textContent = mine.filter(p=>String(p.status||"").toLowerCase()!=="credited").length;
        if (body) body.innerHTML = mine.length ? mine.map(p => `<tr><td>${escapeHTML(p.employee_name||"-")}</td><td>${escapeHTML(String(p.payroll_month||"").slice(0,7))}</td><td>₹${Number(p.basic_salary||0).toLocaleString("en-IN")}</td><td>₹${Number(p.allowances||0).toLocaleString("en-IN")}</td><td>₹0</td><td>₹${Number(p.deductions||0).toLocaleString("en-IN")}</td><td><strong>₹${Number(p.net_salary||0).toLocaleString("en-IN")}</strong></td><td><span class="status-badge ${String(p.status||"pending").toLowerCase()}">${escapeHTML(p.status||"pending")}</span>${!isManager()?` <button class="table-action" onclick="downloadPayslip(${Number(p.employee_id)})">Download Slip</button>`:""}</td></tr>`).join("") : `<tr><td colspan="8" class="empty-state-cell">No payroll records.</td></tr>`;
        if (isManager()) ensurePayrollButton();
        if (!isManager()) await renderLatestPayslip(currentUser.id);
    } catch (error) {
        console.error("Payroll load failed:", error);
        if (body) body.innerHTML = `<tr><td colspan="8" class="empty-state-cell"><strong>Unable to load payroll.</strong><br><small>${escapeHTML(error.message||"Please try again.")}</small><br><button type="button" class="secondary-button" onclick="loadPayroll()">Retry</button></td></tr>`;
        showToast(error.message || "Unable to load payroll.", "error");
    }
}

async function showPayslipPreview(id) {
    try {
        const data = await api(`/api/payroll?ts=${Date.now()}`, { cache: "no-store" });
        const row = (data.payroll || [])
            .filter(p => Number(p.employee_id) === Number(id))
            .sort((a,b) => String(b.payroll_month).localeCompare(String(a.payroll_month)))[0];
        const employee = allEmployees.find(e => Number(e.id) === Number(id)) ||
            (Number(currentUser?.id) === Number(id) ? currentUser : null);
        if (!employee || !row) return showToast("No salary slip found.", "warning");

        const month = String(row.payroll_month || "").slice(0, 7);
        let stats = { percentage: 0 };
        let projects = [];
        try {
            const att = await api(`/api/attendance/monthly?month=${encodeURIComponent(month)}&employee_id=${encodeURIComponent(id)}`);
            stats = calculateAttendance(att.attendance || []);
        } catch {}
        projects = allProjects.filter(p => Number(p.assigned_to) === Number(id) && String(p.status).toLowerCase() === "completed");

        document.getElementById("payslipPreviewOverlay")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "payslipPreviewOverlay";
        overlay.className = "payslip-preview-overlay";
        overlay.innerHTML = `
            <div class="payslip-preview-modal" role="dialog" aria-modal="true" aria-label="Payslip preview">
                <div class="payslip-preview-header">
                    <div><strong>Payslip Preview</strong><span>${escapeHTML(employee.name || "Employee")} · ${escapeHTML(month)}</span></div>
                    <button type="button" class="modal-close" aria-label="Close">×</button>
                </div>
                <div class="payslip-sheet-preview">
                    <div class="payslip-sheet-head"><h1>${escapeHTML(DS_FINAL.branding.companyName || "Dhanush Softwares")}</h1><p>Employee Salary Slip</p></div>
                    <div class="payslip-person-preview">
                        <div class="payslip-photo-preview">${employee.profile_image ? `<img src="${escapeHTML(employee.profile_image)}" alt="Profile">` : escapeHTML(getInitial(employee.name))}</div>
                        <div><h2>${escapeHTML(employee.name || "Employee")}</h2><p>${escapeHTML(employee.employee_code || "")} · ${escapeHTML(employee.designation || "Employee")}</p></div>
                    </div>
                    <div class="payslip-stats-preview">
                        <div><span>Month</span><strong>${escapeHTML(month)}</strong></div>
                        <div><span>Attendance</span><strong>${stats.percentage}%</strong></div>
                        <div><span>Projects Completed</span><strong>${projects.length}</strong></div>
                        <div><span>Net Salary</span><strong>₹${Number(row.net_salary || 0).toLocaleString("en-IN")}</strong></div>
                    </div>
                    <div class="payslip-project-list"><strong>Completed Projects</strong>${projects.length ? projects.map(p => `<div>${escapeHTML(p.name || "Project")}<span>${p.latest_rating ? `${Number(p.latest_rating).toFixed(1)}/5` : "-"}</span></div>`).join("") : `<p>No completed projects</p>`}</div>
                    <div class="payslip-amounts-preview"><div><span>Basic Salary</span><strong>₹${Number(row.basic_salary || 0).toLocaleString("en-IN")}</strong></div><div><span>Allowances</span><strong>₹${Number(row.allowances || 0).toLocaleString("en-IN")}</strong></div><div><span>Deductions</span><strong>₹${Number(row.deductions || 0).toLocaleString("en-IN")}</strong></div><div><span>Net Salary</span><strong>₹${Number(row.net_salary || 0).toLocaleString("en-IN")}</strong></div></div>
                </div>
                <div class="payslip-preview-actions">
                    <button type="button" class="secondary-button" data-payslip-close>Close</button>
                    <button type="button" class="primary-button" data-payslip-download>Download Payslip</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        overlay.querySelector(".modal-close")?.addEventListener("click", close);
        overlay.querySelector("[data-payslip-close]")?.addEventListener("click", close);
        overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
        overlay.querySelector("[data-payslip-download]")?.addEventListener("click", () => downloadPayslip(id));
    } catch (error) {
        showToast(error.message || "Unable to load payslip.", "error");
    }
}

async function downloadPayslip(id){
    try{const data=await api(`/api/payroll?ts=${Date.now()}`);const row=(data.payroll||[]).filter(p=>Number(p.employee_id)===Number(id)).sort((a,b)=>String(b.payroll_month).localeCompare(String(a.payroll_month)))[0];const employee=allEmployees.find(e=>Number(e.id)===Number(id))||(Number(currentUser?.id)===Number(id)?currentUser:null);if(!employee||!row)return showToast("No salary slip found.","warning");const month=String(row.payroll_month).slice(0,7);const att=await api(`/api/attendance/monthly?month=${encodeURIComponent(month)}&employee_id=${id}`);const stats=calculateAttendance(att.attendance||[]);const projects=allProjects.filter(p=>Number(p.assigned_to)===Number(id)&&String(p.status).toLowerCase()==="completed");const html=`<!doctype html><html><head><meta charset="utf-8"><title>Payslip - ${escapeHTML(employee.name)}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#172033}.sheet{max-width:760px;margin:auto;border:1px solid #dbe4f0;border-radius:18px;padding:26px}.head{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:14px}.person{display:flex;gap:14px;align-items:center;margin:20px 0}.photo{width:72px;height:72px;border-radius:50%;overflow:hidden;background:#e8efff;display:grid;place-items:center;font-weight:800}.photo img{width:100%;height:100%;object-fit:cover}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.grid div{border:1px solid #e2e8f0;border-radius:10px;padding:10px}.grid small{display:block;color:#64748b}.grid strong{display:block;margin-top:4px}.sheet table{width:100%;border-collapse:collapse;margin-top:18px}.sheet th,.sheet td{border:1px solid #dbe2ea;padding:9px;text-align:left}@media(max-width:650px){.grid{grid-template-columns:1fr 1fr}}</style></head><body><div class="sheet"><div class="head"><h1>Dhanush Softwares</h1><p>Employee Salary Slip</p></div><div class="person"><div class="photo">${employee.profile_image?`<img src="${escapeHTML(employee.profile_image)}">`:escapeHTML(getInitial(employee.name))}</div><div><h2>${escapeHTML(employee.name)}</h2><p>${escapeHTML(employee.employee_code||"")} · ${escapeHTML(employee.designation||"Employee")}</p></div></div><div class="grid"><div><small>Month</small><strong>${escapeHTML(month)}</strong></div><div><small>Attendance</small><strong>${stats.percentage}%</strong></div><div><small>Projects Completed</small><strong>${projects.length}</strong></div><div><small>Net Salary</small><strong>₹${Number(row.net_salary||0).toLocaleString("en-IN")}</strong></div></div><table><tr><th>Project</th><th>Rating</th></tr>${projects.length?projects.map(p=>`<tr><td>${escapeHTML(p.name)}</td><td>${p.latest_rating?`${Number(p.latest_rating).toFixed(1)}/5`:"-"}</td></tr>`).join(""):`<tr><td colspan="2">No completed projects</td></tr>`}</table><table><tr><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net</th></tr><tr><td>₹${Number(row.basic_salary||0).toLocaleString("en-IN")}</td><td>₹${Number(row.allowances||0).toLocaleString("en-IN")}</td><td>₹${Number(row.deductions||0).toLocaleString("en-IN")}</td><td>₹${Number(row.net_salary||0).toLocaleString("en-IN")}</td></tr></table></div></body></html>`;const blob=new Blob([html],{type:"text/html;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Payslip_${employee.employee_code||employee.id}_${month}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("Payslip downloaded.");}catch(error){showToast(error.message,"error");}
}

async function setupChatUI(){
    const chatContainer=$("chatContainer");
    if(chatContainer && !currentChatUserId){
        chatContainer.classList.remove("has-selection");
        if(window.innerWidth<=650) chatContainer.classList.add("show-chat-users");
        const avatar=$("selectedChatAvatar");
        if(avatar){avatar.innerHTML="";avatar.textContent="";avatar.classList.remove("has-photo");}
        if($("selectedChatName")) $("selectedChatName").textContent="Select an employee";
        if($("selectedChatStatus")) $("selectedChatStatus").textContent="Choose someone to start chatting";
        if($("chatMessageInput")) $("chatMessageInput").disabled=true;
        if($("chatSendButton")) $("chatSendButton").disabled=true;
    }
    const list=$("chatUserList");if(!list)return;
    try{const data=await api(`/api/chat/users?ts=${Date.now()}`),users=data.users||[];list.innerHTML=users.length?users.map(u=>`<button type="button" class="chat-user" data-user-id="${Number(u.id)}"><span class="user-avatar small">${u.profile_image?`<img src="${escapeHTML(u.profile_image)}" alt="Profile">`:escapeHTML(getInitial(u.name))}</span><span class="chat-user-info"><strong>${escapeHTML(u.name)}</strong><span>${Number(u.unread_count)>0?`${u.unread_count} unread`:u.last_login_at?`Last active ${formatIndiaDateTime(u.last_login_at)}`:"Offline"}</span></span>${Number(u.unread_count)>0?`<span class="chat-user-unread">${u.unread_count}</span>`:""}</button>`).join(""):`<div class="empty-state-card">No other active employees.</div>`;list.querySelectorAll(".chat-user").forEach(el=>el.addEventListener("click",()=>selectChat(Number(el.dataset.userId),el.querySelector("strong")?.textContent||"Employee")));const unread=users.reduce((s,u)=>s+Number(u.unread_count||0),0);if($("chatUnreadBadge")){$("chatUnreadBadge").textContent=unread;$("chatUnreadBadge").classList.toggle("hidden",unread===0);}}
    catch(error){list.innerHTML=`<div class="empty-state-card">${escapeHTML(error.message)}</div>`;}
}

async function selectChat(userId,name){
    currentChatUserId=Number(userId);
    const chat=$("chatContainer");
    if(chat){chat.classList.add("has-selection");chat.classList.remove("show-chat-users");}
    document.querySelectorAll(".chat-user").forEach(btn=>btn.classList.toggle("selected",Number(btn.dataset.userId)===currentChatUserId));
    if($("selectedChatName")) $("selectedChatName").textContent=name;
    const user=allEmployees.find(e=>Number(e.id)===currentChatUserId);
    const image=user?.profile_image;
    if($("selectedChatAvatar")){
        const el=$("selectedChatAvatar");
        el.innerHTML=image?`<img src="${escapeHTML(image)}" alt="Profile">`:escapeHTML(getInitial(name));
        el.classList.toggle("has-photo",!!image);
    }
    if($("selectedChatStatus")) $("selectedChatStatus").textContent="Loading conversation...";
    if($("chatMessageInput")) $("chatMessageInput").disabled=false;
    if($("chatSendButton")) $("chatSendButton").disabled=false;
    await loadChatMessages(currentChatUserId,true);
}

async function loadChatMessages(userId){if(!userId)return;try{const data=await api(`/api/chat/messages/${userId}?ts=${Date.now()}`);currentChatMessages=data.messages||[];renderChatHistory();if($("selectedChatStatus"))$("selectedChatStatus").textContent="Online conversation · Seen ✓✓";await loadNotifications();}catch(error){showToast(error.message,"error");}}

function renderChatHistory(){const box=$("chatMessages");if(!box)return;if(!currentChatMessages.length){box.innerHTML=`<div class="chat-empty-state"><div>💬</div><h3>No messages yet</h3><p>Send the first message.</p></div>`;return;}box.innerHTML=currentChatMessages.map(m=>{const mine=Number(m.sender_id)===Number(currentUser?.id);return `<div class="msg-bubble ${mine?"msg-sent":"msg-received"}"><div>${escapeHTML(m.message)}</div><span class="msg-time">${formatIndiaDateTime(m.created_at)} ${mine?`<span class="seen-mark">${m.is_read?"✓✓":"✓"}</span><button type="button" class="msg-delete" title="Delete message" aria-label="Delete message" onclick="deleteChatMessage(${Number(m.id)})"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h6l1-13M10 11v6m4-6v6"></path></svg></button>`:""}</span></div>`;}).join("");box.scrollTop=box.scrollHeight;}

async function sendChatMessage(event){event.preventDefault();if(!currentChatUserId)return showToast("Select an employee first.","warning");const input=$("chatMessageInput"),message=input?.value.trim();if(!message)return;const btn=$("chatSendButton");if(btn)btn.disabled=true;try{await api("/api/chat/messages",{method:"POST",body:{receiver_id:currentChatUserId,message}});if(input)input.value="";await loadChatMessages(currentChatUserId);await setupChatUI();}catch(error){showToast(error.message,"error");}finally{if(btn)btn.disabled=false;}}

async function clearChatHistory(){if(!currentChatUserId)return showToast("Select a conversation first.","warning");if(!confirm("Clear this conversation?"))return;try{await api(`/api/chat/conversations/${currentChatUserId}`,{method:"DELETE"});currentChatMessages=[];renderChatHistory();await setupChatUI();showToast("Conversation cleared.");}catch(error){showToast(error.message,"error");}}
async function deleteChatMessage(id){if(!confirm("Delete this message?"))return;try{await api(`/api/chat/messages/${id}`,{method:"DELETE"});await loadChatMessages(currentChatUserId);}catch(error){showToast(error.message,"error");}}

async function loadNotifications(){try{const data=await api(`/api/notifications?ts=${Date.now()}`,{cache:"no-store"});const rows=data.notifications||[],unread=rows.filter(n=>!n.is_read).length;if($("notificationBadge")){$("notificationBadge").textContent=unread;$("notificationBadge").classList.toggle("hidden",unread===0);}if($("notificationCountText"))$("notificationCountText").textContent=unread?`${unread} unread · ${rows.length} total`:`All ${rows.length} notifications read`;if($("notificationList"))$("notificationList").innerHTML=rows.length?rows.map(n=>`<div class="notification-item ${n.is_read?"read":"unread"}"><div class="notification-item-content"><strong>${escapeHTML(n.title||"Notification")}</strong><p>${escapeHTML(n.message||"")}</p><time>${formatIndiaDateTime(n.created_at)}</time></div>${!n.is_read?`<button type="button" class="text-button notification-read-one" data-id="${Number(n.id)}">Mark read</button>`:""}</div>`).join(""):`<div class="empty-state-card">No notifications</div>`;document.querySelectorAll(".notification-read-one").forEach(btn=>btn.addEventListener("click",async()=>{try{await api(`/api/notifications/${btn.dataset.id}/read`,{method:"PATCH"});await loadNotifications();}catch(e){showToast(e.message,"error");}}));}catch(error){console.error("Notifications:",error);}}

function updateBurgerIcon(){const el=$("sidebarToggleIcon");if(el)el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';}

function downloadIDCardPNG(employee){
    if(!employee)return showToast("Employee not found.","error");
    const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");canvas.width=900;canvas.height=560;
    const grad=ctx.createLinearGradient(0,0,900,0);grad.addColorStop(0,"#1d4ed8");grad.addColorStop(1,"#4f46e5");ctx.fillStyle=grad;ctx.fillRect(0,0,900,560);ctx.fillStyle="#ffffff";ctx.font="700 34px Arial";ctx.fillText(DS_FINAL.branding.companyName||"Dhanush Softwares",50,65);ctx.font="18px Arial";ctx.globalAlpha=.85;ctx.fillText("Employee Identity Card",50,95);ctx.globalAlpha=1;ctx.fillStyle="#ffffff";ctx.fillRect(35,125,830,390);ctx.fillStyle="#172033";ctx.font="700 30px Arial";ctx.fillText(employee.name||"Employee",285,190);ctx.font="18px Arial";ctx.fillStyle="#64748b";ctx.fillText(employee.designation||"Employee",285,222);ctx.font="16px Arial";ctx.fillText(`ID: ${employee.employee_code||employee.id}`,285,265);ctx.fillText(`Email: ${employee.email||"-"}`,285,300);ctx.fillText(`Phone: ${employee.phone||"-"}`,285,335);ctx.fillText(`Status: ${employee.status||"Active"}`,285,370);
    const img=new Image();img.onload=()=>{ctx.save();ctx.beginPath();ctx.arc(150,300,105,0,Math.PI*2);ctx.closePath();ctx.clip();ctx.drawImage(img,45,195,210,210);ctx.restore();finish();};img.onerror=finish;img.src=employee.profile_image||"";function finish(){if(!employee.profile_image){ctx.fillStyle="#e8efff";ctx.beginPath();ctx.arc(150,300,105,0,Math.PI*2);ctx.fill();ctx.fillStyle="#2563eb";ctx.font="700 72px Arial";ctx.textAlign="center";ctx.fillText(getInitial(employee.name),150,325);ctx.textAlign="left";}canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`ID_Card_${employee.employee_code||employee.id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("ID card downloaded.");},"image/png");}}
function viewIDCard(id){
    const employee = allEmployees.find(e => Number(e.id) === Number(id)) ||
        (Number(currentUser?.id) === Number(id) ? currentUser : null);
    if (!employee) return showToast("Employee not found.", "error");
    showIDCardPreview(employee);
}

function viewMyID(){
    if (!currentUser) return showToast("Please sign in first.", "warning");
    showIDCardPreview(currentUser);
}

function bindV4Actions(){
    if ($("dashboardHeaderIdButton")) $("dashboardHeaderIdButton").onclick = () => viewMyID();
    if ($("dashboardHeaderPayslipButton")) $("dashboardHeaderPayslipButton").onclick = () => { if(currentUser) showPayslipPreview(currentUser.id); };
    if ($("dashboardIdButton")) $("dashboardIdButton").onclick = () => { if(currentUser) showIDCardPreview(currentUser); };
    $("clearChatButton")?.addEventListener("click",clearChatHistory);
    $("markNotificationsRead")?.addEventListener("click",async()=>{try{await api("/api/notifications/read-all",{method:"PATCH"});await loadNotifications();}catch(error){showToast(error.message,"error");}});
    $("notificationButton")?.addEventListener("click",()=>{$("notificationPanel")?.classList.toggle("hidden");loadNotifications();});
    ["statTotalEmployees","statActiveEmployees","statActiveProjects","statPendingLeaves"].forEach(id=>$(id)?.classList.add("clickable"));
    $("statTotalEmployees")?.parentElement?.parentElement?.addEventListener("click",()=>switchTab("employees"));
    $("statActiveEmployees")?.parentElement?.parentElement?.addEventListener("click",()=>switchTab("employees"));
    $("statActiveProjects")?.parentElement?.parentElement?.addEventListener("click",()=>switchTab("projects"));
    $("statPendingLeaves")?.parentElement?.parentElement?.addEventListener("click",()=>switchTab("leaves"));
}

function removeStrayPageImages() {
    const root = $("pageContainer");
    if (!root) return;
    const allowed = ".employee-avatar, .dashboard-id-card, .mini-id-card, .id-card-preview-overlay, .professional-id-card, .branding-preview, .chat-container, .topbar";
    root.querySelectorAll("img").forEach(img => {
        if (!img.closest(allowed)) {
            img.remove();
        }
    });
}

// Re-bind final actions after DOM initialization without touching existing features.
const _v4Init = initializeERP;
initializeERP = async function(){await _v4Init();bindV4Actions();};
window.initializeERP=initializeERP;window.toggleSidebar=toggleSidebar;window.switchTab=switchTab;window.viewIDCard=viewIDCard;window.viewMyID=viewMyID;window.downloadPayslip=downloadPayslip;window.deleteChatMessage=deleteChatMessage;window.clearChatHistory=clearChatHistory;window.loadPayroll=loadPayroll;window.showPayslipPreview=showPayslipPreview;


/* =========================================================
   V8 TARGETED FIXES
   Only fixes requested in the latest revision.
========================================================= */

async function loadPerformance() {
    const body = $("performanceTableBody");
    if (body) body.innerHTML = `<tr><td colspan="5" class="empty-state-cell">Loading performance...</td></tr>`;
    try {
        const data = await api(`/api/performance?ts=${Date.now()}`, { cache: "no-store" });
        const rows = data.performance || [];
        if (body) {
            body.innerHTML = rows.length
                ? rows.map(r => `<tr><td>${escapeHTML(r.employee_name || "-")}</td><td><strong>${escapeHTML(String(r.score ?? "-"))}</strong></td><td>${escapeHTML(r.comments || "-")}</td><td>${formatDate(r.review_date || r.created_at)}</td><td>${escapeHTML(r.reviewed_by_name || r.reviewed_by || "-")}</td></tr>`).join("")
                : `<tr><td colspan="5" class="empty-state-cell">No performance reviews yet.</td></tr>`;
        }
        if ($("performanceCards")) {
            const avg = rows.length ? (rows.reduce((sum, r) => sum + Number(r.score || 0), 0) / rows.length).toFixed(1) : "—";
            $("performanceCards").innerHTML = `<div class="performance-card-highlight"><strong>${avg}${rows.length ? "/5" : ""}</strong><span>${rows.length ? "Average rating" : "No ratings yet"}</span></div>`;
        }
    } catch (error) {
        if (body) body.innerHTML = `<tr><td colspan="5" class="empty-state-cell"><strong>Unable to load performance records.</strong><br><small>${escapeHTML(error.message || "Please try again.")}</small><br><button type="button" class="secondary-button" onclick="loadPerformance()">Retry</button></td></tr>`;
    }
}

async function loadAnnouncements() {
    const grid = $("announcementsGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="empty-state-card">Loading announcements...</div>`;
    try {
        const data = await api(`/api/announcements?ts=${Date.now()}`, { cache: "no-store" });
        const rows = data.announcements || [];
        grid.innerHTML = rows.length
            ? rows.map(a => `<article class="announcement-card"><div class="announcement-card-icon">📢</div><div><h3>${escapeHTML(a.title || "Announcement")}</h3><p>${escapeHTML(a.message || "")}</p><small>${formatIndiaDateTime(a.created_at)}${a.created_by_name ? ` · ${escapeHTML(a.created_by_name)}` : ""}</small></div></article>`).join("")
            : `<div class="empty-state-card">No announcements yet.</div>`;
    } catch (error) {
        grid.innerHTML = `<div class="empty-state-card"><strong>Unable to load announcements.</strong><br><small>${escapeHTML(error.message || "Please try again.")}</small><br><button type="button" class="secondary-button" onclick="loadAnnouncements()">Retry</button></div>`;
    }
}

async function publishAnnouncement(event) {
    event.preventDefault();
    if (!isManager()) return showToast("Management permission required.", "error");
    try {
        await api("/api/announcements", { method: "POST", body: { title: $("announcementTitle")?.value.trim(), message: $("announcementMessage")?.value.trim() } });
        closeModal("announcementModal");
        $("announcementForm")?.reset();
        await loadAnnouncements();
        await loadDashboard();
        showToast("Announcement published.");
    } catch (error) {
        setFormMessage("announcementFormMessage", error.message || "Unable to publish announcement.");
    }
}

function showIDCardPreview(employee) {
    if (!employee) return showToast("Employee not found.", "error");
    document.getElementById("idCardPreviewOverlay")?.remove();
    const logo = DS_FINAL.branding.logo || "";
    const overlay = document.createElement("div");
    overlay.id = "idCardPreviewOverlay";
    overlay.className = "id-card-preview-overlay";
    overlay.innerHTML = `
        <div class="id-card-preview-modal" role="dialog" aria-modal="true" aria-label="Employee ID card preview">
            <div class="id-card-preview-header"><div><strong>ID Card Preview</strong><span>${escapeHTML(employee.name || "Employee")}</span></div><button type="button" class="modal-close" aria-label="Close">×</button></div>
            <div class="id-card-horizontal">
                <div class="id-card-horizontal-brand"><img src="${escapeHTML(logo)}" alt="Company logo"><div><strong>${escapeHTML(DS_FINAL.branding.companyName || "Dhanush Softwares")}</strong><span>Employee Identity Card</span></div></div>
                <div class="id-card-horizontal-content">
                    <div class="id-card-horizontal-photo">${employee.profile_image ? `<img src="${escapeHTML(employee.profile_image)}" alt="Profile">` : escapeHTML(getInitial(employee.name))}</div>
                    <div class="id-card-horizontal-details"><h2>${escapeHTML(employee.name || "Employee")}</h2><p>${escapeHTML(employee.designation || "Employee")}</p><div><span>ID</span><strong>${escapeHTML(employee.employee_code || employee.id || "-")}</strong></div><div><span>Email</span><strong>${escapeHTML(employee.email || "-")}</strong></div><div><span>Phone</span><strong>${escapeHTML(employee.phone || "-")}</strong></div></div>
                </div>
            </div>
            <div class="id-card-preview-actions"><button type="button" class="secondary-button" data-id-preview-close>Close</button><button type="button" class="primary-button" data-id-preview-download>Download ID Card</button></div>
        </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector(".modal-close")?.addEventListener("click", close);
    overlay.querySelector("[data-id-preview-close]")?.addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    overlay.querySelector("[data-id-preview-download]")?.addEventListener("click", () => downloadIDCardPNG(employee));
}

function viewIDCard(id) {
    const employee = allEmployees.find(e => Number(e.id) === Number(id)) || (Number(currentUser?.id) === Number(id) ? currentUser : null);
    if (!employee) return showToast("Employee not found.", "error");
    showIDCardPreview(employee);
}

function bindV8Actions() {
    const chat = $("chatContainer");
    if (chat && !currentChatUserId) {
        chat.classList.remove("has-selection");
        if (window.innerWidth <= 650) chat.classList.add("show-chat-users");
    }
    document.querySelectorAll(".chat-user").forEach(btn => btn.addEventListener("click", () => {
        chat?.classList.add("has-selection");
        if (window.innerWidth <= 650) chat?.classList.remove("show-chat-users");
    }));
    $("chatMobileBack")?.addEventListener("click",()=>{
        currentChatUserId=null;
        chat?.classList.remove("has-selection");
        if(window.innerWidth<=650) chat?.classList.add("show-chat-users");
        if($("selectedChatAvatar")){ $("selectedChatAvatar").innerHTML=""; $("selectedChatAvatar").textContent=""; }
        if($("selectedChatName")) $("selectedChatName").textContent="Select an employee";
        if($("selectedChatStatus")) $("selectedChatStatus").textContent="Choose someone to start chatting";
        if($("chatMessageInput")) $("chatMessageInput").disabled=true;
        if($("chatSendButton")) $("chatSendButton").disabled=true;
    });
}

window.loadPerformance = loadPerformance;
window.loadAnnouncements = loadAnnouncements;
window.viewIDCard = viewIDCard;
window.viewMyID = viewMyID;
window.publishAnnouncement = publishAnnouncement;
const __v8Initialize = initializeERP;
initializeERP = async function() {
    await __v8Initialize();
    bindV8Actions();
    removeStrayPageImages();
};
window.initializeERP = initializeERP;

/* =========================================================
   V12 TARGETED FIXES — ONLY USER REQUESTED ITEMS
   1) Mobile/tablet sidebar burger must always work.
   2) Employee ID button must open ONLY the ID-card preview.
   3) Remove stale/legacy ID modal content that could leak uploaded images.
========================================================= */

function toggleSidebar() {
    const sidebar = $("sidebar");
    const overlay = $("sidebarOverlay");
    if (!sidebar) return;

    if (window.innerWidth <= 900) {
        const willOpen = !sidebar.classList.contains("open");
        sidebar.classList.toggle("open", willOpen);
        document.body.classList.toggle("sidebar-open", willOpen);
        if (overlay) overlay.style.display = willOpen ? "block" : "none";
        if (willOpen) sidebar.setAttribute("aria-hidden", "false");
        else sidebar.setAttribute("aria-hidden", "true");
    } else {
        const willClose = !sidebar.classList.contains("closed");
        sidebar.classList.toggle("closed", willClose);
        document.body.classList.remove("sidebar-open");
        if (overlay) overlay.style.display = "none";
        sidebar.setAttribute("aria-hidden", "false");
    }
}

function closeMobileSidebar() {
    const sidebar = $("sidebar");
    const overlay = $("sidebarOverlay");
    if (window.innerWidth > 900) return;
    sidebar?.classList.remove("open");
    document.body.classList.remove("sidebar-open");
    if (overlay) overlay.style.display = "none";
    sidebar?.setAttribute("aria-hidden", "true");
}

function removeLegacyIDCardArtifacts() {
    document.getElementById("idModal")?.remove();
    document.querySelectorAll("#idCardDetails").forEach(el => el.closest(".modal")?.remove());
    document.querySelectorAll("#idCardPreviewOverlay").forEach(el => el.remove());
}

function showIDCardPreview(employee) {
    if (!employee) return showToast("Employee not found.", "error");

    removeLegacyIDCardArtifacts();

    const overlay = document.createElement("div");
    overlay.id = "idCardPreviewOverlay";
    overlay.className = "id-card-preview-overlay";

    const logo = DS_FINAL?.branding?.logo || "/Dhanush.jpg";
    const profile = employee.profile_image || "";
    const initial = escapeHTML(getInitial(employee.name));

    overlay.innerHTML = `
        <div class="id-card-preview-modal" role="dialog" aria-modal="true" aria-label="Employee ID card preview">
            <div class="id-card-preview-header">
                <div>
                    <strong>ID Card Preview</strong>
                    <span>${escapeHTML(employee.name || "Employee")}</span>
                </div>
                <button type="button" class="modal-close" data-id-preview-close aria-label="Close">×</button>
            </div>

            <div class="id-card-horizontal">
                <div class="id-card-horizontal-brand">
                    <img src="${escapeHTML(logo)}" alt="Company logo">
                    <div>
                        <strong>${escapeHTML(DS_FINAL?.branding?.companyName || "Dhanush Softwares")}</strong>
                        <span>Employee Identity Card</span>
                    </div>
                </div>

                <div class="id-card-horizontal-content">
                    <div class="id-card-horizontal-photo">
                        ${profile ? `<img src="${escapeHTML(profile)}" alt="${escapeHTML(employee.name || "Employee")} profile photo">` : initial}
                    </div>
                    <div class="id-card-horizontal-details">
                        <h2>${escapeHTML(employee.name || "Employee")}</h2>
                        <p>${escapeHTML(employee.designation || "Employee")}</p>
                        <div><span>ID</span><strong>${escapeHTML(employee.employee_code || employee.id || "-")}</strong></div>
                        <div><span>Email</span><strong>${escapeHTML(employee.email || "-")}</strong></div>
                        <div><span>Phone</span><strong>${escapeHTML(employee.phone || "-")}</strong></div>
                        <div><span>Department</span><strong>${escapeHTML(employee.department_name || "-")}</strong></div>
                    </div>
                </div>
            </div>

            <div class="id-card-preview-actions">
                <button type="button" class="secondary-button" data-id-preview-close>Close</button>
                <button type="button" class="primary-button" data-id-preview-download>Download ID Card</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelectorAll("[data-id-preview-close]").forEach(btn => btn.addEventListener("click", close));
    overlay.addEventListener("click", event => {
        if (event.target === overlay) close();
    });
    overlay.querySelector("[data-id-preview-download]")?.addEventListener("click", () => downloadIDCardPNG(employee));
}

function viewIDCard(id) {
    const employee = allEmployees.find(e => Number(e.id) === Number(id)) ||
        (Number(currentUser?.id) === Number(id) ? currentUser : null);
    if (!employee) return showToast("Employee not found.", "error");
    showIDCardPreview(employee);
}

function bindV12TargetedActions() {
    let burger = $("sidebarToggle");
    if (burger && !burger.dataset.v12Bound) {
        /* Remove every earlier click handler so the burger cannot toggle twice. */
        const freshBurger = burger.cloneNode(true);
        burger.replaceWith(freshBurger);
        burger = freshBurger;
        burger.dataset.v12Bound = "1";
        burger.addEventListener("click", toggleSidebar);
    }

    const overlay = $("sidebarOverlay");
    if (overlay && !overlay.dataset.v12Bound) {
        overlay.dataset.v12Bound = "1";
        overlay.addEventListener("click", closeMobileSidebar);
    }

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        if (button.dataset.v12NavBound) return;
        button.dataset.v12NavBound = "1";
        button.addEventListener("click", closeMobileSidebar);
    });

    updateBurgerIcon();
}

window.toggleSidebar = toggleSidebar;
window.viewIDCard = viewIDCard;
window.viewMyID = viewMyID;

/* V13: small smooth AI FAB drag so it never blocks the chat send area. */
function bindFloatingAIDrag(){
    const widget = document.querySelector(".floating-ai-widget");
    const button = document.querySelector(".floating-ai-button");
    if(!widget || !button || button.dataset.dragBound === "1") return;
    button.dataset.dragBound = "1";
    let dragging=false, moved=false, startX=0, startY=0, startRight=0, startBottom=0;
    const start=(clientX,clientY)=>{
        const r=widget.getBoundingClientRect();
        dragging=true; moved=false; startX=clientX; startY=clientY;
        startRight=Math.max(8,window.innerWidth-r.right); startBottom=Math.max(8,window.innerHeight-r.bottom);
        widget.style.transition="none";
    };
    const move=(clientX,clientY)=>{
        if(!dragging) return;
        const dx=clientX-startX, dy=clientY-startY;
        if(Math.abs(dx)+Math.abs(dy)>4) moved=true;
        const maxRight=Math.max(8,window.innerWidth-widget.offsetWidth-8);
        const maxBottom=Math.max(8,window.innerHeight-widget.offsetHeight-8);
        widget.style.right=Math.max(8,Math.min(maxRight,startRight-dx))+"px";
        widget.style.bottom=Math.max(8,Math.min(maxBottom,startBottom-dy))+"px";
    };
    const end=()=>{
        if(!dragging) return;
        dragging=false; widget.style.transition="right .22s ease,bottom .22s ease,transform .18s ease";
        if(moved){ button.dataset.dragJustFinished="1"; setTimeout(()=>delete button.dataset.dragJustFinished,180); }
    };
    button.addEventListener("pointerdown",e=>{ if(e.button!==undefined&&e.button!==0)return; button.setPointerCapture?.(e.pointerId); start(e.clientX,e.clientY); });
    button.addEventListener("pointermove",e=>move(e.clientX,e.clientY));
    button.addEventListener("pointerup",end);
    button.addEventListener("pointercancel",end);
    button.addEventListener("click",e=>{ if(button.dataset.dragJustFinished==="1"){e.preventDefault();e.stopImmediatePropagation();} });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindV12TargetedActions, { once: true });
} else {
    bindV12TargetedActions();
    bindFloatingAIDrag();
}

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        document.body.classList.remove("sidebar-open");
        $("sidebarOverlay")?.style.setProperty("display", "none");
        $("sidebar")?.classList.remove("open");
    }
});

/* =========================================================
   V14 FINAL POLISH — dashboard + ID card reliability
   Keeps existing ERP features intact and only hardens the
   dashboard/ID-card flow and perceived performance.
========================================================= */

function dsResolveEmployee(id) {
    const numericId = Number(id);
    return allEmployees.find(e => Number(e.id) === numericId) ||
        (Number(currentUser?.id) === numericId ? currentUser : null);
}

function dsRemoveLegacyIDArtifacts() {
    document.querySelectorAll('#idModal, #idCardDetails, .professional-id-card').forEach(el => el.remove());
    document.querySelectorAll('[data-legacy-id-card]').forEach(el => el.remove());
}

function dsSetDashboardActionButtons(employee) {
    if (!employee) return;
    const idButtons = ['dashboardIdButton', 'dashboardHeaderIdButton'];
    idButtons.forEach(id => {
        const btn = $(id);
        if (!btn) return;
        btn.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            showIDCardPreview(employee);
        };
    });
    const slipButtons = ['dashboardPayslipButton', 'dashboardHeaderPayslipButton'];
    slipButtons.forEach(id => {
        const btn = $(id);
        if (!btn) return;
        btn.onclick = async (event) => {
            event.preventDefault();
            event.stopPropagation();
            btn.disabled = true;
            btn.classList.add('is-loading');
            try { await showPayslipPreview(employee.id); }
            finally { btn.disabled = false; btn.classList.remove('is-loading'); }
        };
    });
}

async function loadDashboard() {
    const dashboardRoot = $('page-dashboard');
    dashboardRoot?.classList.add('ds-view-enter');
    try {
        /* Fetch dashboard essentials together so the dashboard does not render
           once with empty projects/attendance and then remain stale. */
        const month = indiaMonthString();
        const today = todayString();
        const results = await Promise.allSettled([
            api('/api/dashboard'),
            api(`/api/projects?ts=${Date.now()}`, { cache: 'no-store' }),
            api(`/api/attendance?date=${encodeURIComponent(today)}`, { cache: 'no-store' })
        ]);

        const dashboardData = results[0].status === 'fulfilled' ? results[0].value : {};
        const projectData = results[1].status === 'fulfilled' ? results[1].value : {};
        const attendanceData = results[2].status === 'fulfilled' ? results[2].value : {};
        const d = dashboardData.dashboard || {};

        if (Array.isArray(projectData.projects)) allProjects = projectData.projects;
        if (Array.isArray(attendanceData.attendance)) allAttendance = attendanceData.attendance;

        if ($('dashboardCurrentDate')) {
            $('dashboardCurrentDate').textContent = new Date().toLocaleDateString(undefined, {
                day: '2-digit', month: 'long', year: 'numeric'
            });
        }

        if ($('statTotalEmployees')) $('statTotalEmployees').textContent = d.totalEmployees ?? allEmployees.length ?? 0;
        if ($('statActiveEmployees')) $('statActiveEmployees').textContent = d.activeEmployees ?? allEmployees.filter(e => String(e.status || 'active').toLowerCase() === 'active').length;
        if ($('statPendingLeaves')) $('statPendingLeaves').textContent = d.pendingLeaves ?? 0;
        if ($('statActiveProjects')) $('statActiveProjects').textContent = d.totalProjects ?? allProjects.length ?? 0;

        if ($('dashboardLeaves')) {
            $('dashboardLeaves').innerHTML = (d.pendingLeaves || 0)
                ? `<div class="dashboard-highlight">${d.pendingLeaves} pending leave request${d.pendingLeaves === 1 ? '' : 's'}</div>`
                : `<div class="empty-state-card">No pending leave requests.</div>`;
        }

        if ($('dashboardAnnouncements')) {
            const announcements = Array.isArray(d.announcements) ? d.announcements : [];
            $('dashboardAnnouncements').innerHTML = announcements.length
                ? announcements.map(a => `<div class="announcement-preview"><strong>${escapeHTML(a.title || 'Announcement')}</strong><span>${escapeHTML(a.message || '')}</span><small>${formatIndiaDateTime(a.created_at)}</small></div>`).join('')
                : `<div class="empty-state-card">No announcements yet.</div>`;
        }

        if ($('dashboardProjects')) {
            const visibleProjects = isManager()
                ? allProjects.slice(0, 5)
                : allProjects.filter(p => Number(p.assigned_to) === Number(currentUser?.id)).slice(0, 5);
            $('dashboardProjects').innerHTML = visibleProjects.length
                ? visibleProjects.map(p => `<div class="dashboard-row"><div><strong>${escapeHTML(p.name || 'Untitled project')}</strong><small>${escapeHTML(p.assigned_employee_name || 'Unassigned')}</small></div><span class="status-badge ${String(p.status || '').toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(p.status || 'planned')}</span></div>`).join('')
                : `<div class="empty-state-card">No projects yet.</div>`;
        }

        if ($('dashboardAttendance')) {
            const rows = allAttendance.filter(r => String(r.attendance_date).slice(0, 10) === today);
            const c = calculateAttendance(rows);
            $('dashboardAttendance').innerHTML = `<div class="dashboard-highlight"><strong>${c.present}</strong> present · <strong>${c.absent}</strong> absent · <strong>${c.leave}</strong> leave</div>`;
        }

        if (currentUser) {
            if (isManager()) {
                $('dashboardIdCard')?.closest('.id-card-panel')?.style.setProperty('display', 'none');
                $('dashboardPayslip')?.closest('.payslip-panel')?.style.setProperty('display', 'none');
            } else {
                const employee = dsResolveEmployee(currentUser.id) || currentUser;
                const card = $('dashboardIdCard');
                if (card) {
                    card.innerHTML = `<div class="mini-id-card"><div class="mini-id-photo">${employee.profile_image ? `<img src="${escapeHTML(employee.profile_image)}" alt="Profile">` : escapeHTML(getInitial(employee.name))}</div><div><strong>${escapeHTML(employee.name || 'Employee')}</strong><span>${escapeHTML(employee.designation || 'Employee')}</span><small>${escapeHTML(employee.employee_code || 'EMP')}</small></div></div>`;
                }
                dsSetDashboardActionButtons(employee);

                /* Do not block the dashboard on the salary endpoint. */
                renderLatestPayslip(employee.id).catch(err => console.warn('Dashboard payslip:', err));
            }
        }
    } catch (error) {
        console.error('Dashboard:', error);
        showToast(error.message || 'Unable to load dashboard.', 'error');
    } finally {
        requestAnimationFrame(() => dashboardRoot?.classList.remove('ds-view-enter'));
    }
}

/* Replace the ID preview with one isolated, self-contained modal.
   This prevents old uploaded images from leaking into the page. */
function showIDCardPreview(employee) {
    if (!employee) return showToast('Employee not found.', 'error');
    dsRemoveLegacyIDArtifacts();
    document.getElementById('idCardPreviewOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'idCardPreviewOverlay';
    overlay.className = 'id-card-preview-overlay ds-id-isolated';
    overlay.innerHTML = `
        <div class="id-card-preview-modal" role="dialog" aria-modal="true" aria-label="Employee ID card preview">
            <div class="id-card-preview-header">
                <div><strong>ID Card Preview</strong><span>${escapeHTML(employee.name || 'Employee')}</span></div>
                <button type="button" class="modal-close" data-id-preview-close aria-label="Close">×</button>
            </div>
            <div class="id-card-horizontal">
                <div class="id-card-horizontal-brand">
                    <img src="${escapeHTML(DS_FINAL?.branding?.logo || '/Dhanush.jpg')}" alt="Company logo" onerror="this.style.display='none'">
                    <div><strong>${escapeHTML(DS_FINAL?.branding?.companyName || 'Dhanush Softwares')}</strong><span>Employee Identity Card</span></div>
                </div>
                <div class="id-card-horizontal-content">
                    <div class="id-card-horizontal-photo">
                        ${employee.profile_image ? `<img src="${escapeHTML(employee.profile_image)}" alt="Profile photo">` : escapeHTML(getInitial(employee.name))}
                    </div>
                    <div class="id-card-horizontal-details">
                        <h2>${escapeHTML(employee.name || 'Employee')}</h2>
                        <p>${escapeHTML(employee.designation || 'Employee')}</p>
                        <div><span>ID</span><strong>${escapeHTML(employee.employee_code || employee.id || '-')}</strong></div>
                        <div><span>Email</span><strong>${escapeHTML(employee.email || '-')}</strong></div>
                        <div><span>Phone</span><strong>${escapeHTML(employee.phone || '-')}</strong></div>
                        <div><span>Department</span><strong>${escapeHTML(employee.department_name || '-')}</strong></div>
                    </div>
                </div>
            </div>
            <div class="id-card-preview-actions">
                <button type="button" class="secondary-button" data-id-preview-close>Close</button>
                <button type="button" class="primary-button" data-id-preview-download>Download ID Card</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelectorAll('[data-id-preview-close]').forEach(btn => btn.addEventListener('click', close));
    overlay.querySelector('[data-id-preview-download]')?.addEventListener('click', () => downloadIDCardPNG(employee));
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    document.addEventListener('keydown', function escHandler(event) {
        if (event.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    }, { once: true });
}

function bindDashboardV14() {
    dsRemoveLegacyIDArtifacts();
    if (currentUser && !isManager()) dsSetDashboardActionButtons(dsResolveEmployee(currentUser.id) || currentUser);
}

window.loadDashboard = loadDashboard;
window.showIDCardPreview = showIDCardPreview;
window.viewIDCard = viewIDCard;
window.viewMyID = viewMyID;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindDashboardV14, { once: true });
} else {
    bindDashboardV14();
}
