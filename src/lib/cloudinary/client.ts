// Client-side Cloudinary utilities only
// No Node.js imports here!

// Document types for students
export type DocumentType =
  | "photo"
  | "marksheet_10th"
  | "marksheet_12th"
  | "marksheet_graduation"
  | "id_proof"
  | "address_proof"
  | "resume"
  | "experience_certificate"
  | "other";

// Document type labels
export const documentTypeLabels: Record<DocumentType, string> = {
  photo: "Photo",
  marksheet_10th: "10th Marksheet",
  marksheet_12th: "12th Marksheet",
  marksheet_graduation: "Graduation Marksheet",
  id_proof: "ID Proof",
  address_proof: "Address Proof",
  resume: "Resume/CV",
  experience_certificate: "Experience Certificate",
  other: "Other Document",
};

// Allowed file types
export const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

// Max file size (10MB)
export const maxFileSize = 10 * 1024 * 1024;

// Validate file before upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedFileTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed: JPG, PNG, PDF",
    };
  }

  // Check file size
  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: "File too large. Max size: 10MB",
    };
  }

  return { valid: true };
}

// Get Cloudinary upload signature from server
export async function getUploadSignature(
  studentId: string,
  documentType: DocumentType,
  fileName: string
) {
  try {
    const response = await fetch("/api/upload-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId,
        documentType,
        fileName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload signature");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting upload signature:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get signature",
    };
  }
}

// Upload file using signed upload
export async function uploadFile(
  file: File,
  signature: string,
  timestamp: number,
  folder: string,
  publicId: string
) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "");
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("public_id", publicId);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
