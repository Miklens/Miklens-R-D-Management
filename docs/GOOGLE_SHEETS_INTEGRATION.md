# Google Sheets & Drive Integration Guide

This document explains how to set up Google Sheets WebApp for exporting Time Motion data and storing documents in Google Drive.

## Overview

The Time Motion Tracking system integrates with Google in two ways:

1. **Google Drive** - Store documents (images, PDFs, Excel files) attached to time entries
2. **Google Sheets** - Export time motion data for analysis and reporting

## Part 1: Google Drive API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Fill in required information:
   - App name: "Miklens R&D Management"
   - User support email: your email
   - Developer contact information
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.file`
5. Add test users (your email)

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Create "OAuth client ID"
3. Application type: "Web application"
4. Add authorized redirect URI: `http://localhost:5173` (for development)
5. Copy the Client ID

### Step 4: Configure Environment Variables

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here
VITE_GOOGLE_API_KEY=your-api-key-if-needed
```

## Part 2: Google Apps Script (Sheets Integration)

### Step 1: Create a New Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet named "Miklens Time Motion Data"
3. Create sheets: "Daily Log", "Weekly Summary", "Monthly Summary", "Projects"

### Step 2: Open Apps Script

1. In your Google Sheet, go to **Extensions** > **Apps Script**
2. This opens the Apps Script editor

### Step 3: Create the Script

Delete any existing code and paste the following:

```javascript
// Miklens R&D Time Motion Tracking - Google Sheets WebApp
// This script handles data export from the app to Google Sheets

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID

