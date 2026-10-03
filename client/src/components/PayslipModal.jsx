import React from "react";
import { createPortal } from "react-dom";
import { Printer, Download, X, Building, CheckCircle2, ShieldCheck } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { downloadPayslip, printPayslipDirectly } from "../utils/payslipGenerator";

export default function PayslipModal({ isOpen, onClose, slipData }) {
  if (!isOpen || !slipData) return null;

  const handleDownload = () => {
    downloadPayslip(slipData);
  };

  const handlePrint = () => {
    printPayslipDirectly(slipData);
  };

  const basic = Number(slipData.basic_salary) || 50000;
  const hra = Number(slipData.hra) || Math.round(basic * 0.4);
  const allowances = Number(slipData.allowances) || Math.round(basic * 0.25);
  const pf = Number(slipData.pf) || Math.round(basic * 0.12);
  const tax = Number(slipData.tax) || Math.round(basic * 0.1);
  const deductions = Number(slipData.deductions) || pf + tax;
  const grossEarnings = basic + hra + allowances;
  const netSalary = Number(slipData.net_salary) || grossEarnings - deductions;

  const monthName = slipData.payroll_month
    ? new Date(slipData.payroll_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "September 2026";

  return createPortal(
    <div className="modal-backdrop payslip-print-backdrop" onClick={onClose}>
      <div
        className="modal-panel payslip-modal-container animate-scale-up"
        style={{ maxWidth: "min(820px, calc(100vw - 32px))", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="payslip-modal-actions no-print">
          <div className="payslip-modal-title">
            <Building size={18} className="text-primary" />
            <span>Official Salary Payslip Preview</span>
          </div>
          <div className="payslip-btn-group">
            <button className="btn btn-primary btn-sm" onClick={handleDownload} title="Download HTML/PDF Payslip">
              <Download size={15} />
              <span>Download Slip</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="Print or Save as PDF">
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button className="modal-close-button" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Payslip Card */}
        <div className="payslip-printable-document" id="printablePayslip">
          {/* Header */}
          <div className="payslip-doc-header">
            <div className="payslip-brand">
              <BrandLogo size={52} collapsed={true} />
              <div>
                <h2 className="payslip-company-name">DHANUSH SOFTWARES PRIVATE LIMITED</h2>
                <p className="payslip-company-sub">Cloud Enterprise Solutions & IT Services</p>
                <p className="payslip-company-address">14/A, Anna Nagar Main Road, Chennai - 600040, Tamil Nadu, India</p>
                <p className="payslip-company-contact">CIN: U72900TN2024PTC158920 • hr@gmail.com</p>
              </div>
            </div>
            <div className="payslip-month-badge">
              <div className="payslip-month-title">PAYSLIP FOR</div>
              <div className="payslip-month-val">{monthName.toUpperCase()}</div>
              <span className="payslip-status-tag">
                <CheckCircle2 size={12} /> Disbursed
              </span>
            </div>
          </div>

          <div className="payslip-divider" />

          {/* Employee & Bank Info Grid */}
          <div className="payslip-info-grid">
            <div className="payslip-info-item">
              <span className="info-lbl">Employee Name:</span>
              <strong className="info-val">{slipData.employee_name || "Dhanush Murugan"}</strong>
            </div>
            <div className="payslip-info-item">
              <span className="info-lbl">Employee Code:</span>
              <span className="info-val">{slipData.employee_code || "ADMIN001"}</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-lbl">Designation:</span>
              <span className="info-val">{slipData.designation || "Senior Executive"}</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-lbl">Department:</span>
              <span className="info-val">{slipData.department || "Engineering & IT"}</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-lbl">Bank Account No:</span>
              <span className="info-val">•••• •••• 4892 (HDFC Bank)</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-lbl">UAN / PF Number:</span>
              <span className="info-val">100984512498</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-lbl">Payment Mode:</span>
              <span className="info-val">{slipData.payment_mode || "Direct NEFT/RTGS"}</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-lbl">Transaction Ref:</span>
              <span className="info-val font-mono">{slipData.transaction_ref || "HDFC982348712"}</span>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="payslip-tables-row">
            {/* Earnings */}
            <div className="payslip-table-wrapper">
              <div className="payslip-col-header">
                <span>EARNINGS</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="payslip-row">
                <span>Basic Salary</span>
                <span className="font-mono">₹{basic.toLocaleString("en-IN")}</span>
              </div>
              <div className="payslip-row">
                <span>House Rent Allowance (HRA)</span>
                <span className="font-mono">₹{hra.toLocaleString("en-IN")}</span>
              </div>
              <div className="payslip-row">
                <span>Special / Project Allowance</span>
                <span className="font-mono">₹{allowances.toLocaleString("en-IN")}</span>
              </div>
              <div className="payslip-row">
                <span>Performance Incentive</span>
                <span className="font-mono">₹0</span>
              </div>
              <div className="payslip-col-total">
                <strong>Gross Earnings</strong>
                <strong className="font-mono text-success">₹{grossEarnings.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            {/* Deductions */}
            <div className="payslip-table-wrapper">
              <div className="payslip-col-header">
                <span>DEDUCTIONS</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="payslip-row">
                <span>Provident Fund (Employee PF)</span>
                <span className="font-mono">₹{pf.toLocaleString("en-IN")}</span>
              </div>
              <div className="payslip-row">
                <span>Professional Tax (PT)</span>
                <span className="font-mono">₹200</span>
              </div>
              <div className="payslip-row">
                <span>Income Tax (TDS)</span>
                <span className="font-mono">₹{tax.toLocaleString("en-IN")}</span>
              </div>
              <div className="payslip-row">
                <span>Other Deductions</span>
                <span className="font-mono">₹0</span>
              </div>
              <div className="payslip-col-total">
                <strong>Total Deductions</strong>
                <strong className="font-mono text-danger">₹{deductions.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>

          {/* Net Pay Callout */}
          <div className="payslip-netpay-box">
            <div className="netpay-left">
              <span className="netpay-lbl">NET SALARY PAYABLE</span>
              <div className="netpay-amount font-mono">₹{netSalary.toLocaleString("en-IN")}</div>
            </div>
            <div className="netpay-right">
              <div className="netpay-badge">
                <ShieldCheck size={16} /> Digitally Verified & Approved
              </div>
              <span className="netpay-words">Amount credited to linked bank account</span>
            </div>
          </div>

          {/* Signatures & Corporate Watermark */}
          <div className="payslip-signatures">
            <div className="sig-block">
              <div className="sig-line" />
              <div className="sig-title">Employee Signature</div>
            </div>
            <div className="payslip-seal-stamp">
              <div className="seal-circle">
                <span>DHANUSH SOFTWARES</span>
                <strong>* VERIFIED *</strong>
                <span>CHENNAI</span>
              </div>
            </div>
            <div className="sig-block">
              <div className="sig-line" />
              <div className="sig-title">Authorized Finance Signatory</div>
              <div className="sig-note">Dhanush Softwares ERP Payroll System</div>
            </div>
          </div>

          <div className="payslip-footer-note">
            <p>This is a computer-generated document processed via Dhanush Softwares ERP v2.0. No physical signature is required.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
