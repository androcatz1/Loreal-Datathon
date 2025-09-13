"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Download,
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Target,
} from "lucide-react"
import type { AnalyzedComment } from "@/lib/comment-analyzer"

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

interface CommentAnalysisProps {
  commentsData: CommentData[]
  analyzedComments: AnalyzedComment[]
}

export function CommentAnalysis({ commentsData, analyzedComments }: CommentAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSentiment, setSelectedSentiment] = useState("all")
  const [selectedSpamFilter, setSelectedSpamFilter] = useState("all")
  const [selectedQualityFilter, setSelectedQualityFilter] = useState("all")

  const filteredComments = useMemo(() => {
    return analyzedComments.filter((comment) => {
      const matchesSearch =
        searchTerm === "" ||
        comment.textOriginal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === "all" || comment.category === selectedCategory
      const matchesSentiment = selectedSentiment === "all" || comment.sentiment === selectedSentiment

      let matchesSpamFilter = true
      if (selectedSpamFilter === "spam") matchesSpamFilter = comment.isSpam
      else if (selectedSpamFilter === "clean") matchesSpamFilter = !comment.isSpam

      let matchesQualityFilter = true
      if (selectedQualityFilter === "quality") matchesQualityFilter = comment.isQuality
      else if (selectedQualityFilter === "low-quality") matchesQualityFilter = !comment.isQuality

      return matchesSearch && matchesCategory && matchesSentiment && matchesSpamFilter && matchesQualityFilter
    })
  }, [analyzedComments, searchTerm, selectedCategory, selectedSentiment, selectedSpamFilter, selectedQualityFilter])

  const categoryKeywords = useMemo(() => {
    const categories = ["skincare", "fragrance", "makeup", "haircare", "general"]

    return categories.map((cat) => {
      const categoryComments = analyzedComments.filter((c) => c.category === cat)
      const allKeywords = categoryComments.flatMap((c) => c.keywords)
      const keywordCounts = allKeywords.reduce(
        (acc, keyword) => {
          acc[keyword] = (acc[keyword] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const topKeywords = Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }))

      return {
        category: cat,
        keywords: topKeywords,
        totalComments: categoryComments.length,
        avgQuality:
          categoryComments.length > 0
            ? categoryComments.reduce((sum, c) => sum + c.qualityScore, 0) / categoryComments.length
            : 0,
        avgSentiment:
          categoryComments.length > 0
            ? categoryComments.reduce((sum, c) => sum + c.sentimentScore, 0) / categoryComments.length
            : 0,
      }
    })
  }, [analyzedComments])

  const exportData = () => {
    const csvContent = [
      [
        "Comment ID",
        "Text",
        "Sentiment",
        "Sentiment Score",
        "Category",
        "Quality Score",
        "Relevance Score",
        "Spam Score",
        "Is Quality",
        "Is Spam",
        "Engagement Level",
        "Readability Score",
        "Likes",
        "Keywords",
        "Published At",
      ].join(","),
      ...filteredComments.map((comment) =>
        [
          comment.commentId,
          `"${comment.textOriginal.replace(/"/g, '""')}"`,
          comment.sentiment,
          comment.sentimentScore.toFixed(3),
          comment.category,
          comment.qualityScore.toFixed(3),
          comment.relevanceScore.toFixed(3),
          comment.spamScore.toFixed(3),
          comment.isQuality ? "Yes" : "No",
          comment.isSpam ? "Yes" : "No",
          comment.engagement,
          comment.readabilityScore.toFixed(3),
          comment.likeCount,
          `"${comment.keywords.join(", ")}"`,
          comment.publishedAt,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "advanced-comment-analysis.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Advanced Comment Analysis & Filtering
          </CardTitle>
          <CardDescription>
            Filter and analyze comments using AI-powered insights including quality, relevance, and sentiment scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="skincare">Skincare</SelectItem>
                <SelectItem value="fragrance">Fragrance</SelectItem>
                <SelectItem value="makeup">Makeup</SelectItem>
                <SelectItem value="haircare">Haircare</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
              <SelectTrigger>
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedQualityFilter} onValueChange={setSelectedQualityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="quality">High Quality</SelectItem>
                <SelectItem value="low-quality">Low Quality</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSpamFilter} onValueChange={setSelectedSpamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Spam Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Comments</SelectItem>
                <SelectItem value="clean">Clean Only</SelectItem>
                <SelectItem value="spam">Spam Only</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportData} variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>
              Showing {filteredComments.length} of {analyzedComments.length} comments
            </span>
            <Badge variant="secondary">{analyzedComments.filter((c) => c.isQuality).length} quality comments</Badge>
            <Badge variant="destructive">{analyzedComments.filter((c) => c.isSpam).length} spam detected</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analysis Tabs */}
      <Tabs defaultValue="comments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comments">Comment List</TabsTrigger>
          <TabsTrigger value="keywords">Keywords by Category</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <div className="space-y-3">
            {filteredComments.slice(0, 50).map((comment) => (
              <Card key={comment.commentId} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-foreground mb-3 leading-relaxed">{comment.textOriginal}</p>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge
                          variant={
                            comment.sentiment === "positive"
                              ? "default"
                              : comment.sentiment === "negative"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {comment.sentiment === "positive" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {comment.sentiment === "negative" && <XCircle className="w-3 h-3 mr-1" />}
                          {comment.sentiment === "neutral" && <MessageSquare className="w-3 h-3 mr-1" />}
                          {comment.sentiment} ({(comment.sentimentScore * 100).toFixed(0)})
                        </Badge>

                        <Badge variant="outline" className="text-xs capitalize">
                          <Tag className="w-3 h-3 mr-1" />
                          {comment.category}
                        </Badge>

                        {comment.isQuality && (
                          <Badge variant="secondary" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            Quality ({(comment.qualityScore * 100).toFixed(0)})
                          </Badge>
                        )}

                        {comment.isSpam && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Spam ({(comment.spamScore * 100).toFixed(0)})
                          </Badge>
                        )}

                        <Badge variant="outline" className="text-xs">
                          <Brain className="w-3 h-3 mr-1" />
                          Relevance: {(comment.relevanceScore * 100).toFixed(0)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {comment.likeCount} likes
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(comment.publishedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {comment.authorId.slice(0, 8)}...
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {comment.engagement} engagement
                        </Badge>
                      </div>

                      {comment.keywords.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Keywords:</p>
                          <div className="flex flex-wrap gap-1">
                            {comment.keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredComments.length > 50 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    Showing first 50 comments. Use filters to narrow down results or export all data.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryKeywords.map((categoryData) => (
              <Card key={categoryData.category}>
                <CardHeader>
                  <CardTitle className="capitalize text-lg flex items-center justify-between">
                    {categoryData.category}
                    <Badge variant="secondary">{categoryData.totalComments}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Avg Quality: {(categoryData.avgQuality * 100).toFixed(0)}% | Avg Sentiment:{" "}
                    {(categoryData.avgSentiment * 100).toFixed(0)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryData.keywords.map((keywordData, index) => (
                      <div key={keywordData.keyword} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{keywordData.keyword}</span>
                        <Badge variant="secondary" className="text-xs">
                          {keywordData.count}
                        </Badge>
                      </div>
                    ))}
                    {categoryData.keywords.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No keywords found for this category
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered KPIs</CardTitle>
                <CardDescription>Advanced metrics for measuring message efficacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Quality Ratio</span>
                  <Badge variant="secondary">
                    {((analyzedComments.filter((c) => c.isQuality).length / analyzedComments.length) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Relevance Score</span>
                  <Badge variant="secondary">
                    {(
                      (analyzedComments.reduce((sum, c) => sum + c.relevanceScore, 0) / analyzedComments.length) *
                      100
                    ).toFixed(1)}
                    %
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Positive Sentiment</span>
                  <Badge variant="default">
                    {(
                      (analyzedComments.filter((c) => c.sentiment === "positive").length / analyzedComments.length) *
                      100
                    ).toFixed(1)}
                    %
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Spam Detection Rate</span>
                  <Badge variant="destructive">
                    {((analyzedComments.filter((c) => c.isSpam).length / analyzedComments.length) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Readability</span>
                  <Badge variant="secondary">
                    {(
                      (analyzedComments.reduce((sum, c) => sum + c.readabilityScore, 0) / analyzedComments.length) *
                      100
                    ).toFixed(0)}
                    %
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Actionable insights based on advanced analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analyzedComments.filter((c) => c.sentiment === "positive").length / analyzedComments.length > 0.6 ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-sm">Excellent sentiment health - messaging resonates well with audience</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <p className="text-sm">Consider refining messaging strategy to improve sentiment</p>
                  </div>
                )}

                {analyzedComments.filter((c) => c.isSpam).length / analyzedComments.length > 0.1 ? (
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <p className="text-sm">High spam rate detected - implement stronger content moderation</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-sm">Spam levels are well controlled</p>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-sm">
                    Top performing category:{" "}
                    {categoryKeywords.sort((a, b) => b.totalComments - a.totalComments)[0]?.category}- focus content
                    strategy here
                  </p>
                </div>

                {analyzedComments.filter((c) => c.isQuality).length / analyzedComments.length < 0.3 && (
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-orange-500 mt-0.5" />
                    <p className="text-sm">Low quality ratio - encourage more detailed, engaging comments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
