// supabase/functions/generate-imaging-request-pdf/index.ts
// Deno + pdf-lib Edge Function — renders the imaging request form

import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --------------------- PAGE + COLORS ---------------------
const PAGE = { width: 595.28, height: 841.89, margin: 24 }; // A4 portrait
const COLORS = {
  black: rgb(0, 0, 0),
  gridHeader: rgb(0.95, 0.95, 0.95),
  primeGreen: rgb(0.62, 0.78, 0.15),
  sectionTeal: rgb(0.84, 0.94, 0.94),
  sectionGreen: rgb(0.89, 0.96, 0.89),
  sectionBlue: rgb(0.88, 0.93, 0.98),
  footerBar: rgb(0.88, 0.93, 0.98),
  grayDark: rgb(0.2, 0.2, 0.2),
};

// --------------------- DATA ---------------------
type Row = { code: string; part: string };
type Section = { title: string; tint: "teal" | "green" | "blue" | null; rows: Row[] };
type Panel = { sections: Section[] };

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

// --------------------- UTIL ---------------------
function keyFor(r: Row) {
  return [`${r.code}`, `${r.code}:${r.part}`];
}

function drawTickBox(page: any, x: number, centerY: number, size = 10, checked = false) {
  const y = centerY - size / 2;
  // Draw empty box with border only (no fill)
  page.drawRectangle({ 
    x, 
    y, 
    width: size, 
    height: size, 
    borderWidth: 1,
    borderColor: COLORS.black,
  });
  if (checked) {
    const p = 2;
    page.drawLine({ start: { x: x + p, y: y + p }, end: { x: x + size - p, y: y + size - p }, thickness: 1.5, color: COLORS.black });
    page.drawLine({ start: { x: x + p, y: y + size - p }, end: { x: x + size - p, y: y + p }, thickness: 1.5, color: COLORS.black });
  }
}

