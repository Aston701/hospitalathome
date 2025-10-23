import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

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

    // Parse request body with error handling
    let sickNoteId: string | undefined;
    try {
      const body = await req.json();
      sickNoteId = body.sickNoteId;
    } catch (jsonError) {
      console.error("Error parsing request body:", jsonError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sickNoteId) {
      return new Response(
        JSON.stringify({ error: 'Sick note ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating PDF for sick note:', sickNoteId);

    // Fetch sick note data
    const { data: sickNote, error: fetchError } = await supabase
      .from('sick_notes')
      .select('*')
      .eq('id', sickNoteId)
      .single();

    if (fetchError) throw fetchError;
    if (!sickNote) throw new Error('Sick note not found');

    console.log('Sick note data:', {
      id: sickNote.id,
      status: sickNote.status,
      signature_name: sickNote.signature_name,
      signature_timestamp: sickNote.signature_timestamp
    });

    // Fetch patient data separately
    const { data: patient } = await supabase
      .from('patients')
      .select('first_name, last_name, sa_id_number, date_of_birth')
      .eq('id', sickNote.patient_id)
      .single();

    // Fetch visit data separately
    const { data: visit } = await supabase
      .from('visits')
      .select('scheduled_start')
      .eq('id', sickNote.visit_id)
      .single();

    // Fetch doctor profile separately
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', sickNote.issued_by)
      .single();

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    // Register fontkit to embed custom TTF
    pdfDoc.registerFontkit(fontkit);
    // Load a cursive/handwritten font for signatures
    let signatureFont = await (async () => {
      try {
        const ttfUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf';
        const ttfBytes = await (await fetch(ttfUrl)).arrayBuffer();
        return await pdfDoc.embedFont(new Uint8Array(ttfBytes));
      } catch (_) {
        // Fallback to Helvetica if fetch fails
        return await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      }
    })();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    
    
    // === Brand Header: PrimeHealth style ===
    // Fetch the Medi Response long logo at runtime
    let logoImage;
    try {
      const logoResponse = await fetch('https://mediresponse.co.za/wp-content/uploads/2021/06/Medi-Response-Long-Logo.png');
      const logoBytes = await logoResponse.arrayBuffer();
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (e) {
      console.error('Logo fetch failed:', e);
    }

    const { width: pageWidth, height } = page.getSize();
    // Draw a thin green bar across the page (brand accent per sample)
    const barHeight = 18;
    page.drawRectangle({
      x: 0,
      y: height - (barHeight + 40),
      width: pageWidth,
      height: barHeight,
      color: rgb(0.63, 0.80, 0.38),
    });

    // Place the logo top-right if it loaded
    if (logoImage) {
      const logoHeight = 46;
      const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
      page.drawImage(logoImage, {
        x: pageWidth - logoWidth - 35,
        y: height - logoHeight - 24,
        width: logoWidth,
        height: logoHeight,
      });
    }

    // Start content below the header area
// Start content below the header area
    let yPosition = height - (barHeight + 80);

    // (legacy logo block removed to avoid duplicate logo)

// Header
    page.drawText('MEDICAL CERTIFICATE', {
      x: 150,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    page.drawText('Sick Note / Certificate of Incapacity', {
      x: 180,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 20;

    const issueDate = new Date(sickNote.created_at).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    page.drawText(`Date Issued: ${issueDate}`, {
      x: 200,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPosition -= 40;

    // Patient Information Section
    page.drawText('PATIENT INFORMATION', {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    page.drawText(`Patient Name: ${patient?.first_name} ${patient?.last_name}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;

    if (patient?.sa_id_number) {
      page.drawText(`ID Number: ${patient.sa_id_number}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    if (patient?.date_of_birth) {
      const dob = new Date(patient.date_of_birth).toLocaleDateString('en-ZA');
      page.drawText(`Date of Birth: ${dob}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }
    yPosition -= 10;

    // Medical Assessment Section
    page.drawText('MEDICAL ASSESSMENT', {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    if (visit?.scheduled_start) {
      const consultDate = new Date(visit.scheduled_start).toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      page.drawText(`Date of Consultation: ${consultDate}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    page.drawText(`Diagnosis/Condition: ${sickNote.diagnosis}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 25;

    // Certification
    page.drawText('I hereby certify that the above-named patient has been examined', {
      x: 70,
      y: yPosition,
      size: 10,
      font: boldFont,
    });
    yPosition -= 15;
    page.drawText('and is unfit for work/school due to the stated medical condition.', {
      x: 70,
      y: yPosition,
      size: 10,
      font: boldFont,
    });
    yPosition -= 25;

    // Period of Incapacity
    page.drawText('PERIOD OF INCAPACITY', {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    const startDate = new Date(sickNote.start_date).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    page.drawText(`Start Date: ${startDate}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;

    const endDate = new Date(sickNote.end_date).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    page.drawText(`End Date: ${endDate}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;

    const dayLabel = sickNote.days_duration !== 1 ? 'days' : 'day';
    page.drawText(`Total Duration: ${sickNote.days_duration} ${dayLabel}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 25;

    // Additional Notes
    if (sickNote.additional_notes) {
      page.drawText('ADDITIONAL NOTES', {
        x: 50,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      page.drawText(sickNote.additional_notes.substring(0, 200), {
        x: 70,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 25;
    }

    // Signature Section
    page.drawText('AUTHORIZED SIGNATURE', {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    page.drawText(`Issued By: ${doctorProfile?.full_name || 'Medical Professional'}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;

    if (doctorProfile?.phone) {
      page.drawText(`Contact: ${doctorProfile.phone}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    
    
    
    if (sickNote.signature_name) {
      // Add spacing before signature area
      yPosition -= 20;

      // Signature label above the line (small, neat)
      page.drawText("Signed By:", {
        x: 70,
        y: yPosition + 16,
        size: 9,
        font: boldFont,
      });

      // Signature positioning: make the text baseline and place the line just under it
      const sigLineStartX = 140;
      const sigLineEndX = 380;

      // Choose a baseline a bit above yPosition
      const sigSizeBase = 22;
      // We may scale down if the name is too long for the line
      const sigName = String(sickNote.signature_name);
      let sigSize = sigSizeBase;
      const availableWidth = (sigLineEndX - sigLineStartX) - 12;
      try {
        const testWidth = signatureFont.widthOfTextAtSize(sigName, sigSizeBase);
        if (testWidth > availableWidth) {
          const scale = availableWidth / testWidth;
          sigSize = Math.max(16, sigSizeBase * scale);
        }
      } catch (_) { /* ignore width calc errors */ }

      // Baseline Y for signature text
      const sigBaseY = yPosition + 10; // baseline of text
      // Draw the signature (on baseline)
      page.drawText(sigName, {
        x: sigLineStartX + 6,
        y: sigBaseY,
        size: sigSize,
        font: signatureFont,
      });

      // Draw line just under the baseline so the signature "sits" on it
      const sigLineY = sigBaseY - 3; // slightly below baseline
      page.drawLine({
        start: { x: sigLineStartX, y: sigLineY },
        end: { x: sigLineEndX, y: sigLineY },
        thickness: 1.2,
        color: rgb(0, 0, 0),
      });

      // Move cursor below the signature block
      yPosition -= 25;
    }

    }

    }

    }

    if (sickNote.signature_timestamp) {
      const signatureDate = new Date(sickNote.signature_timestamp).toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      page.drawText(`Signature Date: ${signatureDate}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    }

    yPosition -= 20;
    page.drawLine({
      start: { x: 70, y: yPosition },
      end: { x: 300, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
    page.drawText('Authorized Medical Professional', {
      x: 70,
      y: yPosition,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Footer
    page.drawText('This is an official medical certificate issued by MediResponse', {
      x: 120,
      y: 50,
      size: 9,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });
    page.drawText(`Certificate Reference: ${sickNoteId}`, {
      x: 180,
      y: 35,
      size: 8,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const fileName = `sick_note_${patient?.first_name || 'patient'}_${patient?.last_name || 'note'}_${new Date().getTime()}.pdf`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(`sick-notes/${fileName}`, pdfBytes, {
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
