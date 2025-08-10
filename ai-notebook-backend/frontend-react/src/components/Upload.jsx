import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Button from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { LoadingSpinner } from './ui/spinner'
import { formatFileSize } from '../lib/utils'

export function Upload({ base = '', onUpload, refreshFiles, toast }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [errors, setErrors] = useState([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)

  const pollersRef = useRef({})

  const stopPoller = (id) => {
    const t = pollersRef.current[id]
    if (t) {
      clearTimeout(t)
      delete pollersRef.current[id]
    }
  }

  const pollStatusOnce = async (fid, attempt = 0) => {
    try {
      const res = await fetch(`${base}/status/${fid}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      // Update stage text and ready state
      setUploadedFiles(prev => prev.map(f => (
        f.id === fid ? { ...f, stage: data.stage || null, status: data.ready ? 'success' : f.status } : f
      )))
      if (data.ready) {
        stopPoller(fid)
        return
      }
      if (attempt < 60) {
        // Try again after 2s, up to ~2 minutes
        pollersRef.current[fid] = setTimeout(() => pollStatusOnce(fid, attempt + 1), 2000)
      } else {
        stopPoller(fid)
      }
    } catch (e) {
      // Mark error for this file and stop polling
      setUploadedFiles(prev => prev.map(f => (
        f.id === fid ? { ...f, status: 'error' } : f
      )))
      stopPoller(fid)
    }
  }

  useEffect(() => {
    return () => {
      // cleanup any pending timers on unmount
      Object.values(pollersRef.current).forEach((t) => clearTimeout(t))
      pollersRef.current = {}
    }
  }, [])

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => ({
        file: file.name,
        errors: errors.map(e => e.message)
      }))
      setErrors(newErrors)
      toast?.error(`${rejectedFiles.length} file(s) rejected`)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setErrors([])

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
  const formData = new FormData()
  formData.append('file', file)

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 100)

  // Route based on type
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const endpoint = isPdf ? '/upload' : '/upload_image'
  const response = await fetch(`${base}${endpoint}`, {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const result = await response.json()

        setUploadedFiles(prev => [...prev, {
          id: result.file_id,
          name: file.name,
          size: file.size,
          status: 'indexing',
          stage: 'parsing'
        }])

        // begin polling status for this file until ready
        pollStatusOnce(result.file_id, 0)

        if (onUpload) onUpload(result.file_id)
        toast?.success(`${file.name} uploaded successfully`)
      }

      if (refreshFiles) refreshFiles()
    } catch (error) {
      console.error('Upload error:', error)
      toast?.error(`Upload failed: ${error.message}`)
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error' })))
    } finally {
      setUploading(false)
      setTimeout(() => {
        setUploadProgress(0)
        setUploadedFiles([])
      }, 3000)
    }
  }, [onUpload, refreshFiles, toast, base])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 5,
    multiple: true
  })

  const dropzoneVariants = {
    idle: { scale: 1, borderColor: 'rgb(209 213 219)' },
    active: { scale: 1.02, borderColor: 'rgb(59 130 246)' },
    accept: { scale: 1.02, borderColor: 'rgb(34 197 94)' },
    reject: { scale: 0.98, borderColor: 'rgb(239 68 68)' }
  }

  const getDropzoneState = () => {
    if (isDragReject) return 'reject'
    if (isDragAccept) return 'accept'
    if (isDragActive) return 'active'
    return 'idle'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <motion.div
        variants={dropzoneVariants}
        animate={getDropzoneState()}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-2 border-dashed transition-colors">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className="cursor-pointer text-center"
            >
              <input {...getInputProps()} />
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
                  <CloudArrowUpIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {isDragActive ? 'Drop files here' : 'Upload PDFs or Images'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {isDragActive 
                      ? 'Release to upload your files'
                      : 'Drag and drop PDF or PNG/JPG files here, or click to browse'
                    }
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">PDF, PNG, JPG</Badge>
                  <Badge variant="secondary">Max 20MB</Badge>
                  <Badge variant="secondary">Up to 5 files</Badge>
                </div>

                {!isDragActive && (
                  <Button variant="outline" className="mt-4">
                    Choose Files
                  </Button>
                )}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm font-medium">Uploading files...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <motion.div
                      className="bg-primary-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Recently Uploaded
            </h4>
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="h-8 w-8 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                          {file.stage && (
                            <span className="ml-2 text-gray-400">• {file.stage}</span>
                          )}
                        </p>
                      </div>
                      {file.status === 'success' && (
                        <CheckCircleIcon className="h-5 w-5 text-success-600" />
                      )}
                      {file.status === 'indexing' && (
                        <LoadingSpinner size="sm" />
                      )}
                      {file.status === 'error' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-error-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-error-600 dark:text-error-400">
              Upload Errors
            </h4>
            {errors.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-error-200 dark:border-error-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-error-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-error-900 dark:text-error-100">
                          {error.file}
                        </p>
                        <ul className="mt-1 text-xs text-error-700 dark:text-error-300">
                          {error.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setErrors(prev => prev.filter((_, i) => i !== index))}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add by Link */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="Paste a web page or YouTube URL and press Add"
              value={linkUrl}
              onChange={(e)=>setLinkUrl(e.target.value)}
              className="flex-1 h-9 rounded-md bg-white/10 border border-white/25 text-white px-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <Button disabled={linkLoading || !linkUrl.trim()} onClick={async()=>{
              const url = linkUrl.trim()
              if(!url) return
              setLinkLoading(true)
              try{
                const res = await fetch(`${base}/ingest_url`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url }) })
                if(!res.ok){ throw new Error(await res.text()) }
                const data = await res.json()
                const fid = data.file_id
                setUploadedFiles(prev => [...prev, { id: fid, name: url, size: 0, status: 'indexing', stage: 'parsing' }])
                pollStatusOnce(fid, 0)
                toast?.success('Link ingested')
                setLinkUrl('')
                refreshFiles && refreshFiles()
              }catch(e){
                toast?.error('Failed to ingest link')
              }finally{
                setLinkLoading(false)
              }
            }}>{linkLoading ? 'Adding…' : 'Add'}</Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">We’ll fetch readable text or transcripts and index them for Q&A.</p>
        </CardContent>
      </Card>

      {/* Upload Tips */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Upload Tips
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• PDFs, PNGs, and JPGs are processed and indexed automatically</li>
            <li>• Larger files may take longer to process</li>
            <li>• You can upload multiple files at once</li>
            <li>• Files are stored securely and can be organized into notebooks</li>
            <li>• You can also add links (web pages or YouTube); we’ll extract readable text/transcripts</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}