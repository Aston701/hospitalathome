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

    // Build tests list with codes
    const testsList = request.tests_requested
      .map((test: any) => `${test.label} (Code: ${test.code})`)
      .join('\n');

    // Create PDF content
    const pdfContent = `
DIAGNOSTIC IMAGING REQUEST FORM

Date: ${currentDate}
Request Type: ${clinicalNotes.imagingType === 'xray' ? 'X-RAY' : 'ULTRASOUND'}

PATIENT INFORMATION:
Name: ${patientName}
ID Number: ${request.patient.sa_id_number || 'N/A'}
Date of Birth: ${request.patient.date_of_birth || 'N/A'}
Contact: ${request.patient.phone}
Medical Aid: ${request.patient.medical_aid_provider || 'None'} ${request.patient.medical_aid_number ? `(${request.patient.medical_aid_number})` : ''}

EXAMINATION(S) REQUESTED:
${testsList}

CLINICAL INFORMATION:
Brief Clinical History: ${clinicalNotes.clinicalHistory || 'N/A'}

Clinical Indication / Reason for Examination:
${clinicalNotes.clinicalIndication}

Relevant Clinical Findings:
${clinicalNotes.relevantFindings || 'N/A'}

Provisional Diagnosis: ${clinicalNotes.provisionalDiagnosis || 'N/A'}

ADDITIONAL INFORMATION:
Pregnancy Status: ${clinicalNotes.pregnancy?.status ? `Yes (${clinicalNotes.pregnancy.weeks} weeks)` : 'No / N/A'}
Contrast Required: ${clinicalNotes.contrast ? 'Yes' : 'No'}
Known Allergies: ${clinicalNotes.allergies || 'None'}
Urgency: ${clinicalNotes.urgency || 'Routine'}

REQUESTING PRACTITIONER:
Name: ${requestedByProfile.full_name}
Contact: ${requestedByProfile.phone || 'N/A'}
Date: ${currentDate}

---
This is an official diagnostic imaging request. Please process according to the specified urgency level.
Request ID: ${requestId}
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
