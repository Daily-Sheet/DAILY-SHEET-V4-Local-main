import PDFDocument from "pdfkit";

interface TimesheetRow {
  date: string;
  employeeName: string;
  position: string;
  timeIn: string;
  mealBreakOut: string;
  mealBreakIn: string;
  timeOut: string;
  paidMealBreak: boolean;
  totalHours: string;
  initials: string;
}

interface TimesheetPdfData {
  orgName: string;
  showName: string;
  projectName?: string;
  projectNumber?: string;
  rows: TimesheetRow[];
}

const COLORS = {
  darkBg: "#1e293b",
  white: "#ffffff",
  lightGray: "#f8fafc",
  border: "#cbd5e1",
  text: "#1e293b",
  textSecondary: "#64748b",
  headerBg: "#334155",
};

export function generateTimesheetPdf(data: TimesheetPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "landscape",
      margins: { top: 30, bottom: 30, left: 30, right: 30 },
      bufferPages: true,
      info: {
        Title: `Time Sheet - ${data.showName}`,
        Author: data.orgName,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    let y = doc.page.margins.top;

    doc.save();
    doc.roundedRect(startX, y, pageW, 50, 4).fill(COLORS.darkBg);
    doc.restore();

    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.white);
    doc.text(`${data.orgName.toUpperCase()} – SHOW TIME SHEET`, startX + 12, y + 10, { width: pageW - 24 });
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.white);
    doc.text("Hours Worked", startX + 12, y + 32, { width: pageW - 24 });

    y += 60;

    if (data.projectName) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text);
      const projectLabel = data.projectNumber
        ? `PROJECT: ${data.projectName} (#${data.projectNumber})`
        : `PROJECT: ${data.projectName}`;
      doc.text(projectLabel, startX, y);
      y += 16;
    }
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text);
    doc.text(`SHOW: ${data.showName}`, startX, y);
    y += 22;

    const colWidths = [62, 120, 100, 58, 62, 62, 58, 52, 58, 50];
    const headers = ["DATE", "EMPLOYEE", "POSITION", "TIME IN", "MEAL OUT", "MEAL IN", "TIME OUT", "PAID\nBREAK", "TOTAL\nHRS", "INITIALS"];

    const headerH = 28;
    doc.save();
    doc.rect(startX, y, pageW, headerH).fill(COLORS.headerBg);
    doc.restore();

    doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.white);
    let cx = startX;
    headers.forEach((h, i) => {
      doc.text(h, cx + 3, y + 4, { width: colWidths[i] - 6, align: "center" });
      cx += colWidths[i];
    });
    y += headerH;

    doc.font("Helvetica").fontSize(8).fillColor(COLORS.text);

    const rowH = 20;
    data.rows.forEach((row, idx) => {
      if (y + rowH > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      if (idx % 2 === 0) {
        doc.save();
        doc.rect(startX, y, pageW, rowH).fill(COLORS.lightGray);
        doc.restore();
      }

      doc.save();
      doc.rect(startX, y, pageW, rowH).stroke(COLORS.border);
      doc.restore();

      const vals = [
        row.date,
        row.employeeName,
        row.position,
        row.timeIn,
        row.mealBreakOut,
        row.mealBreakIn,
        row.timeOut,
        row.paidMealBreak ? "PAID" : "UNPAID",
        row.totalHours,
        row.initials,
      ];

      doc.fillColor(COLORS.text).font("Helvetica").fontSize(8);
      cx = startX;
      vals.forEach((v, i) => {
        doc.text(v || "", cx + 3, y + 5, { width: colWidths[i] - 6, align: "center", lineBreak: false });
        cx += colWidths[i];
      });

      cx = startX;
      colWidths.forEach((w) => {
        doc.save();
        doc.moveTo(cx, y).lineTo(cx, y + rowH).stroke(COLORS.border);
        doc.restore();
        cx += w;
      });

      y += rowH;
    });

    if (data.rows.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.textSecondary);
      doc.text("No entries recorded.", startX, y + 10, { width: pageW, align: "center" });
      y += 30;
    }

    y += 20;
    if (y + 40 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    doc.font("Helvetica").fontSize(7).fillColor(COLORS.textSecondary);
    doc.text(
      "By my initials above, I certify the information recorded on this time sheet is true and accurate. I certify that I have received all rest periods and meal breaks to which I was entitled during this workday, show, or event except as noted.",
      startX,
      y,
      { width: pageW, align: "left" }
    );

    doc.end();
  });
}
