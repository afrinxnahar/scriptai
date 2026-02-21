"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UploadCloud, X, File as FileIcon, Plus, Link } from "lucide-react"

interface FormStep3Props {
  references: string[]
  setReferences: (value: string[]) => void
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function FormStep3({ references, setReferences, files, setFiles }: FormStep3Props) {
  const [currentLink, setCurrentLink] = useState("")

  const addReference = () => {
    const trimmed = currentLink.trim()
    if (!trimmed) return
    try {
      new URL(trimmed)
    } catch {
      return
    }
    if (!references.includes(trimmed)) {
      setReferences([...references, trimmed])
    }
    setCurrentLink("")
  }

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addReference()
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles?.length) {
        setFiles(prev => [...prev, ...acceptedFiles])
      }
    },
    [setFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".jpeg", ".png", ".jpg"],
      "text/plain": [".txt"],
    },
  })

  const removeFile = (name: string) => {
    setFiles(current => current.filter(file => file.name !== name))
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold">Step 3: Add sources and generate.</h3>

      <div className="space-y-3">
        <Label>Reference Links (Optional)</Label>
        <p className="text-sm text-muted-foreground">Add URLs one by one as reference sources.</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={currentLink}
              onChange={(e) => setCurrentLink(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/article"
              className="pl-9 focus-visible:ring-purple-500"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addReference}
            disabled={!currentLink.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {references.length > 0 && (
          <ul className="space-y-2 mt-2">
            {references.map((ref, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/50 gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Link className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{ref}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeReference(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label>Or upload files</Label>
        <p className="text-sm text-muted-foreground">Supports PDF, DOCX, TXT, and image files.</p>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center w-full p-8 mt-2 border-2 border-dashed rounded-lg cursor-pointer
            border-input bg-background hover:bg-muted transition-colors
            ${isDragActive ? "border-primary" : ""}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p className="text-center">
              Drag & drop files here, or{" "}
              <span className="font-semibold text-primary">click to browse</span>
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <Label>Uploaded Files</Label>
          <ul className="space-y-2">
            {files.map(file => (
              <li
                key={file.name}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{formatFileSize(file.size)}</span>
                  <Button type="button" variant="ghost" size="icon" className="w-6 h-6" onClick={() => removeFile(file.name)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
