import { Request, Response } from "express";
import app from "./app.js";

// Export a default function handler for Vercel
export default async function handler(req: Request, res: Response) {
  console.log(`[index.ts handler] Received request for: ${req.url}`);
  // Vercel handles wrapping this in a server automatically
  await app(req, res);
}
