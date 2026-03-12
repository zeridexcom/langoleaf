import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary - SERVER ONLY
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };

// Check if Cloudinary is configured
export function isCloudinaryConfigured(): { configured: boolean; missing: string[]; present: string[] } {
  const missing: string[] = [];
  const present: string[] = [];
  
  if (cloudName) present.push("CLOUDINARY_CLOUD_NAME");
  else missing.push("CLOUDINARY_CLOUD_NAME");
  
  if (apiKey) present.push("CLOUDINARY_API_KEY");
  else missing.push("CLOUDINARY_API_KEY");
  
  if (apiSecret) present.push("CLOUDINARY_API_SECRET");
  else missing.push("CLOUDINARY_API_SECRET");
  
  return { configured: missing.length === 0, missing, present };
}

// Upload document to Cloudinary - SERVER ONLY
export async function uploadStudentDocument(
  file: Buffer,
  studentId: string,
  documentType: string,
  fileName: string
) {
  // Check configuration first
  const { configured, missing, present } = isCloudinaryConfigured();
  
  console.log("Cloudinary config check:", { configured, missing, present, cloudName: cloudName ? "SET" : "MISSING" });
  
  if (!configured) {
    return {
      success: false,
      error: `Missing Cloudinary env vars: ${missing.join(", ")}. Found: ${present.join(", ") || "none"}. Add missing vars in Vercel Dashboard → Settings → Environment Variables.`,
    };
  }

  try {
    const folder = `students/${studentId}/${documentType}`;
    const publicId = `${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`;

    console.log("Starting Cloudinary upload:", { folder, publicId, fileSize: file.length });

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
          if (error) {
            console.error("Cloudinary upload_stream error:", error);
            reject(error);
          } else {
            console.log("Cloudinary upload success:", result?.public_id);
            resolve(result);
          }
        }
      );

      uploadStream.on("error", (err) => {
        console.error("Cloudinary stream error:", err);
        reject(err);
      });

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
    let errorMessage: string;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    
    return {
      success: false,
      error: `Cloudinary error: ${errorMessage}`,
    };
  }
}

// Get all documents for a student - SERVER ONLY
export async function getStudentDocuments(studentId: string) {
  try {
    const result = await cloudinary.search
      .expression(`folder:students/${studentId}/*`)
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const documents = result.resources.map((resource: any) => {
      const folderParts = resource.folder.split("/");
      const documentType = folderParts[folderParts.length - 1];

      return {
        id: resource.public_id,
        url: resource.secure_url,
        type: documentType,
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

// Delete document from Cloudinary - SERVER ONLY
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
