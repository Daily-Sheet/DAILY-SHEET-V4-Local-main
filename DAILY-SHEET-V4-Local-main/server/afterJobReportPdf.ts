import PDFDocument from "pdfkit";

interface ReportPdfData {
  eventName: string;
  eventDate: string;
  venueName: string;
  venueAddress: string;
  projectName: string;
  submittedBy: string;
  rating?: number | null;
  wentAsPlanned?: boolean | null;
  summary?: string | null;
  issueCategory?: string | null;
  issueDescription?: string | null;
  hadInjuries?: boolean | null;
  injuryDescription?: string | null;
  hadEquipmentIssues?: boolean | null;
  equipmentDescription?: string | null;
  hadUnplannedExpenses?: boolean | null;
  expenseAmount?: string | null;
  expenseDescription?: string | null;
  attendanceEstimate?: number | null;
  clientNotes?: string | null;
  venueNotes?: string | null;
}

const COLORS = {
  darkBg: "#1e293b",
  white: "#ffffff",
  lightGray: "#f8fafc",
  border: "#e2e8f0",
  lightBorder: "#f1f5f9",
  text: "#1e293b",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  sectionLabel: "#475569",
  link: "#2563eb",
  redBg: "#7f1d1d",
  amberBg: "#78350f",
  redLight: "#fef2f2",
  redBorder: "#fecaca",
  amberLight: "#fffbeb",
  amberBorder: "#fde68a",
};

function drawRoundedRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, r: number, fill: string) {
  doc.save();
  doc.roundedRect(x, y, w, h, r).fill(fill);
  doc.restore();
}

function checkPageSpace(doc: PDFKit.PDFDocument, needed: number) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottomLimit) {
    doc.addPage();
  }
}

