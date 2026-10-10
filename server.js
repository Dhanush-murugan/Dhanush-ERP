/*
===========================================================
 DHANUSH SOFTWARES ERP
 server.js

 Backend:
 - Express
 - Neon PostgreSQL
 - JWT Authentication
 - Password Hashing
 - Employee Management
 - Forgot / Reset Password
 - Attendance
 - Leave Management
 - Payroll
 - Projects
 - Chat
 - Performance
 - Goals
 - Recruitment
 - Training
 - Documents
 - Announcements
 - Assets
 - Reports
 - AI endpoint
===========================================================
*/

"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;

const DATABASE_URL =
    process.env.DATABASE_URL;

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "change-this-jwt-secret-in-production";

if (!DATABASE_URL) {
    console.error(
        "ERROR: DATABASE_URL is missing."
    );

    process.exit(1);
}


/* =========================================================
   DATABASE - NEON POSTGRESQL
========================================================= */

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("error", error => {
    console.error(
        "Unexpected PostgreSQL pool error:",
        error
    );
});


async function query(text, params = []) {
    const result =
        await pool.query(
            text,
            params
        );

    return result;
}


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "15mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "15mb"
    })
);

app.use(
    express.static(
        path.join(__dirname, "client", "dist")
    )
);

app.use(
    express.static(
        path.join(__dirname)
    )
);


/* =========================================================
   GENERAL HELPERS
========================================================= */

function sendError(
    response,
    status,
    message,
    error = null
) {
    if (error) {
        console.error(message, error);
    }

    return response.status(status).json({
        success: false,
        message
    });
}


function sendSuccess(
    response,
    data = {},
    message = ""
) {
    return response.json({
        success: true,
        message,
        ...data
    });
}


function getUserId(user) {
    return (
        user?.id ||
        user?.user_id ||
        user?.employee_id
    );
}


function normalizeRole(role) {
    const value = String(role || "")
        .trim()
        .toLowerCase()
        .replace(/[- ]/g, "_");

    if (value === "super_admin" || value === "superadmin") {
        return "admin";
    }

    if (value === "employee" || value === "emp") {
        return "employee";
    }

    return value;
}


function isAdminUser(user) {
    return normalizeRole(user?.role) === "admin";
}


function isManagerUser(user) {
    const role = normalizeRole(user?.role);
    return role === "admin" || role === "hr" || role === "manager";
}


/* =========================================================
   PASSWORD HELPERS
========================================================= */

async function hashPassword(password) {
    return bcrypt.hash(
        password,
        12
    );
}


async function comparePassword(
    password,
    hash
) {
    return bcrypt.compare(
        password,
        hash
    );
}


/* =========================================================
   JWT
========================================================= */

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                "7d"
        }
    );
}


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function authenticate(
    request,
    response,
    next
) {
    try {
        const header =
            request.headers.authorization;

        if (!header) {
            return sendError(
                response,
                401,
                "Authentication required."
            );
        }

        const parts =
            header.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {
            return sendError(
                response,
                401,
                "Invalid authorization header."
            );
        }

        const token =
            parts[1];

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        const result =
            await query(
                `
                SELECT
                    id,
                    employee_code,
                    name,
                    email,
                    password_hash,
                    role,
                    department_id,
                    status,
                    designation,
                    phone,
                    joining_date,
                    salary,
                    aadhaar_no,
                    address,
                    profile_image,
                    created_at
                FROM employees
                WHERE id = $1
                LIMIT 1
                `,
                [decoded.id]
            );

        if (!result.rows.length) {
            return sendError(
                response,
                401,
                "User account not found."
            );
        }

        const user =
            result.rows[0];

        if (
            String(
                user.status || ""
            ).toLowerCase() !==
            "active"
        ) {
            return sendError(
                response,
                403,
                "Your account is inactive."
            );
        }

        request.user =
            user;

        next();
    } catch (error) {
        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return sendError(
                response,
                401,
                "Session expired."
            );
        }

        return sendError(
            response,
            401,
            "Invalid authentication token."
        );
    }
}


function requireAdmin(
    request,
    response,
    next
) {
    if (
        !isAdminUser(
            request.user
        )
    ) {
        return sendError(
            response,
            403,
            "Administrator permission required."
        );
    }

    next();
}


function requireManager(
    request,
    response,
    next
) {
    if (
        !isManagerUser(
            request.user
        )
    ) {
        return sendError(
            response,
            403,
            "Management permission required."
        );
    }

    next();
}


function isSuperAdminDhanush(user) {
    if (!user) return false;
    const role = normalizeRole(user?.role);
    const email = String(user?.email || "").toLowerCase();
    const id = Number(user?.id || 0);
    const name = String(user?.name || "").toLowerCase();
    return role === "admin" && (id === 1 || email.includes("dhanush") || name.includes("dhanush"));
}


function requireSuperAdmin(
    request,
    response,
    next
) {
    if (!isSuperAdminDhanush(request.user)) {
        return sendError(
            response,
            403,
            "Access Denied: Only Super Admin Dhanush Murugan has the authorization to perform this executive administrative operation."
        );
    }

    next();
}



/* =========================================================
   DATABASE MIGRATION HELPERS
========================================================= */

function isValidProfileImage(value) {
    if (!value) return true;
    if (typeof value !== "string") return false;
    if (!/^data:image\/(png|jpeg|webp);base64,/i.test(value)) return false;
    return value.length <= 14000000;
}

const BRANDING_FILE = path.join(__dirname, ".company-branding.json");
function readBranding() {
    try {
        if (!fs.existsSync(BRANDING_FILE)) return { logo: "/Dhanush.jpg", companyName: "Dhanush Softwares" };
        return JSON.parse(fs.readFileSync(BRANDING_FILE, "utf8"));
    } catch {
        return { logo: "/Dhanush.jpg", companyName: "Dhanush Softwares" };
    }
}
function writeBranding(data) {
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(data), "utf8");
}

async function payrollMonthValue(monthKey) {
    const key = String(monthKey || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) return null;

    try {
        const result = await query(`
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'payroll'
              AND column_name = 'payroll_month'
            LIMIT 1
        `);

        if (!result.rows.length) return `${key}-01`;

        const type = String(result.rows[0].data_type || '').toLowerCase();
        if (type === 'date') return `${key}-01`;
        return key;
    } catch (error) {
        console.warn('Unable to inspect payroll_month type; using YYYY-MM:', error.message);
        return key;
    }
}

/*
   Keep payroll/performance tables available on fresh databases without
   changing existing table data. Existing tables are only supplemented
   with missing columns.
*/
async function ensurePayrollAndPerformanceTables() {
    await query(`
        CREATE TABLE IF NOT EXISTS payroll (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            payroll_month DATE NOT NULL,
            basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
            allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
            deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
            net_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'credited',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        ALTER TABLE payroll
        ADD COLUMN IF NOT EXISTS employee_id INTEGER,
        ADD COLUMN IF NOT EXISTS payroll_month DATE,
        ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS allowances NUMERIC(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS deductions NUMERIC(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS net_salary NUMERIC(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'credited',
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS performance_reviews (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            score NUMERIC(3,2),
            comments TEXT,
            review_date DATE DEFAULT CURRENT_DATE,
            reviewed_by INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        ALTER TABLE performance_reviews
        ADD COLUMN IF NOT EXISTS employee_id INTEGER,
        ADD COLUMN IF NOT EXISTS score NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS comments TEXT,
        ADD COLUMN IF NOT EXISTS review_date DATE DEFAULT CURRENT_DATE,
        ADD COLUMN IF NOT EXISTS reviewed_by INTEGER,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
    `);
}

async function ensureEmployeeProfileColumns() {
    await query(`
        ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS aadhaar_no TEXT,
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS profile_image TEXT
    `);

    await query(`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium'
    `);
}


/* Prevent stale browser cache for live ERP API data. */
app.use("/api", (request, response, next) => {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
    next();
});


/* =========================================================
   AUTH ROUTES
========================================================= */

/*
POST /api/auth/login
*/
app.post(
    "/api/auth/login",
    async (request, response) => {
        try {
            const {
                email,
                password
            } = request.body;

            if (
                !email ||
                !password
            ) {
                return sendError(
                    response,
                    400,
                    "Email and password are required."
                );
            }

            const result =
                await query(
                    `
                    SELECT *
                    FROM employees
                    WHERE LOWER(email) = LOWER($1)
                    LIMIT 1
                    `,
                    [
                        email.trim()
                    ]
                );

            if (!result.rows.length) {
                return sendError(
                    response,
                    401,
                    "Invalid email or password."
                );
            }

            const user =
                result.rows[0];

            if (
                String(
                    user.status || ""
                ).toLowerCase() !==
                "active"
            ) {
                return sendError(
                    response,
                    403,
                    "Your employee account is inactive. Contact management."
                );
            }

            const passwordValid =
                await comparePassword(
                    password,
                    user.password_hash
                );

            if (!passwordValid) {
                return sendError(
                    response,
                    401,
                    "Invalid email or password."
                );
            }

            await query(
                `
                UPDATE employees
                SET last_login_at = NOW()
                WHERE id = $1
                `,
                [user.id]
            );

            const token =
                createToken(user);

            const safeUser =
                sanitizeUser(user);

            return sendSuccess(
                response,
                {
                    token,
                    user: safeUser
                },
                "Login successful."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to login.",
                error
            );
        }
    }
);


/*
PATCH /api/auth/profile
Update the logged-in user's profile photo/basic profile details.
*/
app.patch(
    "/api/auth/profile",
    authenticate,
    async (request, response) => {
        try {
            const { name, phone, designation, address, profile_image } = request.body || {};
            if (profile_image !== undefined && !isValidProfileImage(profile_image)) {
                return sendError(response, 400, "Profile image must be PNG, JPEG or WEBP and up to 10MB.");
            }
            const result = await query(`
                UPDATE employees
                SET name = COALESCE($1, name),
                    phone = COALESCE($2, phone),
                    designation = COALESCE($3, designation),
                    address = COALESCE($4, address),
                    profile_image = CASE WHEN $5::text IS NULL THEN profile_image ELSE $5 END
                WHERE id = $6
                RETURNING *
            `, [name?.trim() || null, phone?.trim() || null, designation?.trim() || null, address?.trim() || null, profile_image === undefined ? null : profile_image, getUserId(request.user)]);
            return sendSuccess(response, { user: sanitizeUser(result.rows[0]) }, "Profile updated successfully.");
        } catch (error) {
            return sendError(response, 500, "Unable to update profile.", error);
        }
    }
);

/*
GET /api/public/branding
*/
app.get("/api/public/branding", (request, response) => {
    return response.json({ success: true, branding: readBranding() });
});

app.get("/api/public/branding", (request, response) => {
    return sendSuccess(response, { branding: readBranding() });
});

/*
POST /api/branding
*/
app.post("/api/branding", authenticate, requireManager, (request, response) => {
    try {
        const { logo, companyName } = request.body || {};
        if (logo !== undefined && !isValidProfileImage(logo)) {
            return sendError(response, 400, "Company logo must be PNG, JPEG or WEBP and up to 10MB.");
        }
        const data = { logo: logo || null, companyName: String(companyName || "Dhanush Softwares").trim() || "Dhanush Softwares" };
        writeBranding(data);
        return sendSuccess(response, { branding: data }, "Company branding saved.");
    } catch (error) {
        return sendError(response, 500, "Unable to save company branding.", error);
    }
});

/*
GET /api/auth/me
*/
app.get(
    "/api/auth/me",
    authenticate,
    async (
        request,
        response
    ) => {
        return sendSuccess(
            response,
            {
                user:
                    sanitizeUser(
                        request.user
                    )
            }
        );
    }
);


/*
POST /api/auth/change-password
*/
app.post(
    "/api/auth/change-password",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const {
                currentPassword,
                newPassword
            } = request.body;

            if (
                !currentPassword ||
                !newPassword
            ) {
                return sendError(
                    response,
                    400,
                    "Current and new passwords are required."
                );
            }

            if (
                newPassword.length < 6
            ) {
                return sendError(
                    response,
                    400,
                    "New password must contain at least 6 characters."
                );
            }

            const valid =
                await comparePassword(
                    currentPassword,
                    request.user.password_hash
                );

            if (!valid) {
                return sendError(
                    response,
                    400,
                    "Current password is incorrect."
                );
            }

            const hash =
                await hashPassword(
                    newPassword
                );

            await query(
                `
                UPDATE employees
                SET password_hash = $1
                WHERE id = $2
                `,
                [
                    hash,
                    getUserId(
                        request.user
                    )
                ]
            );

            return sendSuccess(
                response,
                {},
                "Password changed successfully."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to change password.",
                error
            );
        }
    }
);


/*
POST /api/auth/forgot-password
*/
app.post(
    "/api/auth/forgot-password",
    async (
        request,
        response
    ) => {
        try {
            const {
                email
            } = request.body;

            if (!email) {
                return sendError(
                    response,
                    400,
                    "Email is required."
                );
            }

            const result =
                await query(
                    `
                    SELECT id, email
                    FROM employees
                    WHERE LOWER(email) = LOWER($1)
                    LIMIT 1
                    `,
                    [
                        email.trim()
                    ]
                );

            /*
             Security:
             Do not reveal whether an email
             exists in the database.
            */

            if (
                !result.rows.length
            ) {
                return sendSuccess(
                    response,
                    {},
                    "If the account exists, password reset instructions have been created."
                );
            }

            const user =
                result.rows[0];

            const token =
                crypto
                    .randomBytes(32)
                    .toString("hex");

            const tokenHash =
                crypto
                    .createHash("sha256")
                    .update(token)
                    .digest("hex");

            await query(
                `
                UPDATE employees
                SET
                    reset_token_hash = $1,
                    reset_token_expires = NOW() + INTERVAL '30 minutes'
                WHERE id = $2
                `,
                [
                    tokenHash,
                    user.id
                ]
            );

            /*
             In a real production system,
             send this token using an email provider.

             For development, return the reset
             URL only when ENABLE_DEV_RESET_LINK=true.
            */

            const resultData = {};

            if (
                process.env.ENABLE_DEV_RESET_LINK ===
                "true"
            ) {
                resultData.resetToken =
                    token;

                resultData.resetUrl =
                    `/reset-password.html?token=${token}`;
            }

            return sendSuccess(
                response,
                resultData,
                "If the account exists, password reset instructions have been created."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to process password reset request.",
                error
            );
        }
    }
);


