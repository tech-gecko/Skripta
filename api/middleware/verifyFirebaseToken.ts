import { Request, Response, NextFunction } from "express"; 
import admin from "../config/firebaseAdmin.js";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    return next();
  } catch (error: any) {
    if (error.code?.startsWith("auth/")) {
      console.error(`Firebase auth error: ${error.code}`);
      return res.status(401).json({ error: "Unauthorized - Invalid, expired, or malformed token" });
    }

    console.error("Internal server error during token verification:", error);
    return res.status(500).json({ error: "Internal server error during token verification" });
  }
}