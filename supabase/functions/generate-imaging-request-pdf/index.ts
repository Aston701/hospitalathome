// supabase/functions/generate-imaging-request-pdf/index.ts
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// ---------- DATA ----------
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
        { code: "0000", part: "Skeletal Survey <=5 years old" },
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

// ---------- helpers ----------
function keyFor(r: Row) {
  return [`${r.code}`, `${r.code}:${r.part}`];
}
function drawTickBox(page: any, x: number, cy: number, size = 8, checked = false) {
  const y = cy - size / 2;
  page.drawRectangle({ x, y, width: size, height: size, borderWidth: 1, color: COLORS.black });
  if (checked) {
    const p = 1.6;
    page.drawLine({ start: { x: x + p, y: y + p }, end: { x: x + size - p, y: y + size - p }, thickness: 1, color: COLORS.black });
    page.drawLine({ start: { x: x + p, y: y + size - p }, end: { x: x + size - p, y: y + p }, thickness: 1, color: COLORS.black });
  }
}
function drawInput(
  page: any,
  font: any,
  label: string,
  x: number,
  yTop: number,
  w: number,
  h = 14,
  value?: string,
  bold?: any,
) {
  page.drawText(label, { x, y: yTop + 2, size: 7, font: bold ?? font, color: COLORS.black });
  const y = yTop - h;
  page.drawRectangle({ x, y, width: w, height: h, borderWidth: 1, borderColor: COLORS.black });
  if (value) page.drawText(value, { x: x + 3, y: y + 3, size: 8.5, font, color: COLORS.black });
  return y;
}
function drawUnderlineText(page: any, font: any, label: string, x: number, y: number, w: number, underlineY: number) {
  page.drawText(label, { x, y, size: 9, font, color: COLORS.black });
  page.drawLine({ start: { x, y: underlineY }, end: { x: x + w, y: underlineY }, thickness: 1, color: COLORS.black });
}

