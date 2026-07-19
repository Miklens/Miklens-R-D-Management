# Phase 9 Architecture: AI Module via Cloud Functions

## Overview
The AI Engine is the core differentiator of the platform. Instead of doing heavy AI processing on the client device (which could be slow or insecure), we will use Firebase Cloud Functions to interact with large language models securely.

## Components

### 1. `functions/index.js` (or `.ts`)
- **Trigger**: We will set up Firestore document triggers (e.g., `onDocumentCreated("daily_logs/{logId}")`).
- **Processing Flow**:
  1. A scientist submits a `daily_log`.
  2. The Cloud Function wakes up, reads the log text (`activitiesPerformed`, `problems`, `achievements`).
  3. The function fetches the context (previous logs for that product, the product's overall stage).
  4. It constructs a prompt and sends it to the AI API (e.g., Google Gemini/Vertex AI via the Firebase Extensions or SDK).
  5. The AI returns structured JSON containing:
     - `summary`
     - `risks`
     - `estimatedCompletionDate`
     - `recommendations`
  6. The function writes this data back into the `daily_log` document under `aiNotes` and updates the `aiSummary` field in the parent `products` document.

### 2. Scheduled Functions (Cron Jobs)
- We will use `functions.pubsub.schedule('every sunday 23:00')` to automatically aggregate weekly data for all active projects and generate the Weekly Reports.

## Edge Cases & Limitations
- **Timeout/Cold Starts**: Cloud Functions can take a few seconds to boot up. The frontend must implement optimistic UI or "Processing" states (already planned in Phase 10) so the user isn't stuck waiting.
- **Cost Control**: AI calls cost money per token. We must sanitize and strictly limit the length of logs sent to the API.
- **API Failures**: If the AI API is down, the Cloud Function should catch the error and update the document status to `ai_analysis_failed`, allowing a manual retry or failing gracefully without breaking the core app.
