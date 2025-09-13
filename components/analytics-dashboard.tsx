"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface AnalyticsDashboardProps {
  commentsData: CommentData[]
  videosData: VideoData[]
  analyzedComments: AnalyzedComment[]
  analyzedVideos?: AnalyzedVideo[]
}

function SimpleBarChart({
  data,
  title,
}: { data: Array<{ name: string; value: number; color?: string }>; title: string }) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{item.name}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || "#059669",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function SimplePieChart({
  data,
  title,
}: { data: Array<{ name: string; value: number; color: string }>; title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="grid grid-cols-1 gap-3">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1)
          return (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">{percentage}%</div>
                <div className="text-xs text-muted-foreground">{item.value} comments</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AnalyticsDashboard({
  commentsData,
  videosData,
  analyzedComments,
  analyzedVideos,
}: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    return commentAnalyzer.generateMetrics(analyzedComments, analyzedVideos)
  }, [analyzedComments, analyzedVideos])

  const hasComments = analyzedComments.length > 0
  const hasVideos = analyzedVideos && analyzedVideos.length > 0
  const isVideoOnly = hasVideos && !hasComments
  const isCommentOnly = hasComments && !hasVideos

  const sentimentData = [
    { name: "Positive", value: analytics.sentimentDistribution.positive, color: "#10b981" },
    { name: "Neutral", value: analytics.sentimentDistribution.neutral, color: "#6b7280" },
    { name: "Negative", value: analytics.sentimentDistribution.negative, color: "#ef4444" },
  ]

  const categoryData = Object.entries(analytics.categoryDistribution).map(([category, count]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: count,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
  }))

  const qualityMetrics = useMemo(() => {
    const qualityComments = analyzedComments.filter((c) => c.isQuality)
    const spamComments = analyzedComments.filter((c) => c.isSpam)

    return {
      qualityCount: qualityComments.length,
      spamCount: spamComments.length,
      avgQualityScore:
        qualityComments.length > 0
          ? qualityComments.reduce((sum, c) => sum + c.qualityScore, 0) / qualityComments.length
          : 0,
      avgRelevanceScore:
        analyzedComments.length > 0
          ? analyzedComments.reduce((sum, c) => sum + c.relevanceScore, 0) / analyzedComments.length
          : 0,
    }
  }, [analyzedComments])

  return (
    <div className="space-y-6">
      {/* Enhanced KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isVideoOnly ? (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Videos</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.totalVideos.toLocaleString()}</p>
                  </div>
                  <span className="text-2xl">🎥</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Video analysis complete
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {analytics.videoMetrics && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analytics.videoMetrics.totalViews.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-2xl">👁️</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Avg: {analytics.videoMetrics.avgViewCount.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analytics.videoMetrics.totalLikes.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-2xl">❤️</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Avg: {analytics.videoMetrics.avgLikeCount.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Saves</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analytics.videoMetrics.totalFavorites.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-2xl">⭐</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Avg: {analytics.videoMetrics.avgFavoriteCount.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : (
          // Comment-focused or combined KPIs
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.totalComments.toLocaleString()}</p>
                  </div>
                  <span className="text-2xl">💬</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {videosData.length} videos analyzed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {analytics.videoMetrics && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Video Views</p>
                      <p className="text-2xl font-bold text-foreground">
                        {analytics.videoMetrics.avgViewCount.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-2xl">🎥</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {analytics.totalVideos} videos
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quality Ratio</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.qualityRatio.toFixed(1)}%</p>
                  </div>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="mt-2">
                  <Progress value={analytics.qualityRatio} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{qualityMetrics.qualityCount} quality comments</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.averageEngagement.toFixed(1)}</p>
                  </div>
                  <span className="text-2xl">❤️</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {analytics.qualityIndicators.avgLikes.toFixed(1)} avg likes
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Spam Detected</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.spamRatio.toFixed(1)}%</p>
                  </div>
                  <span className={`text-2xl ${analytics.spamRatio > 10 ? "text-red-500" : ""}`}>🛡️</span>
                </div>
                <div className="mt-2">
                  <Badge variant={analytics.spamRatio > 10 ? "destructive" : "secondary"} className="text-xs">
                    {qualityMetrics.spamCount} spam comments
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue={isVideoOnly ? "videos" : "sentiment"} className="space-y-4">
        <TabsList className={`grid w-full ${analytics.videoMetrics ? "grid-cols-6" : "grid-cols-5"}`}>
          {!isVideoOnly && <TabsTrigger value="sentiment">Sentiment</TabsTrigger>}
          {!isVideoOnly && <TabsTrigger value="categories">Categories</TabsTrigger>}
          {!isVideoOnly && <TabsTrigger value="quality">Quality</TabsTrigger>}
          {!isVideoOnly && <TabsTrigger value="keywords">Keywords</TabsTrigger>}
          {!isVideoOnly && <TabsTrigger value="timeline">Timeline</TabsTrigger>}
          {analytics.videoMetrics && <TabsTrigger value="videos">Videos</TabsTrigger>}
        </TabsList>

        {!isVideoOnly && (
          <>
            <TabsContent value="sentiment" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                    <CardDescription>Overall sentiment breakdown with confidence scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimplePieChart data={sentimentData} title="" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Insights</CardTitle>
                    <CardDescription>Advanced sentiment analysis metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">📈</span>
                        <span className="text-sm font-medium">Positive Sentiment</span>
                      </div>
                      <Badge variant="default">{analytics.sentimentDistribution.positive.toFixed(1)}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">📉</span>
                        <span className="text-sm font-medium">Negative Sentiment</span>
                      </div>
                      <Badge variant="destructive">{analytics.sentimentDistribution.negative.toFixed(1)}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">💬</span>
                        <span className="text-sm font-medium">Neutral Sentiment</span>
                      </div>
                      <Badge variant="secondary">{analytics.sentimentDistribution.neutral.toFixed(1)}%</Badge>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-foreground mb-2">Overall Health</p>
                      <div className="flex items-center gap-2">
                        {analytics.sentimentDistribution.positive > analytics.sentimentDistribution.negative ? (
                          <span className="text-green-500">✅</span>
                        ) : (
                          <span className="text-red-500">❌</span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {analytics.sentimentDistribution.positive > analytics.sentimentDistribution.negative
                            ? "Positive sentiment dominates"
                            : "Negative sentiment needs attention"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Comment categorization with AI-powered classification</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart data={categoryData} title="" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Score</CardTitle>
                    <CardDescription>Average comment quality assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {(qualityMetrics.avgQualityScore * 100).toFixed(0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Quality Score</p>
                      <Progress value={qualityMetrics.avgQualityScore * 100} className="mt-3" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Relevance Score</CardTitle>
                    <CardDescription>How relevant comments are to content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {(qualityMetrics.avgRelevanceScore * 100).toFixed(0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Relevance Score</p>
                      <Progress value={qualityMetrics.avgRelevanceScore * 100} className="mt-3" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Readability</CardTitle>
                    <CardDescription>Average comment readability score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {(analytics.qualityIndicators.avgReadability * 100).toFixed(0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Readability Score</p>
                      <Progress value={analytics.qualityIndicators.avgReadability * 100} className="mt-3" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                  <CardDescription>Most frequently mentioned keywords with sentiment context</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {analytics.topKeywords.slice(0, 20).map((keyword, index) => (
                      <div key={keyword.keyword} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              keyword.sentiment === "positive"
                                ? "default"
                                : keyword.sentiment === "negative"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="w-2 h-2 p-0"
                          />
                          <span className="text-sm font-medium">{keyword.keyword}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {keyword.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Timeline</CardTitle>
                  <CardDescription>Comment activity and engagement patterns by hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Hourly Activity</h4>
                    <div className="grid grid-cols-12 gap-1">
                      {analytics.engagementTrends.map((trend, index) => {
                        const maxComments = Math.max(...analytics.engagementTrends.map((t) => t.comments))
                        const height = (trend.comments / maxComments) * 100
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div
                              className="w-full bg-primary rounded-t transition-all duration-300"
                              style={{ height: `${Math.max(height, 5)}px` }}
                              title={`${trend.hour}:00 - ${trend.comments} comments`}
                            />
                            <span className="text-xs text-muted-foreground mt-1">{trend.hour}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {analytics.videoMetrics && (
          <TabsContent value="videos" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Video Performance</CardTitle>
                  <CardDescription>Key video metrics and engagement rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">👁️</span>
                      <span className="text-sm font-medium">Avg Views</span>
                    </div>
                    <Badge variant="secondary">{analytics.videoMetrics.avgViewCount.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">❤️</span>
                      <span className="text-sm font-medium">Avg Likes</span>
                    </div>
                    <Badge variant="secondary">{analytics.videoMetrics.avgLikeCount.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">💬</span>
                      <span className="text-sm font-medium">Avg Comments</span>
                    </div>
                    <Badge variant="secondary">{analytics.videoMetrics.avgCommentCount.toLocaleString()}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Videos</CardTitle>
                  <CardDescription>Videos with highest engagement rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.videoMetrics.topPerformingVideos.slice(0, 5).map((video, index) => (
                      <div key={video.videoId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">ID: {video.videoId}</p>
                        </div>
                        <Badge variant="default" className="ml-2">
                          {video.engagementRate.toFixed(2)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Video performance breakdown by content category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analytics.videoMetrics.categoryPerformance).map(([category, performance]) => (
                    <div key={category} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-foreground mb-2 capitalize">{category}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Views</span>
                          <span className="font-medium">{performance.avgViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Engagement</span>
                          <span className="font-medium">{performance.avgEngagement.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