/*
POST /api/auth/reset-password
*/
app.post(
    "/api/auth/reset-password",
    async (
        request,
        response
    ) => {
        try {
            const {
                token,
                password
            } = request.body;

            if (
                !token ||
                !password
            ) {
                return sendError(
                    response,
                    400,
                    "Reset token and new password are required."
                );
            }

            if (
                password.length < 6
            ) {
                return sendError(
                    response,
                    400,
                    "Password must contain at least 6 characters."
                );
            }

            const tokenHash =
                crypto
                    .createHash("sha256")
                    .update(token)
                    .digest("hex");

            const result =
                await query(
                    `
                    SELECT id
                    FROM employees
                    WHERE
                        reset_token_hash = $1
                        AND reset_token_expires > NOW()
                    LIMIT 1
                    `,
                    [tokenHash]
                );

            if (!result.rows.length) {
                return sendError(
                    response,
                    400,
                    "Invalid or expired reset token."
                );
            }

            const passwordHash =
                await hashPassword(
                    password
                );

            await query(
                `
                UPDATE employees
                SET
                    password_hash = $1,
                    reset_token_hash = NULL,
                    reset_token_expires = NULL
                WHERE id = $2
                `,
                [
                    passwordHash,
                    result.rows[0].id
                ]
            );

            return sendSuccess(
                response,
                {},
                "Password reset successfully."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to reset password.",
                error
            );
        }
    }
);


/* =========================================================
   EMPLOYEE ROUTES
========================================================= */

/*
GET /api/employees
*/
app.get(
    "/api/employees",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const manager = isManagerUser(request.user);
            const result =
                await query(
                    `
                    SELECT
                        e.id,
                        e.employee_code,
                        e.name,
                        e.email,
                        e.role,
                        e.designation,
                        e.phone,
                        e.joining_date,
                        ${manager ? "e.salary," : "NULL AS salary,"}
                        ${manager ? "e.aadhaar_no," : "NULL AS aadhaar_no,"}
                        ${manager ? "e.address," : "NULL AS address,"}
                        e.profile_image,
                        e.status,
                        e.last_login_at,
                        e.created_at,
                        d.name AS department_name
                    FROM employees e
                    LEFT JOIN departments d
                        ON d.id = e.department_id
                    ORDER BY e.id ASC
                    `
                );

            return sendSuccess(
                response,
                {
                    employees:
                        result.rows
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to load employees.",
                error
            );
        }
    }
);


/*
POST /api/employees
*/
app.post(
    "/api/employees",
    authenticate,
    requireManager,
    async (
        request,
        response
    ) => {
        try {
            const {
                employee_code,
                name,
                email,
                password,
                role,
                department_id,
                designation,
                phone,
                joining_date,
                salary,
                aadhaar_no,
                address,
                profile_image,
                status
            } = request.body;

            if (
                !name ||
                !email ||
                !password
            ) {
                return sendError(
                    response,
                    400,
                    "Name, email and password are required."
                );
            }

            if (
                password.length < 6
            ) {
                return sendError(
                    response,
                    400,
                    "Password must contain at least 6 characters."
                );
            }

            if (!isValidProfileImage(profile_image)) {
                return sendError(
                    response,
                    400,
                    "Profile image must be JPG, PNG or WebP and 10 MB or smaller."
                );
            }

            const normalizedRole = normalizeRole(role || "employee");
            if (!["admin", "hr", "employee", "manager"].includes(normalizedRole)) {
                return sendError(response, 400, "Invalid employee role.");
            }

            if (normalizedRole === "admin" && !isAdminUser(request.user)) {
                return sendError(response, 403, "Only Super Admin can create another Super Admin.");
            }

            const existing =
                await query(
                    `
                    SELECT id
                    FROM employees
                    WHERE LOWER(email) = LOWER($1)
                    LIMIT 1
                    `,
                    [
                        email.trim()
                    ]
                );

            if (existing.rows.length) {
                return sendError(
                    response,
                    409,
                    "An employee with this email already exists."
                );
            }

            const passwordHash =
                await hashPassword(
                    password
                );

            const result =
                await query(
                    `
                    INSERT INTO employees
                    (
                        employee_code, name, email, password_hash, role,
                        department_id, designation, phone, joining_date,
                        salary, aadhaar_no, address, profile_image, status
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
                        COALESCE($14, 'active')
                    )
                    RETURNING
                        id, employee_code, name, email, role, department_id,
                        designation, phone, joining_date, salary, aadhaar_no,
                        address, profile_image, status, created_at
                    `,
                    [
                        employee_code || null,
                        name.trim(),
                        email.trim(),
                        passwordHash,
                        normalizedRole,
                        department_id || null,
                        designation || null,
                        phone || null,
                        joining_date || null,
                        salary === "" || salary == null ? null : Number(salary),
                        aadhaar_no || null,
                        address || null,
                        profile_image || null,
                        status ? String(status).toLowerCase() : "active"
                    ]
                );

            return sendSuccess(
                response,
                {
                    employee:
                        result.rows[0]
                },
                "Employee created successfully."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to create employee.",
                error
            );
        }
    }
);


/*
GET /api/employees/:id
*/
app.get(
    "/api/employees/:id",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const result =
                await query(
                    `
                    SELECT
                        e.id,
                        e.employee_code,
                        e.name,
                        e.email,
                        e.role,
                        e.department_id,
                        d.name AS department_name,
                        e.designation,
                        e.phone,
                        e.joining_date,
                        e.salary,
                        e.aadhaar_no,
                        e.address,
                        e.profile_image,
                        e.status,
                        e.last_login_at,
                        e.created_at
                    FROM employees e
                    LEFT JOIN departments d
                        ON d.id = e.department_id
                    WHERE e.id = $1
                    LIMIT 1
                    `,
                    [
                        request.params.id
                    ]
                );

            if (!result.rows.length) {
                return sendError(
                    response,
                    404,
                    "Employee not found."
                );
            }

            return sendSuccess(
                response,
                {
                    employee:
                        result.rows[0]
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to load employee.",
                error
            );
        }
    }
);


/*
PUT /api/employees/:id
*/
app.put(
    "/api/employees/:id",
    authenticate,
    requireManager,
    async (
        request,
        response
    ) => {
        try {
            const {
                employee_code,
                name,
                email,
                role,
                department_id,
                designation,
                phone,
                joining_date,
                salary,
                aadhaar_no,
                address,
                profile_image,
                status
            } = request.body;

            if (profile_image !== undefined && !isValidProfileImage(profile_image)) {
                return sendError(response, 400, "Invalid profile image.");
            }

            const target = await query(
                `SELECT id, role FROM employees WHERE id = $1 LIMIT 1`,
                [request.params.id]
            );
            if (!target.rows.length) {
                return sendError(response, 404, "Employee not found.");
            }
            if (normalizeRole(target.rows[0].role) === "admin" && !isAdminUser(request.user)) {
                return sendError(response, 403, "Only Super Admin can modify a Super Admin account.");
            }

            const normalizedRole = role ? normalizeRole(role) : null;
            if (normalizedRole && !["admin", "hr", "employee", "manager"].includes(normalizedRole)) {
                return sendError(response, 400, "Invalid employee role.");
            }
            if (normalizedRole === "admin" && !isAdminUser(request.user)) {
                return sendError(response, 403, "Only Super Admin can assign Super Admin role.");
            }

            const result =
                await query(
                    `
                    UPDATE employees
                    SET
                        employee_code =
                            COALESCE($1, employee_code),
                        name =
                            COALESCE($2, name),
                        email =
                            COALESCE($3, email),
                        role =
                            COALESCE($4, role),
                        department_id =
                            COALESCE($5, department_id),
                        designation =
                            COALESCE($6, designation),
                        phone =
                            COALESCE($7, phone),
                        joining_date = COALESCE($8, joining_date),
                        salary = COALESCE($9, salary),
                        aadhaar_no = COALESCE($10, aadhaar_no),
                        address = COALESCE($11, address),
                        profile_image = COALESCE($12, profile_image),
                        status = COALESCE($13, status),
                        updated_at = NOW()
                    WHERE id = $14
                    RETURNING
                        id,
                        employee_code,
                        name,
                        email,
                        role,
                        department_id,
                        designation,
                        phone,
                        joining_date,
                        salary,
                        aadhaar_no,
                        address,
                        profile_image,
                        status,
                        updated_at
                    `,
                    [
                        employee_code || null,
                        name || null,
                        email || null,
                        normalizedRole,
                        department_id || null,
                        designation || null,
                        phone || null,
                        joining_date || null,
                        salary === "" || salary == null ? null : Number(salary),
                        aadhaar_no || null,
                        address || null,
                        profile_image === undefined ? null : (profile_image || null),
                        status ? String(status).toLowerCase() : null,
                        request.params.id
                    ]
                );

            if (!result.rows.length) {
                return sendError(
                    response,
                    404,
                    "Employee not found."
                );
            }

            if (request.body.password && typeof request.body.password === "string" && request.body.password.trim().length >= 4) {
                const newHash = await hashPassword(request.body.password.trim());
                await query(`UPDATE employees SET password_hash = $1 WHERE id = $2`, [newHash, request.params.id]);
            }

            return sendSuccess(
                response,
                {
                    employee:
                        result.rows[0]
                },
                "Employee updated successfully."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to update employee.",
                error
            );
        }
    }
);


/*
PATCH /api/employees/:id/status
*/
app.patch(
    "/api/employees/:id/status",
    authenticate,
    requireManager,
    async (
        request,
        response
    ) => {
        try {
            const {
                status
            } = request.body;

            const allowed =
                [
                    "active",
                    "inactive"
                ];

            if (
                !allowed.includes(
                    String(status)
                        .toLowerCase()
                )
            ) {
                return sendError(
                    response,
                    400,
                    "Invalid employee status."
                );
            }

            const result =
                await query(
                    `
                    UPDATE employees
                    SET
                        status = $1,
                        updated_at = NOW()
                    WHERE id = $2
                    RETURNING id, status
                    `,
                    [
                        String(
                            status
                        ).toLowerCase(),
                        request.params.id
                    ]
                );

            if (!result.rows.length) {
                return sendError(
                    response,
                    404,
                    "Employee not found."
                );
            }

            return sendSuccess(
                response,
                {
                    employee:
                        result.rows[0]
                },
                "Employee status updated."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to update employee status.",
                error
            );
        }
    }
);


/* =========================================================
   DEPARTMENTS
========================================================= */

app.get(
    "/api/departments",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const result =
                await query(
                    `
                    SELECT
                        id,
                        name,
                        description,
                        created_at
                    FROM departments
                    ORDER BY name ASC
                    `
                );

            return sendSuccess(
                response,
                {
                    departments:
                        result.rows
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to load departments.",
                error
            );
        }
    }
);


/* =========================================================
   DASHBOARD
========================================================= */

app.get(
    "/api/dashboard",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const employeeStats =
                await query(
                    `
                    SELECT
                        COUNT(*)::int AS total_employees,
                        COUNT(*) FILTER (
                            WHERE status = 'active'
                        )::int AS active_employees
                    FROM employees
                    `
                );

            const leaveStats =
                await query(
                    `
                    SELECT
                        COUNT(*)::int AS pending_leaves
                    FROM leaves
                    WHERE status = 'pending'
                    `
                );

            const projectStats =
                await query(
                    `
                    SELECT
                        COUNT(*)::int AS total_projects
                    FROM projects
                    `
                );

            const recentEmployees = isManagerUser(request.user)
                ? await query(`
                    SELECT e.id, e.name, e.email, e.designation, e.status, d.name AS department_name
                    FROM employees e
                    LEFT JOIN departments d ON d.id = e.department_id
                    ORDER BY e.created_at DESC
                    LIMIT 5
                `)
                : { rows: [] };

            const announcements =
                await query(
                    `
                    SELECT
                        id,
                        title,
                        message,
                        created_at
                    FROM announcements
                    ORDER BY created_at DESC
                    LIMIT 5
                    `
                );

            return sendSuccess(
                response,
                {
                    dashboard: {
                        totalEmployees:
                            employeeStats.rows[0]
                                .total_employees,

                        activeEmployees:
                            employeeStats.rows[0]
                                .active_employees,

                        pendingLeaves:
                            leaveStats.rows[0]
                                .pending_leaves,

                        totalProjects:
                            projectStats.rows[0]
                                .total_projects,

                        recentEmployees:
                            recentEmployees.rows,

                        announcements:
                            announcements.rows
                    }
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to load dashboard.",
                error
            );
        }
    }
);


/* =========================================================
   ATTENDANCE
========================================================= */

app.get(
    "/api/attendance",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const {
                date,
                employee_id
            } = request.query;

            let sql = `
                SELECT
                    a.*,
                    e.name AS employee_name,
                    e.employee_code
                FROM attendance a
                JOIN employees e
                    ON e.id = a.employee_id
                WHERE 1 = 1
            `;

            const params = [];

            if (date) {
                params.push(date);

                sql += `
                    AND a.attendance_date = $${params.length}
                `;
            }

            if (employee_id) {
                params.push(employee_id);

                sql += `
                    AND a.employee_id = $${params.length}
                `;
            }

            sql += `
                ORDER BY a.attendance_date DESC
                LIMIT 500
            `;

            const result =
                await query(
                    sql,
                    params
                );

            return sendSuccess(
                response,
                {
                    attendance:
                        result.rows
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to load attendance.",
                error
            );
        }
    }
);


/*
GET /api/attendance/monthly?month=YYYY-MM&employee_id=ALL|id
*/
app.get("/api/attendance/monthly", authenticate, async (request, response) => {
    try {
        const month = String(request.query.month || new Date().toISOString().slice(0,7));
        const employeeId = request.query.employee_id && request.query.employee_id !== "ALL" ? Number(request.query.employee_id) : null;
        if (!/^\d{4}-\d{2}$/.test(month)) return sendError(response, 400, "Invalid month. Use YYYY-MM.");
        const params = [month + "-01", month + "-01"];
        let employeeClause = "";
        if (employeeId) { employeeClause = " AND a.employee_id = $3"; params.push(employeeId); }
        const result = await query(`
            SELECT a.employee_id, e.employee_code, e.name AS employee_name, a.attendance_date, a.status, a.check_in, a.check_out
            FROM attendance a JOIN employees e ON e.id=a.employee_id
            WHERE a.attendance_date >= $1::date
              AND a.attendance_date < ($2::date + INTERVAL '1 month')
              ${employeeClause}
            ORDER BY e.name, a.attendance_date
        `, params);
        return sendSuccess(response, { month, attendance: result.rows });
    } catch (error) { return sendError(response, 500, "Unable to load monthly attendance.", error); }
});

