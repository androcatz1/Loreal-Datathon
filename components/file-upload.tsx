"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, CheckCircle, AlertCircle, X, Video, MessageSquare } from "lucide-react"
import { commentAnalyzer } from "@/lib/comment-analyzer"

interface FileUploadProps {
  onUpload: (comments: any[], videos: any[]) => void
  isAnalyzing: boolean
}

interface UploadedFile {
  file: File
  type: "comments" | "videos" | "unknown"
  status: "pending" | "processing" | "success" | "error"
  data?: any[]
  error?: string
  separator?: string
}

export function FileUpload({ onUpload, isAnalyzing }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const detectFileType = (headers: string[]): "comments" | "videos" | "unknown" => {
    const lowerHeaders = headers.map((h) => h.toLowerCase())

    // More specific detection for comment files
    const commentHeaders = ["commentid", "textoriginal", "authorid", "videoid"]
    const videoHeaders = ["videoid", "title", "description", "viewcount", "channelid"]

    const commentMatches = commentHeaders.filter((header) =>
      lowerHeaders.some((h) => h.includes(header) || header.includes(h)),
    ).length

    const videoMatches = videoHeaders.filter((header) =>
      lowerHeaders.some((h) => h.includes(header) || header.includes(h)),
    ).length

    console.log("[v0] Header detection - Comment matches:", commentMatches, "Video matches:", videoMatches)
    console.log("[v0] Headers found:", lowerHeaders)

    // Need at least 3 matching headers to confidently identify type
    if (commentMatches >= 3) return "comments"
    if (videoMatches >= 3) return "videos"
    return "unknown"
  }

  const processFile = (file: File): Promise<UploadedFile> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string

          const lines = text.trim().split("\n")
          if (lines.length < 2) {
            resolve({
              file,
              type: "unknown",
              status: "error",
              error: "File appears to be empty or has no data rows.",
            })
            return
          }

          // Try to detect file type first by checking headers with different separators
          const separators = [",", ";", "|", "\t"]
          let detectedType: "comments" | "videos" | "unknown" = "unknown"
          let bestSeparator = ","

          for (const separator of separators) {
            const headerLine = lines[0]
            const headers = commentAnalyzer["parseCSVLine"](headerLine, separator)
            const fileType = detectFileType(headers)

            if (fileType !== "unknown") {
              detectedType = fileType
              bestSeparator = separator
              break
            }
          }

          if (detectedType === "unknown") {
            resolve({
              file,
              type: "unknown",
              status: "error",
              error: `Unable to detect file type. Expected columns for comments: commentId, textOriginal, authorId, videoId. For videos: videoId, title, description, viewCount, channelId. Tried separators: comma, semicolon, pipe, tab.`,
            })
            return
          }

          // Parse the data using the appropriate method
          let data: any[]
          if (detectedType === "comments") {
            data = commentAnalyzer.parseComments(text)
          } else {
            data = commentAnalyzer.parseVideos(text)
          }

          if (data.length === 0) {
            resolve({
              file,
              type: detectedType,
              status: "error",
              error: "No valid data rows found after parsing.",
            })
            return
          }

          console.log(
            "[v0] Successfully parsed",
            detectedType,
            "file with",
            data.length,
            "rows using separator:",
            bestSeparator,
          )
          resolve({
            file,
            type: detectedType,
            status: "success",
            data: data,
            separator: bestSeparator,
          })
        } catch (error) {
          console.error("[v0] CSV parsing error:", error)
          resolve({
            file,
            type: "unknown",
            status: "error",
            error:
              "Failed to parse CSV file. Please check the format and ensure it uses proper CSV structure with quotes around fields containing commas.",
          })
        }
      }

      reader.onerror = () => {
        resolve({
          file,
          type: "unknown",
          status: "error",
          error: "Failed to read file.",
        })
      }

      reader.readAsText(file)
    })
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsProcessing(true)
    const fileArray = Array.from(files)

    const newFiles: UploadedFile[] = fileArray.map((file) => ({
      file,
      type: "unknown",
      status: "processing",
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    for (let i = 0; i < fileArray.length; i++) {
      const processedFile = await processFile(fileArray[i])

      setUploadedFiles((prev) =>
        prev.map((f, index) => (index === prev.length - fileArray.length + i ? processedFile : f)),
      )
    }

    setIsProcessing(false)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (!isAnalyzing) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAnalyze = () => {
    const commentsFile = uploadedFiles.find((f) => f.type === "comments" && f.status === "success")
    const videosFile = uploadedFiles.find((f) => f.type === "videos" && f.status === "success")

    const commentsData = commentsFile?.data || []
    const videosData = videosFile?.data || []

    console.log("[v0] Starting analysis with", commentsData.length, "comments and", videosData.length, "videos")
    onUpload(commentsData, videosData)
  }

  const canAnalyze =
    uploadedFiles.some((f) => (f.type === "comments" || f.type === "videos") && f.status === "success") && !isProcessing

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <input
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
            disabled={isAnalyzing}
          />
          <Upload className={`w-12 h-12 mb-4 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isDragActive ? "Drop files here" : "Upload CSV Files"}
          </h3>
          <p className="text-muted-foreground text-center mb-4">
            Drag and drop your comment and/or video CSV files here, or click to browse.
            <br />
            <span className="text-sm">Supports comments only, videos only, or both files for joined analysis.</span>
            <br />
            <span className="text-xs text-muted-foreground/80">
              Supports multiple separators: comma (,), semicolon (;), pipe (|), or tab. Fields with commas should be
              quoted.
            </span>
          </p>
          <Button
            variant="outline"
            disabled={isAnalyzing}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Choose Files
          </Button>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Uploaded Files</h4>
          {uploadedFiles.map((uploadedFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {uploadedFile.type === "comments" && <MessageSquare className="w-5 h-5 text-blue-500" />}
                  {uploadedFile.type === "videos" && <Video className="w-5 h-5 text-purple-500" />}
                  {uploadedFile.type === "unknown" && <FileText className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <p className="font-medium text-foreground">{uploadedFile.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {uploadedFile.status === "processing" && (
                        <>
                          <Progress value={50} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground">Processing...</span>
                        </>
                      )}
                      {uploadedFile.status === "success" && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <Badge
                            variant="secondary"
                            className={
                              uploadedFile.type === "comments"
                                ? "bg-blue-100 text-blue-800"
                                : uploadedFile.type === "videos"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {uploadedFile.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{uploadedFile.data?.length} rows</span>
                          {uploadedFile.separator && (
                            <Badge variant="outline" className="text-xs">
                              {uploadedFile.separator === "\t"
                                ? "tab"
                                : uploadedFile.separator === ","
                                  ? "comma"
                                  : uploadedFile.separator === ";"
                                    ? "semicolon"
                                    : "pipe"}
                            </Badge>
                          )}
                        </>
                      )}
                      {uploadedFile.status === "error" && (
                        <>
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-destructive">{uploadedFile.error}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={isAnalyzing}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Analyze Button */}
      {canAnalyze && (
        <div className="flex justify-center pt-4">
          <Button onClick={handleAnalyze} disabled={isAnalyzing || isProcessing} className="gap-2" size="lg">
            <Upload className="w-5 h-5" />
            Start Analysis
          </Button>
        </div>
      )}
    </div>
  )
}
