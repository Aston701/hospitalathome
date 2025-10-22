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
    const lineHeight = 14;

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

    const drawBox = (x: number, y: number, w: number, h: number, filled = false) => {
      page.drawRectangle({
        x, y, width: w, height: h,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 1,
        color: filled ? rgb(0, 0, 0) : undefined,
      });
    };

    const drawCheckbox = (x: number, y: number, checked: boolean) => {
      drawBox(x, y, 10, 10);
      if (checked) {
        drawText('✓', x + 1, y + 1, { size: 8, bold: true });
      }
    };

    // Title
    drawText('DIAGNOSTIC IMAGING REQUEST FORM', leftMargin, y, { size: 16, bold: true });
    y -= 20;
    drawLine(leftMargin, y, rightMargin, y);
    y -= 20;

    // Header info
    const examType = clinicalNotes.imagingType === 'xray' ? 'X-RAY' : 'ULTRASOUND';
    drawText(`Examination Type: ${examType}`, leftMargin, y, { bold: true });
    drawText(`Date: ${currentDate}`, rightMargin - 150, y);
    y -= 25;

    // Patient Information Section
    drawText('PATIENT INFORMATION', leftMargin, y, { size: 11, bold: true });
    y -= 15;
    drawBox(leftMargin, y - 40, rightMargin - leftMargin, 45, false);
    y -= 12;
    
    drawText(`Name: ${patientName}`, leftMargin + 5, y);
    drawText(`ID: ${request.patient.sa_id_number || 'N/A'}`, leftMargin + 280, y);
    y -= 12;
    drawText(`DOB: ${request.patient.date_of_birth || 'N/A'}`, leftMargin + 5, y);
    drawText(`Phone: ${request.patient.phone}`, leftMargin + 280, y);
    y -= 12;
    drawText(`Medical Aid: ${request.patient.medical_aid_provider || 'None'}`, leftMargin + 5, y);
    if (request.patient.medical_aid_number) {
      drawText(`Member #: ${request.patient.medical_aid_number}`, leftMargin + 280, y);
    }
    y -= 25;

    // Examinations Section
    drawText('EXAMINATIONS REQUESTED', leftMargin, y, { size: 11, bold: true });
    y -= 15;
    
    const selectedIds = new Set(request.tests_requested.map((t: any) => t.id));
    
    const regions: any[] = clinicalNotes.imagingType === 'xray' 
      ? [
          { cat: 'Chest/Abd', items: ['chest:3445', 'abdomen:3477', 'kub:0000'] },
          { cat: 'Upper Ext', items: ['hand:3305', 'wrist:3305', 'elbow:3907', 'shoulder:3907'] },
          { cat: 'Lower Ext', items: ['foot:3307', 'ankle:3307', 'knee:3307', 'hip:3307'] },
          { cat: 'Spine', items: ['cervical-spine:3321', 'thoracic-spine:3321', 'lumbar-spine:3321'] },
          { cat: 'Head/Neck', items: ['skull:3349', 'sinuses:3351', 'mandible:3355'] },
        ]
      : [
          { cat: 'Ultrasound', items: ['us-abdomen:3627', 'us-renal:3628', 'us-pelvis-ta:3618', 'us-obstetric:3615', 'us-thyroid:3629'] },
        ];

    const boxHeight = 60;
    drawBox(leftMargin, y - boxHeight, rightMargin - leftMargin, boxHeight);
    y -= 10;

    let xPos = leftMargin + 10;
    regions.forEach((category, idx) => {
      if (idx > 0 && idx % 3 === 0) {
        y -= 20;
        xPos = leftMargin + 10;
      }
      
      drawText(category.cat + ':', xPos, y, { size: 8, bold: true });
      let itemY = y - 10;
      category.items.forEach((item: string) => {
        const [id, code] = item.split(':');
        const label = id.replace(/-/g, ' ').replace('us ', '');
        const checked = selectedIds.has(id);
        drawCheckbox(xPos, itemY - 2, checked);
        drawText(label.substring(0, 12), xPos + 13, itemY, { size: 7 });
        itemY -= 9;
      });
      xPos += 170;
    });
    
    y -= boxHeight - 5;

    // Clinical Information
    drawText('CLINICAL INFORMATION', leftMargin, y, { size: 11, bold: true });
    y -= 12;
    drawText(`Indication: ${clinicalNotes.clinicalIndication?.substring(0, 80) || 'N/A'}`, leftMargin + 5, y, { size: 9 });
    y -= 10;
    drawText(`History: ${clinicalNotes.clinicalHistory?.substring(0, 80) || 'N/A'}`, leftMargin + 5, y, { size: 9 });
    y -= 10;
    drawText(`Findings: ${clinicalNotes.relevantFindings?.substring(0, 80) || 'N/A'}`, leftMargin + 5, y, { size: 9 });
    y -= 10;
    drawText(`Diagnosis: ${clinicalNotes.provisionalDiagnosis || 'N/A'}`, leftMargin + 5, y, { size: 9 });
    y -= 20;

    // Additional Info
    drawText('ADDITIONAL INFORMATION', leftMargin, y, { size: 11, bold: true });
    y -= 15;
    drawBox(leftMargin, y - 30, rightMargin - leftMargin, 32);
    y -= 10;
    
    const pregnancy = clinicalNotes.pregnancy?.status;
    drawCheckbox(leftMargin + 5, y - 2, !pregnancy);
    drawText('Not Pregnant', leftMargin + 18, y, { size: 9 });
    drawCheckbox(leftMargin + 100, y - 2, pregnancy);
    drawText(pregnancy ? `Pregnant (${clinicalNotes.pregnancy.weeks}w)` : 'Pregnant', leftMargin + 113, y, { size: 9 });
    
    drawCheckbox(leftMargin + 220, y - 2, !clinicalNotes.contrast);
    drawText('No Contrast', leftMargin + 233, y, { size: 9 });
    drawCheckbox(leftMargin + 310, y - 2, clinicalNotes.contrast);
    drawText('Contrast Req', leftMargin + 323, y, { size: 9 });
    
    y -= 12;
    drawText(`Allergies: ${clinicalNotes.allergies || 'None'}`, leftMargin + 5, y, { size: 9 });
    drawText(`Urgency: ${clinicalNotes.urgency || 'Routine'}`, leftMargin + 300, y, { size: 9, bold: true });
    y -= 25;

    // Requesting Practitioner
    drawText('REQUESTING PRACTITIONER', leftMargin, y, { size: 11, bold: true });
    y -= 12;
    drawText(`Name: ${requestedBy.full_name}`, leftMargin + 5, y, { size: 9 });
    drawText(`Contact: ${requestedBy.phone || 'N/A'}`, leftMargin + 280, y, { size: 9 });
    y -= 10;
    drawText(`Date: ${currentDate}`, leftMargin + 5, y, { size: 9 });
    y -= 20;

    // Footer
    drawLine(leftMargin, y, rightMargin, y);
    y -= 12;
    drawText('This is an official diagnostic imaging request', leftMargin, y, { size: 8 });
    drawText(`Request ID: ${requestId.substring(0, 18)}...`, rightMargin - 150, y, { size: 7 });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to storage
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

    // Update request with PDF URL
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
