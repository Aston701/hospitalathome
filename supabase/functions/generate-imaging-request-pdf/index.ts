import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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

    console.log('Request data fetched:', request);

    // Fetch the requesting practitioner's profile separately
    const { data: practitionerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', request.requested_by)
      .single();

    if (profileError) {
      console.error('Error fetching practitioner profile:', profileError);
    }

    const requestedByProfile = practitionerProfile || { full_name: 'Unknown', phone: null };

    // Parse clinical notes
    const clinicalNotes = JSON.parse(request.clinical_notes || '{}');
    
    // Format patient name
    const patientName = `${request.patient.first_name} ${request.patient.last_name}`;
    
    // Get current date
    const currentDate = new Date().toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get selected test IDs for easy lookup
    const selectedTestIds = new Set(request.tests_requested.map((t: any) => t.id));

    // Define all regions with their codes (matching the form)
    const allXRayRegions = [
      { category: 'CHEST AND ABDOMEN', items: [
        { id: 'chest', label: 'Chest', code: '3445' },
        { id: 'chest-ribs', label: 'Chest and Ribs', code: '3449' },
        { id: 'abdomen', label: 'Abdomen', code: '3477' },
        { id: 'acute-abdomen', label: 'Acute Abdomen', code: '3479' },
        { id: 'thoracic-inlet', label: 'Thoracic inlet', code: '0000' },
        { id: 'kub', label: 'KUB', code: '0000' },
      ]},
      { category: 'UPPER EXTREMITIES', items: [
        { id: 'finger', label: 'Finger', code: '3305' },
        { id: 'hand', label: 'Hand', code: '3305' },
        { id: 'wrist', label: 'Wrist', code: '3305' },
        { id: 'forearm', label: 'Forearm', code: '3367' },
        { id: 'elbow', label: 'Elbow', code: '3907' },
        { id: 'humerus', label: 'Humerus', code: '3907' },
        { id: 'shoulder', label: 'Shoulder', code: '3907' },
        { id: 'clavicle', label: 'Clavicle', code: '3907' },
        { id: 'scapula', label: 'Scapula', code: '3907' },
      ]},
      { category: 'LOWER EXTREMITIES', items: [
        { id: 'toe', label: 'Toe', code: '3305' },
        { id: 'foot', label: 'Foot', code: '3307' },
        { id: 'ankle', label: 'Ankle', code: '3307' },
        { id: 'tibia-fibula', label: 'Tibia & Fibula', code: '3307' },
        { id: 'knee', label: 'Knee', code: '3307' },
        { id: 'femur', label: 'Femur', code: '3307' },
        { id: 'hip', label: 'Hip', code: '3307' },
        { id: 'pelvis', label: 'Pelvis', code: '3331' },
        { id: 'sacroiliac', label: 'Sacroiliac Joints', code: '3321' },
      ]},
      { category: 'SPINE AND PELVIS', items: [
        { id: 'cervical-spine', label: 'Cervical Spine', code: '3321' },
        { id: 'thoracic-spine', label: 'Thoracic Spine', code: '3321' },
        { id: 'lumbar-spine', label: 'Lumbar Spine', code: '3321' },
        { id: 'sacrum', label: 'Sacrum', code: '3321' },
        { id: 'coccyx', label: 'Coccyx', code: '3321' },
        { id: 'whole-spine-pelvis', label: 'Whole Spine & Pelvis', code: '3321' },
        { id: 'skeletal-survey', label: 'Skeletal Survey', code: '3317' },
        { id: 'pelvis-spine', label: 'Pelvis', code: '0000' },
        { id: 'hips', label: 'Hips', code: '0000' },
      ]},
      { category: 'HEAD AND NECK', items: [
        { id: 'skull', label: 'Skull', code: '3349' },
        { id: 'sinuses', label: 'Sinuses', code: '3351' },
        { id: 'post-nasal', label: 'Post Nasal', code: '3385' },
        { id: 'mandible', label: 'Mandible', code: '3355' },
        { id: 'tmj', label: 'TMJ', code: '3367' },
        { id: 'facial-bones', label: 'Facial Bones', code: '3353' },
        { id: 'nasal-bone', label: 'Nasal Bone', code: '3357' },
        { id: 'mastoids', label: 'Mastoids', code: '3359' },
        { id: 'soft-tissue-neck', label: 'Soft Tissue Neck', code: '3443' },
        { id: 'sternum', label: 'Sternum', code: '3451' },
      ]},
      { category: 'SPECIAL EXAMS', items: [
        { id: 'barium-swallow', label: 'Barium Swallow', code: '3399' },
        { id: 'barium-meal', label: 'Barium Meal', code: '3403' },
        { id: 'barium-enema', label: 'Barium Enema', code: '3409' },
        { id: 'ivu', label: 'IVU', code: '3487' },
        { id: 'urethrogram', label: 'Urethrogram', code: '3499' },
        { id: 'cystogram', label: 'Cystogram', code: '3497' },
        { id: 'hsg', label: 'HSG', code: '3519' },
        { id: 'venogram', label: 'Venogram', code: '3345' },
      ]},
    ];

    const allUltrasoundRegions = [
      { id: 'us-abdomen', label: 'Abdomen', code: '3627' },
      { id: 'us-renal', label: 'Renal Tract', code: '3628' },
      { id: 'us-pelvis-ta', label: 'Pelvis Transabdominal', code: '3618' },
      { id: 'us-pelvis-tv', label: 'Pelvis Organs: Transvaginal', code: '5100' },
      { id: 'us-soft-tissue', label: 'Soft Tissue', code: '3629' },
      { id: 'us-obstetric', label: 'Obstetric', code: '3615' },
      { id: 'us-obstetric-fu', label: 'Obstetric F/UP', code: '3617' },
      { id: 'us-thyroid', label: 'Thyroid', code: '3629' },
      { id: 'us-scrotum', label: 'Scrotum', code: '3629' },
      { id: 'us-breast', label: 'Breast', code: '3629' },
      { id: 'us-prostate-ta', label: 'Prostate Transabdominal', code: '3629' },
    ];

    // Build examination checklist
    let examinationsSection = '';
    if (clinicalNotes.imagingType === 'xray') {
      allXRayRegions.forEach(category => {
        examinationsSection += `\n${category.category}:\n`;
        category.items.forEach(item => {
          const isSelected = selectedTestIds.has(item.id);
          examinationsSection += `  ${isSelected ? '[X]' : '[ ]'} ${item.label} (Code: ${item.code})\n`;
        });
      });
    } else {
      examinationsSection += '\nULTRASOUND EXAMINATIONS:\n';
      allUltrasoundRegions.forEach(item => {
        const isSelected = selectedTestIds.has(item.id);
        examinationsSection += `  ${isSelected ? '[X]' : '[ ]'} ${item.label} (Code: ${item.code})\n`;
      });
    }

    // Create PDF content
    const pdfContent = `
================================================================================
              DIAGNOSTIC IMAGING REQUEST FORM
================================================================================

Date: ${currentDate}
Request Type: ${clinicalNotes.imagingType === 'xray' ? 'X-RAY' : 'ULTRASOUND'}

--------------------------------------------------------------------------------
PATIENT INFORMATION
--------------------------------------------------------------------------------
Name: ${patientName}
ID Number: ${request.patient.sa_id_number || 'N/A'}
Date of Birth: ${request.patient.date_of_birth || 'N/A'}
Contact: ${request.patient.phone}
Medical Aid: ${request.patient.medical_aid_provider || 'None'} 
${request.patient.medical_aid_number ? `Member Number: ${request.patient.medical_aid_number}` : ''}

--------------------------------------------------------------------------------
EXAMINATION(S) REQUESTED
--------------------------------------------------------------------------------
${examinationsSection}

--------------------------------------------------------------------------------
CLINICAL INFORMATION
--------------------------------------------------------------------------------
Brief Clinical History:
${clinicalNotes.clinicalHistory || 'N/A'}

Clinical Indication / Reason for Examination:
${clinicalNotes.clinicalIndication}

Relevant Clinical Findings:
${clinicalNotes.relevantFindings || 'N/A'}

Provisional Diagnosis:
${clinicalNotes.provisionalDiagnosis || 'N/A'}

--------------------------------------------------------------------------------
ADDITIONAL INFORMATION
--------------------------------------------------------------------------------
Pregnancy Status: ${clinicalNotes.pregnancy?.status ? `[X] Yes (${clinicalNotes.pregnancy.weeks} weeks)` : '[X] No / N/A'}
Contrast Required: ${clinicalNotes.contrast ? '[X] Yes  [ ] No' : '[ ] Yes  [X] No'}
Known Allergies: ${clinicalNotes.allergies || 'None'}
Urgency Level: ${clinicalNotes.urgency === 'routine' ? '[X] Routine  [ ] Urgent  [ ] Emergency' : 
                 clinicalNotes.urgency === 'urgent' ? '[ ] Routine  [X] Urgent  [ ] Emergency' :
                 '[ ] Routine  [ ] Urgent  [X] Emergency'}

--------------------------------------------------------------------------------
REQUESTING PRACTITIONER
--------------------------------------------------------------------------------
Name: ${requestedByProfile.full_name}
Contact: ${requestedByProfile.phone || 'N/A'}
Date: ${currentDate}

================================================================================
This is an official diagnostic imaging request.
Please process according to the specified urgency level.

Request ID: ${requestId}
================================================================================
`;

    console.log('PDF content prepared');

    // Convert to base64 PDF (simplified text-based PDF)
    const encoder = new TextEncoder();
    const data = encoder.encode(pdfContent);
    const base64 = btoa(String.fromCharCode(...data));

    // Create a simple text-based PDF
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >>\nendobj\n5 0 obj\n<< /Length ${pdfContent.length} >>\nstream\nBT\n/F1 10 Tf\n50 750 Td\n`;
    
    const lines = pdfContent.split('\n');
    let pdfText = '';
    lines.forEach((line, index) => {
      pdfText += `(${line.replace(/[()\\]/g, '\\$&')}) Tj\n0 -12 Td\n`;
    });
    
    const pdfFooter = `ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\n0000000304 00000 n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${(pdfHeader + pdfBody + pdfText + 'ET\nendstream\nendobj').length}\n%%EOF`;
    
    const fullPdf = pdfHeader + pdfBody + pdfText + pdfFooter;
    const pdfBytes = encoder.encode(fullPdf);

    // Upload to storage
    const fileName = `imaging_request_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(`imaging-requests/${fileName}`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw uploadError;
    }

    console.log('PDF uploaded:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(`imaging-requests/${fileName}`);

    console.log('Public URL:', publicUrl);

    // Update the diagnostic request with the PDF URL
    const { error: updateError } = await supabase
      .from('diagnostic_requests')
      .update({ pdf_url: publicUrl })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      throw updateError;
    }

    console.log('Request updated with PDF URL');

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: publicUrl,
        message: 'Imaging request PDF generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-imaging-request-pdf:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
