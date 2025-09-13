"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { AnalyzedComment, AnalysisMetrics, AnalyzedVideo, VideoMetrics } from "@/lib/comment-analyzer"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatbotProps {
  analyzedComments: AnalyzedComment[]
  analytics: AnalysisMetrics
  analyzedVideos?: AnalyzedVideo[]
  videoMetrics?: VideoMetrics
  isVisible: boolean
  onClose: () => void
}

export function AIChatbot({
  analyzedComments,
  analytics,
  analyzedVideos = [],
  videoMetrics,
  isVisible,
  onClose,
}: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your CommentSense AI assistant. I can help you understand your comment and video analysis data. Ask me about sentiment, engagement, video performance, categories, quality metrics, or specific insights!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  console.log("[v0] Chatbot rendered with:", {
    isVisible,
    totalComments: analytics.totalComments,
    totalVideos: analyzedVideos.length,
    messagesCount: messages.length,
  })

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const generateResponse = (userQuestion: string): string => {
    const question = userQuestion.toLowerCase()
    console.log("[v0] Generating response for:", question)

    // Video performance questions
    if (
      question.includes("video") &&
      (question.includes("performance") || question.includes("best") || question.includes("top"))
    ) {
      if (!videoMetrics || analyzedVideos.length === 0) {
        return "No video data available. Upload a videos CSV file to get video performance insights!"
      }

      const topVideos = analyzedVideos.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 3)

      return `Top performing videos by engagement rate: ${topVideos
        .map((v, i) => `${i + 1}. "${v.title.substring(0, 50)}..." (${v.engagementRate.toFixed(2)}% engagement)`)
        .join(", ")}. Focus on similar content styles for better performance.`
    }

    // Video engagement questions
    if (question.includes("video") && question.includes("engagement")) {
      if (!videoMetrics) {
        return "No video data available. Upload a videos CSV file to analyze video engagement!"
      }

      return `Average video engagement rate: ${videoMetrics.averageEngagementRate.toFixed(2)}%. ${
        videoMetrics.averageEngagementRate > 5
          ? "Excellent engagement! Your videos are resonating well with viewers."
          : "Consider optimizing titles, thumbnails, and content to boost engagement."
      } Total videos analyzed: ${videoMetrics.totalVideos}.`
    }

    // Video categories/topics questions
    if (question.includes("video") && (question.includes("category") || question.includes("topic"))) {
      if (!videoMetrics) {
        return "No video data available. Upload a videos CSV file to see video category insights!"
      }

      const topCategories = Object.entries(videoMetrics.categoryDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)

      return `Top video categories: ${topCategories
        .map(([cat, count]) => `${cat} (${count} videos)`)
        .join(", ")}. These categories generate the most content in your channel.`
    }

    // Video views/popularity questions
    if (question.includes("video") && (question.includes("view") || question.includes("popular"))) {
      if (!analyzedVideos.length) {
        return "No video data available. Upload a videos CSV file to analyze video popularity!"
      }

      const totalViews = analyzedVideos.reduce((sum, v) => sum + v.viewCount, 0)
      const avgViews = totalViews / analyzedVideos.length
      const mostViewed = analyzedVideos.reduce((max, v) => (v.viewCount > max.viewCount ? v : max))

      return `Total views across all videos: ${totalViews.toLocaleString()}. Average views per video: ${Math.round(avgViews).toLocaleString()}. Most viewed: "${mostViewed.title.substring(0, 50)}..." with ${mostViewed.viewCount.toLocaleString()} views.`
    }

    // Combined analysis questions
    if (question.includes("overall") || question.includes("summary")) {
      let response = `Summary: ${analytics.totalComments} comments analyzed. Quality: ${analytics.qualityRatio.toFixed(1)}%, Positive sentiment: ${analytics.sentimentDistribution.positive.toFixed(1)}%, Spam: ${analytics.spamRatio.toFixed(1)}%.`

      if (videoMetrics) {
        response += ` Videos: ${videoMetrics.totalVideos} analyzed, ${videoMetrics.averageEngagementRate.toFixed(2)}% avg engagement rate.`
      }

      response += ` ${analytics.sentimentDistribution.positive > 50 && analytics.qualityRatio > 40 ? "Excellent community engagement!" : "Good foundation with room for improvement."}`

      return response
    }

    // Sentiment-related questions
    if (question.includes("sentiment")) {
      const { positive, negative, neutral } = analytics.sentimentDistribution
      if (question.includes("positive")) {
        return `Your content has ${positive.toFixed(1)}% positive sentiment. ${positive > 50 ? "That's great! Your audience is responding positively." : "Consider focusing on content that generates more positive engagement."}`
      }
      if (question.includes("negative")) {
        return `${negative.toFixed(1)}% of comments show negative sentiment. ${negative > 30 ? "You might want to address concerns or improve content quality." : "Your negative sentiment is within normal ranges."}`
      }
      return `Your sentiment breakdown: ${positive.toFixed(1)}% positive, ${neutral.toFixed(1)}% neutral, ${negative.toFixed(1)}% negative. ${positive > negative ? "Overall sentiment is positive!" : "Consider strategies to improve sentiment."}`
    }

    // Quality-related questions
    if (question.includes("quality")) {
      const qualityRatio = analytics.qualityRatio
      const qualityComments = analyzedComments.filter((c) => c.isQuality)
      return `${qualityRatio.toFixed(1)}% of your comments are high-quality (${qualityComments.length} out of ${analytics.totalComments}). ${qualityRatio > 40 ? "Excellent engagement quality!" : "Consider encouraging more detailed discussions."}`
    }

    // Spam-related questions
    if (question.includes("spam")) {
      const spamRatio = analytics.spamRatio
      const spamComments = analyzedComments.filter((c) => c.isSpam)
      return `${spamRatio.toFixed(1)}% of comments were flagged as spam (${spamComments.length} comments). ${spamRatio > 10 ? "Consider implementing stricter moderation." : "Your spam levels are well-controlled."}`
    }

    // Category-related questions
    if (question.includes("category") || question.includes("topic")) {
      const topCategories = Object.entries(analytics.categoryDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
      return `Top discussion categories: ${topCategories.map(([cat, count]) => `${cat} (${count} comments)`).join(", ")}. This shows what topics resonate most with your audience.`
    }

    // Engagement-related questions
    if (question.includes("engagement")) {
      const avgEngagement = analytics.averageEngagement
      const highEngagement = analyzedComments.filter((c) => c.engagement === "high").length
      return `Average engagement is ${avgEngagement.toFixed(1)} likes per comment. ${highEngagement} comments have high engagement. ${avgEngagement > 5 ? "Great engagement levels!" : "Consider strategies to boost interaction."}`
    }

    // Keywords-related questions
    if (question.includes("keyword") || question.includes("popular")) {
      const topKeywords = analytics.topKeywords.slice(0, 5)
      return `Most mentioned keywords: ${topKeywords.map((k) => `"${k.keyword}" (${k.count} times)`).join(", ")}. These represent your audience's main interests.`
    }

    // Time/trend-related questions
    if (question.includes("time") || question.includes("when") || question.includes("trend")) {
      const peakHours = analytics.engagementTrends.sort((a, b) => b.comments - a.comments).slice(0, 3)
      return `Peak activity hours: ${peakHours.map((h) => `${h.hour}:00 (${h.comments} comments)`).join(", ")}. Post content during these times for maximum engagement.`
    }

    // Improvement suggestions
    if (question.includes("improve") || question.includes("better") || question.includes("suggestion")) {
      const suggestions = []
      if (analytics.qualityRatio < 40) suggestions.push("encourage more detailed discussions")
      if (analytics.sentimentDistribution.negative > 30) suggestions.push("address negative feedback proactively")
      if (analytics.spamRatio > 10) suggestions.push("implement stricter comment moderation")
      if (analytics.averageEngagement < 3) suggestions.push("create more engaging content")

      if (videoMetrics && videoMetrics.averageEngagementRate < 3) {
        suggestions.push("optimize video titles and thumbnails for better engagement")
      }

      return suggestions.length > 0
        ? `Based on your data, consider: ${suggestions.join(", ")}.`
        : "Your metrics look great! Keep up the good work with your current content strategy."
    }

    // Default response with helpful suggestions
    return `I can help you understand your comment and video data! Try asking about:
    • Sentiment analysis ("How's my sentiment?")
    • Comment quality ("What's my comment quality?")
    • Video performance ("Show me top performing videos")
    • Video engagement ("How's my video engagement?")
    • Popular topics ("What categories are trending?")
    • Engagement patterns ("When do I get most comments?")
    • Improvement suggestions ("How can I improve?")
    • Overall summary ("Give me an overview")`
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    console.log("[v0] Sending message:", input.trim())

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI processing delay
    setTimeout(() => {
      const response = generateResponse(userMessage.content)
      console.log("[v0] Generated response:", response)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedQuestionClick = (question: string) => {
    console.log("[v0] Suggested question clicked:", question)
    setInput(question)
    // Automatically send the question
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: question,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      setTimeout(() => {
        const response = generateResponse(question)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1000)
    }, 100)
  }

  const suggestedQuestions = [
    "How's my sentiment analysis?",
    "What's my comment quality?",
    ...(videoMetrics ? ["Show me top performing videos", "How's my video engagement?"] : []),
    "Show me popular keywords",
    "When do I get most engagement?",
    "How can I improve?",
  ]

  if (!isVisible) return null

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-lg border-2 z-50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <CardTitle className="text-lg">CommentSense AI</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {analytics.totalComments} comments analyzed
          </Badge>
          {videoMetrics && (
            <Badge variant="outline" className="text-xs">
              {videoMetrics.totalVideos} videos analyzed
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-line ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span>Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-transparent hover:bg-muted cursor-pointer"
                  onClick={() => handleSuggestedQuestionClick(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your comment data..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading} size="sm">
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