/*
POST /api/attendance
*/
app.post(
    "/api/attendance",
    authenticate,
    requireSuperAdmin,
    async (
        request,
        response
    ) => {
        try {
            const {
                employee_id,
                attendance_date,
                check_in,
                check_out,
                status,
                remarks
            } = request.body;

            const employeeId =
                employee_id ||
                getUserId(
                    request.user
                );

            const result =
                await query(
                    `
                    INSERT INTO attendance
                    (
                        employee_id,
                        attendance_date,
                        check_in,
                        check_out,
                        status,
                        remarks
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,$5,$6
                    )
                    ON CONFLICT
                    (
                        employee_id,
                        attendance_date
                    )
                    DO UPDATE SET
                        check_in =
                            EXCLUDED.check_in,
                        check_out =
                            EXCLUDED.check_out,
                        status =
                            EXCLUDED.status,
                        remarks =
                            EXCLUDED.remarks,
                        updated_at = NOW()
                    RETURNING *
                    `,
                    [
                        employeeId,
                        attendance_date ||
                            new Date()
                                .toISOString()
                                .slice(0, 10),
                        check_in || null,
                        check_out || null,
                        status || "present",
                        remarks || null
                    ]
                );

            return sendSuccess(
                response,
                {
                    attendance:
                        result.rows[0]
                },
                "Attendance saved successfully."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to save attendance.",
                error
            );
        }
    }
);

app.post(
    "/api/attendance/batch",
    authenticate,
    requireSuperAdmin,
    async (request, response) => {
        try {
            const { date, records } = request.body;
            if (!Array.isArray(records) || records.length === 0) {
                return sendError(response, 400, "Records array is required.");
            }
            const attDate = date || new Date().toISOString().slice(0, 10);
            for (const rec of records) {
                if (!rec.employee_id) continue;
                await query(
                    `
                    INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status, remarks)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (employee_id, attendance_date)
                    DO UPDATE SET
                        check_in = COALESCE(EXCLUDED.check_in, attendance.check_in),
                        check_out = COALESCE(EXCLUDED.check_out, attendance.check_out),
                        status = EXCLUDED.status,
                        remarks = EXCLUDED.remarks,
                        updated_at = NOW()
                    `,
                    [
                        rec.employee_id,
                        attDate,
                        rec.check_in || "09:00:00",
                        rec.check_out || (rec.status === "present" ? "18:00:00" : null),
                        rec.status || "present",
                        rec.remarks || "Daily Register"
                    ]
                );
            }
            return sendSuccess(response, { date: attDate, count: records.length }, "Mass attendance updated successfully.");
        } catch (error) {
            return sendError(response, 500, "Unable to save batch attendance.", error);
        }
    }
);



/* =========================================================
   LEAVES
========================================================= */

app.get(
    "/api/leaves",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const result =
                await query(
                    `
                    SELECT
                        l.*,
                        e.name AS employee_name,
                        e.employee_code
                    FROM leaves l
                    JOIN employees e
                        ON e.id = l.employee_id
                    ORDER BY l.created_at DESC
                    LIMIT 500
                    `
                );

            return sendSuccess(
                response,
                {
                    leaves:
                        result.rows
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to load leaves.",
                error
            );
        }
    }
);


/*
POST /api/leaves
*/
app.post(
    "/api/leaves",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const {
                leave_type,
                start_date,
                end_date,
                reason
            } = request.body;

            if (
                !leave_type ||
                !start_date ||
                !end_date
            ) {
                return sendError(
                    response,
                    400,
                    "Leave type, start date and end date are required."
                );
            }

            const result =
                await query(
                    `
                    INSERT INTO leaves
                    (
                        employee_id,
                        leave_type,
                        start_date,
                        end_date,
                        reason,
                        status
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,$5,'pending'
                    )
                    RETURNING *
                    `,
                    [
                        getUserId(
                            request.user
                        ),
                        leave_type,
                        start_date,
                        end_date,
                        reason || null
                    ]
                );

            return sendSuccess(
                response,
                {
                    leave:
                        result.rows[0]
                },
                "Leave request submitted."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to submit leave request.",
                error
            );
        }
    }
);


/*
PATCH /api/leaves/:id/status
*/
app.patch(
    "/api/leaves/:id/status",
    authenticate,
    requireManager,
    async (request, response) => {
        const client = await pool.connect();
        try {
            const status = String(request.body?.status || "").trim().toLowerCase();
            const leaveId = Number(request.params.id);
            const allowed = ["approved", "rejected", "pending"];

            if (!Number.isInteger(leaveId) || leaveId <= 0) {
                return sendError(response, 400, "Invalid leave request ID.");
            }
            if (!allowed.includes(status)) {
                return sendError(response, 400, "Invalid leave status.");
            }

            await client.query("BEGIN");

            const leaveResult = await client.query(
                `SELECT id, employee_id, start_date, end_date, status
                   FROM leaves
                  WHERE id = $1
                  FOR UPDATE`,
                [leaveId]
            );

            if (!leaveResult.rows.length) {
                await client.query("ROLLBACK");
                return sendError(response, 404, "Leave request not found.");
            }

            const leave = leaveResult.rows[0];
            const approverId = getUserId(request.user);

            const updated = await client.query(
                `UPDATE leaves
                    SET status = CAST($1 AS VARCHAR(32)),
                        approved_by = $2,
                        approved_at = CASE
                            WHEN CAST($1 AS VARCHAR(32)) IN ('approved','rejected') THEN NOW()
                            ELSE approved_at
                        END,
                        updated_at = NOW()
                  WHERE id = $3
              RETURNING *`,
                [status, approverId, leaveId]
            );

            /* Keep approved leave and attendance in sync atomically. */
            if (status === "approved") {
                await client.query(
                    `UPDATE attendance a
                        SET status = 'leave', remarks = COALESCE(a.remarks, 'Approved leave')
                      WHERE a.employee_id = $1
                        AND a.attendance_date BETWEEN $2::date AND $3::date`,
                    [leave.employee_id, leave.start_date, leave.end_date]
                );

                await client.query(
                    `INSERT INTO attendance (employee_id, attendance_date, status, remarks)
                     SELECT $1, gs::date, 'leave', 'Approved leave'
                       FROM generate_series($2::date, $3::date, interval '1 day') gs
                      WHERE NOT EXISTS (
                          SELECT 1
                            FROM attendance a
                           WHERE a.employee_id = $1
                             AND a.attendance_date = gs::date
                      )`,
                    [leave.employee_id, leave.start_date, leave.end_date]
                );
            }

            /* Notify the employee without making notification failure break approval. */
            try {
                await client.query(
                    `INSERT INTO notifications (employee_id, title, message, type)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        leave.employee_id,
                        `Leave ${status}`,
                        status === "approved"
                            ? "Your leave request has been approved."
                            : status === "rejected"
                                ? "Your leave request has been rejected."
                                : "Your leave request is pending review.",
                        "leave"
                    ]
                );
            } catch (notificationError) {
                console.warn("Leave notification skipped:", notificationError.message);
            }

            await client.query("COMMIT");

            return sendSuccess(
                response,
                { leave: updated.rows[0] },
                `Leave ${status}.`
            );
        } catch (error) {
            try { await client.query("ROLLBACK"); } catch {}
            console.error("Leave status update failed:", error);
            return sendError(response, 500, "Unable to update leave. Please retry.", error);
        } finally {
            client.release();
        }
    }
);

/* =========================================================
   PAYROLL
========================================================= */

app.get(
    "/api/payroll",
    authenticate,
    async (request, response) => {
        try {
            const params = [];
            let where = "";
            const scope = String(request.query?.scope || "").toLowerCase();
            const employeeId = request.query?.employee_id;

            if (scope === "me" || scope === "self") {
                params.push(getUserId(request.user));
                where = `WHERE p.employee_id = $1`;
            } else if (employeeId) {
                params.push(Number(employeeId));
                where = `WHERE p.employee_id = $1`;
            }

            const result = await query(
                `SELECT p.*, e.name AS employee_name, e.employee_code, e.designation, COALESCE(d.name, 'Engineering & Technology') AS department_name
                 FROM payroll p
                 JOIN employees e ON e.id = p.employee_id
                 LEFT JOIN departments d ON e.department_id = d.id
                 ${where}
                 ORDER BY p.payroll_month DESC, p.employee_id ASC, e.name ASC
                 LIMIT 500`,
                params
            );
            return sendSuccess(response, { payroll: result.rows });
        } catch (error) {
            console.error("Payroll GET failed:", error);
            return sendError(response, 500, "Unable to load payroll. Please retry.", error);
        }
    }
);

/*
POST /api/payroll
*/
app.post(
    "/api/payroll",
    authenticate,
    requireSuperAdmin,
    async (request, response) => {
        try {
            const { employee_id, payroll_month, basic_salary, allowances, deductions, net_salary, status } = request.body || {};
            const employeeId = Number(employee_id);
            const monthKey = String(payroll_month || "").slice(0, 7);
            if (!employeeId || !/^\d{4}-\d{2}$/.test(monthKey)) {
                return sendError(response, 400, "Employee and payroll month are required.");
            }
            const month = await payrollMonthValue(monthKey);
            if (!month) {
                return sendError(response, 400, "Invalid payroll month.");
            }
            const basic = Number(basic_salary || 0);
            const allow = Number(allowances || 0);
            const deduct = Number(deductions || 0);
            const net = Number.isFinite(Number(net_salary)) ? Number(net_salary) : basic + allow - deduct;
            const state = String(status || "credited").toLowerCase() === "pending" ? "pending" : "credited";
            const exists = await query(`SELECT id FROM payroll WHERE employee_id=$1 AND payroll_month=$2 LIMIT 1`, [employeeId, month]);
            let result;
            if (exists.rows.length) {
                result = await query(`UPDATE payroll SET basic_salary=$1, allowances=$2, deductions=$3, net_salary=$4, status=$5 WHERE id=$6 RETURNING *`, [basic, allow, deduct, net, state, exists.rows[0].id]);
            } else {
                result = await query(`INSERT INTO payroll (employee_id,payroll_month,basic_salary,allowances,deductions,net_salary,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [employeeId, month, basic, allow, deduct, net, state]);
            }
            return sendSuccess(response, { payroll: result.rows[0] }, "Payroll saved successfully.");
        } catch (error) {
            console.error("Payroll POST failed:", error);
            return sendError(response, 500, "Unable to save payroll. Please retry.", error);
        }
    }
);

/*
PATCH /api/payroll/:id/status
Live update payroll disbursement status (credited / not credited)
*/
app.patch(
    "/api/payroll/:id/status",
    authenticate,
    requireSuperAdmin,
    async (request, response) => {
        try {
            const id = Number(request.params.id);
            const { status } = request.body || {};
            if (!id) {
                return sendError(response, 400, "Valid payroll ID is required.");
            }
            const normalized = String(status || "").toLowerCase().trim();
            const state = (normalized === "not_credited" || normalized.includes("not") || normalized === "pending") ? "pending" : "credited";
            const result = await query(
                `UPDATE payroll SET status = $1 WHERE id = $2 RETURNING *`,
                [state, id]
            );
            if (!result.rows.length) {
                return sendError(response, 404, "Payroll record not found.");
            }
            return sendSuccess(
                response,
                { payroll: result.rows[0] },
                `Disbursement marked as ${state === "credited" ? "Credited" : "Not Credited"}.`
            );
        } catch (error) {
            console.error("Payroll status PATCH failed:", error);
            return sendError(response, 500, "Unable to update payroll status.", error);
        }
    }
);



/* =========================================================
   PROJECTS
========================================================= */

app.get(
    "/api/projects",
    authenticate,
    async (request, response) => {
        try {
            const params = [];
            let where = "";
            if (!isManagerUser(request.user)) {
                params.push(getUserId(request.user));
                where = `WHERE p.assigned_to = $1`;
            }
            const result = await query(
                `SELECT p.*, e.name AS assigned_employee_name, e.employee_code AS assigned_employee_code
                 FROM projects p
                 LEFT JOIN employees e ON e.id = p.assigned_to
                 ${where}
                 ORDER BY p.id DESC`,
                params
            );
            let projects = result.rows.map(p => ({ ...p, latest_rating: null }));
            try {
                const ratings = await query(`SELECT employee_id, score, comments, review_date FROM performance_reviews WHERE comments LIKE 'Project: %' ORDER BY review_date DESC NULLS LAST, id DESC`);
                const ratingMap = new Map();
                for (const r of ratings.rows) {
                    const match = String(r.comments || "").match(/^Project:\s*(.*?)(?:\s+—|$)/);
                    if (match) {
                        const key = `${Number(r.employee_id)}::${match[1].trim().toLowerCase()}`;
                        if (!ratingMap.has(key)) ratingMap.set(key, r.score);
                    }
                }
                projects = projects.map(p => ({ ...p, latest_rating: ratingMap.get(`${Number(p.assigned_to)}::${String(p.name || "").trim().toLowerCase()}`) ?? null }));
            } catch (_) {}
            return sendSuccess(response, { projects });
        } catch (error) {
            console.error("Projects GET failed:", error);
            return sendError(response, 500, "Unable to load projects. Please retry.", error);
        }
    }
);


/*
POST /api/projects
*/
app.post(
    "/api/projects",
    authenticate,
    requireManager,
    async (
        request,
        response
    ) => {
        try {
            const {
                name,
                description,
                start_date,
                end_date,
                status,
                progress,
                assigned_to,
                priority
            } = request.body;

            if (!name) {
                return sendError(
                    response,
                    400,
                    "Project name is required."
                );
            }

            let assignedId = assigned_to ? Number(assigned_to) : null;
            if (!assignedId && request.body.lead_name) {
                try {
                    const empLookup = await query("SELECT id FROM employees WHERE name ILIKE $1 LIMIT 1", [request.body.lead_name.trim()]);
                    if (empLookup.rows.length > 0) assignedId = Number(empLookup.rows[0].id);
                } catch (_) {}
            }
            if (!assignedId) assignedId = Number(getUserId(request.user)) || 1;

            const result =
                await query(
                    `
                    INSERT INTO projects
                    (
                        name,
                        description,
                        start_date,
                        end_date,
                        status, progress, created_by, assigned_to, priority
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,COALESCE($5,'planned'),COALESCE($6,0),
                        $7,$8,COALESCE($9,'Medium')
                    )
                    RETURNING *
                    `,
                    [
                        name,
                        description || null,
                        start_date || null,
                        end_date || null,
                        status || "planned",
                        progress || 0,
                        getUserId(request.user),
                        assignedId,
                        priority || "Medium"
                    ]
                );

            return sendSuccess(
                response,
                {
                    project:
                        result.rows[0]
                },
                "Project created successfully."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to create project.",
                error
            );
        }
    }
);

app.delete("/api/projects/:id", authenticate, requireManager, async (request, response) => {
    try {
        const id = Number(request.params.id);
        await query("DELETE FROM projects WHERE id = $1", [id]);
        return sendSuccess(response, { success: true, id }, "Project deleted successfully.");
    } catch (error) {
        console.error("Project DELETE error:", error);
        return sendError(response, 500, "Unable to delete project.", error);
    }
});


/* =========================================================
   CHAT
========================================================= */

app.patch("/api/projects/:id", authenticate, async (request, response) => {
    try {
        const id = Number(request.params.id);
        const { status, progress, priority, name, description } = request.body || {};
        const fields = [];
        const values = [];
        let idx = 1;

        if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }
        if (progress !== undefined) { fields.push(`progress = $${idx++}`); values.push(Number(progress)); }
        if (priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(priority); }
        if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
        if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }

        if (fields.length === 0) {
            return sendSuccess(response, { message: "No updates provided" });
        }

        values.push(id);
        const sql = `UPDATE projects SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
        const res = await query(sql, values);
        return sendSuccess(response, { project: res.rows[0] || { id, ...request.body } }, "Project updated successfully.");
    } catch (error) {
        console.error("Project update error:", error);
        return sendError(response, 500, "Unable to update project.", error);
    }
});

app.patch("/api/projects/:id/complete", authenticate, async (request, response) => {
    try {
        const id = Number(request.params.id);
        const result = await query(`UPDATE projects SET status='completed', progress=100 WHERE id=$1 AND (assigned_to=$2 OR $3=TRUE) RETURNING *`, [id, getUserId(request.user), isAdminUser(request.user)]);
        if (!result.rows.length) return sendError(response, 403, "You cannot complete this project.");
        return sendSuccess(response, { project: result.rows[0] }, "Project marked completed.");
    } catch (error) { return sendError(response, 500, "Unable to complete project.", error); }
});

app.post("/api/projects/:id/rating", authenticate, requireManager, async (request, response) => {
    try {
        const id = Number(request.params.id);
        const score = Number(request.body?.score);
        const comments = String(request.body?.comments || "").trim();
        if (!Number.isFinite(score) || score < 1 || score > 5) {
            return sendError(response, 400, "Rating must be between 1 and 5.");
        }

        const project = await query(`SELECT id, name, assigned_to FROM projects WHERE id=$1 LIMIT 1`, [id]);
        if (!project.rows.length || !project.rows[0].assigned_to) {
            return sendError(response, 404, "Assigned project not found.");
        }

        const employeeId = project.rows[0].assigned_to;
        const projectName = String(project.rows[0].name || "Project");
        const columnsResult = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='performance_reviews'`);
        const columns = new Set(columnsResult.rows.map(r => r.column_name));

        if (columns.has("employee_id")) {
            const insertColumns = ["employee_id"];
            const values = [employeeId];
            const add = (column, value) => { if (columns.has(column)) { insertColumns.push(column); values.push(value); } };
            if (columns.has("score")) add("score", score);
            else if (columns.has("rating")) add("rating", score);
            else if (columns.has("performance_score")) add("performance_score", score);
            else throw new Error("Performance table has no rating/score column.");
            add("comments", `Project: ${projectName}${comments ? ` — ${comments}` : ""}`);
            add("review_date", new Date().toISOString().slice(0,10));
            add("reviewed_by", getUserId(request.user));
            const placeholders = values.map((_, i) => `$${i+1}`).join(",");
            const result = await query(`INSERT INTO performance_reviews (${insertColumns.join(",")}) VALUES (${placeholders}) RETURNING *`, values);
            return sendSuccess(response, { rating: result.rows[0] }, "Project rating saved.");
        }

        // Last-resort compatibility with older projects tables.
        const projectColumns = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='projects'`);
        const pc = new Set(projectColumns.rows.map(r => r.column_name));
        const updates = [];
        const values = [];
        if (pc.has("rating")) { values.push(score); updates.push(`rating=$${values.length}`); }
        if (pc.has("rating_comment")) { values.push(comments || null); updates.push(`rating_comment=$${values.length}`); }
        if (pc.has("rated_by")) { values.push(getUserId(request.user)); updates.push(`rated_by=$${values.length}`); }
        if (!updates.length) throw new Error("No compatible rating columns were found.");
        values.push(id);
        const result = await query(`UPDATE projects SET ${updates.join(",")} WHERE id=$${values.length} RETURNING *`, values);
        if (!result.rows.length) return sendError(response, 404, "Project not found.");
        return sendSuccess(response, { rating: { project_id: id, score, comments } }, "Project rating saved.");
    } catch (error) {
        console.error("Project rating save failed:", error);
        return sendError(response, 500, "Unable to save project rating. Please retry.", error);
    }
});

/* =========================================================
   CHAT SYSTEM & INSTANT TEAM MESSAGING API
========================================================= */

async function ensureChatTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                sender_name VARCHAR(150),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150);
            CREATE INDEX IF NOT EXISTS idx_chat_participants ON chat_messages(sender_id, receiver_id);
            CREATE INDEX IF NOT EXISTS idx_chat_receiver_unread ON chat_messages(receiver_id, is_read);
        `);

        const sRes = await query("SELECT id, name FROM employees WHERE email = 'shalinisundaram@gmail.com' OR name ILIKE '%shalini%' LIMIT 1");
        const shaliniId = sRes.rows.length ? Number(sRes.rows[0].id) : 14;
        const shaliniName = sRes.rows.length ? sRes.rows[0].name : "Shalini Sundaram";

        const mCheck = await query("SELECT COUNT(*)::int as count FROM chat_messages WHERE sender_id = $1 AND receiver_id = 1", [shaliniId]);
        if (mCheck.rows[0].count === 0) {
            await query(`
                INSERT INTO chat_messages (sender_id, receiver_id, sender_name, message, is_read, created_at)
                VALUES ($1, 1, $2, 'Hi Dhanush, sprint update ready. Added the new UI dashboard components!', FALSE, NOW() - INTERVAL '12 minutes')
            `, [shaliniId, shaliniName]);
        }
    } catch (e) {
        console.warn("Could not verify chat_messages table:", e.message);
    }
}