// Handle GET requests - Serve the web app
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Miklens Time Motion Data')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Handle POST requests - Receive data from the app
function doPost(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'saveEntry':
        return saveTimeEntry(JSON.parse(e.postData.contents));
      case 'getEntries':
        return getTimeEntries(e.parameter);
      case 'exportToSheet':
        return exportToSheet(JSON.parse(e.postData.contents));
      case 'getSummary':
        return getSummary(e.parameter);
      case 'getProjectProgress':
        return getProjectProgress(e.parameter);
      default:
        return ContentService.createTextOutput(JSON.stringify({error: 'Unknown action'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Save a time entry to the spreadsheet
function saveTimeEntry(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Daily Log') || ss.getSheets()[0];
  
  // Headers (if first row is empty)
  if (sheet.getLastRow() === 0) {
    const headers = [
      'ID', 'Scientist ID', 'Scientist Name', 'Date', 'Category', 'Sub-category',
      'Description', 'Start Time', 'End Time', 'Duration (min)', 'Project ID',
      'Project Name', 'Project Stage', 'Location', 'Notes', 'Attachments Count',
      'Created At', 'Updated At'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // Add new row
  const lastRow = sheet.getLastRow() + 1;
  const row = [
    data.id || Utilities.getUuid(),
    data.scientistId || '',
    data.scientistName || '',
    data.date || '',
    data.category || '',
    data.subCategory || '',
    data.description || '',
    data.startTime || '',
    data.endTime || '',
    data.durationMinutes || 0,
    data.projectId || '',
    data.projectName || '',
    data.projectStage || '',
    data.location || '',
    data.notes || '',
    data.attachments ? data.attachments.length : 0,
    data.createdAt || new Date().toISOString(),
    data.updatedAt || new Date().toISOString()
  ];
  
  sheet.getRange(lastRow, 1, 1, row.length).setValues([row]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    row: lastRow,
    message: 'Entry saved successfully'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Get time entries with optional filters
function getTimeEntries(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Daily Log');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({entries: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let entries = data.slice(1).map(row => {
    let entry = {};
    headers.forEach((h, i) => entry[h] = row[i]);
    return entry;
  });
  
  // Apply filters
  if (params.scientistId) {
    entries = entries.filter(e => e['Scientist ID'] === params.scientistId);
  }
  if (params.startDate) {
    entries = entries.filter(e => e['Date'] >= params.startDate);
  }
  if (params.endDate) {
    entries = entries.filter(e => e['Date'] <= params.endDate);
  }
  if (params.category) {
    entries = entries.filter(e => e['Category'] === params.category);
  }
  
  return ContentService.createTextOutput(JSON.stringify({entries}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get summary statistics
function getSummary(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Daily Log');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      totalHours: 0,
      entriesCount: 0,
      byCategory: {},
      byProject: {}
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const entries = data.slice(1).map(row => {
    let entry = {};
    headers.forEach((h, i) => entry[h] = row[i]);
    return entry;
  });
  
  // Filter by date range
  let filtered = entries;
  if (params.startDate) {
    filtered = filtered.filter(e => e['Date'] >= params.startDate);
  }
  if (params.endDate) {
    filtered = filtered.filter(e => e['Date'] <= params.endDate);
  }
  if (params.scientistId) {
    filtered = filtered.filter(e => e['Scientist ID'] === params.scientistId);
  }
  
  // Calculate totals
  const totalMinutes = filtered.reduce((sum, e) => sum + (e['Duration (min)'] || 0), 0);
  
  // By category
  const byCategory = {};
  filtered.forEach(e => {
    const cat = e['Category'] || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + (e['Duration (min)'] || 0);
  });
  
  // By project
  const byProject = {};
  filtered.forEach(e => {
    if (e['Project Name']) {
      if (!byProject[e['Project Name']]) {
        byProject[e['Project Name']] = { minutes: 0, entries: 0 };
      }
      byProject[e['Project Name']].minutes += (e['Duration (min)'] || 0);
      byProject[e['Project Name']].entries += 1;
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    totalHours: totalMinutes / 60,
    entriesCount: filtered.length,
    byCategory,
    byProject,
    startDate: params.startDate,
    endDate: params.endDate
  })).setMimeType(ContentService.MimeType.JSON);
}

// Get project progress summary
function getProjectProgress(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Daily Log');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify({projects: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const entries = data.slice(1).map(row => {
    let entry = {};
    headers.forEach((h, i) => entry[h] = row[i]);
    return entry;
  });
  
  // Group by project
  const projectMap = {};
  entries.forEach(e => {
    if (e['Project Name']) {
      if (!projectMap[e['Project Name']]) {
        projectMap[e['Project Name']] = {
          name: e['Project Name'],
          id: e['Project ID'],
          stage: e['Project Stage'],
          totalMinutes: 0,
          entries: 0,
          scientists: new Set()
        };
      }
      projectMap[e['Project Name']].totalMinutes += (e['Duration (min)'] || 0);
      projectMap[e['Project Name']].entries += 1;
      projectMap[e['Project Name']].scientists.add(e['Scientist Name']);
    }
  });
  
  const projects = Object.values(projectMap).map(p => ({
    ...p,
    totalHours: p.totalMinutes / 60,
    scientistCount: p.scientists.size
  }));
  
  return ContentService.createTextOutput(JSON.stringify({projects}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Export data to different sheet formats
function exportToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const { type, entries, sheetName } = data;
  
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  if (type === 'weekly') {
    // Group by week
    const weeklyData = {};
    entries.forEach(e => {
      const date = new Date(e.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { minutes: 0, entries: 0, scientists: new Set() };
      }
      weeklyData[weekKey].minutes += e.durationMinutes;
      weeklyData[weekKey].entries += 1;
      weeklyData[weekKey].scientists.add(e.scientistName);
    });
    
    const output = Object.entries(weeklyData).map(([week, data]) => [
      week, (data.minutes / 60).toFixed(1), data.entries, data.scientists.size
    ]);
    
    sheet.clear();
    sheet.getRange(1, 1, 1, 4).setValues([['Week Starting', 'Hours', 'Entries', 'Scientists']]);
    sheet.getRange(2, 1, output.length, 4).setValues(output);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Step 4: Create HTML Interface

In the Apps Script editor:

1. Click the **+** button to add a new file
2. Select **HTML**
3. Name it "Index"
4. Paste this code:

```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e293b; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn { background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; }
    .btn:hover { background: #1d4ed8; }
    .status { padding: 10px; border-radius: 6px; margin: 10px 0; }
    .success { background: #dcfce7; color: #166534; }
    .error { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
  </style>
</head>
<body>
  <h1>🧪 Miklens R&D Time Motion Data</h1>
  <div class="card">
    <h2>API Status</h2>
    <p>This WebApp is running and ready to receive data from the Miklens R&D Management application.</p>
    <div class="status success">✅ Connected to Google Sheets</div>
  </div>
  
  <div class="card">
    <h2>Available Endpoints</h2>
    <table>
      <tr><th>Action</th><th>Description</th></tr>
      <tr><td>saveEntry</td><td>Save a new time entry</td></tr>
      <tr><td>getEntries</td><td>Retrieve time entries with filters</td></tr>
      <tr><td>getSummary</td><td>Get summary statistics</td></tr>
      <tr><td>getProjectProgress</td><td>Get project progress data</td></tr>
      <tr><td>exportToSheet</td><td>Export data in different formats</td></tr>
    </table>
  </div>
  
  <div class="card">
    <h2>Quick Stats</h2>
    <div id="stats">Loading...</div>
  </div>
  
  <script>
    // Fetch basic stats on load
    google.script.run.withSuccessHandler(displayStats).getSummary({});
    
    function displayStats(data) {
      document.getElementById('stats').innerHTML = 
        '<p>Total Hours: ' + data.totalHours.toFixed(1) + '</p>' +
        '<p>Total Entries: ' + data.entriesCount + '</p>';
    }
  </script>
</body>
</html>
```

### Step 5: Deploy the WebApp

1. Click the blue **Deploy** button
2. Select **New deployment**
3. Click the gear icon and select **Web app**
4. Configure:
   - Description: "Miklens Time Motion API"
   - Execute as: "Me"
   - Who has access: "Anyone" (or "Anyone with Google Account" for more security)
5. Click **Deploy**
6. Copy the **Web app URL**

### Step 6: Update Your App

Add the WebApp URL to your environment or config:

```env
VITE_GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/YOUR-DEPLOYMENT-ID/exec
```

## Part 3: Usage in the Application

### Document Upload Flow

1. User attaches files in Time Motion Form
2. If Google Drive is connected, files upload directly to Drive
3. If not connected, files are stored as base64 in Firebase (limited)
4. Document URLs are stored with the time entry

### Data Export Flow

1. Management users can click "Export to Sheets"
2. The app sends data to the Google Apps Script WebApp
3. WebApp processes and saves to the spreadsheet
4. Users can then analyze in Sheets, create pivot tables, charts

## Security Considerations

1. **OAuth Tokens**: Stored in memory only, never persisted
2. **Scopes**: Only request minimum necessary scopes (`drive.file`)
3. **CORS**: Apps Script handles CORS automatically
4. **Validation**: Always validate data on both client and server sides

## Troubleshooting

### "Not authorized" errors
- Check OAuth consent screen is configured
- Verify scopes are correctly added
- Test users added to consent screen

### Files not uploading to Drive
- Verify Client ID is correct
- Check browser console for errors
- Ensure redirect URI matches

### Sheets export failing
- Verify WebApp URL is correct
- Check spreadsheet ID is valid
- Ensure sheet names match

## Support

For issues or questions, contact your system administrator.