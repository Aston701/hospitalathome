import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sickNoteId } = await req.json();

    if (!sickNoteId) {
      throw new Error('Sick note ID is required');
    }

    console.log('Generating PDF for sick note:', sickNoteId);

    // Fetch sick note with related data
    const { data: sickNote, error: fetchError } = await supabase
      .from('sick_notes')
      .select(`
        *,
        patient:patients(first_name, last_name, sa_id_number, date_of_birth),
        issuer:issued_by(id),
        visit:visits(scheduled_start)
      `)
      .eq('id', sickNoteId)
      .single();

    if (fetchError) throw fetchError;
    if (!sickNote) throw new Error('Sick note not found');

    // Fetch doctor profile separately
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', sickNote.issued_by)
      .single();

    // Generate HTML for the sick note
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .content {
              margin: 30px 0;
            }
            .section {
              margin: 20px 0;
            }
            .section-title {
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
              font-size: 14px;
              text-transform: uppercase;
            }
            .info-row {
              display: flex;
              margin: 8px 0;
            }
            .info-label {
              font-weight: bold;
              width: 180px;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .certification {
              margin-top: 40px;
              padding: 20px;
              background-color: #f9f9f9;
              border-left: 4px solid #333;
            }
            .signature-section {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 2px solid #ddd;
            }
            .signature-line {
              margin-top: 50px;
              border-top: 1px solid #333;
              width: 300px;
              padding-top: 5px;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MEDICAL CERTIFICATE</h1>
            <p>Sick Note / Certificate of Incapacity</p>
            <p>Date Issued: ${new Date(sickNote.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="content">
            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-row">
                <div class="info-label">Patient Name:</div>
                <div class="info-value">${sickNote.patient.first_name} ${sickNote.patient.last_name}</div>
              </div>
              ${sickNote.patient.sa_id_number ? `
              <div class="info-row">
                <div class="info-label">ID Number:</div>
                <div class="info-value">${sickNote.patient.sa_id_number}</div>
              </div>
              ` : ''}
              ${sickNote.patient.date_of_birth ? `
              <div class="info-row">
                <div class="info-label">Date of Birth:</div>
                <div class="info-value">${new Date(sickNote.patient.date_of_birth).toLocaleDateString('en-ZA')}</div>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">Medical Assessment</div>
              <div class="info-row">
                <div class="info-label">Date of Consultation:</div>
                <div class="info-value">${new Date(sickNote.visit.scheduled_start).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Diagnosis/Condition:</div>
                <div class="info-value">${sickNote.diagnosis}</div>
              </div>
            </div>

            <div class="certification">
              <p style="margin: 0; font-size: 15px;">
                <strong>I hereby certify that the above-named patient has been examined and is unfit for work/school due to the stated medical condition.</strong>
              </p>
            </div>

            <div class="section">
              <div class="section-title">Period of Incapacity</div>
              <div class="info-row">
                <div class="info-label">Start Date:</div>
                <div class="info-value">${new Date(sickNote.start_date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-row">
                <div class="info-label">End Date:</div>
                <div class="info-value">${new Date(sickNote.end_date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Total Duration:</div>
                <div class="info-value">${sickNote.days_duration} day${sickNote.days_duration !== 1 ? 's' : ''}</div>
              </div>
            </div>

            ${sickNote.additional_notes ? `
            <div class="section">
              <div class="section-title">Additional Notes</div>
              <div class="info-value" style="white-space: pre-wrap;">${sickNote.additional_notes}</div>
            </div>
            ` : ''}

            <div class="signature-section">
              <div class="info-row">
                <div class="info-label">Issued By:</div>
                <div class="info-value">${doctorProfile?.full_name || 'Medical Professional'}</div>
              </div>
              ${doctorProfile?.phone ? `
              <div class="info-row">
                <div class="info-label">Contact:</div>
                <div class="info-value">${doctorProfile.phone}</div>
              </div>
              ` : ''}
              <div class="signature-line">
                <div style="font-size: 12px; color: #666;">Authorized Medical Professional</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is an official medical certificate issued by MediResponse</p>
            <p>Certificate Reference: ${sickNoteId}</p>
          </div>
        </body>
      </html>
    `;

    // Generate PDF using headless chrome
    const pdfResponse = await fetch('https://api.htmltopdf.app/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      }),
    });

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF');
    }

    const pdfBlob = await pdfResponse.blob();
    const fileName = `sick_note_${sickNote.patient.first_name}_${sickNote.patient.last_name}_${new Date().getTime()}.pdf`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(`sick-notes/${fileName}`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(`sick-notes/${fileName}`);

    // Update sick note with PDF URL
    const { error: updateError } = await supabase
      .from('sick_notes')
      .update({ pdf_url: publicUrl })
      .eq('id', sickNoteId);

    if (updateError) throw updateError;

    console.log('PDF generated successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf_url: publicUrl,
        message: 'Sick note PDF generated successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error generating sick note PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error occurred',
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});