import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF generation...');
    const { prescriptionId } = await req.json();
    console.log('Prescription ID:', prescriptionId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Supabase client created');

    // Fetch prescription with related data
    const { data: prescription, error: prescriptionError } = await supabaseClient
      .from('prescriptions')
      .select(`
        *,
        visit:visits(
          *,
          patient:patients(*)
        ),
        doctor:doctor_id(full_name, phone)
      `)
      .eq('id', prescriptionId)
      .single();

    console.log('Prescription query result:', { 
      hasData: !!prescription, 
      hasError: !!prescriptionError,
      error: prescriptionError 
    });

    if (prescriptionError || !prescription) {
      console.error('Prescription not found:', prescriptionError);
      throw new Error('Prescription not found');
    }

    console.log('Creating PDF document...');

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom fonts
    pdfDoc.registerFontkit(fontkit);
    
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // Load handwritten font for signature
    let handwrittenFont;
    try {
      console.log('Fetching handwritten font...');
      // Using Caveat font - a reliable handwritten font for pdf-lib
      const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/caveat/Caveat-Regular.ttf';
      const fontResponse = await fetch(fontUrl);
      
      if (!fontResponse.ok) {
        throw new Error(`Font fetch failed: ${fontResponse.status}`);
      }
      
      const fontBytes = await fontResponse.arrayBuffer();
      console.log('Font downloaded, size:', fontBytes.byteLength);
      
      handwrittenFont = await pdfDoc.embedFont(new Uint8Array(fontBytes));
      console.log('Handwritten font embedded successfully');
    } catch (fontError) {
      console.error('Error loading handwritten font:', fontError);
      console.log('Falling back to italic font');
      handwrittenFont = italicFont; // Fallback to italic if custom font fails
    }

    let yPosition = height - 50;

    // Header
    page.drawText('PRESCRIPTION', {
      x: 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;
    page.drawText(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
    });

    page.drawText(`Prescription #: ${prescription.id.slice(0, 8)}`, {
      x: 400,
      y: yPosition,
      size: 12,
      font: font,
    });

    // Doctor Information
    yPosition -= 40;
    page.drawText('PRESCRIBER INFORMATION', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    });

    yPosition -= 20;
    page.drawText(`Dr. ${prescription.doctor.full_name}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
    });

    if (prescription.doctor.phone) {
      yPosition -= 15;
      page.drawText(`Tel: ${prescription.doctor.phone}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });
    }

    // Patient Information
    yPosition -= 40;
    page.drawText('PATIENT INFORMATION', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    });

    const patient = prescription.visit.patient;
    yPosition -= 20;
    page.drawText(`Name: ${patient.first_name} ${patient.last_name}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
    });

    if (patient.date_of_birth) {
      yPosition -= 15;
      page.drawText(`DOB: ${new Date(patient.date_of_birth).toLocaleDateString()}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });
    }

    if (patient.phone) {
      yPosition -= 15;
      page.drawText(`Phone: ${patient.phone}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });
    }

    if (patient.address_line1) {
      yPosition -= 15;
      page.drawText(`Address: ${patient.address_line1}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });

      if (patient.city) {
        yPosition -= 15;
        page.drawText(`${patient.city}${patient.postal_code ? ', ' + patient.postal_code : ''}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
        });
      }
    }

    if (patient.medical_aid_provider) {
      yPosition -= 15;
      page.drawText(`Medical Aid: ${patient.medical_aid_provider}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });

      if (patient.medical_aid_number) {
        yPosition -= 15;
        page.drawText(`Member Number: ${patient.medical_aid_number}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
        });
      }
    }

    // Medications
    yPosition -= 40;
    page.drawText('MEDICATIONS', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    });

    yPosition -= 25;

    prescription.items.forEach((item: any, index: number) => {
      page.drawText(`${index + 1}. ${item.drug}`, {
        x: 60,
        y: yPosition,
        size: 12,
        font: boldFont,
      });

      yPosition -= 15;
      page.drawText(`   Dose: ${item.dose}`, {
        x: 60,
        y: yPosition,
        size: 11,
        font: font,
      });

      yPosition -= 15;
      page.drawText(`   Frequency: ${item.frequency}`, {
        x: 60,
        y: yPosition,
        size: 11,
        font: font,
      });

      yPosition -= 15;
      page.drawText(`   Duration: ${item.duration}`, {
        x: 60,
        y: yPosition,
        size: 11,
        font: font,
      });

      yPosition -= 25;
    });

    // Footer with signature
    yPosition = 180;
    
    if (prescription.signature_name) {
      // Draw the signature name in handwritten font
      page.drawText(prescription.signature_name, {
        x: 50,
        y: yPosition,
        size: 28,
        font: handwrittenFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 10;
      page.drawText('_________________________________', {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });

      yPosition -= 15;
      page.drawText('Digitally Signed', {
        x: 50,
        y: yPosition,
        size: 9,
        font: font,
      });

      if (prescription.signature_timestamp) {
        yPosition -= 12;
        page.drawText(`Date & Time: ${new Date(prescription.signature_timestamp).toLocaleString()}`, {
          x: 50,
          y: yPosition,
          size: 9,
          font: font,
        });
      }

      if (prescription.signature_ip) {
        yPosition -= 12;
        page.drawText(`IP Address: ${prescription.signature_ip}`, {
          x: 50,
          y: yPosition,
          size: 9,
          font: font,
        });
      }
    } else {
      page.drawText('_________________________________', {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });

      yPosition -= 15;
      page.drawText('Prescriber Signature', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      });
    }

    page.drawText(`Status: ${prescription.status.toUpperCase()}`, {
      x: 400,
      y: 180,
      size: 10,
      font: boldFont,
    });

    // Generate PDF
    console.log('Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('PDF saved, size:', pdfBytes.length);

    // Upload to storage
    const fileName = `${prescriptionId}.pdf`;
    console.log('Uploading to storage:', fileName);
    const { error: uploadError } = await supabaseClient.storage
      .from('prescriptions')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    console.log('Upload successful');

    // Get signed URL for private bucket
    console.log('Creating signed URL...');
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('prescriptions')
      .createSignedUrl(fileName, 31536000); // 1 year expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError);
      throw new Error('Failed to create signed URL');
    }

    const signedUrl = signedUrlData.signedUrl;
    console.log('Signed URL created');

    // Update prescription with PDF URL
    console.log('Updating prescription with PDF URL...');
    const { error: updateError } = await supabaseClient
      .from('prescriptions')
      .update({ pdf_url: signedUrl })
      .eq('id', prescriptionId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }
    console.log('Prescription updated successfully');

    return new Response(
      JSON.stringify({ success: true, pdfUrl: signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error message:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
