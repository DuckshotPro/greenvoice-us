import { onRequest } from "firebase-functions/v2/https";
import * as express from "express";

const app = express();

// Import your existing server routes and middleware here
// You'll need to adapt your server code to work with Firebase Functions

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Function
export const api = onRequest(app);