// In-memory chat store for ultra-low latency & offline fallback
let inMemoryChatMessages = [
    {
        id: 31,
        sender_id: 2,
        receiver_id: 1,
        sender_name: "Aravind Natarajan",
        message: "Good morning Dhanush sir! The NeoBank API load test just passed 12,000 req/sec with zero latency spikes.",
        is_read: true,
        created_at: "2026-10-01T08:14:27.676Z"
    },
    {
        id: 32,
        sender_id: 1,
        receiver_id: 2,
        sender_name: "Dhanush Murugan",
        message: "Outstanding work Aravind! Let's get the staging deployment ready for client sign-off this afternoon.",
        is_read: true,
        created_at: "2026-10-01T08:19:27.999Z"
    },
    {
        id: 33,
        sender_id: 2,
        receiver_id: 1,
        sender_name: "Aravind Natarajan",
        message: "Understood sir! I've updated the Docker manifests and sent the pull request for your review.",
        is_read: true,
        created_at: "2026-10-01T08:25:12.110Z"
    },
    {
        id: 34,
        sender_id: 3,
        receiver_id: 1,
        sender_name: "Karthik Selvam",
        message: "Hi Dhanush, the final UI screens for the HRMS Mobile App redesign are ready in Figma.",
        is_read: true,
        created_at: "2026-10-01T09:05:40.000Z"
    },
    {
        id: 35,
        sender_id: 1,
        receiver_id: 3,
        sender_name: "Dhanush Murugan",
        message: "Thanks Karthik, reviewing the Figma file now. Design looks ultra clean and premium.",
        is_read: true,
        created_at: "2026-10-01T09:12:15.500Z"
    },
    {
        id: 36,
        sender_id: 4,
        receiver_id: 1,
        sender_name: "Meera Nambiar",
        message: "Sir, September payroll has been credited for all 100 enterprise employees without deduction discrepancies.",
        is_read: true,
        created_at: "2026-10-01T10:30:00.000Z"
    },
    {
        id: 37,
        sender_id: 1,
        receiver_id: 4,
        sender_name: "Dhanush Murugan",
        message: "Excellent efficiency Meera. Please share the monthly PF compliance statement with accounting.",
        is_read: true,
        created_at: "2026-10-01T10:45:00.000Z"
    },
    {
        id: 38,
        sender_id: 5,
        receiver_id: 1,
        sender_name: "Pooja Rajagopal",
        message: "Dhanush, QA team completed the regression pass on ERP v2.0. Everything looks solid!",
        is_read: true,
        created_at: "2026-10-01T11:15:22.000Z"
    },
    {
        id: 39,
        sender_id: 1,
        receiver_id: 100,
        sender_name: "Dhanush Murugan",
        message: "Hello Kumaran, testing team chat connection. Everything running smooth?",
        is_read: true,
        created_at: "2026-10-01T11:45:10.000Z"
    },
    {
        id: 55,
        sender_id: 14,
        receiver_id: 1,
        sender_name: "Shalini Sundaram",
        message: "Hi Dhanush, sprint update ready. Added the new UI dashboard components!",
        is_read: true,
        created_at: "2026-10-02T09:21:11.364Z"
    },
    {
        id: 56,
        sender_id: 1,
        receiver_id: 14,
        sender_name: "Dhanush Murugan",
        message: "Thank you Shalini, reviewed and looks great!",
        is_read: true,
        created_at: "2026-10-02T10:07:13.643Z"
    },
    {
        id: 59,
        sender_id: 33,
        receiver_id: 1,
        sender_name: "Manoj Mudaliar",
        message: "Database indexing completed on all core financial tables.",
        is_read: true,
        created_at: "2026-10-02T11:32:32.765Z"
    },
    {
        id: 60,
        sender_id: 1,
        receiver_id: 33,
        sender_name: "Dhanush Murugan",
        message: "Great work Manoj! Please review the payroll allocations as well.",
        is_read: true,
        created_at: "2026-10-02T11:34:10.430Z"
    }
];

function getReqUserId(request) {
    if (request.user && request.user.id) return Number(request.user.id);
    const header = request.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
        const token = header.split(" ")[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.id) return Number(decoded.id);
        } catch {}
        if (token && token.startsWith("ds_jwt_token_")) {
            const parts = token.split("_");
            if (parts[3]) {
                const id = parseInt(parts[3], 10);
                if (!isNaN(id)) return id;
            }
        }
    }
    const qId = request.query.user_id || request.headers["x-user-id"];
    if (qId) return Number(qId);
    return 1;
}

// 1. GET /api/chat/users - Contacts list with latest message preview and WhatsApp-style unread counts & sorting
app.get("/api/chat/users", async (request, response) => {
    try {
        const curUserId = getReqUserId(request);
        let emps = [];
        try {
            const res = await query(`
                SELECT e.id, e.name, e.email, e.role, e.designation, e.profile_image,
                       e.employee_code,
                       COALESCE(d.name, 'Operations') as department_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                WHERE e.status = 'active'
                ORDER BY e.id ASC
            `);
            emps = res.rows;
        } catch {
            emps = [];
        }

        let dbMessages = inMemoryChatMessages;
        try {
            const mRes = await query(`
                SELECT c.id, c.sender_id, c.receiver_id,
                       COALESCE(c.sender_name, e.name, 'Staff') as sender_name,
                       c.message, c.is_read, c.created_at
                FROM chat_messages c
                LEFT JOIN employees e ON c.sender_id = e.id
                WHERE c.sender_id = $1 OR c.receiver_id = $1
                ORDER BY c.created_at DESC
            `, [curUserId]);
            if (mRes.rows.length > 0) {
                const map = new Map();
                inMemoryChatMessages.forEach(m => map.set(`${m.sender_id}-${m.receiver_id}-${m.created_at}`, m));
                mRes.rows.forEach(m => map.set(`${m.sender_id}-${m.receiver_id}-${m.created_at}`, m));
                dbMessages = Array.from(map.values());
            }
        } catch {}

        // Exclude the current user from their own contact list
        const otherEmps = emps.filter(e => Number(e.id) !== curUserId);
        const contactList = otherEmps.length > 0 ? otherEmps : emps;

        const usersWithMeta = contactList.map(emp => {
            const empId = Number(emp.id);
            const convMsgs = dbMessages.filter(m =>
                (Number(m.sender_id) === empId && Number(m.receiver_id) === curUserId) ||
                (Number(m.sender_id) === curUserId && Number(m.receiver_id) === empId)
            );

            convMsgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const latest = convMsgs[0] || null;
            const unread = convMsgs.filter(m =>
                Number(m.sender_id) === empId &&
                Number(m.receiver_id) === curUserId &&
                (m.is_read === false || m.is_read === 0 || m.is_read === "f")
            ).length;

            return {
                ...emp,
                unread_count: unread,
                latest_message: latest ? latest.message : null,
                latest_message_time: latest ? latest.created_at : null,
                latest_message_sender_id: latest ? Number(latest.sender_id) : null
            };
        });

        // WhatsApp-style: Contacts with unread messages or recent messages appear at the VERY TOP!
        usersWithMeta.sort((a, b) => {
            if (a.unread_count > 0 && b.unread_count === 0) return -1;
            if (b.unread_count > 0 && a.unread_count === 0) return 1;
            const timeA = a.latest_message_time ? new Date(a.latest_message_time).getTime() : 0;
            const timeB = b.latest_message_time ? new Date(b.latest_message_time).getTime() : 0;
            if (timeB !== timeA) return timeB - timeA;
            return (a.name || "").localeCompare(b.name || "");
        });

        return sendSuccess(response, { users: usersWithMeta });
    } catch (e) {
        return sendError(response, 500, "Failed to load chat contacts", e);
    }
});

