// index.ts — Supabase Edge Function / Deno (Lovable)
// Renders a 3-column radiology request PDF matching the provided image layout
// Uses tick boxes drawn with vector lines (no text glyph drift)

import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

// --------------------- DATA ---------------------

type Row = { code: string; part: string };
type Section = { title: string; tint: { r: number; g: number; b: number } | null; rows: Row[] };
type Panel = { title: string; sections: Section[] };

// Light tints similar to your image
const TINTS = {
  teal: { r: 0.84, g: 0.94, b: 0.94 },
  green: { r: 0.89, g: 0.96, b: 0.89 },
  blue: { r: 0.88, g: 0.93, b: 0.98 },
};

const LEFT_PANEL: Panel = {
  title: "",
  sections: [
    {
      title: "CHEST AND ABDOMEN",
      tint: TINTS.teal,
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
      tint: TINTS.green,
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
      tint: TINTS.teal,
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
  title: "",
  sections: [
    {
      title: "SPINE AND PELVIS",
      tint: TINTS.blue,
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
      tint: TINTS.blue,
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
  title: "",
  sections: [
    {
      title: "SPECIAL EXAMS",
      tint: TINTS.blue,
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
      tint: TINTS.blue,
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

// --------------------- DRAW HELPERS ---------------------

function drawTickBox(page: any, x: number, centerY: number, size = 10, checked = false) {
  // pdf-lib uses bottom-left origin; we compute box bottom from center
  const y = centerY - size / 2;
  page.drawRectangle({ x, y, width: size, height: size, borderWidth: 1 });

  if (checked) {
    const pad = 2;
    page.drawLine({
      start: { x: x + pad, y: y + pad },
      end: { x: x + size - pad, y: y + size - pad },
      thickness: 1,
    });
    page.drawLine({
      start: { x: x + pad, y: y + size - pad },
      end: { x: x + size - pad, y: y + pad },
      thickness: 1,
    });
  }
}

function keyFor(row: Row) {
  // Allow either "code" or "code:part" to identify a selection
  return [`${row.code}`, `${row.code}:${row.part}`];
}

// --------------------- RENDERER ---------------------

async function renderPdf(selected: Set<string>) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]); // A4 landscape
  const { width, height } = page.getSize();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Page title
  const margin = 24;
  const title = "Tick organ / region to be examined";
  page.drawText(title, {
    x: margin,
    y: height - margin - 12,
    size: 12,
    font: fontBold,
  });

  // Grid
  const top = height - margin - 28;
  const colGap = 12;
  const colWidth = (width - margin * 2 - colGap * 2) / 3;
  const rowH = 18;

  // Column header renderer
  function drawColumnHeader(x: number, y: number, w: number) {
    const headerH = 18;
    page.drawRectangle({
      x,
      y: y - headerH,
      width: w,
      height: headerH,
      color: rgb(0.95, 0.95, 0.95),
      borderWidth: 1,
    });
    const codeW = 48;
    const tickW = 36;

    page.drawText("CODE", { x: x + 6, y: y - 13, size: 10, font: fontBold });
    page.drawText("PART", { x: x + codeW + 6, y: y - 13, size: 10, font: fontBold });
    page.drawText("TICK", { x: x + w - tickW + 9, y: y - 13, size: 10, font: fontBold });

    // vertical lines
    page.drawLine({ start: { x: x + codeW, y: y - headerH }, end: { x: x + codeW, y }, thickness: 1 });
    page.drawLine({ start: { x: x + w - tickW, y: y - headerH }, end: { x: x + w - tickW, y }, thickness: 1 });

    return { codeW, tickW, headerH };
  }

  function drawSectionTitle(x: number, y: number, w: number, title: string, tint: Section["tint"]) {
    const h = 18;
    const fill = tint ? rgb(tint.r, tint.g, tint.b) : undefined;
    page.drawRectangle({ x, y: y - h, width: w, height: h, color: fill, borderWidth: 1 });
    page.drawText(title, { x: x + 6, y: y - 13, size: 10, font: fontBold });
    return h;
  }

  function drawRows(x: number, yStart: number, w: number, rows: Row[], codeW: number, tickW: number) {
    let y = yStart;
    for (const r of rows) {
      // row background & border
      page.drawRectangle({ x, y: y - rowH, width: w, height: rowH, borderWidth: 1 });

      // code
      page.drawText(r.code, { x: x + 6, y: y - 13, size: 10, font });

      // part
      page.drawText(r.part, { x: x + codeW + 6, y: y - 13, size: 10, font });

      // tick box centered vertically in the row
      const boxX = x + w - tickW + 10;
      const checked = keyFor(r).some((k) => selected.has(k));
      drawTickBox(page, boxX, y - rowH / 2, 10, checked);

      y -= rowH;
    }
    return y;
  }

  function drawPanel(x: number, panel: Panel) {
    let y = top;

    // Column header
    const { codeW, tickW, headerH } = drawColumnHeader(x, y, colWidth);
    y -= headerH;

    // Sections
    for (const sec of panel.sections) {
      y -= drawSectionTitle(x, y, colWidth, sec.title, sec.tint);
      y = drawRows(x, y, colWidth, sec.rows, codeW, tickW);
    }
  }

  // Layout: left, middle, right columns
  const xLeft = margin;
  const xMid = margin + colWidth + colGap;
  const xRight = margin + (colWidth + colGap) * 2;

  drawPanel(xLeft, LEFT_PANEL);
  drawPanel(xMid, MIDDLE_PANEL);
  drawPanel(xRight, RIGHT_PANEL);

  return await pdf.save();
}

// --------------------- EDGE HANDLER ---------------------

Deno.serve(async (req) => {
  try {
    const { selectedCodes = [] } = await (async () => {
      try {
        return await req.json();
      } catch {
        return { selectedCodes: [] as string[] };
      }
    })();

    const selected = new Set<string>((selectedCodes as string[]).map((s) => String(s)));

    const bytes = await renderPdf(selected);

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="radiology-request.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
