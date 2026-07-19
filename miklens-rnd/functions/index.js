const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

// Mock Cloud Function to simulate AI processing for daily logs
exports.analyzeDailyLog = onDocumentCreated("daily_logs/{logId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const logData = snapshot.data();
  console.log(`Analyzing log ${event.params.logId} for product ${logData.productId}`);

  // Simulate calling an AI API (e.g., Vertex AI / Gemini)
  // In a real implementation, we would send logData.activitiesPerformed and logData.problems

  const simulatedAiSummary = `AI Summary: Progress noted on ${logData.todaysObjective || 'tasks'}. No critical risks detected based on the text.`;
  const simulatedAiRecommendations = "Continue with planned protocol. Monitor for anomalies.";

  try {
    // Write back to the log document
    await snapshot.ref.update({
      aiNotes: simulatedAiSummary,
      aiRecommendations: simulatedAiRecommendations,
      analyzedAt: new Date()
    });

    // Optionally update the parent product's AI summary
    if (logData.productId) {
      await db.collection("products").doc(logData.productId).update({
        aiSummary: "Recently updated based on latest experiments.",
        lastAiAnalysis: new Date()
      });
    }

    console.log("AI Analysis complete.");
  } catch (error) {
    console.error("Error updating document with AI analysis:", error);
  }
});