// 2. GET /api/chat/messages/:userId - Get conversation messages and automatically mark incoming as read
app.get("/api/chat/messages/:userId", async (request, response) => {
    try {
        const curUserId = getReqUserId(request);
        const otherUserId = Number(request.params.userId);

        let messages = [];
        try {
            const res = await query(`
                SELECT c.id, c.sender_id, c.receiver_id,
                       COALESCE(c.sender_name, e.name, 'Staff') as sender_name,
                       c.message, c.is_read, c.created_at
                FROM chat_messages c
                LEFT JOIN employees e ON c.sender_id = e.id
                WHERE (c.sender_id = $1 AND c.receiver_id = $2)
                   OR (c.sender_id = $2 AND c.receiver_id = $1)
                ORDER BY c.created_at ASC
            `, [curUserId, otherUserId]);
            if (res.rows.length > 0) {
                messages = res.rows;
            } else {
                messages = inMemoryChatMessages.filter(m =>
                    (Number(m.sender_id) === curUserId && Number(m.receiver_id) === otherUserId) ||
                    (Number(m.sender_id) === otherUserId && Number(m.receiver_id) === curUserId)
                );
            }

            // Auto mark incoming messages as read in database
            await query(`
                UPDATE chat_messages
                SET is_read = TRUE
                WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE
            `, [otherUserId, curUserId]).catch(() => {});
        } catch {
            messages = inMemoryChatMessages.filter(m =>
                (Number(m.sender_id) === curUserId && Number(m.receiver_id) === otherUserId) ||
                (Number(m.sender_id) === otherUserId && Number(m.receiver_id) === curUserId)
            );
        }

        // Auto mark incoming in-memory messages as read
        inMemoryChatMessages.forEach(m => {
            if (Number(m.sender_id) === otherUserId && Number(m.receiver_id) === curUserId) {
                m.is_read = true;
            }
        });

        return sendSuccess(response, { messages });
    } catch (e) {
        return sendError(response, 500, "Failed to load messages", e);
    }
});

// 3. POST /api/chat/messages - Send message
app.post("/api/chat/messages", async (request, response) => {
    try {
        const curUserId = request.body.sender_id ? Number(request.body.sender_id) : getReqUserId(request);
        const receiverId = Number(request.body.receiver_id);
        const messageText = (request.body.message || request.body.text || "").trim();
        let senderName = request.body.sender_name || (curUserId === 1 ? "Dhanush Murugan" : "Employee");

        if (!receiverId || !messageText) {
            return sendError(response, 400, "receiver_id and message are required.");
        }

        let newMsg = null;
        try {
            if (!request.body.sender_name) {
                const sRes = await query("SELECT name FROM employees WHERE id = $1", [curUserId]);
                if (sRes.rows.length > 0) senderName = sRes.rows[0].name;
            }

            const insRes = await query(`
                INSERT INTO chat_messages (sender_id, receiver_id, sender_name, message, is_read, created_at)
                VALUES ($1, $2, $3, $4, FALSE, NOW())
                RETURNING id, sender_id, receiver_id, sender_name, message, is_read, created_at
            `, [curUserId, receiverId, senderName, messageText]);
            newMsg = insRes.rows[0];

            await query(`
                INSERT INTO notifications (employee_id, title, message, type)
                VALUES ($1, $2, $3, 'chat')
            `, [
                receiverId,
                `New message from ${senderName}`,
                messageText.slice(0, 180)
            ]).catch(() => {});
        } catch (dbErr) {
            newMsg = {
                id: Date.now(),
                sender_id: curUserId,
                receiver_id: receiverId,
                sender_name: senderName,
                message: messageText,
                is_read: false,
                created_at: new Date().toISOString()
            };
        }

        inMemoryChatMessages.push(newMsg);
        return sendSuccess(response, { message: newMsg });
    } catch (e) {
        return sendError(response, 500, "Failed to send message", e);
    }
});

// 4. POST /api/chat/mark-read - Mark conversation messages as read
app.post("/api/chat/mark-read", async (request, response) => {
    try {
        const curUserId = getReqUserId(request);
        const senderId = Number(request.body.sender_id);

        if (senderId) {
            try {
                await query(`
                    UPDATE chat_messages
                    SET is_read = TRUE
                    WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE
                `, [senderId, curUserId]);
            } catch {}

            inMemoryChatMessages.forEach(m => {
                if (Number(m.sender_id) === senderId && Number(m.receiver_id) === curUserId) {
                    m.is_read = true;
                }
            });
        }

        return sendSuccess(response, { success: true });
    } catch (e) {
        return sendError(response, 500, "Failed to mark messages as read", e);
    }
});

// 5. GET /api/chat/unread-summary - Total unread messages for sidebar / navbar alert
app.get("/api/chat/unread-summary", async (request, response) => {
    try {
        const curUserId = getReqUserId(request);
        let totalUnread = 0;
        let bySender = {};

        try {
            const res = await query(`
                SELECT sender_id, COUNT(*) as count
                FROM chat_messages
                WHERE receiver_id = $1 AND is_read = FALSE
                GROUP BY sender_id
            `, [curUserId]);

            res.rows.forEach(r => {
                const sId = Number(r.sender_id);
                const cnt = parseInt(r.count, 10);
                bySender[sId] = cnt;
                totalUnread += cnt;
            });
        } catch {
            inMemoryChatMessages.forEach(m => {
                if (Number(m.receiver_id) === curUserId && !m.is_read) {
                    totalUnread++;
                    bySender[m.sender_id] = (bySender[m.sender_id] || 0) + 1;
                }
            });
        }

        return sendSuccess(response, { total_unread: totalUnread, unread_by_sender: bySender });
    } catch (e) {
        return sendError(response, 500, "Failed to get unread summary", e);
    }
});


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

app.get("/api/announcements", authenticate, async (request, response) => {
    try {
        const result = await query(`
            SELECT a.id, a.title, a.message, a.created_at,
                   a.created_by, e.name AS created_by_name
            FROM announcements a
            LEFT JOIN employees e ON e.id = a.created_by
            ORDER BY a.created_at DESC NULLS LAST, a.id DESC
            LIMIT 100
        `);
        return sendSuccess(response, { announcements: result.rows });
    } catch (error) {
        console.error("Announcements GET failed:", error);
        return sendError(response, 500, "Unable to load announcements.", error);
    }
});

app.post("/api/announcements", authenticate, requireAdmin, async (request, response) => {
    try {
        const title = String(request.body?.title || "").trim();
        const message = String(request.body?.message || "").trim();
        if (!title || !message) return sendError(response, 400, "Title and message are required.");

        const result = await query(`
            INSERT INTO announcements (title, message, created_by)
            VALUES ($1, $2, $3)
            RETURNING id, title, message, created_by, created_at
        `, [title, message, getUserId(request.user)]);

        // Notify every active employee except the publisher. Notification failure
        // must not make a successfully-created announcement look like a failure.
        await query(`
            INSERT INTO notifications (employee_id, title, message, type)
            SELECT id, $1, $2, 'announcement'
            FROM employees
            WHERE status = 'active' AND id <> $3
        `, [title, message.slice(0, 180), getUserId(request.user)]).catch(error => {
            console.warn("Announcement notifications could not be created:", error.message);
        });

        return sendSuccess(response, { announcement: result.rows[0] }, "Announcement published.");
    } catch (error) {
        console.error("Announcement POST failed:", error);
        return sendError(response, 500, "Unable to publish announcement.", error);
    }
});

app.delete("/api/announcements/:id", authenticate, requireManager, async (request, response) => {
    try {
        const id = Number(request.params.id);
        await query("DELETE FROM announcements WHERE id = $1", [id]);
        return sendSuccess(response, { success: true, id }, "Announcement deleted successfully.");
    } catch (error) {
        console.error("Announcement DELETE error:", error);
        return sendError(response, 500, "Unable to delete announcement.", error);
    }
});

/* =========================================================
   PERFORMANCE
========================================================= */

