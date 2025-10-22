// index.ts — Supabase Edge Function (Deno) using pdf-lib
// Renders a PDF that matches the provided "X-RAY AND ULTRASOUND REQUEST FORM" design.

import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

// ---------- CONFIG ----------
const PAGE = {
  // A4 portrait
  width: 595.28,
  height: 841.89,
  margin: 24,
};
const COLORS = {
  black: rgb(0, 0, 0),
  grayDark: rgb(0.2, 0.2, 0.2),
  gray: rgb(0.5, 0.5, 0.5),
  grayLight: rgb(0.9, 0.9, 0.9),
  gridHeader: rgb(0.95, 0.95, 0.95),
  // header band similar to image
  primeGreen: rgb(0.62, 0.78, 0.15),
  sectionTeal: rgb(0.84, 0.94, 0.94),
  sectionGreen: rgb(0.89, 0.96, 0.89),
  sectionBlue: rgb(0.88, 0.93, 0.98),
  footerBar: rgb(0.88, 0.93, 0.98),
};

// ---------- DATA (codes & parts) ----------
type Row = { code: string; part: string };
type Section = { title: string; tint: "teal" | "green" | "blue" | null; rows: Row[] };
type Panel = { sections: Section[] };

const TINT = {
  teal: COLORS.sectionTeal,
  green: COLORS.sectionGreen,
  blue: COLORS.sectionBlue,
};

const LEFT_PANEL: Panel = {
  sections: [
    {
      title: "CHEST AND ABDOMEN",
      tint: "teal",
      rows: [
        { code: "3445", part: "Chest" },
        { code: "3449", part: "Chest and Ribs" },
        { code: "3477", part: "Abdomen" },
        { code: "3479", part: "Acute Abdomen" },
        { code: "0000", part: "Thoracic inlet" },
        { code: "0000", part: "KUB" },
      ],
    },
    {
      title: "UPPER EXTREMITIES",
      tint: "green",
      rows: [
        { code: "3305", part: "Finger" },
        { code: "3305", part: "Hand" },
        { code: "3305", part: "Wrist" },
        { code: "3367", part: "Forearm" },
        { code: "3907", part: "Elbow" },
        { code: "3907", part: "Humerus" },
        { code: "3907", part: "Shoulder" },
        { code: "3907", part: "Clavicle" },
        { code: "3907", part: "Scapula" },
      ],
    },
    {
      title: "LOWER EXTREMITIES",
      tint: "teal",
      rows: [
        { code: "3305", part: "Toe" },
        { code: "3307", part: "Foot" },
        { code: "3307", part: "Ankle" },
        { code: "3307", part: "Tibia & Fibula" },
        { code: "3307", part: "Knee" },
        { code: "3307", part: "Femur" },
        { code: "3307", part: "Hip" },
        { code: "3331", part: "Pelvis" },
        { code: "3321", part: "Sacroiliac Joints" },
        { code: "0000", part: "Other: Specify" },
      ],
    },
  ],
};

const MIDDLE_PANEL: Panel = {
  sections: [
    {
      title: "SPINE AND PELVIS",
      tint: "blue",
      rows: [
        { code: "3321", part: "Cervical Spine" },
        { code: "3321", part: "Thoracic Spine" },
        { code: "3321", part: "Lumbar Spine" },
        { code: "3321", part: "Sacrum" },
        { code: "3321", part: "Coccyx" },
        { code: "3321", part: "Whole Spine & Pelvis" },
        { code: "3317", part: "Skeletal Survey" },
        { code: "0000", part: "Pelvis" },
        { code: "0000", part: "Hips" },
        { code: "0000", part: "Skeletal Survey ≤5 years old" },
        { code: "0000", part: "Skeletal Survey >5 years old" },
      ],
    },
    {
      title: "HEAD AND NECK",
      tint: "blue",
      rows: [
        { code: "3349", part: "Skull" },
        { code: "3351", part: "Sinuses" },
        { code: "3385", part: "Post Nasal" },
        { code: "3355", part: "Mandible" },
        { code: "3367", part: "TMJ" },
        { code: "3353", part: "Facial Bones" },
        { code: "3357", part: "Nasal Bone" },
        { code: "3359", part: "Mastoids" },
        { code: "3443", part: "Soft Tissue Neck" },
        { code: "3468", part: "Thoracic Inlet" },
        { code: "3451", part: "Sternum" },
        { code: "3451", part: "Sternoclavicular Jt" },
        { code: "0000", part: "Other: Specify" },
      ],
    },
  ],
};

