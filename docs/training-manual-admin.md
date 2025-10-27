# Training Manual - Administrator

## Overview
As an Administrator, you have full access to the Healthcare Visit Management System. You can manage users, patients, visits, prescriptions, and system settings.

---

## Getting Started

### Logging In
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You'll be directed to the Dashboard

---

## Dashboard

The Dashboard provides an overview of:
- **Today's Visits**: Total visits scheduled for today
- **Completed Visits**: Number of completed visits today
- **Total Patients**: Total number of patients in the system
- **Urgent Requests**: Number of urgent visit requests

### Today's Schedule
View all visits scheduled for today with:
- Patient name
- Scheduled time
- Assigned nurse
- Visit status (Scheduled, In Progress, Completed)

Click on any visit to view full details.

---

## Managing Patients

### Viewing All Patients
1. Click **"Patients"** in the sidebar
2. View the list of all registered patients
3. Use the search bar to find specific patients
4. Click on any patient card to view their full profile

### Adding a New Patient
1. Navigate to **Patients** page
2. Click **"Add New Patient"** button
3. Fill in the required information:
   - Full Name
   - Date of Birth
   - Gender
   - Phone Number
   - Email (optional)
   - Address (with autocomplete)
   - Emergency Contact
   - Blood Type
   - Medical Conditions
   - Allergies
   - Current Medications
4. Upload consent forms if available
5. Click **"Save Patient"**

### Viewing Patient Details
1. Click on a patient from the Patients list
2. View comprehensive patient information:
   - Personal details
   - Medical history
   - Visit timeline
   - Vital signs history
   - Prescriptions
3. Edit patient information using the **Edit** button

---

## Managing Visits

### Viewing All Visits
1. Click **"Visits"** in the sidebar
2. View all visits with filtering options
3. Filter by status or date range
4. Click on any visit to view details

### Creating a New Visit
1. Navigate to **Visits** page
2. Click **"New Visit"** button
3. Select or search for a patient
4. Fill in visit details:
   - Visit type (Home Visit or Telemedicine)
   - Scheduled date and time
   - Priority level
   - Reason for visit
   - Special instructions
5. Assign a nurse (optional)
6. Click **"Schedule Visit"**

### Dispatch Board
1. Click **"Dispatch"** in the sidebar
2. View real-time visit status across columns:
   - **Scheduled**: Visits waiting for nurse assignment
   - **Assigned**: Visits assigned to nurses
   - **En Route**: Nurses traveling to patient
   - **On Site**: Nurses currently with patients
3. Monitor nurse locations and visit progress
4. Reassign visits as needed

---

## Managing Prescriptions

### Viewing Prescriptions
1. Click **"Prescriptions"** in the sidebar
2. View all prescriptions with status:
   - Draft (being prepared)
   - Pending Approval
   - Approved (signed by doctor)
3. Filter by status or search by patient name

### Prescription Workflow
As an admin, you can:
- View all prescriptions
- Monitor prescription approval status
- Generate PDF copies of approved prescriptions
- Track which doctor created and approved each prescription

**Note**: Only doctors can create and approve prescriptions.

---

## User Management

### Viewing Users
1. Click **"Users"** in the sidebar
2. View all system users organized by role:
   - Admins
   - Doctors
   - Nurses
   - Control Room Staff

### Adding New Users
1. Navigate to **Users** page
2. Click **"Add New User"** button
3. Fill in user information:
   - Full Name
   - Email Address
   - Phone Number
   - Role (Admin, Doctor, Nurse, Control Room)
   - Temporary Password
4. Click **"Create User"**
5. The user will receive their login credentials

### Managing User Roles
- **Admin**: Full system access
- **Doctor**: Manage prescriptions, view all patients and visits
- **Nurse**: Conduct visits, record vitals, view assigned patients
- **Control Room**: Dispatch and monitor visits, coordinate care

