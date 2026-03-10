import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Generate a signed URL for secure document access
export function generateSignedUrl(publicId: string, expiresInSeconds: number = 3600): string {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const expiration = timestamp + expiresInSeconds;
  
  const signature = cloudinary.utils.api_sign_request(
    {
      public_id: publicId,
      timestamp: timestamp,
      expires_at: expiration,
    },
    process.env.CLOUDINARY_API_SECRET || ''
  );

  return cloudinary.url(publicId, {
    sign_url: true,
    signature: signature,
    timestamp: timestamp,
    expires_at: expiration,
  });
}

// Upload options for different file types
export const uploadOptions = {
  documents: {
    folder: 'documents',
    resource_type: 'auto' as const,
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
    max_file_size: 10 * 1024 * 1024, // 10MB
  },
  images: {
    folder: 'images',
    resource_type: 'image' as const,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5 * 1024 * 1024, // 5MB
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
    ],
  },
};

// Get file type category
export function getFileCategory(filename: string): 'document' | 'image' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  return imageExtensions.includes(ext) ? 'image' : 'document';
}
