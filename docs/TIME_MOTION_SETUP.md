# Time Motion Tracking - Setup Guide

## Quick Setup

### 1. Install Dependencies

```bash
npm install react-dropzone uuid date-fns
```

### 2. Firebase Firestore Setup

Go to your Firebase Console and create a new collection:

**Collection Name:** `timeMotionEntries`

**Document Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scientistId | string | ✓ | User ID from auth |
| scientistName | string | ✓ | User name/email |
| date | string | ✓ | YYYY-MM-DD format |
| category | string | ✓ | research, document, trials, experiments, lab, meetings, discussions, field_visits, other |
| description | string | ✓ | What did you work on? |
| startTime | string | ✓ | HH:mm format (e.g., "09:30") |
| endTime | string | ✓ | HH:mm format (e.g., "11:45") |
| durationMinutes | number | ✓ | Total minutes (e.g., 135) |
| projectId | string | - | Firebase document ID of project |
| projectName | string | - | Name of the project |
| projectStage | string | - | concept, mis, design, development, testing, pilot, production, completed |
| attachments | array | - | Array of document objects |
| location | string | - | Where did you work? (Lab 1, Field Site A, etc.) |
| notes | string | - | Additional notes |
| isDraft | boolean | ✓ | true or false |
| isBillable | boolean | - | true or false (default: false) |
| createdAt | string | ✓ | ISO timestamp |
| updatedAt | string | ✓ | ISO timestamp |

### 3. Set Up Indexes (Optional)

For better query performance, you may need to create composite indexes:
- scientistId + date
- scientistId + date range
- projectId

### 4. Security Rules (Optional)

If you want to restrict access, add Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own entries
    match /timeMotionEntries/{entry} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.scientistId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.scientistId;
    }
    
    // Allow admins/management to read all
    match /timeMotionEntries/{entry} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'Management'];
    }
  }
}
```

## Features

### Timer Mode
- Start/Stop/Pause live timer
- Quick start buttons for common tasks
- Manual entry for activities done earlier
- Works offline - saves when back online

### Weekly Timesheet
- View entire week at a glance
- Daily breakdown with totals
- Category analysis
- Billable hours tracking

### Manual Entry
- Log past activities
- Attach documents (images, PDFs, Excel)
- Link to projects
- Add location and notes

### Performance Analytics
- Weekly/Monthly/Quarterly views
- Category breakdown charts
- Project progress tracking
- Productivity scores

## Project-Specific Notes

Since your scientists work in **labs and fields** (not at desks):
- Idle detection is disabled (scientists are always active)
- Location field is important - track where work was done
- Field trials and lab work are primary categories
- Document attachments help track research data

## Google Drive Integration (Optional)

To enable document uploads to Google Drive:

1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Add to `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id
   ```

## Google Sheets Export (Optional)

1. Follow the guide in `docs/GOOGLE_SHEETS_INTEGRATION.md`
2. Deploy the Google Apps Script
3. Add to `.env`:
   ```
   VITE_GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/...
   ```

## Support

For issues or questions, check the documentation or contact your system administrator.