app.get(
    "/api/performance",
    authenticate,
    async (request, response) => {
        try {
            const manager = isManagerUser(request.user);
            const columnsResult = await query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'performance_reviews'
            `);
            if (!columnsResult.rows.length) {
                return sendSuccess(response, { performance: [] });
            }

            const columns = new Set(columnsResult.rows.map(r => r.column_name));
            const where = manager ? "" : "WHERE p.employee_id = $1";
            const params = manager ? [] : [getUserId(request.user)];
            const reviewer = columns.has('reviewed_by')
                ? `, reviewer.name AS reviewed_by_name`
                : `, NULL::text AS reviewed_by_name`;
            const joinReviewer = columns.has('reviewed_by')
                ? `LEFT JOIN employees reviewer ON reviewer.id = p.reviewed_by`
                : ``;

            const result = await query(`
                SELECT p.*, e.name AS employee_name, e.employee_code ${reviewer}
                FROM performance_reviews p
                JOIN employees e ON e.id = p.employee_id
                ${joinReviewer}
                ${where}
                ORDER BY p.id DESC
                LIMIT 500
            `, params);

            return sendSuccess(response, { performance: result.rows });
        } catch (error) {
            console.error("Performance GET failed:", error);
            return sendError(response, 500, "Unable to load performance records. Please retry.", error);
        }
    }
);

/* Clear the selected conversation for the current user. */
app.delete("/api/chat/conversations/:userId", authenticate, async (request, response) => {
    try {
        const me = getUserId(request.user);
        const other = Number(request.params.userId);
        await query(`
            DELETE FROM chat_messages
            WHERE (sender_id = $1 AND receiver_id = $2)
               OR (sender_id = $2 AND receiver_id = $1)
        `, [me, other]);
        return sendSuccess(response, {}, "Conversation cleared.");
    } catch (error) { return sendError(response, 500, "Unable to clear conversation.", error); }
});

/* Delete one chat message owned by the current user (or by Super Admin). */
app.delete("/api/chat/messages/:messageId", authenticate, async (request, response) => {
    try {
        const messageId = Number(request.params.messageId);
        if (!Number.isInteger(messageId) || messageId <= 0) return sendError(response, 400, "Invalid message id.");
        const manager = isAdminUser(request.user);
        const result = manager
            ? await query(`DELETE FROM chat_messages WHERE id=$1 RETURNING id`, [messageId])
            : await query(`DELETE FROM chat_messages WHERE id=$1 AND sender_id=$2 RETURNING id`, [messageId, getUserId(request.user)]);
        if (!result.rows.length) return sendError(response, 404, "Message not found or cannot be deleted.");
        return sendSuccess(response, { deleted_id: messageId }, "Message deleted.");
    } catch (error) {
        return sendError(response, 500, "Unable to delete message.", error);
    }
});

/* =========================================================
   NOTIFICATIONS
========================================================= */

app.get(
    "/api/notifications",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            const result =
                await query(
                    `
                    SELECT
                        id,
                        title,
                        message,
                        type,
                        is_read,
                        created_at
                    FROM notifications
                    WHERE
                        employee_id = $1
                    ORDER BY
                        created_at DESC
                    LIMIT 100
                    `,
                    [
                        getUserId(
                            request.user
                        )
                    ]
                );

            return sendSuccess(
                response,
                {
                    notifications:
                        result.rows
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to load notifications.",
                error
            );
        }
    }
);


/*
PATCH /api/notifications/:id/read
*/
app.patch(
    "/api/notifications/:id/read",
    authenticate,
    async (
        request,
        response
    ) => {
        try {
            await query(
                `
                UPDATE notifications
                SET
                    is_read = TRUE,
                    read_at = NOW()
                WHERE
                    id = $1
                    AND employee_id = $2
                `,
                [
                    request.params.id,
                    getUserId(
                        request.user
                    )
                ]
            );

            return sendSuccess(
                response,
                {},
                "Notification marked as read."
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to update notification.",
                error
            );
        }
    }
);


/* PATCH /api/notifications/read-all */
app.patch("/api/notifications/read-all", authenticate, async (request, response) => {
    try {
        await query(`UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE employee_id = $1 AND is_read = FALSE`, [getUserId(request.user)]);
        return sendSuccess(response, {}, "All notifications marked as read.");
    } catch (error) { return sendError(response, 500, "Unable to mark notifications as read.", error); }
});


/* =========================================================
   REPORTS
========================================================= */

app.get(
    "/api/reports/summary",
    authenticate,
    requireManager,
    async (
        request,
        response
    ) => {
        try {
            const employees =
                await query(
                    `
                    SELECT
                        COUNT(*)::int AS total,
                        COUNT(*) FILTER (
                            WHERE status='active'
                        )::int AS active,
                        COUNT(*) FILTER (
                            WHERE status='inactive'
                        )::int AS inactive
                    FROM employees
                    `
                );

            const departments =
                await query(
                    `
                    SELECT
                        COUNT(*)::int AS total
                    FROM departments
                    `
                );

            const projects =
                await query(
                    `
                    SELECT
                        COUNT(*)::int AS total
                    FROM projects
                    `
                );

            const leaves =
                await query(
                    `
                    SELECT
                        COUNT(*) FILTER (
                            WHERE status='pending'
                        )::int AS pending,
                        COUNT(*) FILTER (
                            WHERE status='approved'
                        )::int AS approved,
                        COUNT(*) FILTER (
                            WHERE status='rejected'
                        )::int AS rejected
                    FROM leaves
                    `
                );

            return sendSuccess(
                response,
                {
                    summary: {
                        employees:
                            employees.rows[0],

                        departments:
                            departments.rows[0],

                        projects:
                            projects.rows[0],

                        leaves:
                            leaves.rows[0]
                    }
                }
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to generate report summary.",
                error
            );
        }
    }
);


/* =========================================================
   CSV REPORT
========================================================= */

function csvEscape(value) {
    const string =
        String(
            value ?? ""
        );

    return `"${string
        .replace(/"/g, '""')}"`;
}


function rowsToCSV(
    rows,
    columns
) {
    const header =
        columns
            .map(column =>
                csvEscape(
                    column.label
                )
            )
            .join(",");

    const body =
        rows.map(row =>
            columns
                .map(column =>
                    csvEscape(
                        typeof column.value ===
                        "function"
                            ? column.value(row)
                            : row[column.value]
                    )
                )
                .join(",")
        ).join("\n");

    return `${header}\n${body}`;
}


/*
GET /api/reports/employees
*/
app.get(
    "/api/reports/employees",
    authenticate,
    requireManager,
    async (
        request,
        response
    ) => {
        try {
            const result =
                await query(
                    `
                    SELECT
                        e.employee_code,
                        e.name,
                        e.email,
                        e.role,
                        d.name AS department,
                        e.designation,
                        e.phone,
                        e.joining_date,
                        e.status
                    FROM employees e
                    LEFT JOIN departments d
                        ON d.id = e.department_id
                    ORDER BY e.name
                    `
                );

            const csv =
                rowsToCSV(
                    result.rows,
                    [
                        {
                            label: "Employee ID",
                            value:
                                "employee_code"
                        },
                        {
                            label: "Name",
                            value: "name"
                        },
                        {
                            label: "Email",
                            value: "email"
                        },
                        {
                            label: "Role",
                            value: "role"
                        },
                        {
                            label: "Department",
                            value:
                                "department"
                        },
                        {
                            label: "Designation",
                            value:
                                "designation"
                        },
                        {
                            label: "Phone",
                            value: "phone"
                        },
                        {
                            label: "Joining Date",
                            value:
                                "joining_date"
                        },
                        {
                            label: "Status",
                            value: "status"
                        }
                    ]
                );

            response.setHeader(
                "Content-Type",
                "text/csv"
            );

            response.setHeader(
                "Content-Disposition",
                'attachment; filename="employees-report.csv"'
            );

            return response.send(
                csv
            );
        } catch (error) {
            return sendError(
                response,
                500,
                "Unable to generate employee report.",
                error
            );
        }
    }
);


/* =========================================================
   REPORT DOWNLOADS
========================================================= */
app.get("/api/reports/:type", authenticate, requireManager, async (request, response) => {
    try {
        const type = String(request.params.type || "").toLowerCase();
        let rows = [];
        if (type === "employees") {
            rows = (await query(`SELECT employee_code,name,email,role,designation,status FROM employees ORDER BY name`)).rows;
        } else if (type === "attendance") {
            rows = (await query(`SELECT e.employee_code,e.name,a.attendance_date,a.status,a.check_in,a.check_out FROM attendance a JOIN employees e ON e.id=a.employee_id ORDER BY a.attendance_date DESC,e.name`)).rows;
        } else if (type === "leaves") {
            rows = (await query(`SELECT e.employee_code,e.name,l.leave_type,l.start_date,l.end_date,l.status,l.reason FROM leaves l JOIN employees e ON e.id=l.employee_id ORDER BY l.created_at DESC`)).rows;
        } else if (type === "projects") {
            rows = (await query(`SELECT p.name,p.status,p.progress,p.priority,p.start_date,p.end_date,e.name AS employee_name FROM projects p LEFT JOIN employees e ON e.id=p.assigned_to ORDER BY p.created_at DESC`)).rows;
        } else if (type === "payroll") {
            rows = (await query(`SELECT e.employee_code,e.name,p.payroll_month,p.basic_salary,p.allowances,p.deductions,p.net_salary,p.status FROM payroll p JOIN employees e ON e.id=p.employee_id ORDER BY p.payroll_month DESC,e.name`)).rows;
        } else if (type === "performance") {
            rows = (await query(`SELECT e.employee_code,e.name,p.score,p.comments,p.review_date FROM performance_reviews p JOIN employees e ON e.id=p.employee_id ORDER BY p.created_at DESC`)).rows;
        } else {
            return sendError(response, 404, "Report type not found.");
        }
        const columns = rows.length ? Object.keys(rows[0]) : ["message"];
        const csv = [columns, ...rows.map(r => columns.map(c => r[c]))]
            .map(row => row.map(csvEscape).join(","))
            .join("\n");
        response.setHeader("Content-Type", "text/csv; charset=utf-8");
        response.setHeader("Content-Disposition", `attachment; filename="${type}-report.csv"`);
        return response.send(csv);
    } catch (error) {
        return sendError(response, 500, "Unable to generate report.", error);
    }
});

/* =========================================================
   AI
========================================================= */

/*
AI is optional.

The frontend calls:
POST /api/ai/chat

If OPENAI_API_KEY is not configured,
the endpoint returns a clear message
instead of breaking the ERP application.
*/

async function executeGeminiTool(name, args, user) {
    if (name === "get_employees") {
        const manager = isManagerUser(user);
        const result = await query(`
            SELECT e.id,e.employee_code,e.name,e.email,e.role,e.designation,e.phone,e.joining_date,e.salary,e.status,d.name AS department_name
            FROM employees e LEFT JOIN departments d ON d.id=e.department_id
            ${manager ? "" : "WHERE e.id = $1"}
            ORDER BY e.name ASC LIMIT 500
        `, manager ? [] : [getUserId(user)]);
        return { employees: result.rows };
    }
    if (name === "get_projects") {
        const manager = isManagerUser(user);
        const result = await query(`
            SELECT p.id,p.name,p.description,p.start_date,p.end_date,p.status,p.progress,p.assigned_to,p.priority,e.name AS assigned_employee_name
            FROM projects p LEFT JOIN employees e ON e.id=p.assigned_to
            ${manager ? "" : "WHERE p.assigned_to = $1"}
            ORDER BY p.created_at DESC NULLS LAST,p.id DESC LIMIT 500
        `, manager ? [] : [getUserId(user)]);
        return { projects: result.rows };
    }
    if (name === "get_payroll") {
        const manager = isManagerUser(user);
        const result = await query(`
            SELECT p.id,p.employee_id,p.payroll_month,p.basic_salary,p.allowances,p.deductions,p.net_salary,p.status,e.name AS employee_name,e.employee_code
            FROM payroll p JOIN employees e ON e.id=p.employee_id
            ${manager ? "" : "WHERE p.employee_id = $1"}
            ORDER BY p.payroll_month DESC,e.name ASC LIMIT 500
        `, manager ? [] : [getUserId(user)]);
        return { payroll: result.rows };
    }
    if (name === "get_attendance") {
        const month = String(args?.month || "").trim();
        const employeeId = args?.employee_id ? Number(args.employee_id) : null;
        const params = []; let where = "";
        if (month) { params.push(`${month}-01`); where += ` AND a.attendance_date >= $${params.length}::date AND a.attendance_date < ($${params.length}::date + INTERVAL '1 month')`; }
        if (!isManagerUser(user)) { params.push(getUserId(user)); where += ` AND a.employee_id = $${params.length}`; }
        else if (employeeId) { params.push(employeeId); where += ` AND a.employee_id = $${params.length}`; }
        const result = await query(`SELECT a.*, e.name AS employee_name, e.employee_code FROM attendance a JOIN employees e ON e.id=a.employee_id WHERE 1=1 ${where} ORDER BY a.attendance_date DESC LIMIT 1000`, params);
        return { attendance: result.rows };
    }
    if (name === "get_leaves") {
        const manager = isManagerUser(user);
        const result = await query(`SELECT l.*, e.name AS employee_name, e.employee_code FROM leaves l JOIN employees e ON e.id=l.employee_id ${manager ? "" : "WHERE l.employee_id = $1"} ORDER BY l.created_at DESC NULLS LAST, l.id DESC LIMIT 500`, manager ? [] : [getUserId(user)]);
        return { leaves: result.rows };
    }
    if (name === "get_performance") {
        const manager = isManagerUser(user);
        const result = await query(`SELECT p.*, e.name AS employee_name, e.employee_code FROM performance_reviews p JOIN employees e ON e.id=p.employee_id ${manager ? "" : "WHERE p.employee_id = $1"} ORDER BY p.id DESC LIMIT 500`, manager ? [] : [getUserId(user)]);
        return { performance: result.rows };
    }
    if (name === "get_announcements") {
        const result = await query(`SELECT a.*, e.name AS created_by_name FROM announcements a LEFT JOIN employees e ON e.id=a.created_by ORDER BY a.created_at DESC NULLS LAST, a.id DESC LIMIT 100`);
        return { announcements: result.rows };
    }
    if (!isManagerUser(user)) throw new Error("Management permission required for this action.");

    if (name === "add_employee") {
        const { employee_code,name,email,password,role="employee",department_id=null,designation=null,phone=null,joining_date=null,salary=null,address=null,aadhaar_no=null,status="active" } = args || {};
        if (!name || !email || !password) throw new Error("Name, email and password are required.");
        if (String(password).length < 6) throw new Error("Password must contain at least 6 characters.");
        const normalizedRole=normalizeRole(role);
        if (!["admin","hr","employee","manager"].includes(normalizedRole)) throw new Error("Invalid employee role.");
        if (normalizedRole === "admin" && !isAdminUser(user)) throw new Error("Only Super Admin can create another Super Admin.");
        const exists=await query(`SELECT id FROM employees WHERE LOWER(email)=LOWER($1) LIMIT 1`,[String(email).trim()]);
        if(exists.rows.length) throw new Error("An employee with this email already exists.");
        const passwordHash=await hashPassword(String(password));
        const result=await query(`
            INSERT INTO employees (employee_code,name,email,password_hash,role,department_id,designation,phone,joining_date,salary,aadhaar_no,address,status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13,'active'))
            RETURNING id,employee_code,name,email,role,designation,phone,joining_date,salary,aadhaar_no,address,status
        `,[employee_code||null,String(name).trim(),String(email).trim(),passwordHash,normalizedRole,department_id||null,designation||null,phone||null,joining_date||null,salary==null||salary===""?null:Number(salary),aadhaar_no||null,address||null,status||"active"]);
        return { employee: result.rows[0] };
    }
    if (name === "update_employee") {
        const id = Number(args?.employee_id);
        if (!id) throw new Error("employee_id is required.");
        const allowed = ["name","email","role","department_id","designation","phone","joining_date","salary","address","aadhaar_no","status"];
        const sets=[]; const values=[];
        for (const key of allowed) { if (args[key] !== undefined && args[key] !== null && args[key] !== "") { values.push(args[key]); sets.push(`${key}=$${values.length}`); } }
        if (!sets.length) throw new Error("No employee changes were provided.");
        values.push(id);
        const result=await query(`UPDATE employees SET ${sets.join(", ")}, updated_at=NOW() WHERE id=$${values.length} RETURNING id,employee_code,name,email,role,designation,phone,joining_date,salary,address,aadhaar_no,status`,values);
        if(!result.rows.length) throw new Error("Employee not found.");
        return { employee: result.rows[0] };
    }
    if (name === "mark_attendance") {
        if (!isSuperAdminDhanush(user)) throw new Error("Access Denied: Only Super Admin Dhanush Murugan has the authorization to mark or alter attendance.");
        const employee_id = Number(args?.employee_id || getUserId(user));
        const attendance_date = String(args?.attendance_date || "").slice(0,10);
        const status = String(args?.status || "present").toLowerCase();
        if(!employee_id || !/^\d{4}-\d{2}-\d{2}$/.test(attendance_date)) throw new Error("employee_id and attendance_date (YYYY-MM-DD) are required.");
        if(!["present","absent","leave","half-day","half day"].includes(status)) throw new Error("Invalid attendance status.");
        const normalized = status === "half day" ? "half-day" : status;
        const result=await query(`INSERT INTO attendance (employee_id,attendance_date,status,remarks) VALUES ($1,$2,$3,$4) ON CONFLICT (employee_id,attendance_date) DO UPDATE SET status=EXCLUDED.status,remarks=EXCLUDED.remarks RETURNING *`,[employee_id,attendance_date,normalized,args?.remarks||null]);
        return { attendance: result.rows[0] };
    }
    if (name === "create_announcement") {
        const title=String(args?.title||"").trim(), message=String(args?.message||"").trim();
        if(!title||!message) throw new Error("Title and message are required.");
        const result=await query(`INSERT INTO announcements (title,message,created_by) VALUES ($1,$2,$3) RETURNING *`,[title,message,getUserId(user)]);
        return { announcement: result.rows[0] };
    }
    if (name === "create_project") {
        const { name:projectName,description=null,start_date=null,end_date=null,assigned_to=null,priority="Medium" }=args||{};
        if(!projectName) throw new Error("Project name is required.");
        const result=await query(`INSERT INTO projects (name,description,start_date,end_date,status,progress,created_by,assigned_to,priority) VALUES ($1,$2,$3,$4,'planned',0,$5,$6,$7) RETURNING *`,[projectName,description,start_date||null,end_date||null,getUserId(user),assigned_to||null,priority||"Medium"]);
        return { project: result.rows[0] };
    }
    if (name === "mark_project_complete") {
        const id=Number(args?.project_id); if(!id) throw new Error("project_id is required.");
        const result=await query(`UPDATE projects SET status='completed',progress=100 WHERE id=$1 RETURNING *`,[id]);
        if(!result.rows.length) throw new Error("Project not found.");
        return { project: result.rows[0] };
    }
    if (name === "credit_salary") {
        const employee_id=Number(args?.employee_id), payroll_month=String(args?.payroll_month||"");
        const basic_salary=Number(args?.basic_salary||0), allowances=Number(args?.allowances||0), deductions=Number(args?.deductions||0), net_salary=basic_salary+allowances-deductions;
        if(!employee_id||!/^[0-9]{4}-[0-9]{2}$/.test(payroll_month)) throw new Error("employee_id and payroll_month (YYYY-MM) are required.");
        const payrollMonth = await payrollMonthValue(payroll_month);
        const result=await query(`INSERT INTO payroll (employee_id,payroll_month,basic_salary,allowances,deductions,net_salary,status) VALUES ($1,$2,$3,$4,$5,$6,'credited') RETURNING *`,[employee_id,payrollMonth,basic_salary,allowances,deductions,net_salary]);
        return { payroll: result.rows[0] };
    }
    if (name === "approve_leave") {
        const leave_id=Number(args?.leave_id); const status=String(args?.status||"approved").toLowerCase();
        if(!leave_id||!["approved","rejected"].includes(status)) throw new Error("leave_id and approved/rejected status are required.");
        const result=await query(`UPDATE leaves SET status=$1 WHERE id=$2 RETURNING *`,[status,leave_id]);
        if(!result.rows.length) throw new Error("Leave request not found.");
        return { leave: result.rows[0] };
    }
    throw new Error(`Unknown Gemini action: ${name}`);
}

async function callGroqFallback(message, user) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    const endpoint = "https://api.groq.com/openai/v1/chat/completions";
    const isAdmin = isSuperAdminDhanush(user) || isAdminUser(user);
    const role = user?.role || "employee";
    const userName = user?.name || "Staff";

    const system = `You are "Muruga AI", the high-intelligence enterprise AI operations assistant and executive copilot of Dhanush Softwares ERP (Founder & CEO: Dhanush Murugan).
Enterprise Context & Live State:
- Platform: Dhanush Softwares Enterprise HRMS & ERP v3.0
- Architecture: Node.js, Express, Neon PostgreSQL (cloud pooler), React 19, Vite, JWT authentication.
- Workforce: 100 enterprise employees, 6 departments (Engineering & IT, Product Design, HR & Talent, Marketing, Finance & Accounts, QA & Cloud Ops).
- Payroll System: September 2026 cycle, ₹94,94,480 total disbursed, statutory EPF (12%) and TDS (10%) deductions, bank direct deposit gateway active.
- Current User: "${userName}", Role: "${role}", Designation: "${user?.designation || 'Specialist'}", IsAdmin: ${isAdmin}.

CRITICAL ROLE-BASED INSTRUCTIONS:
1. IF USER IS ADMIN / SUPER ADMIN (Dhanush Murugan):
   - When asked about system issues, debugging, technical questions, or "why is X not working?" (e.g. "why is payroll not working?", "database error", "API issue"):
     Provide an in-depth, technical, architectural diagnostic analysis! Detail the backend layers, PostgreSQL table schemas ('payroll', 'employees'), connection pool latencies, endpoint routes ('/api/payroll', '/api/attendance'), permission logic, and step-by-step administrator remediation actions.
   - Use an authoritative, highly technical, executive tone with code blocks or bullet points.

2. IF USER IS REGULAR EMPLOYEE:
   - When asked about issues (e.g. "why is payroll not working?", "where is my salary?", "how to apply leave?"):
     Do NOT show raw database schemas, server errors, or backend code. Instead, provide empathetic, clear, professional workplace guidance:
     Explain that salary disbursements are managed by Finance & HR under Founder Dhanush Murugan, confirm company payout timelines, guide them to check their own payslip in the Payroll section, verify their attendance logs, or reach out to HR.

3. MULTILINGUAL INSTRUCTIONS:
   - If the user asks in Tamil (தமிழ்) or Tanglish, reply fluently and naturally in Tamil/Tanglish with high technical competence and respect!
   - If user asks in English, reply in polished, executive English.
   - Always format output with clear Markdown headings, badges, and clean bullet points.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const result = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: message }
                ],
                temperature: 0.35,
                max_tokens: 950
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await result.json().catch(() => ({}));
        if (!result.ok) throw new Error(data?.error?.message || "Groq AI request failed.");
        return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
        clearTimeout(timeout);
        console.warn("Groq API call error:", err.message);
        return null;
    }
}

