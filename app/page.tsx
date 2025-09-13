"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileUpload } from "@/components/file-upload"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { CommentAnalysis } from "@/components/comment-analysis"
import { AIChatbot } from "@/components/ai-chatbot"
import { commentAnalyzer, type AnalyzedComment, type AnalyzedVideo } from "@/lib/comment-analyzer"

interface CommentData {
  kind: string
  commentId: string
  channelId: string
  videoId: string
  authorId: string
  textOriginal: string
  parentCommentId: string
  likeCount: number
  publishedAt: string
  updatedAt: string
}

interface VideoData {
  kind: string
  videoId: string
  publishedAt: string
  channelId: string
  title: string
  description: string
  tags: string[]
  defaultLanguage: string
  defaultAudioLanguage: string
  contentDuration: string
  viewCount: number
  likeCount: number
  favouriteCount: number
  commentCount: number
  topicCategories: string[]
}

export default function CommentSensePage() {
  const [commentsData, setCommentsData] = useState<CommentData[]>([])
  const [videosData, setVideosData] = useState<VideoData[]>([])
  const [analyzedComments, setAnalyzedComments] = useState<AnalyzedComment[]>([])
  const [analyzedVideos, setAnalyzedVideos] = useState<AnalyzedVideo[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [isChatbotVisible, setIsChatbotVisible] = useState(false)

  const handleFileUpload = async (comments: CommentData[], videos: VideoData[]) => {
    setIsAnalyzing(true)
    setCommentsData(comments)
    setVideosData(videos)
    setAnalysisProgress(0)

    console.log("[v0] Starting analysis with", comments.length, "comments and", videos.length, "videos")

    // Create video lookup map for joining
    const videoMap = new Map<string, VideoData>()
    videos.forEach((video) => {
      videoMap.set(video.videoId, video)
    })

    // Analyze videos first if available
    const analyzedVideosList: AnalyzedVideo[] = []
    if (videos.length > 0) {
      console.log("[v0] Analyzing videos...")
      for (let i = 0; i < videos.length; i++) {
        const analyzedVideo = commentAnalyzer.analyzeVideo(videos[i])
        analyzedVideosList.push(analyzedVideo)

        // Update progress (videos take 30% of total progress)
        const videoProgress = ((i + 1) / videos.length) * 30
        setAnalysisProgress(videoProgress)

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
    setAnalyzedVideos(analyzedVideosList)

    // Analyze comments with video context
    const analyzedCommentsList: AnalyzedComment[] = []
    const batchSize = 50
    const startProgress = videos.length > 0 ? 30 : 0

    console.log("[v0] Analyzing comments with video context...")
    for (let i = 0; i < comments.length; i += batchSize) {
      const batch = comments.slice(i, i + batchSize)
      const batchAnalyzed = batch.map((comment) => {
        // Find matching video for this comment
        const matchingVideo = videoMap.get(comment.videoId)
        return commentAnalyzer.analyzeCommentWithVideo(comment, matchingVideo)
      })
      analyzedCommentsList.push(...batchAnalyzed)

      // Update progress (comments take remaining 70% of progress)
      const commentProgress = startProgress + ((i + batchSize) / comments.length) * (100 - startProgress)
      setAnalysisProgress(Math.min(100, commentProgress))

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log("[v0] Analysis complete!")
    setAnalyzedComments(analyzedCommentsList)
    setIsAnalyzing(false)
    setAnalysisComplete(true)
  }

  const resetAnalysis = () => {
    setCommentsData([])
    setVideosData([])
    setAnalyzedComments([])
    setAnalyzedVideos([])
    setAnalysisComplete(false)
    setIsAnalyzing(false)
    setAnalysisProgress(0)
    setIsChatbotVisible(false)
  }

  const analytics = analysisComplete ? commentAnalyzer.generateMetrics(analyzedComments, analyzedVideos) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <span className="text-primary-foreground text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">CommentSense</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Comment & Video Analysis Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analysisComplete && (
                <Button
                  variant="outline"
                  onClick={() => setIsChatbotVisible(!isChatbotVisible)}
                  className="gap-2 bg-transparent"
                >
                  <span className="text-sm">🤖</span>
                  AI Assistant
                </Button>
              )}
              {analysisComplete && (
                <Button variant="outline" onClick={resetAnalysis} className="gap-2 bg-transparent">
                  <span className="text-sm">↻</span>
                  New Analysis
                </Button>
              )}
              <Badge variant="secondary" className="gap-1">
                <span className="text-white bg-green-600 rounded-full px-1">✓</span>
                Ready
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {!analysisComplete ? (
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Unlock Insights from Your Social Media Data</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upload your comment and video CSV files for comprehensive AI-powered analysis. Supports comments only,
                videos only, or both with automatic data joining.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl text-primary mx-auto mb-3">💬</div>
                  <h3 className="font-semibold text-foreground mb-2">Comment Analysis</h3>
                  <p className="text-sm text-muted-foreground">Sentiment, quality, and spam detection</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl text-primary mx-auto mb-3">🎥</div>
                  <h3 className="font-semibold text-foreground mb-2">Video Analysis</h3>
                  <p className="text-sm text-muted-foreground">Performance metrics and content insights</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl text-primary mx-auto mb-3">🔗</div>
                  <h3 className="font-semibold text-foreground mb-2">Data Joining</h3>
                  <p className="text-sm text-muted-foreground">Automatic linking of comments to videos</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl text-primary mx-auto mb-3">📊</div>
                  <h3 className="font-semibold text-foreground mb-2">Rich Analytics</h3>
                  <p className="text-sm text-muted-foreground">Comprehensive dashboards and insights</p>
                </CardContent>
              </Card>
            </div>

            {/* File Upload Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">📤</span>
                  Upload Your Data
                </CardTitle>
                <CardDescription>
                  Upload CSV files containing comments, videos, or both. Comments and videos will be automatically
                  joined by videoId when both are provided.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onUpload={handleFileUpload} isAnalyzing={isAnalyzing} />
              </CardContent>
            </Card>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-4xl animate-pulse">🧠</div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Analyzing Your Data...</h3>
                    <p className="text-muted-foreground mb-4">
                      Processing {commentsData.length} comments and {videosData.length} videos with advanced AI analysis
                    </p>
                    <Progress value={analysisProgress} className="w-full max-w-md mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {analysisProgress < 30 && videosData.length > 0 && "Analyzing video content and performance..."}
                      {analysisProgress < 30 && videosData.length === 0 && "Running sentiment analysis..."}
                      {analysisProgress >= 30 &&
                        analysisProgress < 60 &&
                        "Categorizing comments and joining with video data..."}
                      {analysisProgress >= 60 && analysisProgress < 90 && "Detecting spam and assessing quality..."}
                      {analysisProgress >= 90 && "Finalizing analysis and generating insights..."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            <AnalyticsDashboard
              commentsData={commentsData}
              videosData={videosData}
              analyzedComments={analyzedComments}
              analyzedVideos={analyzedVideos}
            />
            <CommentAnalysis commentsData={commentsData} analyzedComments={analyzedComments} />
            {analysisComplete && analytics && (
              <AIChatbot
                analyzedComments={analyzedComments}
                analytics={analytics}
                isVisible={isChatbotVisible}
                onClose={() => setIsChatbotVisible(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
