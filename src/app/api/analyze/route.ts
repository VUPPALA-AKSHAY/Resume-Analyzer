import { NextRequest, NextResponse } from "next/server";
import { looksLikeResume, parseFile } from "@/lib/backend/parser";
import { analyzeResume } from "@/lib/backend/ai-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const jobRole = formData.get("jobRole") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No resume file was uploaded." },
        { status: 400 }
      );
    }

    if (!jobRole || !jobRole.trim()) {
      return NextResponse.json(
        { error: "Target job role is required." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[API POST /api/analyze] Processing '${file.name}' (${file.size} bytes)...`);
    const resumeText = await parseFile(buffer, file.type, file.name);

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { error: "Failed to extract text. Make sure the file is not empty or corrupted." },
        { status: 422 }
      );
    }

    if (!looksLikeResume(resumeText)) {
      return NextResponse.json(
        { error: "Please upload correct resume." },
        { status: 422 }
      );
    }

    console.log(`[API POST /api/analyze] Running AI evaluation for job role: '${jobRole}'...`);
    const analysisResult = await analyzeResume(resumeText, jobRole);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("[API POST /api/analyze] Exception caught:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error during analysis." },
      { status: 500 }
    );
  }
}
