// lib/pdfGenerator.js
// Generates printable / downloadable A4 PDF documents for Prescriptions and Payment Receipts,
// mirroring frontend/lib/utils/pdf_generator.dart.

import {
  cleanText,
  formatCurrency,
  formatDate,
  formatDoctorName,
  formatPatientName,
} from '@/lib/formatters';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openPrintWindow(title, bodyHtml) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWin = window.open(
    '',
    '_blank',
    'width=900,height=800,noopener,noreferrer'
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
    }
    .sheet {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }
    .toolbar {
      max-width: 780px;
      margin: 0 auto 16px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      background: #0d9488;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .tag {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0d9488;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      margin: 6px 0 0;
      color: #0f172a;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      background: #f8fafc;
    }
    .box-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .box-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .box-sub {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      margin-bottom: 24px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.06em;
    }
    .notes {
      border: 1px solid #cbd5e1;
      background: #f0fdfa;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    .barcode {
      margin-top: 32px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
    }
    .barcode-box {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 28px;
      font-family: monospace;
      letter-spacing: 3px;
      font-size: 14px;
      border-radius: 6px;
    }
    .barcode-caption {
      font-size: 10px;
      color: #64748b;
      margin-top: 6px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { border: none; box-shadow: none; padding: 16px; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
  </div>
  <div class="sheet">
    ${bodyHtml}
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  } else {
    // Fallback if popup blocked: download as HTML document
    const blob = new Blob([html], {
      type: 'text/html;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(
      () => URL.revokeObjectURL(url),
      5000
    );
  }
}

export function downloadPrescriptionPdf(
  prescriptionOrArgs,
  patientProfileArg = null
) {
  const isWrapper =
    prescriptionOrArgs &&
    typeof prescriptionOrArgs === 'object' &&
    prescriptionOrArgs.prescription &&
    typeof prescriptionOrArgs.prescription === 'object';

  const prescription = isWrapper
    ? prescriptionOrArgs.prescription
    : prescriptionOrArgs;
  const patientProfile = isWrapper
    ? prescriptionOrArgs.patientProfile || patientProfileArg
    : patientProfileArg;

  const rxId = String(
    prescription?.id || ''
  ).startsWith('PRE-')
    ? prescription.id
    : `PRE-${prescription?.id || '0'}`;

  const rawRole = cleanText(
    prescription?.provider_role,
    'Doctor'
  );
  const doctorName =
    rawRole.toLowerCase() === 'doctor'
      ? formatDoctorName(
          prescription?.provider_name ||
            prescription?.doctor,
          'Doctor'
        )
      : cleanText(
          prescription?.provider_name ||
            prescription?.doctor,
          'Healthcare Provider'
        );

  const specialty = cleanText(
    prescription?.specialty,
    rawRole.toLowerCase() === 'doctor'
      ? 'General Practitioner'
      : 'Registered General Nurse'
  );

  const patientName = formatPatientName(
    {
      full_name:
        prescription?.patient_name ||
        patientProfile?.full_name ||
        patientProfile?.name,
      id:
        prescription?.patient_id ||
        patientProfile?.id,
    },
    'Patient'
  );

  const patientNic = cleanText(
    prescription?.patient_nic ||
      patientProfile?.nic_no ||
      patientProfile?.nic,
    'N/A'
  );

  const patientPhone = cleanText(
    prescription?.patient_phone ||
      patientProfile?.phone ||
      patientProfile?.emergency_contact,
    'N/A'
  );

  const dateText = formatDate(
    prescription?.created_at ||
      prescription?.date
  );

  const rawItems = Array.isArray(
    prescription?.items
  )
    ? prescription.items
    : [];

  const items =
    rawItems.length > 0
      ? rawItems
      : [
          {
            drug_name: cleanText(
              prescription?.medicine,
              'Prescribed Medication'
            ),
            generic_name: '',
            dosage: '-',
            frequency: '-',
            duration: cleanText(
              prescription?.duration,
              'As directed'
            ),
            instruction: cleanText(
              prescription?.instruction,
              'Follow provider instructions'
            ),
          },
        ];

  const rowsHtml = items
    .map(
      (item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <strong>${escapeHtml(
            cleanText(
              item.drug_name,
              'Medicine'
            )
          )}</strong>
          ${
            cleanText(item.generic_name)
              ? `<div style="color:#64748b;font-size:11px;margin-top:2px;">Generic: ${escapeHtml(
                  item.generic_name
                )}</div>`
              : ''
          }
        </td>
        <td>${escapeHtml(
          cleanText(item.dosage, 'N/A')
        )}</td>
        <td>${escapeHtml(
          cleanText(item.frequency, 'N/A')
        )}</td>
        <td>${escapeHtml(
          cleanText(item.duration, 'N/A')
        )}</td>
        <td>${escapeHtml(
          cleanText(item.instruction, 'N/A')
        )}</td>
      </tr>`
    )
    .join('');

  const notes = cleanText(prescription?.notes);

  const bodyHtml = `
    <div class="header">
      <div>
        <div class="tag">Digital Prescription Record</div>
        <h1 class="title">Rx ID: ${escapeHtml(
          rxId
        )}</h1>
        <div class="subtitle">Where Is My Doctor • Home Healthcare Platform</div>
      </div>
      <div style="text-align:right;">
        <div class="box-label">Date Prescribed</div>
        <div class="box-value">${escapeHtml(
          dateText
        )}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-label">Prescribed By</div>
        <div class="box-value">${escapeHtml(
          doctorName
        )}</div>
        <div class="box-sub">${escapeHtml(
          specialty
        )}</div>
      </div>
      <div class="box">
        <div class="box-label">Patient Information</div>
        <div class="box-value">${escapeHtml(
          patientName
        )}</div>
        <div class="box-sub">NIC: ${escapeHtml(
          patientNic
        )} • Contact: ${escapeHtml(
    patientPhone
  )}</div>
      </div>
    </div>

    <div class="box-label">Prescribed Medications (${
      items.length
    })</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    ${
      notes && notes.toLowerCase() !== 'none'
        ? `<div class="notes">
            <div class="box-label" style="color:#0f766e;">Clinical / Provider Notes</div>
            <div style="font-size:13px;line-height:1.5;color:#1e293b;">${escapeHtml(
              notes
            )}</div>
          </div>`
        : ''
    }

    <div class="barcode">
      <div class="barcode-box">||||| |||| || |||| ||||| |||||</div>
      <div class="barcode-caption">Verified Digital Prescription — Present at Pharmacy (${escapeHtml(
        rxId
      )})</div>
    </div>
  `;

  openPrintWindow(
    `Prescription_${rxId}`,
    bodyHtml
  );
}

export function downloadReceiptPdf(invoice) {
  const receiptId = String(
    invoice?.id || ''
  ).startsWith('INV-')
    ? invoice.id
    : `INV-${invoice?.id || '0'}`;

  const service = cleanText(
    invoice?.service_type || invoice?.service,
    'Home Healthcare Visit'
  );
  const providerName = cleanText(
    invoice?.provider_name ||
      invoice?.providerName,
    'Healthcare Provider'
  );
  const providerRole = cleanText(
    invoice?.provider_role ||
      invoice?.providerType,
    'Doctor'
  );
  const paymentMethod = cleanText(
    invoice?.payment_method || invoice?.method,
    'Card'
  );
  const paidDate = formatDate(
    invoice?.paid_at ||
      invoice?.created_at ||
      invoice?.date ||
      new Date().toISOString()
  );
  const amount = Number(
    invoice?.amount ?? invoice?.total ?? 0
  );

  const bodyHtml = `
    <div class="header">
      <div>
        <div class="tag" style="color:#16a34a;">Healthcare Home Payment Receipt</div>
        <h1 class="title">Receipt ${escapeHtml(
          receiptId
        )}</h1>
        <div class="subtitle">Official Transaction Confirmation</div>
      </div>
      <div style="text-align:right;">
        <div class="box-label">Status</div>
        <div class="box-value" style="color:#16a34a;">PAID</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-label">Paid To</div>
        <div class="box-value">${escapeHtml(
          providerName
        )}</div>
        <div class="box-sub">${escapeHtml(
          providerRole
        )}</div>
      </div>
      <div class="box">
        <div class="box-label">Transaction Details</div>
        <div class="box-value">${escapeHtml(
          paymentMethod
        )} Payment</div>
        <div class="box-sub">Date: ${escapeHtml(
          paidDate
        )}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Provider</th>
          <th>Method</th>
          <th style="text-align:right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${escapeHtml(
            service
          )}</strong></td>
          <td>${escapeHtml(providerName)}</td>
          <td>${escapeHtml(paymentMethod)}</td>
          <td style="text-align:right;font-weight:800;color:#0f766e;">${escapeHtml(
            formatCurrency(amount)
          )}</td>
        </tr>
      </tbody>
    </table>

    <div class="barcode">
      <div class="barcode-box">|||| ||||| |||| ||| ||||| ||||</div>
      <div class="barcode-caption">Verified Payment Receipt (${escapeHtml(
        receiptId
      )})</div>
    </div>
  `;

  openPrintWindow(
    `Receipt_${receiptId}`,
    bodyHtml
  );
}

