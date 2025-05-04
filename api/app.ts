import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/userRoutes.js";
import cvRoutes from "./routes/cvRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app: Application = express();

app.use(cors()); // Consider configuring CORS more restrictively in production
app.use(helmet());
app.use(express.json());

dotenv.config();

app.get("/api/health", (_: Request, res: Response) => {
  console.log("[app.ts] Matched /api/health route");
  res.status(200).json({ status: "OK", message: "Skripta API is running" });
});
app.use("/api/users", userRoutes);
app.use("/api/cvs", cvRoutes);

app.use(errorHandler);

export default app;

// --- Local Development Server Start ---
// This block runs only when the script is executed directly (e.g., `node dist/api/app.js`)
// It won't run when imported by Vercel's runtime via api/index.ts
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const PORT = process.env["PORT"] || 3001;
  app.listen(PORT, () => {
    console.log(`[Skripta API] Server listening on http://localhost:${PORT}`);
  });
}
