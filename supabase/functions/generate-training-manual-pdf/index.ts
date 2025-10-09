import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { comprehensiveManuals } from "./comprehensive-manuals.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { role } = await req.json();
    
    if (!role || !comprehensiveManuals[role]) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const content = comprehensiveManuals[role];
    const title = `${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')} Training Manual`;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const fontSize = 10;
    const lineHeight = 14;
    const margin = 50;
    const pageWidth = 612; // US Letter
    const pageHeight = 792;
    const maxWidth = pageWidth - (margin * 2);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Title page
    page.drawText(title, {
      x: margin,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.3, 0.6),
    });
    
    yPosition -= 30;
    page.drawText('Comprehensive Training Guide', {
      x: margin,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    yPosition -= 60;

    // Process content
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        yPosition -= lineHeight / 2;
        continue;
      }

      // Chapter headers (=== lines)
      if (trimmedLine.startsWith('===')) {
        yPosition -= 10;
        continue;
      }

      // Major headers (all caps, no special characters)
      if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 0 && !trimmedLine.startsWith('-') && !trimmedLine.match(/^\d+\./)) {
        yPosition -= 8;
        
        // Check if it's a chapter title (contains "CHAPTER")
        if (trimmedLine.includes('CHAPTER')) {
          page.drawText(trimmedLine, {
            x: margin,
            y: yPosition,
            size: fontSize + 4,
            font: boldFont,
            color: rgb(0.1, 0.2, 0.5),
          });
          yPosition -= lineHeight + 10;
        } else {
          page.drawText(trimmedLine, {
            x: margin,
            y: yPosition,
            size: fontSize + 2,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.4),
          });
          yPosition -= lineHeight + 5;
        }
        continue;
      }

      // Bullet points or numbered lists
      if (trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
        const text = trimmedLine.replace(/^-/, '  -').replace(/^(\d+\.)/, '  $1');
        const words = text.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          
          if (width > maxWidth - 20) {
            page.drawText(currentLine, {
              x: margin + 15,
              y: yPosition,
              size: fontSize,
              font: font,
            });
            yPosition -= lineHeight;
            currentLine = word;
            
            if (yPosition < margin + 30) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          page.drawText(currentLine, {
            x: margin + 15,
            y: yPosition,
            size: fontSize,
            font: font,
          });
          yPosition -= lineHeight;
        }
        continue;
      }

      // Regular text with word wrap
      const words = trimmedLine.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        
        if (width > maxWidth) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: font,
          });
          yPosition -= lineHeight;
          currentLine = word;
          
          if (yPosition < margin + 30) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: font,
        });
        yPosition -= lineHeight;
      }
    }

    // Footer on last page
    const currentDate = new Date().toLocaleDateString();
    page.drawText(`Last Updated: ${currentDate} | Version 2.0 Comprehensive Edition`, {
      x: margin,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes as unknown as BodyInit, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${role}-training-manual.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
