"use client"

import { useRef, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UploadCloud, X, Image as ImageIcon, User } from "lucide-react"

interface ThumbnailStep3Props {
  referenceImage: File | null
  setReferenceImage: (v: File | null) => void
  faceImage: File | null
  setFaceImage: (v: File | null) => void
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function ThumbnailStep3({
  referenceImage,
  setReferenceImage,
  faceImage,
  setFaceImage,
}: ThumbnailStep3Props) {
  const faceInputRef = useRef<HTMLInputElement>(null)

  const onDropRef = useCallback(
    (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return
      if (file.size > 10 * 1024 * 1024) return
      setReferenceImage(file)
    },
    [setReferenceImage],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropRef,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
  })

  const handleFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return
    if (!file.type.startsWith("image/")) return
    setFaceImage(file)
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold">
        Step 3: Add references and generate.
      </h3>

      {/* Reference Image Dropzone */}
      <div className="space-y-2">
        <Label>Reference Image (Optional)</Label>
        <p className="text-sm text-muted-foreground">
          Upload an image to guide the style, composition, or color palette.
        </p>

        {referenceImage ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-xs">
                {referenceImage.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {formatFileSize(referenceImage.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setReferenceImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center w-full p-8 mt-2 border-2 border-dashed rounded-lg cursor-pointer
              border-input bg-background hover:bg-muted transition-colors
              ${isDragActive ? "border-primary" : ""}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p>Drop the image here ...</p>
            ) : (
              <p className="text-center">
                Drag & drop an image here, or{" "}
                <span className="font-semibold text-primary">click to browse</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              JPEG, PNG, WebP · Max 10MB
            </p>
          </div>
        )}
      </div>

      {/* Face Image */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          Face / Person Photo (Optional)
        </Label>
        <p className="text-sm text-muted-foreground">
          Upload a photo of yourself or a person to include prominently in the thumbnail.
        </p>

        {faceImage ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-xs">
                {faceImage.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {formatFileSize(faceImage.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => {
                  setFaceImage(null)
                  if (faceInputRef.current) faceInputRef.current.value = ""
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => faceInputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" />
            Upload face or person photo
          </Button>
        )}
        <input
          ref={faceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFaceSelect}
        />
      </div>
    </div>
  )
}