### Editing Users
1. Click on a user card
2. Update their information
3. Reset passwords if needed
4. Deactivate users if necessary

---

## Settings & System Configuration

### Accessing Settings
1. Click **"Settings"** in the sidebar
2. Configure various system preferences

### Profile Settings
- Update your full name
- Add or update phone number
- Manage personal preferences

### Notification Preferences
- **Email Notifications**: Toggle email alerts on/off
- **Visit Reminders**: Receive notifications for upcoming visits
- **Assignment Alerts**: Get notified when assigned to new tasks

### Zapier Integration
The system integrates with Zapier for automated notifications and workflows.

**Configuring Zapier Webhook:**
1. Navigate to Settings page
2. Scroll to **Zapier Integration** section
3. Enter your Zapier webhook URL
4. Click **Save Webhook URL**
5. Click **Test Webhook** to verify the connection

**What Gets Sent to Zapier:**
- Equipment checklist alerts when issues are reported
- Critical system notifications
- Custom workflow triggers

**Setting Up Your Zap:**
1. Create a new Zap in Zapier
2. Choose "Webhooks by Zapier" as the trigger
3. Select "Catch Hook"
4. Copy the webhook URL provided
5. Paste it in the system Settings page
6. Configure your Zap actions (e.g., send email via Outlook 365)
7. Test the webhook from Settings to verify

### Security Settings
- **Multi-Factor Authentication**: Enable MFA for added security
- **Password Management**: Change your password regularly
- Use strong passwords and never share credentials

---

## Equipment Checklists

### Overview
The system includes equipment checklists to ensure all medical equipment is properly maintained and functional.

### Accessing Checklists
1. Click **"Checklists"** in the sidebar
2. View available checklist templates
3. Submit new checklists or review past submissions

### Submitting a Checklist
1. Select a checklist template (e.g., "Medical Equipment Daily Check")
2. Fill in staff name
3. For each equipment item, select **Yes** or **No**
4. If **No**, provide details in the comment field
5. Enter your signature name
6. Click **Submit Checklist**

### Automatic Alerts
When equipment issues are reported (any "No" answers):
- System automatically sends alerts via Zapier
- Management team receives email notification
- Issues are documented with staff name and timestamp
- PDF record is generated for compliance

### Viewing Past Submissions
1. Click on **"Past Submissions"** tab
2. Review all submitted checklists
3. View staff signatures and timestamps
4. Download PDF records as needed

---

## Best Practices

### Security
- Never share your admin credentials
- Regularly review user access levels
- Audit user activity periodically
- Use strong passwords

### Patient Privacy
- Always verify patient identity before sharing information
- Log out when leaving your workstation
- Follow HIPAA compliance guidelines
- Only access patient records when necessary

### Workflow Management
- Review the Dispatch board regularly
- Ensure visits are properly assigned
- Monitor urgent requests promptly
- Follow up on incomplete visits

### Data Quality
- Ensure patient information is complete and accurate
- Verify addresses before scheduling home visits
- Keep emergency contact information current
- Update medical histories regularly

---

## Troubleshooting

### Cannot Log In
- Verify your email and password
- Check if Caps Lock is enabled
- Contact IT support if issues persist

### Visit Not Showing
- Refresh the page
- Check the date filters
- Verify the visit was properly saved

### User Cannot Access Features
- Verify their role assignment
- Check if their account is active
- Confirm they're using the correct login credentials

---

## Support

For technical support or questions:
- Contact IT Help Desk
- Email: support@healthcare-system.com
- Phone: [Support Number]

---

## Quick Reference

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Quick search
- `Esc`: Close dialogs

### Status Indicators
- 🟢 **Scheduled**: Visit is scheduled
- 🟡 **In Progress**: Visit underway
- 🔴 **Urgent**: Requires immediate attention
- ✅ **Completed**: Visit finished

---

*Last Updated: [Current Date]*
*Version 1.0*