function drawInput(
  page: any,
  font: any,
  label: string,
  x: number,
  yTop: number,
  w: number,
  h = 16,
  value?: string,
  bold?: any,
) {
  page.drawText(label, { x, y: yTop + 3, size: 8, font: bold ?? font });
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

// --------------------- RENDER ---------------------
async function renderPdf(body: any) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // Load Unicode fonts (TTF from GitHub)
  const regularBytes = await (
    await fetch(
      "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    )
  ).arrayBuffer();
  const boldBytes = await (
    await fetch("https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf")
  ).arrayBuffer();

  const font = await pdf.embedFont(new Uint8Array(regularBytes), { subset: true });
  const fontBold = await pdf.embedFont(new Uint8Array(boldBytes), { subset: true });

  const page = pdf.addPage([PAGE.width, PAGE.height]);
  const { width, height } = page.getSize();

  // Header band
  const bandH = 28;
  page.drawRectangle({ x: 0, y: height - bandH - 18, width, height: bandH, color: COLORS.primeGreen });
  page.drawText("X-RAY AND ULTRASOUND REQUEST FORM", {
    x: PAGE.margin,
    y: height - bandH - 6,
    size: 12,
    font: fontBold,
    color: COLORS.black,
  });

  // Logo
  try {
    const res = await fetch("https://mediresponse.co.za/wp-content/uploads/2021/06/Medi-Response-Long-Logo.png");
    const bytes = await res.arrayBuffer();
    const img = await pdf.embedPng(bytes);
    const logoW = 150;
    const logoH = (logoW / img.width) * img.height;
    page.drawImage(img, { x: width - PAGE.margin - logoW, y: height - bandH - 10, width: logoW, height: logoH });
  } catch {
    /* ignore */
  }

  // Patient details
  let y = height - bandH - 40;
  const left = PAGE.margin;
  const gap = 10;

  // Row 1
  const nameW = 250;
  drawInput(page, font, "Name:", left, y, nameW, 16, body?.patient?.name, fontBold);
  const sexW = 60;
  drawInput(page, font, "Sex:", left + nameW + gap, y, sexW, 16, body?.patient?.sex, fontBold);
  const lnmpW = 90;
  drawInput(page, font, "LNMP:", left + nameW + gap + sexW + gap, y, lnmpW, 16, body?.patient?.lnmp, fontBold);

  // Row 2
  y -= 26;
  const idW = 180;
  drawInput(page, font, "I.D. Number:", left, y, idW, 16, body?.patient?.idNumber, fontBold);
  const dobW = 150;
  drawInput(page, font, "DOB:", left + idW + gap, y, dobW, 16, body?.patient?.dob, fontBold);
  const dateW = 150;
  drawInput(page, font, "Date:", left + idW + gap + dobW + gap, y, dateW, 16, body?.patient?.date, fontBold);

  // Row 3: Private & Medical Aid
  y -= 26;
  page.drawText("Private:", { x: left, y: y + 3, size: 10, font });
  drawTickBox(page, left + 46, y + 8, 10, !!body?.patient?.private);

  const maX = left + 80;
  page.drawText("Medical Aid:", { x: maX, y: y + 3, size: 10, font });
  drawTickBox(page, maX + 68, y + 8, 10, !!body?.patient?.medicalAid?.isMember);

  const maNameX = maX + 88;
  const maNameW = 180;
  drawInput(page, font, "Name of Medical Aid", maNameX, y + 12, maNameW, 16, body?.patient?.medicalAid?.name || "");
  const maNumX = maNameX + maNameW + gap;
  const maNumW = 160;
  drawInput(page, font, "Medical Aid Number:", maNumX, y + 12, maNumW, 16, body?.patient?.medicalAid?.number || "");

  // Caption
  y -= 18;
  page.drawText("Tick organ / region to be examined", { x: left, y, size: 10, font });

  // Grid
  const gridTop = y - 12;
  const colWidth = (width - PAGE.margin * 2 - gap * 2) / 3;
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
    page.drawLine({ start: { x: x + codeW, y: topY - headerH }, end: { x: x + codeW, y: topY }, thickness: 1 });
    page.drawLine({ start: { x: x + w - tickW, y: topY - headerH }, end: { x: x + w - tickW, y: topY }, thickness: 1 });
  }

  function drawSectionTitle(x: number, topY: number, w: number, title: string, tint: "teal" | "green" | "blue" | null) {
    const h = 18;
    const color =
      tint === "teal"
        ? COLORS.sectionTeal
        : tint === "green"
          ? COLORS.sectionGreen
          : tint === "blue"
            ? COLORS.sectionBlue
            : undefined;

    page.drawRectangle({ x, y: topY - h, width: w, height: h, color, borderWidth: 1 });
    page.drawText(title, { x: x + 6, y: topY - 13, size: 10, font: fontBold });
    return h;
  }

  function drawRows(x: number, yStart: number, w: number, rows: Row[]) {
    let yy = yStart;
    for (const r of rows) {
      page.drawRectangle({ x, y: yy - rowH, width: w, height: rowH, borderWidth: 1 });
      page.drawText(r.code, { x: x + 6, y: yy - 13, size: 10, font });
      page.drawText(r.part, { x: x + codeW + 6, y: yy - 13, size: 10, font });
      const isChecked = keyFor(r).some((k) => selected.has(k));
      drawTickBox(page, x + w - tickW + 12, yy - rowH / 2, 10, isChecked);
      yy -= rowH;
    }
    return yy;
  }

  function drawPanel(x: number, topY: number, panel: Panel) {
    let yy = topY;
    drawColumnHeader(x, yy, colWidth);
    yy -= headerH;
    for (const sec of panel.sections) {
      yy -= drawSectionTitle(x, yy, colWidth, sec.title, sec.tint);
      yy = drawRows(x, yy, colWidth, sec.rows);
    }
    return yy;
  }

  const x1 = PAGE.margin;
  const x2 = PAGE.margin + colWidth + gap;
  const x3 = PAGE.margin + (colWidth + gap) * 2;

  let bottomY = drawPanel(x1, gridTop, LEFT_PANEL);
  bottomY = Math.min(bottomY, drawPanel(x2, gridTop, MIDDLE_PANEL));
  bottomY = Math.min(bottomY, drawPanel(x3, gridTop, RIGHT_PANEL));

  // Footnote
  const footnoteY = bottomY - 14;
  page.drawText("*If you are pregnant or suspect to be pregnant, please inform your doctor or radiographer", {
    x: PAGE.margin,
    y: footnoteY,
    size: 9,
    font,
    color: COLORS.grayDark,
  });

  // Clinical History
  let chTop = footnoteY - 20;
  page.drawText("Clinical History", { x: PAGE.margin, y: chTop, size: 10, font: fontBold });
  const chH = 72;
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

  // Doctor details
  const docY = chTop - chH - 26;
  const nameW2 = 240;
  const prW = 180;
  drawUnderlineText(page, font, "Doctor's Name", PAGE.margin, docY, nameW2, docY - 4);
  if (body?.doctor?.name) page.drawText(body.doctor.name, { x: PAGE.margin + 110, y: docY, size: 10, font });
  drawUnderlineText(page, font, "Practice Number", PAGE.margin + nameW2 + 24, docY, prW, docY - 4);
  if (body?.doctor?.practiceNumber)
    page.drawText(body.doctor.practiceNumber, { x: PAGE.margin + nameW2 + 24 + 120, y: docY, size: 10, font });
  drawUnderlineText(page, font, "Signature", PAGE.margin + nameW2 + 24 + prW + 24, docY, 120, docY - 4);

  // Footer bar
  const fbH = 28;
  page.drawRectangle({ x: 0, y: 0, width, height: fbH, color: COLORS.footerBar });
  const footer =
    "Tel: 686 4455 | Plot 720/721 | Tsheko-Tsheko Road | Maun     Tel: 354 6580 | Plot 60601 | Block 7 | Gaborone";
  page.drawText(footer, { x: PAGE.margin, y: 10, size: 9, font });

  return await pdf.save();
}

