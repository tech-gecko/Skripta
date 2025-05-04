import { Router, Request, Response } from "express";
import supabase from "../config/supabaseClient.js";
import { verifyToken } from "../middleware/verifyFirebaseToken.js";
import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post(
  "/sync",
  verifyToken,
  expressAsyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      console.error("[userRoutes] Error: req.user is undefined after verifyToken middleware");
      const userError = new Error("Internal server error: User context missing");
      throw userError;
    }
    const { uid, email } = req.user;

    const { error: supabaseError } = await supabase
      .from("users")
      .upsert({ id: uid, email: email || null }, { onConflict: "id" });

    if (supabaseError) {
      console.error("Supabase sync error:", supabaseError);
      throw supabaseError;
    }

    res.status(200).json({ message: "User synced successfully" });
  })
);

export default router;
