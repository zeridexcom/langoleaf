import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

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

// Upload document to Cloudinary
export async function uploadStudentDocument(
  file: Buffer,
  studentId: string,
  documentType: DocumentType,
  fileName: string
) {
  try {
    const folder = `students/${studentId}/${documentType}`;
    const publicId = `${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`;

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "auto",
          allowed_formats: ["jpg", "jpeg", "png", "pdf"],
          transformation:
            documentType === "photo"
              ? [
                  { width: 400, height: 400, crop: "fill", gravity: "face" },
                  { quality: "auto" },
                ]
              : [{ quality: "auto" }],
          tags: ["student_document", studentId, documentType],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(file);
    });

    return {
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
      format: (result as any).format,
      size: (result as any).bytes,
      createdAt: (result as any).created_at,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Get all documents for a student
export async function getStudentDocuments(studentId: string) {
  try {
    const result = await cloudinary.search
      .expression(`folder:students/${studentId}/*`)
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const documents = result.resources.map((resource: any) => {
      const folderParts = resource.folder.split("/");
      const documentType = folderParts[folderParts.length - 1] as DocumentType;

      return {
        id: resource.public_id,
        url: resource.secure_url,
        type: documentType,
        typeLabel: documentTypeLabels[documentType] || "Document",
        format: resource.format,
        size: resource.bytes,
        createdAt: resource.created_at,
        thumbnail: resource.thumbnail_url || resource.secure_url,
      };
    });

    return {
      success: true,
      documents,
    };
  } catch (error) {
    console.error("Error getting student documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get documents",
      documents: [],
    };
  }
}

// Delete document from Cloudinary
export async function deleteDocument(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

// Generate signed URL for private documents
export async function generateSignedUrl(
  publicId: string,
  expiresIn: number = 3600
) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000) + expiresIn;
    const signature = cloudinary.utils.api_sign_request(
      {
        public_id: publicId,
        timestamp,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      success: true,
      url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}?_a=AAABBB&_s=${signature}&_t=${timestamp}`,
      expiresAt: timestamp,
    };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate URL",
    };
  }
}

// Get documents folder URL for a student
export function getStudentDocumentsFolderUrl(studentId: string) {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/students/${studentId}`;
}

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
