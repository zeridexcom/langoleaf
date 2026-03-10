import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary - SERVER ONLY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Upload document to Cloudinary - SERVER ONLY
export async function uploadStudentDocument(
  file: Buffer,
  studentId: string,
  documentType: string,
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