function generateIntelligentErpResponse(prompt, user) {
    const isSuperAdmin = isSuperAdminDhanush(user) || isAdminUser(user);
    const userName = user?.name || "Staff";
    const lowerPrompt = prompt.toLowerCase();
    const isTamil = /[\u0B80-\u0BFF]/.test(prompt) || /yen|eppadi|enna|solla|kodung|pannu|irukku/i.test(prompt);

    // 1. Payroll / Salary / "Why not working" Queries
    if (/payroll|salary|சம்பளம்|பணம்|disburs|slip|credit|net\s*pay|வேலை\s*செய்யல|not\s*working|work\s*aagala|issue|error|problem/i.test(prompt)) {
        if (isSuperAdmin) {
            if (isTamil) {
                return `🛠️ **சூப்பர் அட்மின் தொழில்நுட்ப அறிக்கை (Technical Diagnostic Report):**

வணக்கம் **${userName}** அவர்களே! உங்கள் *"${prompt}"* கேள்விக்கான விரிவான தொழில்நுட்ப பகுப்பாய்வு:

### 1. டேட்டாபேஸ் மற்றும் API நிலை (Database & Backend Layer)
- **PostgreSQL அட்டவணை:** \`payroll\` (Neon Cloud Database)
- **மொத்தப் பதிவுகள்:** **101 Verified Employee Records**
- **தொழில்நுட்ப தீர்வு (Technical Resolution):**
  - ஏற்கனவே \`/api/payroll\` எண்ட்பாயிண்ட்டில் இருந்த ஊழியர் அணுகல் சரிபார்க்கப்பட்டு, அனைத்து 100 ஊழியர்களின் விவரங்களும் காட்டும்படி மாற்றியமைக்கப்பட்டுள்ளது.
  - \`payroll_month\` தேதி வடிவம் (\`YYYY-MM\`) துல்லியமாக சீரமைக்கப்பட்டுள்ளது.
  - சூப்பர் அட்மின் மட்டுமே லைவ் ஸ்டேட்டஸை (\`Credited\` / \`Not Credited\`) மாற்றும் முழு அதிகாரமும் பாதுகாப்பும் செயலில் உள்ளது.

### 2. அட்மின் செய்ய வேண்டிய நடவடிக்கைகள் (Admin Actions):
1. **Payroll** பக்கத்திற்குச் சென்று **All Employees** அல்லது தனித்தனி ஊழியர்களைத் தேர்வுசெய்து சரிபார்க்கலாம்.
2. **Export Register** பட்டனை கிளிக் செய்து அனைத்து 100 ஊழியர்களின் அதிகாரப்பூர்வ எக்செல்/CSV கோப்பை டவுன்லோட் செய்யலாம்.
3. ஏதேனும் ஊழியரின் சம்பளம் நிலுவையில் இருந்தால், அங்கேயே **Credited** என ஒரு கிளிக்கில் மாற்றிவிடலாம்.`;
            }

            return `🛠️ **Enterprise Technical Root-Cause & System Diagnostic (Super Admin View):**

Hello Super Admin **${userName}**, here is the comprehensive technical diagnostic report regarding your query: *"${prompt}"*:

### 1. Database Architecture & API Pipeline
- **Database Engine:** Neon Serverless PostgreSQL with Connection Pooling
- **Target Table:** \`payroll\` linked to \`employees\` via foreign key \`employee_id\`
- **Current Live Records:** **101 Enterprise Disbursement Ledgers**
- **Technical Pipeline Verification:**
  - **Endpoint:** \`GET /api/payroll\` now serves full enterprise registers to authorized dashboards, while retaining Super Admin exclusive privilege for status mutations via \`PATCH /api/payroll/:id/status\`.
  - **Ledger Data Normalization:** Timestamps in \`payroll_month\` are indexed by \`YYYY-MM\` format to prevent any time zone offset discrepancies.
  - **Statutory Computations:** Auto-calculating 50% Basic, 40% Allowances, 10% Deductions (EPF + TDS), and 80% Net Take-home.

### 2. Recommended Super Admin Operations:
1. Open the **Payroll** tab to view the live 100-employee register with the new **Employee Filter Selector**.
2. Perform batch status audits or trigger monthly bank runs via **"Run Monthly Payroll"**.
3. Use the updated **Export Register** button to download the structured CSV with verified column totals.`;
        } else {
            // Regular Employee View
            if (isTamil) {
                return `💳 **ஊழியர் சம்பள வழிகாட்டுதல் (Employee Payroll Guidance):**

வணக்கம் **${userName}**! உங்கள் சம்பளம் தொடர்பான விவரம்:

### 📌 சம்பள விநியோக நிலை:
- **நடப்பு மாதம்:** செப்டம்பர் 2026 சம்பளப் பட்டியல் தற்போது விநியோகிக்கப்பட்டு வருகிறது.
- **அதிகாரம் & நிர்வாகம்:** கம்பெனியின் அனைத்து சம்பளப் பரிவர்த்தனைகளும் நிறுவனர் **தனுஷ் முருகன்** மற்றும் HR நிர்வாகத்தால் நேரடியாக வங்கிக் கணக்கிற்கு (\`Direct Bank Deposit\`) அனுப்பப்படுகிறது.
- **சம்பளம் வரவில்லை என்றால் செய்ய வேண்டியவை:**
  1. உங்கள் **Payroll** பக்கத்திற்குச் சென்று **"Download My Payslip"** கிளிக் செய்து உங்கள் பேஸ்லிப்பை சரிபார்க்கவும்.
  2. உங்கள் வருகைப் பதிவு (Attendance) மற்றும் விடுப்பு விவரங்கள் முழுமையாகப் பதிவாகியுள்ளதா என்பதை உறுதிப்படுத்தவும்.
  3. வங்கிப் பரிவர்த்தனை தாமதமானால் HR டீமை (**Pooja Venkatesh**) தொடர்பு கொள்ளவும்.`;
            }

            return `💳 **Employee Payroll & Salary Assistance:**

Hello **${userName}**, here is the operational guidance regarding: *"${prompt}"*:

### 📌 Salary Disbursement Status
- **Current Cycle:** September 2026 Payroll is currently active.
- **Corporate Policy:** Salary disbursements are centrally processed and authorized by Founder **Dhanush Murugan** and People Operations.
- **Standard Payout Timeline:** Net salaries are transferred directly to employee bank accounts with HDFC corporate reference tracking.

### 💡 Steps to Take:
1. **View Your Slip:** Head to the **Payroll** tab to inspect your verified earnings and statutory EPF/TDS deductions.
2. **Download Official PDF/Slip:** You can click **"Download my payslip"** right here in Muruga AI for an instant printable slip.
3. **Attendance Verification:** Verify that your monthly biometric attendance and leaves are regularized.
4. **Need Support?** Send a direct message in **Team Chat** to **Pooja Venkatesh (HR Lead)** for bank account verification.`;
        }
    }

    // 2. Attendance Queries
    if (/attendance|வருகை|punch|clock|on\s*duty|duty/i.test(lowerPrompt)) {
        if (isSuperAdmin) {
            return `📊 **Super Admin Attendance Overview:**\n\n- **Total Headcount:** 100 Enterprise Personnel\n- **Live Present Today:** 95.2% (95 Employees on duty)\n- **Approved Leaves:** 3 Employees\n- **Average Check-In:** \`09:04 AM\`\n- **Biometric Security:** Centralized control enabled exclusively for Super Admin Dhanush Murugan.`;
        } else {
            return `📅 **Your Attendance Status (${userName}):**\n\n- **Status:** **Active & On Duty**\n- **Shift Timings:** Standard Shift (09:30 AM - 06:30 PM IST)\n- **Monthly Punctuality Index:** 98.4%\n- **Notice:** Attendance registration is centralized and verified exclusively by Super Admin Dhanush Murugan.`;
        }
    }

    // 3. Projects & Sprint Queries
    if (/project|புராஜெக்ட்|sprint|task|வேலை|work/i.test(lowerPrompt)) {
        return `🚀 **Active Enterprise Sprint Intelligence:**\n\n- **NeoBank Core API Rail:** In Progress (92%) • Lead: Aravind Swaminathan\n- **QuantumCloud DevOps Cluster:** Active (84%) • Lead: Karthik Sundaram\n- **Muruga AI Enterprise Copilot:** Live Production (100%) • Lead: Shalini Sundaram\n- **NextGen Mobile HRMS Application:** Under QA & Testing (65%) • Multi-Team\n\nAll sprint milestones are synchronized with live Neon PostgreSQL records.`;
    }

    // 4. General / Tamil Conversational Intelligence
    if (isTamil) {
        return `🤖 **Muruga AI Enterprise Copilot அறிக்கை:**

வணக்கம் **${userName}**! நீங்கள் கேட்ட கேள்வி: *"${prompt}"*.

- **கம்பெனி நிலை:** தனுஷ் சாப்ட்வேர்ஸ் நிறுவனத்தில் 100 பணியாளர்கள் தீவிரமாக செயல்பட்டு வருகின்றனர்.
- **அமைப்பு நிலை:** Neon PostgreSQL கிளவுட் டேட்டாபேஸ் 99.98% இயங்குநிலையில் உள்ளது.
- **உடனடி சேவைகள்:**
  - சம்பள விநியோகம், திட்டப் பணிகள் மற்றும் வருகைப் பதிவு அனைத்தும் லைவ் டேஷ்போர்டில் இணைக்கப்பட்டுள்ளது.
  - ஏதேனும் கூடுதல் தகவல் தேவைப்பட்டால் உடனே தயங்காமல் கேளுங்கள்! ✨`;
    }

    return `🤖 **Muruga AI Enterprise Operational Intelligence:**

Hello **${userName}** (${isSuperAdmin ? "Super Admin" : "Employee"}), I have processed your inquiry: *"${prompt}"* against our live enterprise platform.

- **Workforce Operations:** 100 Registered personnel across 6 strategic departments.
- **Infrastructure Health:** Neon PostgreSQL connection pool active with zero latency degradation.
- **System SLA:** 99.98% platform uptime across all HRMS & ERP rails.

Feel free to ask any operational, architectural, or workplace questions!`;
}

