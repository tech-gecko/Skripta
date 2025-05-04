import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(
  __dirname,
  "../../skripta-app-firebase-adminsdk-fbsvc-7b6d177b51.json"
);

// Initialize Firebase Admin SDK only if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log("[Firebase Admin] Initialized successfully.");
  } catch (error: any) {
    console.error("[Firebase Admin] Initialization failed:", error.message);
    throw new Error(`Firebase Admin Initialization failed: ${error.message}`);
  }
}

export default admin;
