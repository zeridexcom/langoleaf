import { NextResponse } from "next/server";
import { getSheetsClient, ensureSheets } from "@/lib/google/sheets";

export const dynamic = "force-dynamic";

// GET /api/test-sheets - Test Google Sheets connection
export async function GET() {
  try {
    // Check if env vars are set
    const missingVars = [];
    if (!process.env.GOOGLE_SHEETS_ID) missingVars.push("GOOGLE_SHEETS_ID");
    if (!process.env.GOOGLE_CLIENT_EMAIL) missingVars.push("GOOGLE_CLIENT_EMAIL");
    if (!process.env.GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY");

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        missing: missingVars,
      }, { status: 400 });
    }

    // Test connection
    const sheets = await getSheetsClient();
    
    // Try to get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    });

    // Ensure sheets exist
    const sheetsReady = await ensureSheets();

    return NextResponse.json({
      success: true,
      message: "Google Sheets connection successful!",
      spreadsheetTitle: spreadsheet.data.properties?.title,
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      sheetsCreated: sheetsReady,
      availableSheets: spreadsheet.data.sheets?.map(s => s.properties?.title),
    });

  } catch (error: any) {
    console.error("Google Sheets test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to connect to Google Sheets",
      details: error.response?.data?.error || error,
    }, { status: 500 });
  }
}
