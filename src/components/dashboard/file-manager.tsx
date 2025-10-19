'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, Download, Trash2, File, Image, FileText, Archive } from 'lucide-react'
import { toast } from 'sonner'

interface FileItem {
  key: string
  name: string
  size: number
  type: string
  uploadedAt: string
  url?: string
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  result?: {
    key: string
    url: string
  }
}

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    setFiles([
      {
        key: 'uploads/user123/profile.jpg',
        name: 'profile.jpg',
        size: 1024 * 500, // 500KB
        type: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
      },
      {
        key: 'uploads/user123/resume.pdf',
        name: 'resume.pdf',
        size: 1024 * 1024 * 2, // 2MB
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      },
    ])
  }, [])

  const handleFileUpload = async (selectedFiles: FileList) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    const filesToUpload = Array.from(selectedFiles)
    
    // Initialize progress tracking
    const initialProgress: UploadProgress[] = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }))
    setUploadProgress(initialProgress)

    try {
      const formData = new FormData()
      filesToUpload.forEach(file => {
        formData.append('files', file)
      })

      formData.append('options', JSON.stringify({
        folder: 'uploads',
        maxSizeMB: 10,
        allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
      }))

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Update progress to completed
        const completedProgress = initialProgress.map((progress, index) => ({
          ...progress,
          progress: 100,
          status: 'completed' as const,
          result: result.results.uploads[index],
        }))
        setUploadProgress(completedProgress)

        // Add new files to the list
        const newFiles: FileItem[] = result.results.uploads.map((upload: any, index: number) => ({
          key: upload.key,
          name: filesToUpload[index].name,
          size: filesToUpload[index].size,
          type: filesToUpload[index].type,
          uploadedAt: new Date().toISOString(),
          url: upload.url,
        }))

        setFiles(prev => [...prev, ...newFiles])
        toast.success(`Successfully uploaded ${result.results.successful} file(s)`)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      // Update progress to error
      const errorProgress = initialProgress.map(progress => ({
        ...progress,
        progress: 0,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed',
      }))
      setUploadProgress(errorProgress)
      
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      // Clear progress after a delay
      setTimeout(() => setUploadProgress([]), 3000)
    }
  }

  const handleFileDownload = async (fileKey: string, fileName: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: fileKey,
          expires: 3600,
        }),
      })

      const result = await response.json()

      if (result.success && result.downloadUrl) {
        // Create download link
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Download started')
      } else {
        throw new Error(result.error || 'Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileDelete = async (fileKeys: string[]) => {
    if (fileKeys.length === 0) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys: fileKeys,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Remove deleted files from the list
        setFiles(prev => prev.filter(file => !result.results.deletedKeys.includes(file.key)))
        setSelectedFiles([])
        toast.success(`Successfully deleted ${result.results.successful} file(s)`)
      } else {
        throw new Error(result.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFileTypeColor = (type: string): string => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-800'
    if (type === 'application/pdf') return 'bg-red-100 text-red-800'
    if (type.includes('zip') || type.includes('rar')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Manager
          </CardTitle>
          <CardDescription>
            Upload, download, and manage your files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or click to select
              </p>
              <Input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
              >
                Select Files
              </Button>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Upload Progress</h4>
                {uploadProgress.map((progress, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{progress.file.name}</span>
                      <span>{progress.progress}%</span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    {progress.status === 'error' && (
                      <p className="text-xs text-red-600">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Files</CardTitle>
            {selectedFiles.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleFileDelete(selectedFiles)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedFiles.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No files uploaded yet
              </p>
            ) : (
              files.map((file) => (
                <div
                  key={file.key}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(prev => [...prev, file.key])
                        } else {
                          setSelectedFiles(prev => prev.filter(key => key !== file.key))
                        }
                      }}
                      className="rounded"
                    />
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="secondary" className={getFileTypeColor(file.type)}>
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileDownload(file.key, file.name)}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileDelete([file.key])}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}