const RIGHT_PANEL: Panel = {
  sections: [
    {
      title: "SPECIAL EXAMS",
      tint: "blue",
      rows: [
        { code: "3399", part: "Barium Swallow" },
        { code: "3403", part: "Barium Meal" },
        { code: "3409", part: "Barium Enema" },
        { code: "3487", part: "IVU" },
        { code: "3499", part: "Urethrogram" },
        { code: "3497", part: "Cystogram" },
        { code: "3425", part: "OCG" },
        { code: "3519", part: "HSG" },
        { code: "3695", part: "Sialogram" },
        { code: "3603", part: "Sinogram" },
        { code: "3345", part: "Venogram" },
      ],
    },
    {
      title: "ULTRASOUND",
      tint: "blue",
      rows: [
        { code: "3627", part: "Abdomen" },
        { code: "3628", part: "Renal Tract" },
        { code: "3618", part: "Pelvis Transabdominal" },
        { code: "5100", part: "Pelvis Organs: Transvaginal" },
        { code: "3629", part: "Soft Tissue" },
        { code: "3615", part: "Obstetric" },
        { code: "3617", part: "Obstetric F/UP" },
        { code: "3629", part: "Thyroid" },
        { code: "3629", part: "Scrotum" },
        { code: "3629", part: "Breast" },
        { code: "3629", part: "Prostate Transabdominal" },
        { code: "0000", part: "Thyroid / Neck" },
        { code: "0000", part: "Ultrasound Soft Tissue any Region" },
        { code: "0000", part: "Neonatal Head Scan" },
        { code: "0000", part: "Pleural Space Ultrasound" },
        { code: "0000", part: "Peripheral Venous Ultrasound Study" },
        { code: "0000", part: "Peripheral Arterial Ultrasound Vascular Study (GHP)" },
        { code: "0000", part: "Carotid Ultrasound Vascular Study" },
      ],
    },
  ],
};

// ---------- HELPERS ----------
function keyFor(r: Row) {
  return [`${r.code}`, `${r.code}:${r.part}`];
}

function drawTickBox(page: any, x: number, centerY: number, size = 10, checked = false) {
  const y = centerY - size / 2;
  page.drawRectangle({ x, y, width: size, height: size, borderWidth: 1 });
  if (checked) {
    const p = 2;
    page.drawLine({ start: { x: x + p, y: y + p }, end: { x: x + size - p, y: y + size - p }, thickness: 1 });
    page.drawLine({ start: { x: x + p, y: y + size - p }, end: { x: x + size - p, y: y + p }, thickness: 1 });
  }
}

function drawInput(page: any, font: any, label: string, x: number, yTop: number, w: number, h = 16, value?: string) {
  page.drawText(label, { x, y: yTop + 3, size: 8, font });
  const y = yTop - h;
  page.drawRectangle({ x, y, width: w, height: h, borderWidth: 1 });
  if (value) {
    page.drawText(value, { x: x + 4, y: y + 4, size: 10, font });
  }
  return y; // bottom
}

function drawUnderlineText(page: any, font: any, label: string, x: number, y: number, w: number, underlineY: number) {
  page.drawText(label, { x, y, size: 10, font });
  page.drawLine({ start: { x, y: underlineY }, end: { x: x + w, y: underlineY }, thickness: 1 });
}