export async function generateAfterJobReportPdf(data: ReportPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: `After Job Report - ${data.eventName}`,
        Author: data.submittedBy,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftMargin = doc.page.margins.left;

    // ── Title Header ──
    doc.fontSize(20).font("Helvetica-Bold").fillColor(COLORS.text);
    doc.text("AFTER JOB REPORT", leftMargin, doc.page.margins.top, { align: "center", width: pageWidth });
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica").fillColor(COLORS.textSecondary);
    doc.text(data.eventDate || "", { align: "center", width: pageWidth });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor(COLORS.textTertiary);
    doc.text(`Submitted by ${data.submittedBy}`, { align: "center", width: pageWidth });
    doc.moveDown(1.5);

    // ── Dark Header Bar (event name + venue info) ──
    const contentWidth = pageWidth - 24;
    const headerTitle = data.projectName
      ? `${data.eventName.toUpperCase()}  (${data.projectName})`
      : data.eventName.toUpperCase();

    doc.font("Helvetica-Bold").fontSize(13);
    const titleH = doc.heightOfString(headerTitle, { width: contentWidth });
    let totalHeaderH = 10 + titleH + 6;

    let venueText = "";
    let venueTextH = 0;
    if (data.venueName) {
      venueText = data.venueName;
      if (data.venueAddress) venueText += ` — ${data.venueAddress}`;
      doc.font("Helvetica").fontSize(9);
      venueTextH = doc.heightOfString(venueText, { width: contentWidth });
      totalHeaderH += venueTextH + 4;
    }
    totalHeaderH += 8;

    checkPageSpace(doc, totalHeaderH + 20);
    const headerY = doc.y;
    drawRoundedRect(doc, leftMargin, headerY, pageWidth, totalHeaderH, 4, COLORS.darkBg);

    doc.fontSize(13).font("Helvetica-Bold").fillColor(COLORS.white);
    doc.text(headerTitle, leftMargin + 12, headerY + 10, { width: contentWidth });

    if (data.venueName) {
      doc.fontSize(9).font("Helvetica").fillColor("#d1d5db");
      doc.text(venueText, leftMargin + 12, headerY + 10 + titleH + 4, { width: contentWidth });
    }

    doc.y = headerY + totalHeaderH + 8;

    // ── Overview Table ──
    const overviewRows: Array<{ label: string; value: string }> = [];
    if (data.rating != null) {
      overviewRows.push({ label: "Rating", value: `${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}  (${data.rating}/5)` });
    }
    overviewRows.push({
      label: "Went as Planned",
      value: data.wentAsPlanned === true ? "Yes" : data.wentAsPlanned === false ? "No" : "N/A",
    });
    if (data.attendanceEstimate) {
      overviewRows.push({ label: "Attendance Estimate", value: `~${data.attendanceEstimate}` });
    }

    if (overviewRows.length > 0) {
      renderKeyValueTable(doc, overviewRows, pageWidth, leftMargin);
      doc.moveDown(0.8);
    }

    // ── Summary ──
    if (data.summary) {
      checkPageSpace(doc, 60);
      renderSectionLabel(doc, "SUMMARY", pageWidth, leftMargin);
      renderTextBlock(doc, data.summary, pageWidth, leftMargin);
      doc.moveDown(0.8);
    }

    // ── Issues ──
    if (data.wentAsPlanned === false && (data.issueCategory || data.issueDescription)) {
      checkPageSpace(doc, 80);
      renderColoredSection(doc, "ISSUES", COLORS.redBg, pageWidth, leftMargin);
      const issueRows: Array<{ label: string; value: string }> = [];
      if (data.issueCategory) issueRows.push({ label: "Category", value: data.issueCategory });
      if (issueRows.length > 0) {
        renderKeyValueTable(doc, issueRows, pageWidth, leftMargin);
      }
      if (data.issueDescription) {
        doc.moveDown(0.3);
        renderTextBlock(doc, data.issueDescription, pageWidth, leftMargin);
      }
      doc.moveDown(0.8);
    }

    // ── Injuries ──
    if (data.hadInjuries) {
      checkPageSpace(doc, 60);
      renderColoredSection(doc, "INJURIES REPORTED", COLORS.redBg, pageWidth, leftMargin);
      if (data.injuryDescription) {
        renderTextBlock(doc, data.injuryDescription, pageWidth, leftMargin);
      }
      doc.moveDown(0.8);
    }

    // ── Equipment Issues ──
    if (data.hadEquipmentIssues) {
      checkPageSpace(doc, 60);
      renderColoredSection(doc, "EQUIPMENT ISSUES", COLORS.amberBg, pageWidth, leftMargin);
      if (data.equipmentDescription) {
        renderTextBlock(doc, data.equipmentDescription, pageWidth, leftMargin);
      }
      doc.moveDown(0.8);
    }

    // ── Unplanned Expenses ──
    if (data.hadUnplannedExpenses) {
      checkPageSpace(doc, 80);
      renderColoredSection(doc, "UNPLANNED EXPENSES", COLORS.amberBg, pageWidth, leftMargin);
      const expenseRows: Array<{ label: string; value: string }> = [];
      if (data.expenseAmount) expenseRows.push({ label: "Amount", value: `$${data.expenseAmount}` });
      if (expenseRows.length > 0) {
        renderKeyValueTable(doc, expenseRows, pageWidth, leftMargin);
      }
      if (data.expenseDescription) {
        doc.moveDown(0.3);
        renderTextBlock(doc, data.expenseDescription, pageWidth, leftMargin);
      }
      doc.moveDown(0.8);
    }

    // ── Client Notes ──
    if (data.clientNotes) {
      checkPageSpace(doc, 60);
      renderSectionLabel(doc, "CLIENT / VENUE CONTACT NOTES", pageWidth, leftMargin);
      renderTextBlock(doc, data.clientNotes, pageWidth, leftMargin);
      doc.moveDown(0.8);
    }

    // ── Venue Notes ──
    if (data.venueNotes) {
      checkPageSpace(doc, 60);
      renderSectionLabel(doc, "VENUE NOTES FOR NEXT TIME", pageWidth, leftMargin);
      renderTextBlock(doc, data.venueNotes, pageWidth, leftMargin);
      doc.moveDown(0.8);
    }

    // ── Footer ──
    doc.moveDown(1);
    const lineY = doc.y;
    doc.moveTo(leftMargin, lineY).lineTo(leftMargin + pageWidth, lineY).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font("Helvetica").fillColor(COLORS.textTertiary);
    doc.text("Generated by Daily Sheet", { align: "center", width: pageWidth });

    doc.end();
  });
}

