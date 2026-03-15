import { google } from "googleapis";

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "";
const STUDENTS_SHEET_NAME = "Students";
const APPLICATIONS_SHEET_NAME = "Applications";

// Initialize Google Sheets API
export async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// Ensure sheets exist
export async function ensureSheets() {
  try {
    const sheets = await getSheetsClient();
    
    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = spreadsheet.data.sheets?.map(
      (s) => s.properties?.title
    ) || [];

    // Create Students sheet if not exists
    if (!existingSheets.includes(STUDENTS_SHEET_NAME)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: STUDENTS_SHEET_NAME,
                },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${STUDENTS_SHEET_NAME}!A1:K1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            "ID",
            "Name",
            "Email",
            "Phone",
            "Program",
            "University",
            "Status",
            "Created At",
            "Freelancer ID",
            "Documents URL",
            "Notes",
          ]],
        },
      });
    }

    // Create Applications sheet if not exists
    if (!existingSheets.includes(APPLICATIONS_SHEET_NAME)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: APPLICATIONS_SHEET_NAME,
                },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${APPLICATIONS_SHEET_NAME}!A1:J1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            "ID",
            "Student ID",
            "Student Name",
            "Program",
            "University",
            "Status",
            "Commission Amount",
            "Created At",
            "Updated At",
            "Documents",
          ]],
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Error ensuring sheets:", error);
    return false;
  }
}

// Add student to Google Sheets
export async function addStudentToSheet(student: {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  program: string;
  university: string;
  status: string;
  created_at: string;
  freelancer_id: string;
  documents_url?: string;
  notes?: string;
}) {
  try {
    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${STUDENTS_SHEET_NAME}!A:K`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          student.id,
          student.full_name,
          student.email,
          student.phone,
          student.program,
          student.university,
          student.status,
          student.created_at,
          student.freelancer_id,
          student.documents_url || "",
          student.notes || "",
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error adding student to sheet:", error);
    return false;
  }
}

// Add application to Google Sheets
export async function addApplicationToSheet(application: {
  id: string;
  student_id: string;
  student_name: string;
  program: string;
  university: string;
  status: string;
  commission_amount: number;
  created_at: string;
  updated_at: string;
  documents?: string;
}) {
  try {
    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${APPLICATIONS_SHEET_NAME}!A:J`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          application.id,
          application.student_id,
          application.student_name,
          application.program,
          application.university,
          application.status,
          application.commission_amount,
          application.created_at,
          application.updated_at,
          application.documents || "",
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error adding application to sheet:", error);
    return false;
  }
}

// Update student in Google Sheets
export async function updateStudentInSheet(
  studentId: string,
  updates: Partial<{
    full_name: string;
    email: string;
    phone: string;
    program: string;
    university: string;
    status: string;
    documents_url: string;
    notes: string;
  }>
) {
  try {
    const sheets = await getSheetsClient();

    // Find the row with this student ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${STUDENTS_SHEET_NAME}!A:A`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === studentId);

    if (rowIndex === -1) {
      console.error("Student not found in sheet");
      return false;
    }

    // Update specific columns
    const columnMap: Record<string, number> = {
      full_name: 1,
      email: 2,
      phone: 3,
      program: 4,
      university: 5,
      status: 6,
      documents_url: 9,
      notes: 10,
    };

    for (const [key, value] of Object.entries(updates)) {
      if (columnMap[key] !== undefined) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${STUDENTS_SHEET_NAME}!${String.fromCharCode(65 + columnMap[key])}${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[value]],
          },
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating student in sheet:", error);
    return false;
  }
}

// Get all students from Google Sheets
export async function getStudentsFromSheet() {
  try {
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${STUDENTS_SHEET_NAME}!A2:K`,
    });

    const rows = response.data.values || [];
    
    return rows.map((row) => ({
      id: row[0],
      full_name: row[1],
      email: row[2],
      phone: row[3],
      program: row[4],
      university: row[5],
      status: row[6],
      created_at: row[7],
      freelancer_id: row[8],
      documents_url: row[9],
      notes: row[10],
    }));
  } catch (error) {
    console.error("Error getting students from sheet:", error);
    return [];
  }
}
