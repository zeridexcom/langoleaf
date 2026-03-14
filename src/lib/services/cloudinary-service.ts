import { v2 as cloudinary } from 'cloudinary'
import { AppError } from '@/lib/utils/error'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  resource_type: string
  format: string
  version: number
  asset_id: string
  bytes: number
  width?: number
  height?: number
}

export interface CloudinaryUploadOptions {
  folder?: string
  tags?: string[]
  context?: Record<string, string>
  transformation?: Array<Record<string, unknown>>
  resourceType?: 'image' | 'raw' | 'video' | 'auto'
}

export class CloudinaryService {
  /**
   * Upload a file buffer to Cloudinary
   */
  static async uploadFile(
    buffer: Buffer,
    filename: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const {
        folder = 'student-portal',
        tags = [],
        context = {},
        resourceType = 'auto',
      } = options

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            tags,
            context: Object.entries(context).map(([key, value]) => `${key}=${value}`).join('|'),
            resource_type: resourceType,
            type: 'authenticated', // Require signed URLs for access
          },
          (error, result) => {
            if (error || !result) {
              reject(new AppError('INTERNAL_ERROR', `Cloudinary upload failed: ${error?.message || 'Unknown error'}`))
              return
            }

            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              resource_type: result.resource_type,
              format: result.format,
              version: result.version,
              asset_id: result.asset_id || '',
              bytes: result.bytes,
              width: result.width,
              height: result.height,
            })
          }
        )

        uploadStream.end(buffer)
      })
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to upload file to Cloudinary')
    }
  }

  /**
   * Generate a signed URL for secure access to a file
   */
  static generateSecureUrl(
    publicId: string,
    options: {
      expiresIn?: number // seconds
      transformation?: Array<Record<string, unknown>>
      download?: boolean
    } = {}
  ): { url: string; expiresAt: Date } {
    try {
      const { expiresIn = 3600, transformation, download = false } = options

      const timestamp = Math.round(new Date().getTime() / 1000)
      const expiresAt = new Date((timestamp + expiresIn) * 1000)

      let url: string

      if (transformation) {
        url = cloudinary.url(publicId, {
          sign_url: true,
          type: 'authenticated',
          transformation,
          secure: true,
          expires_at: timestamp + expiresIn,
        })
      } else {
        url = cloudinary.url(publicId, {
          sign_url: true,
          type: 'authenticated',
          secure: true,
          expires_at: timestamp + expiresIn,
        })
      }

      // Add download flag if requested
      if (download) {
        url += `&fl_attachment=true`
      }

      return { url, expiresAt }
    } catch (error) {
      console.error('Cloudinary signed URL error:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to generate secure URL')
    }
  }

  /**
   * Generate a thumbnail URL with transformations
   */
  static generateThumbnailUrl(
    publicId: string,
    options: {
      width?: number
      height?: number
      crop?: string
      quality?: number
    } = {}
  ): string {
    try {
      const { width = 200, height = 200, crop = 'fill', quality = 80 } = options

      return cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        secure: true,
        transformation: [
          {
            width,
            height,
            crop,
            quality,
          },
        ],
      })
    } catch (error) {
      console.error('Cloudinary thumbnail error:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to generate thumbnail URL')
    }
  }

  /**
   * Replace an existing file in Cloudinary
   */
  static async replaceFile(
    publicId: string,
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      // Delete the old file first
      await this.deleteFile(publicId)

      // Upload the new file with the same public_id
      const { folder = 'student-portal', tags = [], context = {} } = options

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            folder,
            tags,
            context: Object.entries(context).map(([key, value]) => `${key}=${value}`).join('|'),
            resource_type: 'auto',
            type: 'authenticated',
            invalidate: true, // Invalidate CDN cache
          },
          (error, result) => {
            if (error || !result) {
              reject(new AppError('INTERNAL_ERROR', `Cloudinary replace failed: ${error?.message || 'Unknown error'}`))
              return
            }

            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              resource_type: result.resource_type,
              format: result.format,
              version: result.version,
              asset_id: result.asset_id || '',
              bytes: result.bytes,
              width: result.width,
              height: result.height,
            })
          }
        )

        uploadStream.end(buffer)
      })
    } catch (error) {
      console.error('Cloudinary replace error:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to replace file in Cloudinary')
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  static async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'auto',
        type: 'authenticated',
      })
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      // Don't throw - file might not exist
    }
  }

  /**
   * Delete all files in a folder (use with caution)
   */
  static async deleteFolder(folderPath: string): Promise<void> {
    try {
      // Note: This requires admin API access
      // In production, you might want to batch delete or use a different approach
      const result = await cloudinary.api.delete_resources_by_prefix(folderPath, {
        resource_type: 'auto',
        type: 'authenticated',
      })

      console.log(`Deleted ${result.deleted?.length || 0} resources from ${folderPath}`)
    } catch (error) {
      console.error('Cloudinary folder delete error:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to delete folder from Cloudinary')
    }
  }

  /**
   * Generate upload signature for direct client uploads
   */
  static generateUploadSignature(params: Record<string, unknown>): {
    signature: string
    timestamp: number
    apiKey: string
  } {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000)
      
      const signature = cloudinary.utils.api_sign_request(
        { ...params, timestamp },
        process.env.CLOUDINARY_API_SECRET || ''
      )

      return {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY || '',
      }
    } catch (error) {
      console.error('Cloudinary signature error:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to generate upload signature')
    }
  }

  /**
   * Get file metadata from Cloudinary
   */
  static async getFileMetadata(publicId: string): Promise<{
    bytes: number
    format: string
    width?: number
    height?: number
    created_at: string
  } | null> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'auto',
        type: 'authenticated',
      })

      return {
        bytes: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        created_at: result.created_at,
      }
    } catch (error) {
      console.error('Cloudinary metadata error:', error)
      return null
    }
  }
}
