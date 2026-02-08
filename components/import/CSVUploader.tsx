'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CSVUploaderProps {
  onFileSelect: (file: File) => void
}

export function CSVUploader({ onFileSelect }: CSVUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return false
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB')
      return false
    }

    return true
  }

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          dragActive
            ? 'border-accent-info bg-accent-info/10'
            : 'border-border hover:border-accent-info/50',
          'p-8 text-center cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-background-secondary p-4">
            <Upload className="h-8 w-8 text-text-secondary" />
          </div>

          <div className="space-y-1">
            <p className="text-lg font-medium">
              Drag & drop your CSV file here
            </p>
            <p className="text-sm text-text-secondary">
              or click to browse
            </p>
          </div>

          <p className="text-xs text-text-secondary">
            Maximum file size: 5MB
          </p>

          <Button type="button" variant="outline">
            Choose File
          </Button>
        </div>
      </div>

      {/* Selected File Display */}
      {selectedFile && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="rounded bg-accent-info/10 p-2">
              <FileText className="h-5 w-5 text-accent-info" />
            </div>
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-text-secondary">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-accent-danger bg-accent-danger/10 p-4 text-sm text-accent-danger">
          {error}
        </div>
      )}

      {/* Sample CSV Link */}
      <div className="text-center">
        <Button variant="link" asChild>
          <a href="/sample-trades.csv" download>
            Download Sample CSV Template
          </a>
        </Button>
      </div>
    </div>
  )
}
