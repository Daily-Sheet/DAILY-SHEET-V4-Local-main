import PDFDocument from "pdfkit";

interface GearRequestPdfData {
  orgName: string;
  showName: string;
  venueName?: string;
  date: string;
  requestedByName: string;
  department?: string;
  recipientEmail: string;
  items: string;
  notes?: string;
  timestamp: string;
}

const COLORS = {
  darkBg: "#1e293b",
  white: "#ffffff",
  lightGray: "#f8fafc",
  border: "#cbd5e1",
  text: "#1e293b",
  textSecondary: "#64748b",
  accent: "#3b82f6",
};

export function generateGearRequestPdf(data: GearRequestPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "portrait",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: `Gear Request - ${data.showName}`,
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
    doc.roundedRect(startX, y, pageW, 55, 4).fill(COLORS.darkBg);
    doc.restore();

    doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.white);
    doc.text("GEAR REQUEST", startX + 14, y + 10, { width: pageW - 28 });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.white);
    doc.text(`${data.orgName}`, startX + 14, y + 34, { width: pageW - 28 });
    y += 65;

    const drawField = (label: string, value: string) => {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textSecondary);
      doc.text(label.toUpperCase(), startX, y, { width: pageW });
      y += 13;
      doc.font("Helvetica").fontSize(11).fillColor(COLORS.text);
      doc.text(value, startX, y, { width: pageW });
      y += 18;
    };

    drawField("Show", data.showName);
    if (data.venueName) drawField("Venue", data.venueName);
    drawField("Date", data.date);
    drawField("Requested By", `${data.requestedByName}${data.department ? ` · ${data.department}` : ""}`);
    drawField("Sent To", data.recipientEmail);
    y += 6;

    doc.save();
    doc.moveTo(startX, y).lineTo(startX + pageW, y).stroke(COLORS.border);
    doc.restore();
    y += 14;

    doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.text);
    doc.text("Items Requested", startX, y, { width: pageW });
    y += 20;

    doc.save();
    doc.roundedRect(startX, y, pageW, 2, 0).fill(COLORS.lightGray);
    doc.restore();

    const itemLines = data.items.split("\n");
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);

    for (const line of itemLines) {
      if (y + 16 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      const trimmed = line.trim();
      if (trimmed) {
        doc.circle(startX + 5, y + 5, 2).fill(COLORS.accent);
        doc.fillColor(COLORS.text);
        doc.text(trimmed, startX + 14, y, { width: pageW - 14 });
      }
      y += 16;
    }

    y += 10;

    if (data.notes) {
      if (y + 60 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      doc.save();
      doc.moveTo(startX, y).lineTo(startX + pageW, y).stroke(COLORS.border);
      doc.restore();
      y += 14;

      doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.text);
      doc.text("Notes", startX, y, { width: pageW });
      y += 20;

      doc.font("Helvetica").fontSize(10).fillColor(COLORS.textSecondary);
      doc.text(data.notes, startX, y, { width: pageW });
      y += doc.heightOfString(data.notes, { width: pageW }) + 10;
    }

    y += 20;
    if (y + 20 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.textSecondary);
    doc.text(`Generated ${data.timestamp}`, startX, y, { width: pageW, align: "right" });

    doc.end();
  });
}
