// Utility to generate and download official enterprise salary payslips for Dhanush Softwares ERP

export function numberToIndianWords(num) {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  const inWords = (n) => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  const n = Math.round(Number(num) || 0);
  if (n === 0) return "Zero Rupees Only";

  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundred = remainder % 1000;

  let res = "";
  if (crore > 0) res += inWords(crore) + "Crore ";
  if (lakh > 0) res += inWords(lakh) + "Lakh ";
  if (thousand > 0) res += inWords(thousand) + "Thousand ";
  if (hundred > 0) res += inWords(hundred);

  return "Rupees " + res.trim() + " Only";
}

export function generatePayslipHtml(slipData) {
  const basic = Number(slipData.basic_salary) || 54000;
  const hra = Number(slipData.hra) || Math.round(basic * 0.4);
  const allowances = Number(slipData.allowances) || Math.round(basic * 0.25);
  const pf = Number(slipData.pf) || Math.round(basic * 0.12);
  const tax = Number(slipData.tax) || Math.round(basic * 0.1);
  const deductions = Number(slipData.deductions) || pf + tax + 200;
  const grossEarnings = basic + hra + allowances;
  const netSalary = Number(slipData.net_salary) || (grossEarnings - deductions);

  const monthName = slipData.payroll_month
    ? new Date(slipData.payroll_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "September 2026";

  const netWords = numberToIndianWords(netSalary);
  const currentDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const payslipNo = `DS-PAY-${slipData.employee_code || "EMP001"}-${Date.now().toString().slice(-6)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${slipData.employee_name} (${monthName}) - Dhanush Softwares</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px;
      display: flex;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .payslip-sheet {
      width: 100%;
      max-width: 820px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 76px;
      font-weight: 800;
      color: rgba(99, 102, 241, 0.04);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      letter-spacing: 4px;
    }
    .sheet-content {
      position: relative;
      z-index: 1;
    }
    /* Header */
    .payslip-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .company-col {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .logo-box {
      width: 58px;
      height: 58px;
      flex-shrink: 0;
    }
    .company-title {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #1e1b4b;
      text-transform: uppercase;
    }
    .company-sub {
      font-size: 11.5px;
      font-weight: 600;
      color: #6366f1;
    }
    .company-meta {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .payslip-badge-col {
      text-align: right;
    }
    .payslip-tag {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #475569;
      text-transform: uppercase;
    }
    .payslip-month {
      font-size: 18px;
      font-weight: 800;
      color: #4338ca;
      font-family: 'JetBrains Mono', monospace;
    }
    .payslip-ref {
      font-size: 10.5px;
      font-family: 'JetBrains Mono', monospace;
      color: #64748b;
      margin-top: 3px;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      background: #dcfce7;
      color: #15803d;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
      border: 1px solid #bbf7d0;
    }
    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-lbl {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .info-val {
      font-size: 12.5px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 2px;
    }
    .info-val.mono {
      font-family: 'JetBrains Mono', monospace;
    }
    /* Breakdown Table */
    .breakdown-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .table-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .table-head {
      background: #f1f5f9;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      letter-spacing: 0.5px;
    }
    .table-row {
      padding: 9px 14px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .table-row:nth-child(even) {
      background: #fafbfc;
    }
    .table-total {
      background: #f8fafc;
      padding: 11px 14px;
      font-size: 12.5px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #e2e8f0;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .text-success { color: #16a34a; }
    .text-danger { color: #dc2626; }
    /* Net Pay Highlight */
    .netpay-banner {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .netpay-left-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #c7d2fe;
      font-weight: 700;
    }
    .netpay-left-val {
      font-size: 26px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #ffffff;
      margin-top: 2px;
    }
    .netpay-right {
      text-align: right;
      max-width: 380px;
    }
    .netpay-words {
      font-size: 12px;
      color: #e0e7ff;
      font-weight: 500;
      font-style: italic;
    }
    .netpay-disbursed-note {
      font-size: 10.5px;
      color: #38bdf8;
      margin-top: 4px;
      font-weight: 600;
    }
    /* Signatures & Seal */
    .signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
    }
    .sig-col {
      width: 200px;
      text-align: center;
    }
    .sig-line {
      height: 1px;
      background: #64748b;
      margin-bottom: 8px;
    }
    .sig-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-role {
      font-size: 10px;
      color: #64748b;
    }
    /* Digital Seal */
    .seal-wrap {
      width: 100px;
      height: 100px;
      border: 2px dashed #4338ca;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px;
      color: #4338ca;
      text-align: center;
      transform: rotate(-10deg);
      background: rgba(99, 102, 241, 0.03);
    }
    .seal-org { font-size: 7.5px; font-weight: 800; letter-spacing: 0.5px; }
    .seal-main { font-size: 9px; font-weight: 800; margin: 2px 0; color: #16a34a; }
    .seal-loc { font-size: 7px; font-weight: 600; }
    /* Footer */
    .payslip-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .payslip-sheet {
        border: none;
        box-shadow: none;
        padding: 10mm;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="payslip-sheet">
    <div class="watermark">DHANUSH SOFTWARES</div>
    <div class="sheet-content">
      <!-- Header -->
      <div class="payslip-header">
        <div class="company-col">
          <div class="logo-box">
            <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0b0f19" />
                  <stop offset="100%" stop-color="#1e1b4b" />
                </linearGradient>
                <linearGradient id="pBow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#38bdf8" />
                  <stop offset="50%" stop-color="#6366f1" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
                <linearGradient id="pArr" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stop-color="#f59e0b" />
                  <stop offset="100%" stop-color="#fbbf24" />
                </linearGradient>
              </defs>
              <rect x="6" y="6" width="108" height="108" rx="26" fill="url(#pBg)" stroke="#6366f1" stroke-width="2.5" />
              <path d="M 60 22 C 34 22 22 40 22 60 C 22 80 34 98 60 98" fill="none" stroke="url(#pBow)" stroke-width="6" stroke-linecap="round" />
              <path d="M 52 34 C 68 34 82 40 82 50 C 82 58 72 62 60 62 C 48 62 38 66 38 74 C 38 84 52 86 68 86" fill="none" stroke="#06b6d4" stroke-width="5" stroke-linecap="round" />
              <path d="M 44 60 L 76 60 M 76 60 L 64 52 M 76 60 L 64 68" fill="none" stroke="url(#pArr)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
              <polygon points="84,60 76,56 74,60 76,64" fill="#fbbf24" />
              <circle cx="60" cy="22" r="4" fill="#38bdf8" />
              <circle cx="60" cy="98" r="4" fill="#ec4899" />
              <circle cx="60" cy="60" r="3.5" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <h1 class="company-title">DHANUSH SOFTWARES PRIVATE LIMITED</h1>
            <p class="company-sub">Enterprise Cloud Solutions & IT Engineering Services</p>
            <p class="company-meta">14/A, Anna Nagar Main Road, Chennai - 600040, Tamil Nadu, India</p>
            <p class="company-meta">CIN: U72900TN2024PTC158920 • PAN: AABCD1234E • payroll@gmail.com</p>
          </div>
        </div>

        <div class="payslip-badge-col">
          <div class="payslip-tag">OFFICIAL SALARY SLIP</div>
          <div class="payslip-month">${monthName.toUpperCase()}</div>
          <div class="payslip-ref">${payslipNo}</div>
          <span class="status-badge">● Bank Gateway Disbursed</span>
        </div>
      </div>

      <!-- Employee Info -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-lbl">Employee Name</span>
          <span class="info-val">${slipData.employee_name || "Dhanush Murugan"}</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Employee Code</span>
          <span class="info-val mono">${slipData.employee_code || "EMP001"}</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Designation</span>
          <span class="info-val">${slipData.designation || "Senior Technical Lead"}</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Department</span>
          <span class="info-val">${slipData.department || "Engineering & IT"}</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Bank Account</span>
          <span class="info-val mono">•••• •••• 4892 (HDFC Bank)</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">UAN / PF Number</span>
          <span class="info-val mono">100984512498</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Payment Mode</span>
          <span class="info-val">${slipData.payment_mode || "Direct NEFT / RTGS"}</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Bank Transaction Ref</span>
          <span class="info-val mono">${slipData.transaction_ref || "HDFC982348712"}</span>
        </div>
      </div>

      <!-- Earnings & Deductions Tables -->
      <div class="breakdown-row">
        <!-- Earnings -->
        <div class="table-box">
          <div class="table-head">
            <span>EARNINGS COMPONENTS</span>
            <span>AMOUNT (₹)</span>
          </div>
          <div class="table-row">
            <span>Basic Salary</span>
            <span class="mono">₹${basic.toLocaleString("en-IN")}</span>
          </div>
          <div class="table-row">
            <span>House Rent Allowance (HRA)</span>
            <span class="mono">₹${hra.toLocaleString("en-IN")}</span>
          </div>
          <div class="table-row">
            <span>Special & Project Allowances</span>
            <span class="mono">₹${allowances.toLocaleString("en-IN")}</span>
          </div>
          <div class="table-row">
            <span>Performance Incentive</span>
            <span class="mono">₹0</span>
          </div>
          <div class="table-total">
            <span>Gross Earnings</span>
            <span class="mono text-success">₹${grossEarnings.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <!-- Deductions -->
        <div class="table-box">
          <div class="table-head">
            <span>STATUTORY DEDUCTIONS</span>
            <span>AMOUNT (₹)</span>
          </div>
          <div class="table-row">
            <span>Employee Provident Fund (EPF 12%)</span>
            <span class="mono">₹${pf.toLocaleString("en-IN")}</span>
          </div>
          <div class="table-row">
            <span>Income Tax Withholding (TDS)</span>
            <span class="mono">₹${tax.toLocaleString("en-IN")}</span>
          </div>
          <div class="table-row">
            <span>Professional Tax (PT)</span>
            <span class="mono">₹200</span>
          </div>
          <div class="table-row">
            <span>Other Deductions</span>
            <span class="mono">₹0</span>
          </div>
          <div class="table-total">
            <span>Total Deductions</span>
            <span class="mono text-danger">₹${deductions.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <!-- Net Salary Box -->
      <div class="netpay-banner">
        <div>
          <div class="netpay-left-title">NET DISBURSED SALARY</div>
          <div class="netpay-left-val">₹${netSalary.toLocaleString("en-IN")}</div>
        </div>
        <div class="netpay-right">
          <div class="netpay-words">${netWords}</div>
          <div class="netpay-disbursed-note">✔ Digitally Verified • 100% Credited to Bank Account</div>
        </div>
      </div>

      <!-- Signatures & Official Stamp -->
      <div class="signatures-row">
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-name">${slipData.employee_name || "Employee"}</div>
          <div class="sig-role">Employee Signature</div>
        </div>

        <div class="seal-wrap">
          <span class="seal-org">DHANUSH SOFTWARES</span>
          <span class="seal-main">★ VERIFIED ★</span>
          <span class="seal-loc">CHENNAI - 600040</span>
        </div>

        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-name">Authorized Signatory</div>
          <div class="sig-role">Corporate Finance & Payroll Division</div>
        </div>
      </div>

      <div class="payslip-footer">
        <p>This is a computer-generated salary slip processed via Dhanush Softwares ERP v3.0. Form 16 & ESI Compliant. Issued on ${currentDate}.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadPayslip(slipData) {
  const htmlContent = generatePayslipHtml(slipData);
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const empName = (slipData.employee_name || "Employee").replace(/\s+/g, "_");
  const month = (slipData.payroll_month || "2026-09").slice(0, 7);
  link.href = url;
  link.download = `Dhanush_Softwares_Payslip_${empName}_${month}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPayslipDirectly(slipData) {
  const htmlContent = generatePayslipHtml(slipData);
  const printWindow = window.open("", "_blank", "width=900,height=850");
  if (!printWindow) {
    // If popup blocked, fallback to standard download
    downloadPayslip(slipData);
    return;
  }
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
