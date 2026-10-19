import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

function formatCurrency(val, symbol = '₹') {
  const num = Number(val) || 0;
  return `${symbol} ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function generateQuotationHtml(quotation, customBusiness = null) {
  if (!quotation) return '';

  const qData = quotation.data || {};
  const client = qData.client || {};
  const quotationMeta = qData.quotation || {};
  const summary = qData.summary || {};
  const items = Array.isArray(qData.items) ? qData.items : [];
  const currency = quotationMeta.currency || 'INR';
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';

  // Business profile from customBusiness or embedded in quotation data or default
  const b =
    customBusiness ||
    qData.business || {
      legalName: 'Devlomatix Solutions Private Limited',
      tradeName: 'Devlomatix Solutions',
      gstin: '07AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      phone: '+91 98765 43210',
      email: 'sales@devlomatix.com',
      website: 'www.devlomatix.com',
      address: {
        line1: 'Corporate Tower, Level 4, Tech Innovation Hub',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      bank: {
        bankName: 'HDFC Bank Ltd',
        accountHolder: 'Devlomatix Solutions Pvt Ltd',
        accountNumber: '50200012345678',
        ifsc: 'HDFC0001234',
        upiId: 'devlomatix@hdfcbank',
      },
      presets: {
        jurisdiction: 'New Delhi, India',
        signatoryName: 'Authorized Commercial Signatory',
        signatoryDesignation: 'Director / Business Lead',
      },
    };

  const addressLine = [
    b.address?.line1,
    b.address?.line2,
    b.address?.city,
    b.address?.state ? `${b.address.state} - ${b.address.pincode || ''}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const subtotal = summary.subtotal || quotation.total || 0;
  const discountTotal = summary.discountTotal || 0;
  const taxTotal = summary.taxTotal || 0;
  const grandTotal = summary.grandTotal || quotation.total || 0;

  const rowsHtml = items
    .map((item, idx) => {
      const itemSub = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      const itemDiscount = itemSub * ((Number(item.discountPercent) || 0) / 100);
      const itemTax = (itemSub - itemDiscount) * ((Number(item.taxPercent) || 0) / 100);
      const itemTotal = Math.round(itemSub - itemDiscount + itemTax);

      return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${item.name || 'Deliverable'}</div>
          ${item.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 12px; font-weight: 600;">${item.quantity || 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 12px;">${formatCurrency(item.unitPrice, symbol)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #475569;">${item.taxPercent || 0}%</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px;">${formatCurrency(itemTotal, symbol)}</td>
      </tr>
    `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation ${quotation.quotationNumber || 'QT'}</title>
  <style>
    @page {
      margin: 20mm;
      size: A4;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .company-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .company-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .badge-quotation {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .meta-box {
      width: 100%;
      margin-bottom: 24px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .section-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-bottom: 2px solid #cbd5e1;
    }
    .total-box {
      float: right;
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 24px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
      color: #475569;
    }
    .grand-total {
      border-top: 2px solid #2563eb;
      margin-top: 6px;
      padding-top: 8px;
      font-size: 15px;
      font-weight: 900;
      color: #1d4ed8;
      display: flex;
      justify-content: space-between;
    }
    .footer-section {
      clear: both;
      margin-top: 32px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- Company Letterhead Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top;">
        <div class="company-title">${b.legalName || 'Devlomatix Solutions'}</div>
        ${b.tagline ? `<div style="font-size: 12px; color: #2563eb; font-weight: 600; margin-top: 2px;">${b.tagline}</div>` : ''}
        <div class="company-sub" style="margin-top: 6px;">
          ${addressLine ? `${addressLine}<br>` : ''}
          ${b.gstin ? `<strong>GSTIN:</strong> ${b.gstin} &nbsp;|&nbsp; ` : ''}
          ${b.pan ? `<strong>PAN:</strong> ${b.pan}` : ''}
        </div>
        <div class="company-sub">
          ${b.email ? `Email: ${b.email} &nbsp;|&nbsp; ` : ''}
          ${b.phone ? `Phone: ${b.phone}` : ''}
        </div>
      </td>
      <td style="vertical-align: top; text-align: right; width: 220px;">
        <div class="badge-quotation">Official Quotation</div>
        <div style="font-size: 17px; font-weight: 900; color: #0f172a; margin-top: 8px;">
          #${quotation.quotationNumber || 'QT-DRAFT'}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
          <strong>Date:</strong> ${formatDate(quotation.createdAt || quotationMeta.issueDate)}<br>
          <strong>Validity:</strong> ${quotationMeta.validUntil || '30 Days'}
        </div>
      </td>
    </tr>
  </table>

  <!-- Client & Scope Meta Row -->
  <table class="meta-box" style="border-collapse: collapse;">
    <tr>
      <td style="width: 50%; padding-right: 10px; vertical-align: top;">
        <div class="meta-card">
          <div class="section-label">Prepared For (Recipient)</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${quotation.clientName || client.name || 'Client'}</div>
          ${client.company ? `<div style="font-size: 12px; font-weight: 600; color: #475569;">${client.company}</div>` : ''}
          ${client.phone ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px;">Phone: ${client.phone}</div>` : ''}
          ${client.email ? `<div style="font-size: 11px; color: #64748b;">Email: ${client.email}</div>` : ''}
        </div>
      </td>
      <td style="width: 50%; padding-left: 10px; vertical-align: top;">
        <div class="meta-card">
          <div class="section-label">Scope & Engagement</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${quotationMeta.title || 'Commercial Project Scope'}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            <strong>Currency:</strong> ${currency} (${symbol})<br>
            <strong>Status:</strong> ${(quotation.status || 'draft').toUpperCase()}
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th style="text-align: left;">Deliverable & Scope</th>
        <th style="width: 60px; text-align: center;">Qty</th>
        <th style="width: 100px; text-align: right;">Unit Price</th>
        <th style="width: 60px; text-align: center;">GST</th>
        <th style="width: 110px; text-align: right;">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- Financial Summary Box -->
  <div class="total-box">
    <div class="total-row">
      <span>Taxable Subtotal:</span>
      <span style="font-weight: 600;">${formatCurrency(subtotal, symbol)}</span>
    </div>
    ${
      discountTotal > 0
        ? `
    <div class="total-row" style="color: #dc2626;">
      <span>Total Discount:</span>
      <span style="font-weight: 600;">- ${formatCurrency(discountTotal, symbol)}</span>
    </div>`
        : ''
    }
    <div class="total-row">
      <span>GST / Taxes:</span>
      <span style="font-weight: 600;">+ ${formatCurrency(taxTotal, symbol)}</span>
    </div>
    <div class="grand-total">
      <span>Grand Total (${currency}):</span>
      <span>${formatCurrency(grandTotal, symbol)}</span>
    </div>
  </div>

  <div style="clear: both;"></div>

  <!-- Bank Coordinates & Payment Terms -->
  <div style="display: flex; gap: 16px; margin-top: 10px;">
    ${
      b.bank?.bankName
        ? `
    <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 11px;">
      <div class="section-label">Banking Coordinates for Wire / NEFT / RTGS</div>
      <div><strong>Bank:</strong> ${b.bank.bankName}</div>
      <div><strong>Account Holder:</strong> ${b.bank.accountHolder || b.legalName}</div>
      <div><strong>Account Number:</strong> ${b.bank.accountNumber}</div>
      <div><strong>IFSC Code:</strong> ${b.bank.ifsc}</div>
      ${b.bank.upiId ? `<div><strong>UPI / VPA:</strong> ${b.bank.upiId}</div>` : ''}
    </div>
    `
        : ''
    }

    <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 11px;">
      <div class="section-label">Commercial Terms</div>
      <div><strong>Payment Terms:</strong> ${qData.notes || '50% advance on confirmation, 50% upon milestone completion.'}</div>
      ${qData.terms ? `<div style="margin-top: 4px;"><strong>Scope Warranty:</strong> ${qData.terms}</div>` : ''}
      <div style="margin-top: 4px; color: #64748b;"><strong>Jurisdiction:</strong> Subject to ${b.presets?.jurisdiction || 'Local Jurisdiction'} courts.</div>
    </div>
  </div>

  <!-- Footer & Authorized Signature -->
  <div class="footer-section">
    <table style="width: 100%;">
      <tr>
        <td style="vertical-align: bottom;">
          <div>This is a computer-generated commercial proposal issued by <strong>${b.legalName || 'Devlomatix Solutions'}</strong>.</div>
          <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">Generated via DevX Commercial Mobile Hub</div>
        </td>
        <td style="text-align: right; vertical-align: bottom; width: 220px;">
          <div style="border-bottom: 1px dashed #94a3b8; margin-bottom: 6px; width: 180px; margin-left: auto;"></div>
          <div style="font-weight: 800; color: #0f172a; font-size: 11px;">${b.presets?.signatoryName || 'Authorized Signatory'}</div>
          <div style="font-size: 10px; color: #64748b;">${b.presets?.signatoryDesignation || 'Director / Commercial Lead'}</div>
        </td>
      </tr>
    </table>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Generate PDF file and trigger Native Share or Print
 */
export async function printOrShareQuotationPdf(quotation, customBusiness = null, action = 'share') {
  try {
    const html = generateQuotationHtml(quotation, customBusiness);

    if (action === 'print') {
      await Print.printAsync({ html });
      return { success: true };
    }

    // Export to PDF file
    const { uri } = await Print.printToFileAsync({ html });

    if (action === 'share') {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Quotation ${quotation.quotationNumber || 'Proposal'}.pdf`,
        });
      }
    }

    return { success: true, uri };
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    return { success: false, error: error.message || 'Failed to generate PDF' };
  }
}
