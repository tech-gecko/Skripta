import { Router, Request, Response } from "express";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { validationResult } from "express-validator";
import { validateCvMetadata } from "../middleware/validateCv.js";
import { verifyToken } from "../middleware/verifyFirebaseToken.js";
import asyncHandler from "express-async-handler";
import { generateCvPdf, ProfileData } from "../services/cvGeneratorService.js";

const router = Router();

// Save metadata for uploaded CVs
router.post(
  "/",
  verifyToken,
  validateCvMetadata,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array() });
      return;
    }

    if (!req.user) {
      console.error("[cvRoutes] Error: req.user is undefined after verifyToken middleware");
      const userError = new Error("Internal server error: User context missing");
      throw userError;
    }
    const { uid } = req.user;

    const { fileName, versionName } = req.body;

    const fileExtension = path.extname(fileName);
    const storagePath = `user-cvs/${uid}/${uuidv4()}${fileExtension}`;

    const { data, error: supabaseError } = await supabase
      .from("cvs")
      .insert({
        user_id: uid,
        file_name: fileName,
        storage_path: storagePath,
        version_name: versionName || null
      })
      .select()
      .single();

    if (supabaseError) {
      console.error("Supabase CV insert error:", supabaseError);
      throw supabaseError;
    }

    res.status(201).json({
      message: "CV metadata created successfully",
      cvId: data.id,
      storagePath: data.storage_path
    });
  })
);

// Generate CV PDF, upload PDF to storage and save metadata to DB
router.post(
  "/generate",
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      console.error("[cvRoutes] Error: req.user is undefined after verifyToken middleware");
      const userError = new Error("Internal server error: User context missing");
      throw userError;
    }
    const { uid } = req.user;
    const { targetJobTitle } = req.body;

    const [
      userProfileResult,
      experienceResult,
      educationResult,
      skillsResult,
      projectsResult
    ] = await Promise.all([
      supabase.from("users").select("*").eq("id", uid).single(),
      supabase.from("work_experience").select("*").eq("user_id", uid)
        .order("start_date", { ascending: false }),
      supabase.from("education").select("*").eq("user_id", uid)
        .order("start_date", { ascending: false }),
      supabase.from("skills").select("*").eq("user_id", uid)
        .order("category").order("skill_name"),
      supabase.from("projects").select("*").eq("user_id", uid)
        .order("start_date", { ascending: false })
    ]);

    const results = [
      userProfileResult,
      experienceResult,
      educationResult,
      skillsResult,
      projectsResult
    ];
    const dbErrors = results.map(r => r.error).filter(Boolean);
    if (dbErrors.length > 0) {
      console.error("Errors fetching data for CV generation:", dbErrors);
      throw new Error("Failed to fetch necessary data for CV generation");
    }
    if (!userProfileResult.data) {
      // This case should ideally be caught by RLS or be impossible if user exists
      console.error("Critical error: User profile data not found for user:", uid);
      throw new Error("User profile data missing");
    }

    const profileData: ProfileData = {
      user: userProfileResult.data!,
      experience: experienceResult.data || [],
      education: educationResult.data || [],
      skills: skillsResult.data || [],
      projects: projectsResult.data || [],
      targetJobTitle: targetJobTitle || undefined
    };

    try {
      console.log(`Generating PDF buffer for target job: ${targetJobTitle || "N/A"}`);
      const pdfBuffer = await generateCvPdf(profileData);
      console.log(`PDF buffer generated, size: ${pdfBuffer.length} bytes`);

      const generatedFileName = `Generated_CV_${uuidv4()}.pdf`;
      const storagePath = `user-cvs/${uid}/${generatedFileName}`;

      console.log(`Uploading generated CV to: ${storagePath}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-cvs")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: false
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      console.log("Upload successful:", uploadData);

      const defaultVersionName = `Generated ${new Date().toLocaleDateString()}`;
      console.log(`Inserting metadata for: ${generatedFileName}`);
      const { data: insertData, error: insertError } = await supabase
        .from("cvs")
        .insert({
          user_id: uid,
          file_name: generatedFileName,
          storage_path: storagePath,
          version_name: defaultVersionName
        })
        .select()
        .single();

      if (insertError) {
        console.error("Supabase CV metadata insert error:", insertError);
        console.log(`Attempting to delete orphaned file: ${storagePath}`);
        await supabase.storage.from("user-cvs").remove([storagePath]);
        throw new Error(`Metadata insert failed: ${insertError.message}`);
      }
      console.log("Metadata insert successful:", insertData);

      if (!res.headersSent) {
        res.status(201).json({
          message: "CV generated and saved successfully",
          cvId: insertData.id,
          storagePath: insertData.storage_path
        });
      }

    } catch (error) {
      console.error("Error during CV generation process:", error);
      throw error;
    }
  })
);

export default router;