// ---------- render ----------
async function renderPdf(body: any) {
  const pdf = await PDFDocument.create();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([PAGE.width, PAGE.height]);
  const { width, height } = page.getSize();

  // Header band
  const bandH = 26;
  page.drawRectangle({ x: 0, y: height - bandH - 18, width, height: bandH, color: COLORS.primeGreen });
  page.drawText("X-RAY AND ULTRASOUND REQUEST FORM", {
    x: PAGE.margin,
    y: height - bandH - 6,
    size: 11,
    font: fontBold,
    color: COLORS.black,
  });

  // Logo
  try {
    const res = await fetch("https://mediresponse.co.za/wp-content/uploads/2021/06/Medi-Response-Long-Logo.png");
    const bytes = await res.arrayBuffer();
    const img = await pdf.embedPng(bytes);
    const logoW = 138;
    const logoH = (logoW / img.width) * img.height;
    page.drawImage(img, { x: width - PAGE.margin - logoW, y: height - bandH - 10, width: logoW, height: logoH });
  } catch {}

  // Patient details
  let y = height - bandH - 40;
  const left = PAGE.margin;
  const gap = 10;

  const nameW = 240;
  drawInput(page, font, "Name:", left, y, nameW, 14, body?.patient?.name, fontBold);
  const sexW = 54;
  drawInput(page, font, "Sex:", left + nameW + gap, y, sexW, 14, body?.patient?.sex, fontBold);
  const lnmpW = 84;
  drawInput(page, font, "LNMP:", left + nameW + gap + sexW + gap, y, lnmpW, 14, body?.patient?.lnmp, fontBold);

  y -= 22;
  const idW = 168;
  drawInput(page, font, "I.D. Number:", left, y, idW, 14, body?.patient?.idNumber, fontBold);
  const dobW = 140;
  drawInput(page, font, "DOB:", left + idW + gap, y, dobW, 14, body?.patient?.dob, fontBold);
  const dateW = 140;
  drawInput(page, font, "Date:", left + idW + gap + dobW + gap, y, dateW, 14, body?.patient?.date, fontBold);

  y -= 22;
  page.drawText("Private:", { x: left, y: y + 2, size: 9, font, color: COLORS.black });
  drawTickBox(page, left + 44, y + 7, 8, !!body?.patient?.private);

  const maX = left + 78;
  page.drawText("Medical Aid:", { x: maX, y: y + 2, size: 9, font, color: COLORS.black });
  drawTickBox(page, maX + 66, y + 7, 8, !!body?.patient?.medicalAid?.isMember);

  const maNameX = maX + 86;
  const maNameW = 170;
  drawInput(page, font, "Name of Medical Aid", maNameX, y + 10, maNameW, 14, body?.patient?.medicalAid?.name || "");
  const maNumX = maNameX + maNameW + gap;
  const maNumW = 150;
  drawInput(page, font, "Medical Aid Number:", maNumX, y + 10, maNumW, 14, body?.patient?.medicalAid?.number || "");

  y -= 14;
  page.drawText("Tick organ / region to be examined", { x: left, y, size: 9, font, color: COLORS.black });

  // Grid
  const gridTop = y - 10;
  const colWidth = (width - PAGE.margin * 2 - gap * 2) / 3;
  const rowH = 15;
  const headerH = 15;
  const codeW = 50;
  const tickW = 34;

  const selected: Set<string> = new Set((body?.selected || []).map((s: string) => String(s)));

  function header(x: number, topY: number, w: number) {
    page.drawRectangle({ x, y: topY - headerH, width: w, height: headerH, color: COLORS.gridHeader, borderWidth: 1, borderColor: COLORS.black });
    page.drawText("CODE", { x: x + 6, y: topY - 12, size: 9, font: fontBold, color: COLORS.black });
    page.drawText("PART", { x: x + codeW + 6, y: topY - 12, size: 9, font: fontBold, color: COLORS.black });
    page.drawText("TICK", { x: x + w - tickW + 10, y: topY - 12, size: 9, font: fontBold, color: COLORS.black });
    page.drawLine({ start: { x: x + codeW, y: topY - headerH }, end: { x: x + codeW, y: topY }, thickness: 1, color: COLORS.black });
    page.drawLine({ start: { x: x + w - tickW, y: topY - headerH }, end: { x: x + w - tickW, y: topY }, thickness: 1, color: COLORS.black });
  }
  function sectionTitle(x: number, topY: number, w: number, title: string, tint: "teal" | "green" | "blue" | null) {
    const h = 16;
    const color =
      tint === "teal"
        ? COLORS.sectionTeal
        : tint === "green"
          ? COLORS.sectionGreen
          : tint === "blue"
            ? COLORS.sectionBlue
            : undefined;
    page.drawRectangle({ x, y: topY - h, width: w, height: h, color, borderWidth: 1, borderColor: COLORS.black });
    page.drawText(title, { x: x + 6, y: topY - 12, size: 9, font: fontBold, color: COLORS.black });
    return h;
  }
  function rows(x: number, yStart: number, w: number, data: Row[]) {
    let yy = yStart;
    for (const r of data) {
      page.drawRectangle({ x, y: yy - rowH, width: w, height: rowH, borderWidth: 1, borderColor: COLORS.black });
      page.drawText(r.code, { x: x + 6, y: yy - 11, size: 8.5, font, color: COLORS.black });
      page.drawText(r.part, { x: x + codeW + 6, y: yy - 11, size: 8.5, font, color: COLORS.black });
      const checked = keyFor(r).some((k) => selected.has(k));
      drawTickBox(page, x + w - tickW + 12, yy - rowH / 2, 8, checked);
      yy -= rowH;
    }
    return yy;
  }
  function panel(x: number, topY: number, p: Panel) {
    let yy = topY;
    header(x, yy, colWidth);
    yy -= headerH;
    for (const s of p.sections) {
      yy -= sectionTitle(x, yy, colWidth, s.title, s.tint);
      yy = rows(x, yy, colWidth, s.rows);
    }
    return yy;
  }

  const x1 = PAGE.margin,
    x2 = PAGE.margin + colWidth + gap,
    x3 = PAGE.margin + (colWidth + gap) * 2;
  let bottomY = panel(x1, gridTop, LEFT_PANEL);
  bottomY = Math.min(bottomY, panel(x2, gridTop, MIDDLE_PANEL));
  bottomY = Math.min(bottomY, panel(x3, gridTop, RIGHT_PANEL));

  // Footnote + Clinical History
  const footnoteY = bottomY - 12;
  page.drawText("*If you are pregnant or suspect to be pregnant, please inform your doctor or radiographer", {
    x: PAGE.margin,
    y: footnoteY,
    size: 8.5,
    font,
    color: COLORS.grayDark,
  });

  let chTop = footnoteY - 18;
  page.drawText("Clinical History", { x: PAGE.margin, y: chTop, size: 9, font: fontBold, color: COLORS.black });
  const chH = 64;
  page.drawRectangle({
    x: PAGE.margin,
    y: chTop - chH - 5,
    width: width - PAGE.margin * 2,
    height: chH,
    borderWidth: 1,
    borderColor: COLORS.black,
  });
  if (body?.clinicalHistory) {
    page.drawText(String(body.clinicalHistory), {
      x: PAGE.margin + 5,
      y: chTop - 16,
      size: 8.5,
      font,
      color: COLORS.black,
      lineHeight: 11,
      maxWidth: width - PAGE.margin * 2 - 10,
    });
  }

  const docY = chTop - chH - 22;
  const nameW2 = 230,
    prW = 170;
  drawUnderlineText(page, font, "Doctor's Name", PAGE.margin, docY, nameW2, docY - 4);
  if (body?.doctor?.name) page.drawText(body.doctor.name, { x: PAGE.margin + 100, y: docY, size: 9, font, color: COLORS.black });
  drawUnderlineText(page, font, "Practice Number", PAGE.margin + nameW2 + 20, docY, prW, docY - 4);
  if (body?.doctor?.practiceNumber)
    page.drawText(body.doctor.practiceNumber, { x: PAGE.margin + nameW2 + 20 + 110, y: docY, size: 9, font, color: COLORS.black });
  drawUnderlineText(page, font, "Signature", PAGE.margin + nameW2 + 20 + prW + 20, docY, 110, docY - 4);

  // Footer bar
  const fbH = 24;
  page.drawRectangle({ x: 0, y: 0, width, height: fbH, color: COLORS.footerBar });
  const footer =
    "Tel: 686 4455 | Plot 720/721 | Tsheko-Tsheko Road | Maun     Tel: 354 6580 | Plot 60601 | Block 7 | Gaborone";
  page.drawText(footer, { x: PAGE.margin, y: 8, size: 8.5, font, color: COLORS.black });

  return await pdf.save();
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request content-type:', req.headers.get('content-type'));
    
    // Validate input with Zod schema
    const requestSchema = z.object({
      requestId: z.string().uuid('Invalid request ID format')
    });

    const body = await req.json();
    console.log('Request body:', body);
    const { requestId } = requestSchema.parse(body);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching diagnostic request:', requestId);

    // Fetch diagnostic request with related data
    const { data: diagnosticRequest, error: fetchError } = await supabaseClient
      .from('diagnostic_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !diagnosticRequest) {
      console.error('Error fetching diagnostic request:', fetchError);
      return new Response(JSON.stringify({ 
        error: "Diagnostic request not found", 
        details: fetchError?.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch related visit data
    const { data: visit } = await supabaseClient
      .from('visits')
      .select('*, patient:patients(*)')
      .eq('id', diagnosticRequest.visit_id)
      .single();

    // Fetch doctor/requester data
    const { data: doctor } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', diagnosticRequest.requested_by)
      .single();

    console.log('Diagnostic request found:', diagnosticRequest.id);

    const patient = visit?.patient;
    
    // Parse clinical notes if it's a JSON string
    let clinicalData: any = {};
    if (diagnosticRequest.clinical_notes) {
      try {
        clinicalData = typeof diagnosticRequest.clinical_notes === 'string' 
          ? JSON.parse(diagnosticRequest.clinical_notes)
          : diagnosticRequest.clinical_notes;
      } catch (e) {
        console.error('Error parsing clinical notes:', e);
      }
    }
    
    // Extract selected region IDs from tests_requested
    const selectedRegions = (diagnosticRequest.tests_requested || []).map((test: any) => test.id);

    // Build request body for PDF
    const pdfBody = {
      patient: {
        name: patient ? `${patient.first_name} ${patient.last_name}` : '',
        sex: '', // No gender column in patients table
        idNumber: patient?.sa_id_number || '',
        dob: patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '',
        date: diagnosticRequest.created_at ? new Date(diagnosticRequest.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        lnmp: '',
        private: patient?.medical_aid_provider ? false : true,
        medicalAid: {
          isMember: !!patient?.medical_aid_provider,
          name: patient?.medical_aid_provider || '',
          number: patient?.medical_aid_number || ''
        }
      },
      selected: selectedRegions,
      clinicalHistory: clinicalData.clinicalHistory || clinicalData.clinical_history || '',
      doctor: {
        name: doctor?.full_name || '',
        practiceNumber: doctor?.practice_number || ''
      }
    };

    console.log('Generating PDF with data:', { 
      patientName: pdfBody.patient.name, 
      selectedCount: pdfBody.selected.length 
    });

    const pdfBytes = await renderPdf(pdfBody);

    // Upload PDF to storage
    const fileName = `diagnostic_request_${requestId}.pdf`;
    const { error: uploadError } = await supabaseClient.storage
      .from('prescriptions')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('prescriptions')
      .getPublicUrl(fileName);

    // Update diagnostic request with PDF URL
    const { error: updateError } = await supabaseClient
      .from('diagnostic_requests')
      .update({ pdf_url: publicUrl })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating diagnostic request:', updateError);
    }

    return new Response(JSON.stringify({ pdfUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