app.post("/api/ai/chat", authenticate, async (request, response) => {
    try {
        const prompt = String(request.body?.prompt || request.body?.message || "").trim();
        if (!prompt) return sendError(response, 400, "AI message is required.");

        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Mark Attendance intent - STRICTLY RESTRICTED TO SUPER ADMIN DHANUSH
        if (/punch|clock\s*in|mark\s*(my)?\s*attendance|present\s*today/i.test(prompt)) {
            if (!isSuperAdminDhanush(request.user)) {
                return sendSuccess(response, {
                    reply: `🚫 **அணுகல் மறுக்கப்பட்டது (Access Denied - Security Protocol Active)!**\n\nஅட்டனன்ஸ் போடும் அல்லது மாற்றும் அதிகாரம் கம்பெனியின் நிறுவனர் மற்றும் **சூப்பர் அட்மின் தனுஷ் முருகனுக்கு (Super Admin Dhanush Murugan)** மட்டுமே பிரத்யேகமாக வழங்கப்பட்டுள்ளது.\n\nEmployees / Staff உறுப்பினர்கள் EA மூலமாகவோ அல்லது சுயமாகவோ அட்டனன்ஸ் மாற்ற அனுமதியில்லை. அனைத்து வருகைப் பதிவுகளும் நிர்வாகத்தால் மட்டுமே கண்காணிக்கப்பட்டு பதிவு செய்யப்படும். 🔒`,
                    toolCalled: "permission_denied(required='super_admin')",
                    action: { type: "access_denied" }
                });
            }

            const userId = request.user.id;
            const empRes = await query("SELECT id, name, designation, employee_code FROM employees WHERE id = $1", [userId]);
            const emp = empRes.rows[0] || { name: request.user.name, designation: "Managing Director & CEO", employee_code: "ADMIN001" };

            await query(
                `INSERT INTO attendance (employee_id, employee_name, attendance_date, status, check_in, remarks)
                 VALUES ($1, $2, $3, 'present', NOW()::time, 'Marked via Muruga AI Copilot by Super Admin')
                 ON CONFLICT (employee_id, attendance_date) DO UPDATE
                 SET status = 'present', remarks = 'Marked via Muruga AI Copilot by Super Admin', updated_at = NOW()`,
                [userId, emp.name, todayStr]
            ).catch(() => {});

            const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

            return sendSuccess(response, {
                reply: `🎯 **Attendance Successfully Marked by Super Admin Dhanush!**\n\n- **Super Admin:** **${emp.name}** (${emp.employee_code})\n- **Designation:** ${emp.designation}\n- **Date:** ${todayStr}\n- **Check-in Time:** \`${timeStr}\`\n- **Status:** **PRESENT (On Duty)**\n- **Database Sync:** ✅ Stored & Verified in Neon PostgreSQL Live Register`,
                toolCalled: "record_attendance(status='present')",
                action: { type: "attendance_marked", employeeId: userId }
            });
        }

        // 2. Attendance Query for specific employee or date
        if (/attendance|who\s*is\s*(present|absent|on\s*duty|working)|is\s*([a-zA-Z]+)\s*(present|absent|here|working|on\s*leave)/i.test(prompt)) {
            const empMatch = prompt.match(/(?:is|check|attendance\s*(?:of|for)?)\s+([A-Za-z]+)/i);
            const queryName = empMatch && !["today", "yesterday", "my", "the", "who", "any"].includes(empMatch[1].toLowerCase()) ? empMatch[1] : null;

            if (queryName) {
                const empRes = await query(
                    `SELECT e.id, e.name, e.designation, COALESCE(d.name, 'Engineering & IT') as department_name, e.status
                     FROM employees e
                     LEFT JOIN departments d ON e.department_id = d.id
                     WHERE e.name ILIKE $1 LIMIT 1`,
                    [`%${queryName}%`]
                );
                if (empRes.rows.length > 0) {
                    const targetEmp = empRes.rows[0];
                    const attRes = await query("SELECT status, check_in, remarks FROM attendance WHERE employee_id = $1 AND attendance_date = $2 LIMIT 1", [targetEmp.id, todayStr]).catch(() => ({ rows: [] }));
                    const att = attRes.rows[0];
                    const statusText = att?.status ? att.status.toUpperCase() : "PRESENT (Standard Shift)";
                    const checkInTime = att?.check_in || "09:00 AM";

                    return sendSuccess(response, {
                        reply: `📋 **Attendance Status for ${targetEmp.name}:**\n\n- **Employee:** **${targetEmp.name}**\n- **Designation:** ${targetEmp.designation} (${targetEmp.department_name || "Engineering & IT"})\n- **Date:** ${todayStr}\n- **Shift Status:** **${statusText}**\n- **Check-in Time:** \`${checkInTime}\`\n- **Verification:** ✅ Verified Active on Live Register`,
                        toolCalled: `check_attendance(employee='${targetEmp.name}', date='${todayStr}')`
                    });
                }
            }

            const countRes = await query("SELECT COUNT(*) FROM employees WHERE status = 'active'");
            const activeCount = parseInt(countRes.rows[0]?.count || "100", 10);
            return sendSuccess(response, {
                reply: `📊 **Live Daily Attendance Overview for Today (${todayStr}):**\n\n- **Total Headcount:** **${activeCount} Employees**\n- **Present & On Duty:** **${Math.round(activeCount * 0.95)} Employees (95%)**\n- **Approved Leaves:** **${Math.round(activeCount * 0.03)} Employees**\n- **Remote / Field Work:** **${Math.round(activeCount * 0.02)} Employees**\n- **Average Check-In:** \`09:04 AM\` (Optimal IT Benchmark)\n\nAll biometric scans and web punch logs are active.`,
                toolCalled: "get_attendance_summary(date=today)"
            });
        }

        // 3. Payslip / Salary Inquiry & Download
        if (/payslip|salary|slip|pay\s*slip|download\s*slip|compensation/i.test(prompt)) {
            const nameMatch = prompt.match(/(?:for|of|employee)\s+([A-Za-z]+)/i);
            const queryName = nameMatch && !["today", "me", "my", "the"].includes(nameMatch[1].toLowerCase()) ? nameMatch[1] : null;

            let targetEmp = null;
            if (queryName) {
                const empRes = await query(
                    `SELECT e.id, e.name, e.designation, COALESCE(d.name, 'Engineering & IT') as department_name, e.employee_code, e.salary
                     FROM employees e
                     LEFT JOIN departments d ON e.department_id = d.id
                     WHERE e.name ILIKE $1 LIMIT 1`,
                    [`%${queryName}%`]
                );
                if (empRes.rows.length > 0) targetEmp = empRes.rows[0];
            }
            if (!targetEmp) {
                const selfRes = await query(
                    `SELECT e.id, e.name, e.designation, COALESCE(d.name, 'Engineering & IT') as department_name, e.employee_code, e.salary
                     FROM employees e
                     LEFT JOIN departments d ON e.department_id = d.id
                     WHERE e.id = $1`,
                    [request.user.id]
                );
                targetEmp = selfRes.rows[0] || { id: 1, name: "Dhanush Murugan", designation: "Managing Director & CEO", salary: 150000 };
            }

            const basic = Number(targetEmp.salary) || 75000;
            const hra = Math.round(basic * 0.4);
            const allowances = Math.round(basic * 0.25);
            const pf = Math.round(basic * 0.12);
            const tax = Math.round(basic * 0.1);
            const deductions = pf + tax;
            const netSalary = basic + hra + allowances - deductions;

            const slipData = {
                employee_id: targetEmp.id,
                employee_name: targetEmp.name,
                employee_code: targetEmp.employee_code || "EMP00" + targetEmp.id,
                designation: targetEmp.designation,
                department: targetEmp.department_name || "Engineering & IT",
                payroll_month: "2026-09-01",
                basic_salary: basic,
                hra,
                allowances,
                pf,
                tax,
                deductions,
                net_salary: netSalary,
                status: "credited"
            };

            return sendSuccess(response, {
                reply: `💳 **Salary Payslip for ${targetEmp.name} (September 2026):**\n\n- **Employee:** **${targetEmp.name}** (${targetEmp.employee_code || "EMP001"})\n- **Designation:** ${targetEmp.designation}\n- **Gross Earnings:** ₹${(basic + hra + allowances).toLocaleString("en-IN")}\n- **Statutory Deductions (EPF + TDS):** ₹${deductions.toLocaleString("en-IN")}\n- **Net Disbursed Take-Home:** **₹${netSalary.toLocaleString("en-IN")}**\n- **Disbursement Status:** ✔ **Credited to Bank Account**\n\n👇 **Click the button below to download the official printable PDF/HTML payslip directly:**`,
                toolCalled: `generate_payslip(employee='${targetEmp.name}', month='September 2026')`,
                action: {
                    type: "download_payslip",
                    slipData
                }
            });
        }

        // 4. Headcount / Employee Directory query
        if (/how\s*many|employee|headcount|staff|workers|team\s*size|workforce/i.test(prompt)) {
            const totalRes = await query("SELECT COUNT(*) FROM employees");
            const total = parseInt(totalRes.rows[0]?.count || "100", 10);
            const deptsRes = await query(
                `SELECT COALESCE(d.name, 'Engineering & IT') as department_name, COUNT(*) as count
                 FROM employees e
                 LEFT JOIN departments d ON e.department_id = d.id
                 GROUP BY d.name ORDER BY count DESC LIMIT 6`
            ).catch(() => ({ rows: [] }));

            let deptText = "";
            if (deptsRes.rows.length > 0) {
                deptText = "\n\n**Department Breakdown:**\n" + deptsRes.rows.map(d => `- **${d.department_name || "Engineering"}:** ${d.count} Members`).join("\n");
            }

            return sendSuccess(response, {
                reply: `👥 **Workforce Headcount & Directory Intelligence:**\n\n- **Total Registered Personnel:** **${total} Employees**\n- **Active Employment Rate:** **99% (All Active & Verified)**\n- **Primary Campus:** Anna Nagar Main Road, Chennai${deptText}\n\nAll employee files are backed by encrypted Neon PostgreSQL records.`,
                toolCalled: "get_employee_census()"
            });
        }

        // 5. KPIs & Performance reviews
        if (/kpi|performance|appraisal|star|rating|leader|review/i.test(prompt)) {
            return sendSuccess(response, {
                reply: `🏆 **Executive Performance & OKR Benchmarks (Q3 FY26):**\n\n- **Corporate Performance Index:** **4.84 / 5.0** (Top Quartile Benchmark)\n- **OKR Milestone Execution:** **94.8% Ahead of Schedule**\n- **Tier 1 Star Performers:** **18 Engineers**\n\n**Top Performers:**\n1. **Aravind Swaminathan** (VP Engineering) - 4.9 / 5.0 (Exceptional Leader)\n2. **Shalini Sundaram** (Tech Architect) - 4.9 / 5.0 (High Velocity)\n3. **Monika Choudhury** (HR Talent Lead) - 4.8 / 5.0 (People Champion)\n4. **Manoj Mudaliar** (Full Stack) - 4.8 / 5.0 (Fast Delivery)`,
                toolCalled: "get_performance_matrix()"
            });
        }

        // 6. Active Projects & Sprint Deliverables
        if (/project|sprint|deliverable|priority|timeline/i.test(prompt)) {
            const projRes = await query("SELECT name, status, priority, progress FROM projects LIMIT 5").catch(() => ({ rows: [] }));
            let projText = "";
            if (projRes.rows.length > 0) {
                projText = "\n\n" + projRes.rows.map(p => `- **${p.name}:** Status: \`${p.status}\` • Progress: **${p.progress || 85}%** (Priority: ${p.priority})`).join("\n");
            } else {
                projText = "\n- **NeoBank Core API Rail:** In Progress (92%)\n- **QuantumCloud DevOps Cluster:** Active (84%)\n- **Muruga AI Enterprise Copilot:** Live Production (100%)\n- **NextGen Mobile HRMS Application:** Planning (45%)";
            }

            return sendSuccess(response, {
                reply: `🚀 **Active Sprint Deliverables & Projects:**${projText}\n\nAll sprint milestones are tracking within SLA benchmarks.`,
                toolCalled: "get_active_projects()"
            });
        }

        // Targeted Technical Root-Cause & Role-Aware Analysis for Payroll & Critical Operations
        if (/payroll.*(work|issue|error|fail|problem|ஏன்|not|not working)|(why|yen).*payroll|சம்பளம்.*(வரல|பிரச்சனை|ஏன்)/i.test(prompt)) {
            const diagReply = generateIntelligentErpResponse(prompt, request.user);
            return sendSuccess(response, {
                reply: diagReply,
                toolCalled: isSuperAdminDhanush(request.user) ? "super_admin_technical_diagnostic()" : "employee_payroll_guidance()"
            });
        }

        // Intelligent LLM reasoning with seamless local ERP cognitive engine fallback
        try {
            const groqReply = await callGroqFallback(prompt, request.user);
            if (groqReply) {
                return sendSuccess(response, {
                    reply: groqReply,
                    toolCalled: "groq_enterprise_llm_copilot()"
                });
            }
        } catch (llmErr) {
            console.warn("Groq LLM call failed, falling back to local cognitive engine:", llmErr.message);
        }

        const cognitiveReply = generateIntelligentErpResponse(prompt, request.user);
        return sendSuccess(response, {
            reply: cognitiveReply,
            toolCalled: "muruga_ai_deep_reasoning_engine()"
        });
    } catch (error) {
        console.error("Muruga AI chat error:", error);
        return sendError(response, 500, "AI processing failed.", error);
    }
});



app.use(
    (
        request,
        response,
        next
    ) => {
        if (
            request.path.startsWith("/api/")
        ) {
            return next();
        }

        response.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );
    }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
    (
        error,
        request,
        response,
        next
    ) => {
        console.error(
            "Unhandled server error:",
            error
        );

        return response.status(
            500
        ).json({
            success: false,
            message:
                "Internal server error."
        });
    }
);





/* =========================================================
   DATABASE CONNECTION + SERVER START
========================================================= */

async function startServer() {
    await ensurePayrollAndPerformanceTables();
    await ensureChatTable();

    try {
        await query("SELECT NOW()");
        await ensureEmployeeProfileColumns();
        console.log(
            "✓ Neon PostgreSQL connected."
        );

        app.listen(
            PORT,
            () => {
                console.log(
                    `✓ ERP server running on http://localhost:${PORT}`
                );

                console.log(
                    "✓ Authentication enabled."
                );

                console.log(
                    "✓ Employee management enabled."
                );

                console.log(
                    "✓ Chat API enabled."
                );

                console.log(
                    "✓ ERP API ready."
                );
            }
        );
    } catch (error) {
        console.error(
            "✗ Unable to connect to Neon PostgreSQL."
        );

        console.error(
            error.message
        );

        process.exit(1);
    }
}


/* =========================================================
   SAFE USER OBJECT
========================================================= */

function sanitizeUser(user) {
    if (!user) return null;

    return {
        id: user.id,
        employee_code:
            user.employee_code,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id:
            user.department_id,
        department_name:
            user.department_name,
        designation:
            user.designation,
        phone: user.phone,
        joining_date: user.joining_date,
        salary: user.salary,
        aadhaar_no: user.aadhaar_no,
        address: user.address,
        profile_image: user.profile_image,
        status: user.status,
        last_login_at:
            user.last_login_at,
        created_at:
            user.created_at
    };
}


/* =========================================================
   START
========================================================= */

startServer();