/** Section label — matches the "CREW" / "GENERAL SCHEDULE" style from daily sheet */
function renderSectionLabel(doc: PDFKit.PDFDocument, title: string, pageWidth: number, leftMargin: number) {
  doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.sectionLabel);
  doc.text(title, leftMargin, doc.y, { width: pageWidth });
  doc.moveDown(0.3);
}

/** Colored rounded-rect header bar for alert sections (issues, injuries, expenses) */
function renderColoredSection(doc: PDFKit.PDFDocument, title: string, bgColor: string, pageWidth: number, leftMargin: number) {
  const contentWidth = pageWidth - 24;
  doc.font("Helvetica-Bold").fontSize(10);
  const titleH = doc.heightOfString(title, { width: contentWidth });
  const barH = titleH + 16;

  checkPageSpace(doc, barH + 20);
  const barY = doc.y;
  drawRoundedRect(doc, leftMargin, barY, pageWidth, barH, 4, bgColor);

  doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.white);
  doc.text(title, leftMargin + 12, barY + 8, { width: contentWidth });

  doc.y = barY + barH + 6;
}

/** Key-value table with alternating rows — matches daily sheet schedule table style */
function renderKeyValueTable(doc: PDFKit.PDFDocument, rows: Array<{ label: string; value: string }>, pageWidth: number, leftMargin: number) {
  const labelWidth = pageWidth * 0.35;
  const valueWidth = pageWidth * 0.65;
  const rowHeight = 20;
  const padding = 8;

  checkPageSpace(doc, rowHeight * Math.min(rows.length, 4));

  const tableStartY = doc.y;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowY = tableStartY + i * rowHeight;

    checkPageSpace(doc, rowHeight);

    // Alternating background
    if (i % 2 === 0) {
      doc.rect(leftMargin, rowY, pageWidth, rowHeight).fill(COLORS.lightGray);
    }
    // Bottom border
    doc.moveTo(leftMargin, rowY + rowHeight)
      .lineTo(leftMargin + pageWidth, rowY + rowHeight)
      .strokeColor(COLORS.lightBorder).lineWidth(0.3).stroke();

    // Label
    doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.sectionLabel);
    doc.text(row.label, leftMargin + padding, rowY + 6, { width: labelWidth - padding * 2 });

    // Value
    doc.fontSize(8).font("Helvetica").fillColor(COLORS.text);
    doc.text(row.value, leftMargin + labelWidth + padding, rowY + 6, { width: valueWidth - padding * 2 });
  }

  // Outer border
  const tableH = rows.length * rowHeight;
  doc.rect(leftMargin, tableStartY, pageWidth, tableH).strokeColor(COLORS.border).lineWidth(0.5).stroke();

  doc.y = tableStartY + tableH + 4;
}

/** Bordered text block for long-form content (summary, descriptions) */
function renderTextBlock(doc: PDFKit.PDFDocument, text: string, pageWidth: number, leftMargin: number) {
  const padding = 10;
  const contentWidth = pageWidth - padding * 2;

  doc.font("Helvetica").fontSize(9);
  const textH = doc.heightOfString(text, { width: contentWidth });
  const boxH = textH + padding * 2;

  checkPageSpace(doc, boxH);

  const boxY = doc.y;
  doc.rect(leftMargin, boxY, pageWidth, boxH).strokeColor(COLORS.border).lineWidth(0.5).stroke();

  doc.fontSize(9).font("Helvetica").fillColor(COLORS.text);
  doc.text(text, leftMargin + padding, boxY + padding, { width: contentWidth });

  doc.y = boxY + boxH + 4;
}
