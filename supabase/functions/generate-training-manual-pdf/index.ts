import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Training manual content
const manuals: Record<string, string> = {
  admin: `ADMINISTRATOR TRAINING MANUAL

OVERVIEW
As an Administrator, you have full access to the Healthcare Visit Management System. You can manage users, patients, visits, prescriptions, and system settings.

GETTING STARTED

Logging In
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You'll be directed to the Dashboard

DASHBOARD

The Dashboard provides an overview of:
• Today's Visits: Total visits scheduled for today
• Completed Visits: Number of completed visits today
• Total Patients: Total number of patients in the system
• Urgent Requests: Number of urgent visit requests

MANAGING PATIENTS

Viewing All Patients
1. Click "Patients" in the sidebar
2. View the list of all registered patients
3. Use the search bar to find specific patients
4. Click on any patient card to view their full profile

Adding a New Patient
1. Navigate to Patients page
2. Click "Add New Patient" button
3. Fill in required information
4. Upload consent forms if available
5. Click "Save Patient"

MANAGING VISITS

Creating a New Visit
1. Navigate to Visits page
2. Click "New Visit" button
3. Select or search for a patient
4. Fill in visit details
5. Assign a nurse (optional)
6. Click "Schedule Visit"

Dispatch Board
1. Click "Dispatch" in the sidebar
2. View real-time visit status
3. Monitor nurse locations and visit progress
4. Reassign visits as needed

MANAGING PRESCRIPTIONS

• View all prescriptions
• Monitor prescription approval status
• Generate PDF copies of approved prescriptions
• Track which doctor created and approved each prescription

USER MANAGEMENT

Adding New Users
1. Navigate to Users page
2. Click "Add New User" button
3. Fill in user information
4. Assign role (Admin, Doctor, Nurse, Control Room)
5. Click "Create User"

BEST PRACTICES

Security
• Never share your admin credentials
• Regularly review user access levels
• Use strong passwords

Patient Privacy
• Always verify patient identity
• Log out when leaving your workstation
• Follow HIPAA compliance guidelines

For support, contact IT Help Desk`,

  doctor: `DOCTOR TRAINING MANUAL

OVERVIEW
As a Doctor, you have access to patient records, visit information, and prescription management. Your primary role is to review patient visits and create, approve, and manage prescriptions.

GETTING STARTED

Logging In
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You'll be directed to the Dashboard

DASHBOARD

The Dashboard provides an overview of:
• Today's Visits: Total visits scheduled for today
• Completed Visits: Number of completed visits today
• Total Patients: Total number of patients
• Urgent Requests: Number of urgent visit requests

MANAGING PRESCRIPTIONS

Creating a New Prescription
1. Access Patient Visit detail page
2. Click "Create New Prescription" button
3. Add medications with:
   - Drug Name
   - Dosage (e.g., "500mg")
   - Frequency (e.g., "Twice daily")
   - Duration (e.g., "7 days")
4. Review prescription carefully
5. Click "Save" to save as draft

Approving and Signing Prescriptions
1. Review prescription thoroughly
2. Click "Approve & Sign" button
3. Enter your full name as digital signature
4. Review legal disclaimer
5. Click "Sign and Approve"
6. PDF is automatically generated

Important Notes
• Only doctors can create and approve prescriptions
• Approved prescriptions cannot be edited
• Create a new prescription if changes are needed
• Your signature is legally binding

REVIEWING PATIENTS

Patient Profile Includes
• Personal information
• Medical conditions
• Current medications
• Known allergies (Always check!)
• Previous visit history
• Historical vital signs
• Previous prescriptions

REVIEWING VISITS

Visit Status Guide
• Scheduled: Visit scheduled, nurse may not be assigned
• Assigned: Nurse has been assigned
• En Route: Nurse traveling to patient
• On Site: Nurse currently with patient
• In Telemed: Telemedicine session active
• Completed: Visit concluded

BEST PRACTICES

Prescription Safety
1. Always verify patient allergies
2. Check for drug interactions
3. Verify correct dosages
4. Document reasoning

Clinical Workflow
1. Review visit notes thoroughly
2. Check vital signs
3. Review uploaded photos/documents
4. Create prescription thoughtfully
5. Sign only when certain

TELEMEDICINE VISITS

Conducting Virtual Consultations
1. Review patient medical history
2. Take detailed notes during consultation
3. Document patient's reported symptoms
4. Create prescriptions as needed

For clinical questions, contact Medical Director
For technical support, contact IT Help Desk`,

  nurse: `NURSE TRAINING MANUAL

OVERVIEW
As a Nurse, you are responsible for conducting patient visits, recording vital signs, documenting visit notes, and uploading relevant medical information.

GETTING STARTED

Logging In
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You'll be directed to the Visits page

YOUR WORKSPACE - VISITS PAGE

When you log in, you'll see:
• All assigned visits for the day
• Visit status for each patient
• Scheduled times
• Patient addresses for home visits

UNDERSTANDING VISIT STATUS

• Scheduled: Visit on your schedule, not yet started
• Assigned: Visit assigned to you
• En Route: Traveling to patient
• On Site: At patient location
• In Telemed: Telemedicine session active
• Completed: Visit finished and documented

CONDUCTING A VISIT

Before the Visit
1. Review patient information
2. Check for allergies and current medications
3. Note special instructions
4. Update status to "En Route"

During the Visit
1. Update status to "On Site"
2. Record vital signs:
   - Blood Pressure
   - Heart Rate
   - Temperature
   - Respiratory Rate
   - Oxygen Saturation
   - Blood Glucose (if applicable)
3. Document visit notes
4. Take photos if needed
5. Provide care

Completing the Visit
1. Review all vitals recorded
2. Ensure visit notes complete
3. Upload necessary photos
4. Document follow-up needed
5. Update status to "Completed"

RECORDING VITAL SIGNS

Best Practices
• Blood Pressure: Patient seated, relaxed 5 minutes
• Heart Rate: Count for full 60 seconds
• Temperature: Specify method used
• Respiratory Rate: Observe for 60 seconds
• Oxygen Saturation: Ensure finger warm and clean
• Blood Glucose: Note time of last meal

TELEMEDICINE VISITS

1. Test internet connection
2. Update status to "In Telemed"
3. Guide patient through symptoms
4. Ask for patient-reported vitals
5. Document observations
6. Complete visit

EMERGENCY SITUATIONS

When to Call 911
• Patient unresponsive
• Chest pain or difficulty breathing
• Severe bleeding
• Signs of stroke
• Any life-threatening situation

Procedure
1. Call 911 immediately
2. Provide care within scope
3. Stay with patient
4. Notify control room
5. Document thoroughly

BEST PRACTICES

Patient Care
• Always verify patient identity
• Check allergies before administering anything
• Follow infection control protocols
• Respect patient privacy

Safety First
• Use proper PPE when required
• Never guess at measurements
• Record vitals immediately
• Document accurately

For clinical questions, contact on-call doctor
For technical support, contact Control Room`,

  control_room: `CONTROL ROOM TRAINING MANUAL

OVERVIEW
As a Control Room operator, you are the central coordination hub for all healthcare visits. You monitor real-time visit status, dispatch nurses, manage schedules, and ensure smooth operations.

GETTING STARTED

Logging In
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You'll be directed to the Dispatch board

THE DISPATCH BOARD

Your mission control center with 4 main columns:

1. Scheduled
   - Visits scheduled but not assigned
   - Action: Assign to available nurses

2. Assigned
   - Visits assigned but nurse hasn't departed
   - Action: Monitor for delays

3. En Route
   - Nurses traveling to patients
   - Action: Monitor travel progress

4. On Site
   - Nurses currently with patients
   - Action: Monitor visit progress

Real-Time Updates
• Board updates automatically
• New visits appear instantly
• Completed visits move off board
• Color-coded for quick scanning

MANAGING VISITS

Creating a New Visit
1. Click "Visits" in sidebar
2. Click "New Visit" button
3. Enter visit details:
   - Select patient
   - Visit type (Home/Telemedicine)
   - Date and time
   - Priority level
   - Reason for visit
4. Assign nurse (optional)
5. Click "Schedule Visit"

Reassigning Visits
When to Reassign:
• Nurse calls in sick
• Emergency situations
• Visit running late
• Nurse requests assistance

How to Reassign:
1. Access visit from board
2. Click "Edit" or "Reassign"
3. Select new nurse
4. Add explanatory note
5. Save changes

Handling Urgent Requests
1. Identify urgent visit
2. Assess available nurses
3. Assign closest nurse
4. Contact nurse directly
5. Monitor closely

MONITORING VISIT PROGRESS

Normal Flow:
Scheduled → Assigned → En Route → On Site → Completed

Warning Signs:
• Visit stuck in one status too long
• Scheduled but not assigned after 30 minutes
• En Route longer than expected
• On Site unusually long

Action Required:
• Contact assigned nurse
• Check for issues
• Reassign if necessary
• Update patient if delayed

SCHEDULING AND COORDINATION

Daily Schedule Management
1. Morning review of all visits
2. Verify nurse assignments
3. Identify conflicts
4. Plan for coverage

Route Optimization
• Assign nurses to same geographic area
• Minimize travel time
• Consider traffic patterns
• Balance workload

HANDLING SPECIAL SITUATIONS

Emergency Situations
When Nurse Reports Emergency:
1. Remain calm, gather information
2. Ensure 911 called if needed
3. Alert doctor immediately
4. Document everything
5. Notify supervisor
6. Adjust schedule

When Patient Calls Emergency:
1. Direct to call 911
2. Gather details
3. Alert assigned nurse
4. Notify doctor
5. Document call
6. Schedule follow-up

Technical Issues
• Document visits manually
• Use phone communication
• Enter data when system returns
• Report to IT

BEST PRACTICES

Communication Excellence
• Be clear and concise
• Respond promptly
• Proactive updates
• Professional language

Operational Efficiency
• Stay organized
• Anticipate issues
• Have backup plans
• Monitor weather/traffic

Quality Assurance
• Verify information accuracy
• Ensure proper documentation
• Monitor incomplete visits
• Follow up on outstanding items

DAILY CHECKLIST

Start of Shift:
□ Review all scheduled visits
□ Verify nurse assignments
□ Check urgent visits
□ Confirm nurse availability

During Shift:
□ Monitor Dispatch Board
□ Respond to communications
□ Update visit statuses
□ Handle new requests
□ Document events

End of Shift:
□ Ensure visits completed
□ Document outstanding issues
□ Brief next shift
□ Submit reports

For technical support, contact IT Help Desk
For emergencies, follow emergency protocols`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { role } = await req.json();
    
    if (!role || !manuals[role]) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const content = manuals[role];
    const title = `${role.charAt(0).toUpperCase() + role.slice(1)} Training Manual`;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const fontSize = 11;
    const lineHeight = 14;
    const margin = 50;
    const pageWidth = 612; // US Letter
    const pageHeight = 792;
    const maxWidth = pageWidth - (margin * 2);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Title
    page.drawText(title, {
      x: margin,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.5),
    });
    yPosition -= 40;

    // Process content
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition < margin + 20) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        yPosition -= lineHeight;
        continue;
      }

      // Headers (all caps)
      if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 0 && !trimmedLine.startsWith('•')) {
        yPosition -= 5;
        page.drawText(trimmedLine, {
          x: margin,
          y: yPosition,
          size: fontSize + 2,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.4),
        });
        yPosition -= lineHeight + 5;
        continue;
      }

      // Bullet points or numbered lists
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
        const text = trimmedLine.replace(/^[•\-]/, '  •').replace(/^(\d+\.)/, '  $1');
        const words = text.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          
          if (width > maxWidth - 20) {
            page.drawText(currentLine, {
              x: margin + 20,
              y: yPosition,
              size: fontSize,
              font: font,
            });
            yPosition -= lineHeight;
            currentLine = word;
            
            if (yPosition < margin + 20) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          page.drawText(currentLine, {
            x: margin + 20,
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
          
          if (yPosition < margin + 20) {
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
    page.drawText(`Last Updated: ${currentDate} | Version 1.0`, {
      x: margin,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${role}-training-manual.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
