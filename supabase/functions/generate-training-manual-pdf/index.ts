import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map role names to file names
const roleToFileName: Record<string, string> = {
  'control_room': 'training-manual-control-room.md',
  'doctor': 'training-manual-doctor.md',
  'nurse': 'training-manual-nurse.md',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { role } = await req.json();
    
    const fileName = roleToFileName[role];
    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Read markdown file from docs directory
    const filePath = `${Deno.cwd()}/../../docs/${fileName}`;
    let content: string;
    
    try {
      content = await Deno.readTextFile(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      return new Response(
        JSON.stringify({ error: 'Could not read training manual file' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Process markdown content
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

      // Skip markdown horizontal rules
      if (trimmedLine.startsWith('---')) {
        yPosition -= 10;
        continue;
      }

      // Handle markdown headers (# ## ###)
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        
        yPosition -= 8;
        
        const headerSize = fontSize + (7 - level) * 2;
        page.drawText(text, {
          x: margin,
          y: yPosition,
          size: headerSize,
          font: boldFont,
          color: rgb(0.1, 0.2, 0.5),
        });
        yPosition -= lineHeight + 10;
        continue;
      }

      // Handle markdown lists (- or numbered)
      if (trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
        const text = trimmedLine.replace(/^-\s*/, '• ').replace(/^(\d+\.)\s*/, '$1 ');
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

      // Handle bold text in markdown (**text**)
      const processedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1');

      // Regular text with word wrap
      const words = processedLine.split(' ');
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
    page.drawText(`Last Updated: ${currentDate} | Version 2.0 - Comprehensive Guide`, {
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