// --------------------- HTTP HANDLER ---------------------
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body with error handling
    let requestId: string | undefined;
    try {
      const body = await req.json();
      requestId = body.requestId;
    } catch (jsonError) {
      console.error("Error parsing request body:", jsonError);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!requestId) {
      return new Response(JSON.stringify({ error: "requestId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the diagnostic request
    const { data: request, error: requestError } = await supabase
      .from("diagnostic_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching request:", requestError);
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch patient data separately
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("first_name, last_name, sa_id_number, date_of_birth, medical_aid_provider, medical_aid_number")
      .eq("id", request.patient_id)
      .single();

    if (patientError || !patient) {
      console.error("Error fetching patient:", patientError);
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch doctor/requester profile separately
    const { data: doctor, error: doctorError } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", request.requested_by)
      .single();

    if (doctorError || !doctor) {
      console.error("Error fetching doctor:", doctorError);
      return new Response(JSON.stringify({ error: "Doctor profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse clinical notes if it's a JSON string
    let clinicalNotes: any = {};
    try {
      clinicalNotes = typeof request.clinical_notes === 'string' 
        ? JSON.parse(request.clinical_notes) 
        : request.clinical_notes || {};
    } catch (e) {
      console.error("Error parsing clinical notes:", e);
    }

    // Build the body for the PDF renderer
    const body = {
      patient: {
        name: `${patient.first_name} ${patient.last_name}`,
        sex: "",
        lnmp: "",
        idNumber: patient.sa_id_number || "",
        dob: patient.date_of_birth || "",
        date: new Date().toISOString().split('T')[0],
        private: false,
        medicalAid: {
          isMember: !!patient.medical_aid_provider,
          name: patient.medical_aid_provider || "",
          number: patient.medical_aid_number || "",
        },
      },
      selected: request.tests_requested?.map((test: any) => 
        test.code ? `${test.code}:${test.label}` : test.label
      ) || [],
      clinicalHistory: clinicalNotes.clinicalHistory || "",
      doctor: {
        name: doctor.full_name || "",
        practiceNumber: "",
      },
    };

    const bytes = await renderPdf(body);
    
    // Upload PDF to storage
    const fileName = `imaging_request_${patient.first_name}_${patient.last_name}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("prescriptions")
      .upload(`imaging-requests/${fileName}`, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("prescriptions")
      .getPublicUrl(`imaging-requests/${fileName}`);

    // Update the diagnostic request with the PDF URL
    await supabase
      .from("diagnostic_requests")
      .update({ pdf_url: publicUrl })
      .eq("id", requestId);

    return new Response(JSON.stringify({ pdfUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
