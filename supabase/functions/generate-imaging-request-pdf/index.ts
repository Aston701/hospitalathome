import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { requestId } = await req.json();

    console.log('Generating imaging request PDF for request:', requestId);

    // Fetch the imaging request details
    const { data: request, error: requestError } = await supabase
      .from('diagnostic_requests')
      .select(`
        *,
        patient:patients(first_name, last_name, date_of_birth, sa_id_number, phone, medical_aid_provider, medical_aid_number)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('Error fetching request:', requestError);
      throw new Error('Imaging request not found');
    }

    // Fetch practitioner profile
    const { data: practitionerProfile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', request.requested_by)
      .single();

    const requestedBy = practitionerProfile || { full_name: 'Unknown', phone: null };
    const clinicalNotes = JSON.parse(request.clinical_notes || '{}');
    const patientName = `${request.patient.first_name} ${request.patient.last_name}`;
    const currentDate = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    
    let y = height - 40;
    const leftMargin = 40;
    const rightMargin = width - 40;

    // Helper functions
    const drawText = (text: string, x: number, yPos: number, options: any = {}) => {
      page.drawText(text, {
        x,
        y: yPos,
        size: options.size || 10,
        font: options.bold ? boldFont : font,
        color: rgb(0, 0, 0),
        ...options,
      });
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 0.5,
        color: rgb(0.3, 0.3, 0.3),
      });
    };

    const drawBox = (x: number, y: number, w: number, h: number) => {
      page.drawRectangle({
        x, y, width: w, height: h,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 1,
      });
    };

    const drawCheckbox = (x: number, y: number, checked: boolean) => {
      drawBox(x, y, 10, 10);
      if (checked) {
        drawText('X', x + 2, y + 1, { size: 8, bold: true });
      }
    };

    // Title
    drawText('DIAGNOSTIC IMAGING REQUEST FORM', leftMargin, y, { size: 14, bold: true });
    y -= 18;
    drawLine(leftMargin, y, rightMargin, y);
    y -= 15;

    // Header
    const examType = clinicalNotes.imagingType === 'xray' ? 'X-RAY' : 'ULTRASOUND';
    drawText(`Type: ${examType}`, leftMargin, y, { bold: true, size: 10 });
    drawText(`Date: ${currentDate}`, rightMargin - 120, y, { size: 9 });
    y -= 18;

    // Patient Info
    drawText('PATIENT INFORMATION', leftMargin, y, { size: 10, bold: true });
    y -= 10;
    drawText(`Name: ${patientName}`, leftMargin + 5, y, { size: 8 });
    drawText(`ID: ${request.patient.sa_id_number || 'N/A'}`, leftMargin + 250, y, { size: 8 });
    y -= 10;
    drawText(`DOB: ${request.patient.date_of_birth || 'N/A'}`, leftMargin + 5, y, { size: 8 });
    drawText(`Phone: ${request.patient.phone}`, leftMargin + 250, y, { size: 8 });
    y -= 10;
    drawText(`Medical Aid: ${request.patient.medical_aid_provider || 'None'}`, leftMargin + 5, y, { size: 8 });
    if (request.patient.medical_aid_number) {
      drawText(`Member: ${request.patient.medical_aid_number}`, leftMargin + 250, y, { size: 8 });
    }
    y -= 18;

    // Examinations
    drawText('EXAMINATIONS REQUESTED', leftMargin, y, { size: 10, bold: true });
    y -= 10;
    
    const selectedIds = new Set(request.tests_requested.map((t: any) => t.id));
    
    if (clinicalNotes.imagingType === 'xray') {
      const xrayItems = [
        ['chest', 'Chest', '3445'], ['chest-ribs', 'Chest & Ribs', '3449'], ['abdomen', 'Abdomen', '3477'],
        ['acute-abdomen', 'Acute Abd', '3479'], ['kub', 'KUB', '0000'], ['finger', 'Finger', '3305'],
        ['hand', 'Hand', '3305'], ['wrist', 'Wrist', '3305'], ['forearm', 'Forearm', '3367'],
        ['elbow', 'Elbow', '3907'], ['humerus', 'Humerus', '3907'], ['shoulder', 'Shoulder', '3907'],
        ['clavicle', 'Clavicle', '3907'], ['scapula', 'Scapula', '3907'], ['toe', 'Toe', '3305'],
        ['foot', 'Foot', '3307'], ['ankle', 'Ankle', '3307'], ['tibia-fibula', 'Tibia/Fibula', '3307'],
        ['knee', 'Knee', '3307'], ['femur', 'Femur', '3307'], ['hip', 'Hip', '3307'],
        ['pelvis', 'Pelvis', '3331'], ['sacroiliac', 'SI Joints', '3321'], ['cervical-spine', 'C-Spine', '3321'],
        ['thoracic-spine', 'T-Spine', '3321'], ['lumbar-spine', 'L-Spine', '3321'], ['sacrum', 'Sacrum', '3321'],
        ['coccyx', 'Coccyx', '3321'], ['skull', 'Skull', '3349'], ['sinuses', 'Sinuses', '3351'],
        ['mandible', 'Mandible', '3355'], ['tmj', 'TMJ', '3367'], ['sternum', 'Sternum', '3451'],
        ['barium-swallow', 'Barium Swallow', '3399'], ['ivu', 'IVU', '3487'], ['venogram', 'Venogram', '3345'],
      ];

      let colX = leftMargin + 5;
      let itemsInRow = 0;
      
      xrayItems.forEach(([id, label, code]) => {
        if (itemsInRow === 3) {
          y -= 8;
          colX = leftMargin + 5;
          itemsInRow = 0;
        }
        
        const checked = selectedIds.has(id);
        drawCheckbox(colX, y, checked);
        drawText(`${label} (${code})`, colX + 13, y + 2, { size: 6 });
        
        colX += 170;
        itemsInRow++;
      });
      
      y -= 10;
      
    } else {
      const usItems = [
        ['us-abdomen', 'Abdomen', '3627'], ['us-renal', 'Renal Tract', '3628'],
        ['us-pelvis-ta', 'Pelvis TA', '3618'], ['us-pelvis-tv', 'Pelvis TV', '5100'],
        ['us-soft-tissue', 'Soft Tissue', '3629'], ['us-obstetric', 'Obstetric', '3615'],
        ['us-obstetric-fu', 'OB F/UP', '3617'], ['us-thyroid', 'Thyroid', '3629'],
        ['us-scrotum', 'Scrotum', '3629'], ['us-breast', 'Breast', '3629'],
        ['us-prostate-ta', 'Prostate', '3629'],
      ];

      let colX = leftMargin + 5;
      usItems.forEach(([id, label, code], idx) => {
        if (idx > 0 && idx % 3 === 0) {
          y -= 8;
          colX = leftMargin + 5;
        }
        const checked = selectedIds.has(id);
        drawCheckbox(colX, y, checked);
        drawText(`${label} (${code})`, colX + 13, y + 2, { size: 7 });
        colX += 170;
      });
      y -= 10;
    }

    y -= 12;

    // Clinical Info
    drawText('CLINICAL INFORMATION', leftMargin, y, { size: 10, bold: true });
    y -= 10;
    drawText(`Indication: ${clinicalNotes.clinicalIndication?.substring(0, 85) || 'N/A'}`, leftMargin + 5, y, { size: 7 });
    y -= 8;
    drawText(`History: ${clinicalNotes.clinicalHistory?.substring(0, 85) || 'N/A'}`, leftMargin + 5, y, { size: 7 });
    y -= 8;
    drawText(`Findings: ${clinicalNotes.relevantFindings?.substring(0, 85) || 'N/A'}`, leftMargin + 5, y, { size: 7 });
    y -= 8;
    drawText(`Diagnosis: ${clinicalNotes.provisionalDiagnosis || 'N/A'}`, leftMargin + 5, y, { size: 7 });
    y -= 15;

    // Additional Info
    drawText('ADDITIONAL INFORMATION', leftMargin, y, { size: 10, bold: true });
    y -= 10;
    
    const pregnancy = clinicalNotes.pregnancy?.status;
    drawCheckbox(leftMargin + 5, y, !pregnancy);
    drawText('Not Pregnant', leftMargin + 18, y + 2, { size: 7 });
    drawCheckbox(leftMargin + 90, y, pregnancy);
    drawText(pregnancy ? `Pregnant (${clinicalNotes.pregnancy.weeks}w)` : 'Pregnant', leftMargin + 103, y + 2, { size: 7 });
    
    drawCheckbox(leftMargin + 200, y, !clinicalNotes.contrast);
    drawText('No Contrast', leftMargin + 213, y + 2, { size: 7 });
    drawCheckbox(leftMargin + 280, y, clinicalNotes.contrast);
    drawText('Contrast', leftMargin + 293, y + 2, { size: 7 });
    
    y -= 10;
    drawText(`Allergies: ${clinicalNotes.allergies || 'None'}`, leftMargin + 5, y, { size: 7 });
    drawText(`Urgency: ${clinicalNotes.urgency || 'Routine'}`, leftMargin + 280, y, { size: 7, bold: true });
    y -= 15;

    // Practitioner
    drawText('REQUESTING PRACTITIONER', leftMargin, y, { size: 10, bold: true });
    y -= 10;
    drawText(`Name: ${requestedBy.full_name}`, leftMargin + 5, y, { size: 8 });
    drawText(`Contact: ${requestedBy.phone || 'N/A'}`, leftMargin + 280, y, { size: 8 });
    y -= 8;
    drawText(`Date: ${currentDate}`, leftMargin + 5, y, { size: 8 });
    y -= 15;

    // Footer
    drawLine(leftMargin, y, rightMargin, y);
    y -= 10;
    drawText('Official diagnostic imaging request', leftMargin, y, { size: 7 });
    drawText(`Request ID: ${requestId.substring(0, 18)}...`, rightMargin - 140, y, { size: 6 });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Upload
    const fileName = `imaging_request_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(`imaging-requests/${fileName}`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(`imaging-requests/${fileName}`);

    await supabase
      .from('diagnostic_requests')
      .update({ pdf_url: publicUrl })
      .eq('id', requestId);

    return new Response(
      JSON.stringify({ success: true, pdfUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
