import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'ai-qualifier-uploads'

// File upload types
export interface FileUploadOptions {
  key: string
  body: Buffer | Uint8Array | string
  contentType?: string
  metadata?: Record<string, string>
  expires?: number // in seconds
}

export interface FileDownloadOptions {
  key: string
  expires?: number // in seconds for signed URL
}

export interface UploadResult {
  success: boolean
  key?: string
  url?: string
  error?: string
}

// S3 File Operations
export async function uploadToS3(options: FileUploadOptions): Promise<UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata,
    })

    await s3Client.send(command)

    // Generate a signed URL for access
    const url = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: options.key,
    }), { expiresIn: options.expires || 3600 })

    return {
      success: true,
      key: options.key,
      url,
    }
  } catch (error) {
    console.error('S3 upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

export async function downloadFromS3(options: FileDownloadOptions): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: options.key,
    })

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: options.expires || 3600,
    })

    return url
  } catch (error) {
    console.error('S3 download URL generation failed:', error)
    return null
  }
}

export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    console.error('S3 delete failed:', error)
    return false
  }
}

// Utility functions for common file operations
export function generateFileKey(userId: string, fileName: string, folder = 'uploads'): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${folder}/${userId}/${timestamp}_${sanitizedFileName}`
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function getContentType(fileName: string): string {
  const extension = getFileExtension(fileName)
  
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    
    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
  }
  
  return mimeTypes[extension] || 'application/octet-stream'
}

export function validateFileSize(file: File, maxSizeMB = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = getFileExtension(fileName)
  return allowedTypes.includes(extension)
}

// File processing functions
export async function processFileUpload(
  file: File,
  userId: string,
  options: {
    folder?: string
    maxSizeMB?: number
    allowedTypes?: string[]
    metadata?: Record<string, string>
  } = {}
): Promise<UploadResult> {
  const {
    folder = 'uploads',
    maxSizeMB = 10,
    allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    metadata = {},
  } = options

  // Validate file size
  if (!validateFileSize(file, maxSizeMB)) {
    return {
      success: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    }
  }

  // Validate file type
  if (!validateFileType(file.name, allowedTypes)) {
    return {
      success: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  // Generate file key
  const key = generateFileKey(userId, file.name, folder)

  // Convert file to buffer
  const buffer = await file.arrayBuffer()

  // Upload to S3
  return await uploadToS3({
    key,
    body: new Uint8Array(buffer),
    contentType: getContentType(file.name),
    metadata: {
      ...metadata,
      originalName: file.name,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
    },
  })
}

// Batch operations
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  options: Parameters<typeof processFileUpload>[2] = {}
): Promise<UploadResult[]> {
  const results = await Promise.allSettled(
    files.map(file => processFileUpload(file, userId, options))
  )

  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : { success: false, error: 'Upload failed' }
  )
}

export async function deleteMultipleFiles(keys: string[]): Promise<boolean[]> {
  const results = await Promise.allSettled(
    keys.map(key => deleteFromS3(key))
  )

  return results.map(result => 
    result.status === 'fulfilled' ? result.value : false
  )
}