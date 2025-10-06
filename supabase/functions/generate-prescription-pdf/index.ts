import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prescriptionId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    if (prescriptionError || !prescription) {
      throw new Error('Prescription not found');
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

    // Footer
    yPosition = 100;
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

    page.drawText(`Status: ${prescription.status.toUpperCase()}`, {
      x: 400,
      y: yPosition,
      size: 10,
      font: boldFont,
    });

    // Generate PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const fileName = `${prescriptionId}.pdf`;
    const { error: uploadError } = await supabaseClient.storage
      .from('prescriptions')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL (signed URL for private bucket)
    const { data: { signedUrl } } = await supabaseClient.storage
      .from('prescriptions')
      .createSignedUrl(fileName, 31536000); // 1 year expiry

    // Update prescription with PDF URL
    const { error: updateError } = await supabaseClient
      .from('prescriptions')
      .update({ pdf_url: signedUrl })
      .eq('id', prescriptionId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, pdfUrl: signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
