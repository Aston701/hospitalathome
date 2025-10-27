# Training Manual - Control Room Operator

## Table of Contents
1. [Introduction](#introduction)
2. [System Access](#system-access)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Patients](#managing-patients)
5. [Managing Visits](#managing-visits)
6. [Dispatch Board Operations](#dispatch-board-operations)
7. [Equipment Checklists](#equipment-checklists)
8. [User Management](#user-management)
9. [System Settings](#system-settings)
10. [Best Practices](#best-practices)

---

## Introduction

As a Control Room Operator, you are the central coordination hub for the Hospital at Home service. You manage patient records, schedule and coordinate visits, dispatch nurses and doctors, monitor real-time operations, and ensure smooth workflow across the entire system.

**Your Core Responsibilities:**
- Creating and managing patient records
- Scheduling and coordinating all visits
- Assigning nurses and doctors to visits
- Monitoring visit progress in real-time
- Managing the dispatch board
- Reviewing equipment checklists
- Creating and managing user accounts
- Configuring system settings and integrations

---

## System Access

### Logging In

1. **Open the Application**
   - Navigate to the application URL in your web browser
   - Recommended browsers: Chrome, Firefox, Safari, Edge

2. **Enter Your Credentials**
   - Email: Your registered email address
   - Password: Your secure password
   - Click **"Sign In"**

3. **First Login**
   - After signing in, you'll be directed to the Dashboard
   - Take a moment to familiarize yourself with the navigation sidebar on the left

### Navigation Menu

The sidebar contains all main sections:
- **Dashboard**: Overview and today's schedule
- **Dispatch**: Real-time visit tracking (your primary workspace)
- **Patients**: Patient database management
- **Visits**: Visit scheduling and history
- **Prescriptions**: View all prescriptions
- **Checklists**: Equipment maintenance tracking
- **Users**: Staff account management
- **Roster**: Staff scheduling (if applicable)
- **Settings**: System configuration

---

## Dashboard Overview

### Understanding the Dashboard

The Dashboard provides a real-time snapshot of operations:

**Key Metrics (Top Cards):**
1. **Today's Visits**: Total number of visits scheduled for today
2. **Completed Visits**: How many visits have been completed today
3. **Total Patients**: Total patients registered in the system
4. **Urgent Requests**: Number of urgent visit requests pending

**Today's Schedule Section:**
- Lists all visits scheduled for today
- Shows patient name, scheduled time, assigned nurse, and visit status
- Click on any visit card to view full details
- Color-coded by status for quick visual reference

### Using the Dashboard Effectively

**Start of Day Routine:**
1. Check total visits for the day
2. Review urgent requests first
3. Scan the schedule for any unassigned visits
4. Verify all visits have adequate nurse coverage
5. Note any visits requiring special attention

---

## Managing Patients

### Viewing Patient Records

1. **Access Patients Page**
   - Click **"Patients"** in the sidebar
   - You'll see a grid of patient cards

2. **Patient Card Information**
   - Each card shows: Name, Date of Birth, Contact Information
   - Medical conditions and allergies are highlighted
   - Number of total visits is displayed

3. **Searching for Patients**
   - Use the search bar at the top
   - Search by: Name, ID number, phone number, or email
   - Results update as you type

4. **Viewing Patient Details**
   - Click on any patient card
   - You'll see comprehensive patient information:
     - Personal details
     - Medical history
     - Visit timeline
     - Vital signs history
     - All prescriptions
     - Medical documents

### Creating a New Patient

1. **Start Patient Creation**
   - From Patients page, click **"Add New Patient"** button
   - A comprehensive form will appear

2. **Personal Information** (Required Fields)
   - **First Name**: Patient's first name
   - **Last Name**: Patient's surname
   - **Date of Birth**: Select from calendar or enter manually
   - **SA ID Number**: South African ID number (optional but recommended)
   - **Phone Number**: Primary contact number (required)
   - **Email Address**: Patient's email (optional)

3. **Address Information**
   - **Address Line 1**: Street address
   - **Address Line 2**: Apartment/Unit number (optional)
   - **Suburb**: Suburb or area name
   - **City**: City name
   - **Province**: Select from dropdown
   - **Postal Code**: Postal/ZIP code
   - **Note**: The address autocomplete feature can help you find correct addresses

4. **Medical Aid Information** (Optional)
   - **Medical Aid Provider**: Name of medical aid scheme
   - **Medical Aid Number**: Member number
   - **Medical Aid Plan**: Plan option name

5. **Medical Information**
   - **Medical Conditions**: List all chronic or current conditions
     - Click "+ Add Condition" for each one
     - Examples: Diabetes, Hypertension, Asthma
   - **Known Allergies**: List all allergies
     - Click "+ Add Allergy" for each one
     - Include medication allergies, food allergies, environmental
   - **Current Medications**: List ongoing medications
     - Enter medication name and dosage
     - Include both prescription and over-the-counter

6. **Additional Notes**
   - Add any special instructions
   - Document accessibility needs
   - Note preferred contact methods
   - Include emergency contact information

7. **Consent Documentation**
   - Upload signed consent forms if available
   - Mark consent as signed if obtained verbally (document in notes)

8. **Save Patient Record**
   - Review all information for accuracy
   - Click **"Save Patient"**
   - Patient is now in the system and available for visit scheduling

### Editing Patient Information

1. **Access Patient Record**
   - Find and click on the patient
   - Click **"Edit"** button (top right of patient details)

2. **Make Changes**
   - Update any necessary information
   - All fields can be modified
   - Changes are logged with timestamp

3. **Save Changes**
   - Click **"Save"**
   - Changes take effect immediately
   - All users will see updated information

---

## Managing Visits

### Understanding Visit Types

**Home Visit:**
- Nurse travels to patient's home
- Requires accurate address
- Shows travel time on dispatch board
- Medical box may be assigned

**Telemedicine:**
- Virtual consultation
- No travel required
- Requires internet connection
- Microsoft Teams meeting link generated

### Creating a New Visit

1. **Access Visit Creation**
   - Click **"Visits"** in sidebar
   - Click **"New Visit"** button (top right)

2. **Select Patient**
   - Search for patient by name
   - Click on patient from dropdown
   - Patient's address and medical info will auto-populate

3. **Visit Details**
   
   **Visit Type:**
   - Select "Home Visit" or "Telemedicine"
   
   **Scheduled Date & Time:**
   - Click date field to open calendar
   - Select date
   - Select start time (e.g., 09:00)
   - Select end time (e.g., 10:00)
   - Standard visits are usually 1 hour
   
   **Priority Level:**
   - **Routine**: Standard, non-urgent visit
   - **Urgent**: Requires attention soon
   - **Emergency**: Immediate attention needed
   
   **Reason for Visit:**
   - Enter detailed reason (required)
   - Examples: "Follow-up vital signs check", "Wound care assessment", "Post-discharge monitoring"
   
   **Special Instructions:**
   - Add any special notes for the nurse
   - Examples: "Patient has mobility issues", "Large dog on property", "Prefer afternoon visits"

4. **Assign Staff**
   
   **Assign Nurse:**
   - Select from dropdown of available nurses
   - Consider nurse's:
     - Current workload
     - Geographic location
     - Skills/specializations
     - Availability
   - Can be left unassigned and assigned later from Dispatch
   
   **Assign Doctor:**
   - Select doctor for oversight
   - Doctor will receive visit notifications
   - Doctor can review visit notes and prescribe medications

5. **Medical Box Assignment** (For Home Visits)
   - Select available medical box from dropdown
   - Ensures nurse has necessary equipment
   - System prevents double-booking of equipment

6. **Create Visit**
   - Review all information
   - Click **"Schedule Visit"**
   - Visit now appears on Dispatch board
   - Assigned staff receive notifications

### Editing Existing Visits

1. **Find the Visit**
   - Go to Visits page
   - Search by patient name or date
   - Click on visit card

2. **Edit Visit**
   - Click **"Edit"** button
   - Modify any details:
     - Reschedule date/time
     - Change assigned staff
     - Update priority
     - Add notes
   - Click **"Save Changes"**

3. **Notifications**
   - Affected staff are automatically notified of changes
   - Patient contact may be needed for significant changes

### Cancelling Visits

1. **Access Visit**
   - Find and open the visit

2. **Cancel**
   - Click **"Cancel Visit"** button
   - Enter cancellation reason
   - Confirm cancellation

3. **Follow-up**
   - Notify assigned staff
   - Contact patient to reschedule if appropriate
   - Document reason in visit notes

---

## Dispatch Board Operations

### Understanding the Dispatch Board

The Dispatch Board is your mission control center for real-time visit tracking.

**Access:** Click **"Dispatch"** in the sidebar

**Board Layout:**
The board has columns representing visit status:

1. **Scheduled** - Visits created but not yet started
2. **Assigned** - Nurse assigned, hasn't departed yet
3. **En Route** - Nurse traveling to patient
4. **On Site** - Nurse currently with patient
5. **Completed** - Visit finished

### Monitoring Visit Progress

**Real-Time Updates:**
- Board updates automatically every few seconds
- Visit cards move between columns as status changes
- No manual refresh needed

**Visit Card Information:**
Each card shows:
- Patient name
- Scheduled time
- Assigned nurse name
- Visit type icon (home/telemedicine)
- Priority indicator (if urgent/emergency)
- Time in current status

**Color Coding:**
- 🟢 Green: On schedule
- 🟡 Yellow: Attention needed
- 🔴 Red: Urgent/overdue

### Managing the Dispatch Flow

**Morning Setup:**
1. Review all "Scheduled" visits
2. Assign unassigned visits to available nurses
3. Verify geographic distribution is logical
4. Check for adequate time buffers between visits
5. Monitor for urgent requests

**Throughout the Day:**
1. Watch for visits stuck in one status too long
2. Contact nurses if no status updates
3. Reassign visits if nurses report delays
4. Monitor for emergency situations
5. Coordinate lunch breaks and other timing

**Warning Signs:**
- Visit in "Assigned" for > 30 minutes without moving to "En Route"
- Visit in "En Route" longer than expected travel time
- Visit "On Site" for unusually long duration (> 90 minutes)
- Multiple visits assigned to same nurse at overlapping times

### Reassigning Visits

**When to Reassign:**
- Nurse calls in sick
- Nurse running significantly behind schedule
- Emergency requires redistribution
- Better geographic assignment identified

**How to Reassign:**
1. Click on the visit card
2. Click **"Edit"** or **"Reassign"** button
3. Select new nurse from dropdown
4. Add note explaining reason
5. Click **"Save"**
6. Both nurses receive notification
7. Monitor to ensure smooth handoff

---

## Equipment Checklists

### Overview

Equipment checklists ensure all medical equipment is functional and safe. Nurses complete these before shifts, and you monitor for reported issues.

### Accessing Checklists

1. Click **"Checklists"** in sidebar
2. You'll see two tabs:
   - **Available Templates**: Checklist types staff can submit
   - **Past Submissions**: All completed checklists

### Reviewing Checklist Submissions

1. **View Submissions**
   - Click **"Past Submissions"** tab
   - See all submitted checklists in chronological order

2. **Submission Details**
   Each submission shows:
   - Checklist name (e.g., "Medical Equipment Daily Check")
   - Staff member who completed it
   - Date and time submitted
   - Signature name
   - PDF download option

3. **Expand to See Details**
   - Click on any submission to expand
   - View all checklist items
   - See which items were marked "Yes" (functional)
   - See which items were marked "No" (issues) with comments

### Handling Equipment Issues

**Automatic Alerts:**
- When a nurse reports any equipment problem (selects "No"), the system automatically sends an email alert to management
- Alert includes:
  - Checklist name
  - Staff member reporting
  - Specific equipment with issues
  - Comments explaining the problem
  - Timestamp

**Your Response:**
1. Review the reported issue in detail
2. Contact maintenance or arrange repair/replacement
3. Follow up with the reporting nurse
4. Update equipment status
5. Ensure replacement equipment is available
6. Document resolution

**Critical Equipment Issues:**
- If equipment is unsafe or critical: remove from service immediately
- Notify all staff
- Arrange immediate replacement
- Document incident

---

## User Management

### Viewing Users

1. **Access Users Page**
   - Click **"Users"** in sidebar
   - Users are grouped by role:
     - Admins
     - Control Room Staff
     - Doctors
     - Nurses

2. **User Information Displayed**
   - Full name
   - Email address
   - Phone number
   - Role
   - Active status

### Creating New User Accounts

1. **Start User Creation**
   - Click **"Add New User"** button

2. **Enter User Information**
   
   **Full Name:**
   - Complete first and last name
   
   **Email Address:**
   - Will be used for login
   - Must be unique in system
   
   **Phone Number:**
   - Contact number for the staff member
   
   **Role:**
   - **Admin**: Full system access, can manage all aspects
   - **Control Room**: Dispatch, scheduling, patient management
   - **Doctor**: View patients/visits, manage prescriptions
   - **Nurse**: Conduct visits, record vitals, view assigned patients
   
   **Temporary Password:**
   - Create a secure temporary password
   - User will be prompted to change on first login
   - Minimum 8 characters recommended

3. **Create User**
   - Click **"Create User"**
   - User can now log in with provided credentials
   - Communicate credentials securely to the new user

### Managing Existing Users

1. **Edit User Information**
   - Click on user card
   - Update name, phone, or role as needed
   - Save changes

2. **Reset Password**
   - Access user details
   - Click **"Reset Password"**
   - Provide new temporary password to user securely

3. **Deactivate User**
   - Access user details
   - Toggle active status to "Inactive"
   - User can no longer log in
   - Historical data is preserved

---

## System Settings

### Accessing Settings

1. Click **"Settings"** in sidebar
2. You'll see multiple configuration sections

### Profile Settings

**Update Your Information:**
1. **Full Name**: Your display name in the system
2. **Phone Number**: Your contact number
3. Click **"Update"** to save changes

### Notification Preferences

**Email Notifications:**
- Toggle on/off to receive email alerts
- Includes visit updates, urgent requests, system alerts

**Visit Reminders:**
- Notifications for upcoming visits
- Helpful for time management

**Assignment Alerts:**
- Alerts when you're assigned to tasks
- Ensures you don't miss assignments

### Zapier Integration

**What is Zapier Integration?**
- Connects the system to Zapier for automated workflows
- Sends equipment alerts to email (Microsoft 365 Outlook)
- Enables custom automation

**Configuring the Webhook:**

1. **Get Webhook URL from Zapier:**
   - Log in to Zapier (https://zapier.com)
   - Create a new Zap
   - Choose "Webhooks by Zapier" as trigger
   - Select "Catch Hook"
   - Copy the webhook URL provided

2. **Enter Webhook in System:**
   - In Settings, scroll to **Zapier Integration** section
   - Paste webhook URL into the field
   - Click **"Save Webhook URL"**

3. **Test the Connection:**
   - Click **"Test Webhook"** button
   - Check your Zapier dashboard - should see test data
   - If successful, you'll see confirmation message

4. **Complete Zapier Setup:**
   - Back in Zapier, configure action steps:
     - Add "Microsoft 365 Outlook - Send Email" action
     - Set recipients to management email addresses
     - Map data fields from webhook to email
     - Include: subject, message, recipient email, additional data
   - Turn on your Zap

**What Gets Sent:**
- Equipment checklist alerts (when staff report issues)
- Contains: checklist name, staff name, equipment issues, comments, timestamp

### Security Settings

**Multi-Factor Authentication:**
- Enable MFA for enhanced account security
- Requires second verification factor when logging in

**Password Management:**
- Change your password regularly
- Use strong, unique passwords
- Never share credentials

---

## Best Practices

### Communication

**With Nurses:**
- Give advance notice of assignments
- Provide complete patient information
- Be available for questions
- Acknowledge their updates and concerns
- Respect their clinical expertise

**With Doctors:**
- Alert to urgent situations immediately
- Provide clear visit summaries
- Coordinate telemedicine scheduling
- Relay medical directives accurately

**With Patients:**
- Return calls promptly
- Provide clear information
- Confirm appointment details
- Be empathetic and professional

### Operational Efficiency

**Daily Routine:**
1. Start with dashboard review
2. Check overnight messages
3. Verify day's schedule
4. Assign any unassigned visits
5. Monitor dispatch board throughout day
6. Review equipment checklists
7. End-of-day: brief next shift

**Time Management:**
- Allow buffer time between visits
- Consider travel time realistically
- Account for lunch breaks
- Keep emergency slots available

**Documentation:**
- Document all significant events
- Keep notes clear and professional
- Record decision rationale
- Maintain accurate logs

### Quality Assurance

**Before Scheduling Visits:**
- Verify patient address accuracy
- Confirm patient contact information
- Ensure appropriate staff assignment
- Check equipment availability

**During Operations:**
- Monitor visit progress actively
- Identify delays early
- Intervene proactively
- Keep all parties informed

**After Visit Completion:**
- Verify proper documentation
- Check for follow-up needs
- Review for improvement opportunities

### Emergency Protocols

**When Nurse Reports Emergency:**
1. Stay calm and gather information
2. Confirm 911 called if needed
3. Alert doctor immediately
4. Document everything
5. Notify supervisor
6. Adjust schedule for affected nurse
7. Follow up on outcome

**System Down:**
1. Switch to manual documentation
2. Use phone communication
3. Log all activities
4. Enter data when system returns
5. Report to IT immediately

---

## Troubleshooting

### Common Issues and Solutions

**Visit Not Appearing on Dispatch Board:**
- Check visit date is today or future
- Verify visit was saved successfully
- Refresh browser page
- Check visit status

**Cannot Assign Nurse to Visit:**
- Verify nurse account is active
- Check for time conflicts
- Ensure medical box not double-booked
- Try refreshing and assigning again

**Patient Information Not Saving:**
- Check all required fields completed
- Verify internet connection
- Check for error messages
- Try saving again
- Contact support if persists

**Checklist Submission Not Showing:**
- Refresh the Checklists page
- Check date filters
- Verify submission completed successfully
- Contact submitting staff if needed

---

## Support Contacts

**For Technical Support:**
- IT Help Desk
- Email: support@healthcare-system.com
- Document issue details and steps to reproduce

**For Operational Support:**
- Supervisor
- Escalation procedures per organization policy

**For Emergencies:**
- Follow emergency protocols
- Contact supervisor immediately
- Document all actions

---

*Last Updated: October 2025*
*Version 2.0 - Comprehensive Guide*