// ---------- MAIN RENDER ----------
async function renderPdf(body: any) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  const { width, height } = page.getSize();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // -- Header band
  const bandH = 28;
  page.drawRectangle({
    x: 0,
    y: height - bandH - 18,
    width,
    height: bandH,
    color: COLORS.primeGreen,
  });
  page.drawText("X-RAY AND ULTRASOUND REQUEST FORM", {
    x: PAGE.margin,
    y: height - bandH - 6,
    size: 12,
    font: fontBold,
    color: COLORS.black,
  });

  // Logo (Medi Response)
  try {
    const logoRes = await fetch("https://mediresponse.co.za/wp-content/uploads/2021/06/Medi-Response-Long-Logo.png");
    const logoBytes = await logoRes.arrayBuffer();
    const logo = await pdf.embedPng(logoBytes);
    const logoW = 150;
    const logoH = (logoW / logo.width) * logo.height;
    page.drawImage(logo, {
      x: width - PAGE.margin - logoW,
      y: height - bandH - 10,
      width: logoW,
      height: logoH,
    });
  } catch {
    // Logo loading failed; continue without blocking
  }

  // -- Patient details block
  let y = height - bandH - 40;
  const left = PAGE.margin;
  const colGap = 10;

  // Top row: Name, Sex, LNMP
  const nameW = 250;
  drawInput(page, font, "Name:", left, y, nameW, 16, body?.patient?.name);
  const sexW = 60;
  drawInput(page, font, "Sex:", left + nameW + colGap, y, sexW, 16, body?.patient?.sex);
  const lnmpW = 90;
  drawInput(page, font, "LNMP:", left + nameW + colGap + sexW + colGap, y, lnmpW, 16, body?.patient?.lnmp);

  // Row 2: ID, DOB, Date
  y -= 26;
  const idW = 180;
  drawInput(page, font, "I.D. Number:", left, y, idW, 16, body?.patient?.idNumber);
  const dobW = 150;
  drawInput(page, font, "DOB:", left + idW + colGap, y, dobW, 16, body?.patient?.dob);
  const dateW = 150;
  drawInput(page, font, "Date:", left + idW + colGap + dobW + colGap, y, dateW, 16, body?.patient?.date);

  // Row 3: Private checkbox + Medical Aid checkbox and inputs
  y -= 26;
  // Private
  page.drawText("Private:", { x: left, y: y + 3, size: 10, font });
  drawTickBox(page, left + 46, y + 8, 10, !!body?.patient?.private);

  // Medical aid checkbox + name + number
  const maX = left + 80;
  page.drawText("Medical Aid:", { x: maX, y: y + 3, size: 10, font });
  drawTickBox(page, maX + 68, y + 8, 10, !!body?.patient?.medicalAid?.isMember);

  const maNameX = maX + 88;
  const maNameW = 180;
  drawInput(page, font, "Name of Medical Aid", maNameX, y + 12, maNameW, 16, body?.patient?.medicalAid?.name || "");
  const maNumX = maNameX + maNameW + colGap;
  const maNumW = 160;
  drawInput(page, font, "Medical Aid Number:", maNumX, y + 12, maNumW, 16, body?.patient?.medicalAid?.number || "");

  // Caption before grid
  y -= 18;
  page.drawText("Tick organ / region to be examined", {
    x: left,
    y,
    size: 10,
    font,
  });

  // ---- GRID (3 columns) ----
  const gridTop = y - 12;
  const colWidth = (width - PAGE.margin * 2 - colGap * 2) / 3;
  const rowH = 18;
  const headerH = 18;
  const codeW = 54;
  const tickW = 40;

  const selected: Set<string> = new Set((body?.selected || []).map((s: string) => String(s)));

  function drawColumnHeader(x: number, topY: number, w: number) {
    page.drawRectangle({ x, y: topY - headerH, width: w, height: headerH, color: COLORS.gridHeader, borderWidth: 1 });
    page.drawText("CODE", { x: x + 6, y: topY - 13, size: 10, font: fontBold });
    page.drawText("PART", { x: x + codeW + 6, y: topY - 13, size: 10, font: fontBold });
    page.drawText("TICK", { x: x + w - tickW + 10, y: topY - 13, size: 10, font: fontBold });
    // verticals
    page.drawLine({ start: { x: x + codeW, y: topY - headerH }, end: { x: x + codeW, y: topY }, thickness: 1 });
    page.drawLine({ start: { x: x + w - tickW, y: topY - headerH }, end: { x: x + w - tickW, y: topY }, thickness: 1 });
  }

  function drawSectionTitle(x: number, topY: number, w: number, title: string, tint: keyof typeof TINT | null) {
    const h = 18;
    page.drawRectangle({ x, y: topY - h, width: w, height: h, color: tint ? TINT[tint] : undefined, borderWidth: 1 });
    page.drawText(title, { x: x + 6, y: topY - 13, size: 10, font: fontBold });
    return h;
  }

  function drawRows(x: number, yStart: number, w: number, rows: Row[]) {
    let y0 = yStart;
    for (const r of rows) {
      page.drawRectangle({ x, y: y0 - rowH, width: w, height: rowH, borderWidth: 1 });
      page.drawText(r.code, { x: x + 6, y: y0 - 13, size: 10, font });
      page.drawText(r.part, { x: x + codeW + 6, y: y0 - 13, size: 10, font });

      const isChecked = keyFor(r).some((k) => selected.has(k));
      drawTickBox(page, x + w - tickW + 12, y0 - rowH / 2, 10, isChecked);
      y0 -= rowH;
    }
    return y0;
  }

  function drawPanel(x: number, topY: number, panel: Panel) {
    let yy = topY;
    drawColumnHeader(x, yy, colWidth);
    yy -= headerH;
    for (const sec of panel.sections) {
      yy -= drawSectionTitle(x, yy, colWidth, sec.title, sec.tint);
      yy = drawRows(x, yy, colWidth, sec.rows);
    }
  }

  const x1 = PAGE.margin;
  const x2 = PAGE.margin + colWidth + colGap;
  const x3 = PAGE.margin + (colWidth + colGap) * 2;

  drawPanel(x1, gridTop, LEFT_PANEL);
  drawPanel(x2, gridTop, MIDDLE_PANEL);
  drawPanel(x3, gridTop, RIGHT_PANEL);

  // --- Footnote
  const footnoteY = gridTop - 18 - headerH - 360; // rough spacing; form has long grid
  page.drawText("*If you are pregnant or suspect to be pregnant, please inform your doctor or radiographer", {
    x: PAGE.margin,
    y: footnoteY,
    size: 9,
    font,
    color: COLORS.grayDark,
  });

  // --- Clinical History box
  let chTop = footnoteY - 18;
  page.drawText("Clinical History", { x: PAGE.margin, y: chTop, size: 10, font: fontBold });
  const chH = 70;
  page.drawRectangle({
    x: PAGE.margin,
    y: chTop - chH - 6,
    width: width - PAGE.margin * 2,
    height: chH,
    borderWidth: 1,
  });
  if (body?.clinicalHistory) {
    page.drawText(String(body.clinicalHistory), {
      x: PAGE.margin + 6,
      y: chTop - 18,
      size: 10,
      font,
      lineHeight: 12,
      maxWidth: width - PAGE.margin * 2 - 12,
    });
  }

  // --- Doctor details
  const docY = chTop - chH - 24;
  const nameW2 = 240;
  const prW = 180;
  drawUnderlineText(page, font, "Doctor's Name", PAGE.margin, docY, nameW2, docY - 4);
  if (body?.doctor?.name) page.drawText(body.doctor.name, { x: PAGE.margin + 110, y: docY, size: 10, font });
  drawUnderlineText(page, font, "Practice Number", PAGE.margin + nameW2 + 24, docY, prW, docY - 4);
  if (body?.doctor?.practiceNumber)
    page.drawText(body.doctor.practiceNumber, { x: PAGE.margin + nameW2 + 24 + 120, y: docY, size: 10, font });
  drawUnderlineText(page, font, "Signature", PAGE.margin + nameW2 + 24 + prW + 24, docY, 120, docY - 4);

  // --- Footer contact bar (edit to your actual copy)
  const fbH = 28;
  page.drawRectangle({ x: 0, y: 0, width, height: fbH, color: COLORS.footerBar });
  const footer =
    "Tel: 686 4455 | Plot 720/721 | Tsheko-Tsheko Road | Maun     Tel: 354 6580 | Plot 60601 | Block 7 | Gaborone";
  page.drawText(footer, { x: PAGE.margin, y: 10, size: 9, font });

  return await pdf.save();
}

// ---------- HTTP HANDLER ----------
Deno.serve(async (req) => {
  try {
    const body = await (async () => {
      try {
        return await req.json();
      } catch {
        return {};
      }
    })();

    const bytes = await renderPdf(body);

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="xray-ultrasound-request.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
