import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";

const app = express();

// Configure CORS for Firebase hosting
app.use(cors({ 
  origin: true, 
  credentials: true 
}));

app.use(express.json());

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "Firebase Functions"
  });
});

// Your existing routes will need to be imported and adapted here
// For now, we'll add placeholder routes that match your current API structure

app.get("/auth/user", (req, res) => {
  res.json({ user: null, authenticated: false });
});

app.get("/ads/settings", (req, res) => {
  res.json({ enabled: false, provider: null });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);