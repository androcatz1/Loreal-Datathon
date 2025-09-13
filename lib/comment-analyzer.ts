// Advanced comment analysis engine for CommentSense platform

export interface AnalyzedComment {
  commentId: string
  textOriginal: string
  authorId: string
  likeCount: number
  publishedAt: string
  videoId?: string
  videoTitle?: string
  videoViewCount?: number
  videoLikeCount?: number
  videoCommentCount?: number
  videoTopicCategories?: string[]

  // Analysis results
  sentiment: "positive" | "negative" | "neutral"
  sentimentScore: number
  category: string
  subcategory?: string
  isSpam: boolean
  spamScore: number
  isQuality: boolean
  qualityScore: number
  relevanceScore: number
  keywords: string[]
  entities: string[]
  emotions: string[]
  toxicity: number
  engagement: "high" | "medium" | "low"
  language: string
  readabilityScore: number
}

export interface AnalyzedVideo {
  videoId: string
  title: string
  description: string
  channelId: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  contentDuration: string
  topicCategories: string[]

  // Analysis results
  titleSentiment: "positive" | "negative" | "neutral"
  titleSentimentScore: number
  descriptionSentiment: "positive" | "negative" | "neutral"
  descriptionSentimentScore: number
  category: string
  keywords: string[]
  engagementRate: number
  popularityScore: number
  contentQuality: "high" | "medium" | "low"
  avgCommentSentiment?: number
  commentEngagementRatio?: number
}

export interface AnalysisMetrics {
  totalComments: number
  totalVideos: number
  qualityRatio: number
  sentimentDistribution: {
    positive: number
    negative: number
    neutral: number
  }
  videoMetrics?: {
    totalViews: number
    totalLikes: number
    totalFavorites: number
    avgViewCount: number
    avgLikeCount: number
    avgFavoriteCount: number
    avgCommentCount: number
    avgEngagementRate: number
    topPerformingVideos: Array<{ videoId: string; title: string; engagementRate: number }>
    categoryPerformance: Record<string, { avgViews: number; avgEngagement: number }>
  }
  categoryDistribution: Record<string, number>
  spamRatio: number
  averageEngagement: number
  topKeywords: Array<{ keyword: string; count: number; sentiment: string }>
  engagementTrends: Array<{ hour: number; comments: number; avgLikes: number }>
  qualityIndicators: {
    avgLength: number
    avgLikes: number
    avgReadability: number
  }
}

// Enhanced category definitions with industry-specific keywords
interface CategoryKeywords {
  [category: string]: {
    primary: string[]
    secondary: string[]
    negative: string[]
  }
}

const CATEGORY_KEYWORDS: CategoryKeywords = {
  skincare: {
    primary: [
      "skin",
      "skincare",
      "moisturizer",
      "cleanser",
      "serum",
      "cream",
      "lotion",
      "acne",
      "wrinkles",
      "aging",
      "hydration",
      "dry",
      "oily",
      "sensitive",
    ],
    secondary: [
      "routine",
      "glow",
      "texture",
      "pores",
      "blackheads",
      "breakout",
      "dermatologist",
      "ingredients",
      "retinol",
      "hyaluronic",
      "vitamin c",
      "spf",
    ],
    negative: ["irritation", "reaction", "burning", "stinging", "rash", "allergic"],
  },
  fragrance: {
    primary: [
      "perfume",
      "fragrance",
      "scent",
      "cologne",
      "eau de toilette",
      "eau de parfum",
      "smell",
      "aroma",
      "notes",
      "spray",
    ],
    secondary: [
      "floral",
      "woody",
      "citrus",
      "musky",
      "vanilla",
      "rose",
      "jasmine",
      "sandalwood",
      "bergamot",
      "lasting",
      "projection",
      "sillage",
    ],
    negative: ["overpowering", "synthetic", "cheap", "headache", "cloying"],
  },
  makeup: {
    primary: [
      "makeup",
      "cosmetics",
      "foundation",
      "concealer",
      "lipstick",
      "eyeshadow",
      "mascara",
      "blush",
      "bronzer",
      "highlighter",
    ],
    secondary: [
      "coverage",
      "pigmentation",
      "blend",
      "long-lasting",
      "waterproof",
      "matte",
      "shimmer",
      "palette",
      "brush",
      "application",
    ],
    negative: ["patchy", "cakey", "streaky", "smudge", "flaky"],
  },
  haircare: {
    primary: ["hair", "shampoo", "conditioner", "styling", "treatment", "mask", "oil", "serum", "spray", "gel"],
    secondary: [
      "volume",
      "shine",
      "frizz",
      "damage",
      "repair",
      "growth",
      "thickness",
      "curl",
      "straight",
      "color",
      "bleach",
      "dye",
    ],
    negative: ["greasy", "dry", "brittle", "thinning", "loss", "damage"],
  },
}

// Sentiment analysis with contextual understanding
const SENTIMENT_PATTERNS = {
  positive: {
    strong: [
      "amazing",
      "incredible",
      "fantastic",
      "outstanding",
      "exceptional",
      "phenomenal",
      "brilliant",
      "perfect",
      "flawless",
    ],
    moderate: ["good", "great", "nice", "love", "like", "enjoy", "happy", "satisfied", "pleased", "recommend"],
    mild: ["okay", "fine", "decent", "alright", "not bad", "works", "useful"],
  },
  negative: {
    strong: ["terrible", "awful", "horrible", "disgusting", "worst", "hate", "despise", "useless", "trash", "garbage"],
    moderate: ["bad", "poor", "disappointing", "waste", "regret", "annoying", "frustrating", "overpriced"],
    mild: ["meh", "boring", "bland", "average", "nothing special", "could be better"],
  },
  neutral: ["product", "item", "thing", "stuff", "brand", "company", "price", "cost", "buy", "purchase"],
}

// Spam detection patterns
const SPAM_PATTERNS = {
  promotional: [
    "click here",
    "visit my",
    "check out my",
    "follow me",
    "subscribe",
    "link in bio",
    "dm me",
    "message me",
  ],
  monetary: ["free money", "make money", "earn cash", "get paid", "winner", "prize", "lottery", "investment"],
  repetitive: ["first", "second", "third", "fourth", "fifth"],
  suspicious: ["bot", "fake", "scam", "virus", "hack", "phishing"],
}

// Quality indicators
const QUALITY_INDICATORS = {
  positive: [
    "detailed",
    "experience",
    "recommend",
    "tried",
    "used",
    "months",
    "weeks",
    "results",
    "improvement",
    "comparison",
  ],
  negative: ["just", "only", "simple", "short", "quick", "fast"],
}

export class CommentAnalyzer {
  private stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
  ])

  analyzeSentiment(text: string): { sentiment: "positive" | "negative" | "neutral"; score: number } {
    const lowerText = text.toLowerCase()
    let score = 0
    let wordCount = 0

    // Check for strong sentiment words
    SENTIMENT_PATTERNS.positive.strong.forEach((word) => {
      if (lowerText.includes(word)) {
        score += 3
        wordCount++
      }
    })

    SENTIMENT_PATTERNS.positive.moderate.forEach((word) => {
      if (lowerText.includes(word)) {
        score += 2
        wordCount++
      }
    })

    SENTIMENT_PATTERNS.positive.mild.forEach((word) => {
      if (lowerText.includes(word)) {
        score += 1
        wordCount++
      }
    })

    SENTIMENT_PATTERNS.negative.strong.forEach((word) => {
      if (lowerText.includes(word)) {
        score -= 3
        wordCount++
      }
    })

    SENTIMENT_PATTERNS.negative.moderate.forEach((word) => {
      if (lowerText.includes(word)) {
        score -= 2
        wordCount++
      }
    })

    SENTIMENT_PATTERNS.negative.mild.forEach((word) => {
      if (lowerText.includes(word)) {
        score -= 1
        wordCount++
      }
    })

    // Normalize score
    const normalizedScore = wordCount > 0 ? score / wordCount : 0

    let sentiment: "positive" | "negative" | "neutral" = "neutral"
    if (normalizedScore > 0.5) sentiment = "positive"
    else if (normalizedScore < -0.5) sentiment = "negative"

    return { sentiment, score: Math.max(-1, Math.min(1, normalizedScore)) }
  }

  categorizeComment(text: string): { category: string; subcategory?: string; confidence: number } {
    const lowerText = text.toLowerCase()
    const categoryScores: Record<string, number> = {}

    Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      let score = 0

      // Primary keywords have higher weight
      keywords.primary.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          score += 3
        }
      })

      // Secondary keywords have medium weight
      keywords.secondary.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          score += 2
        }
      })

      // Negative keywords reduce score
      keywords.negative.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          score += 1 // Still relevant to category but negative context
        }
      })

      categoryScores[category] = score
    })

    // Find the category with highest score
    const sortedCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)

    if (sortedCategories.length === 0) {
      return { category: "general", confidence: 0.1 }
    }

    const [topCategory, topScore] = sortedCategories[0]
    const totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0)
    const confidence = totalScore > 0 ? topScore / totalScore : 0

    return { category: topCategory, confidence }
  }

  detectSpam(
    text: string,
    metadata: { likeCount: number; authorId: string },
  ): { isSpam: boolean; score: number; reasons: string[] } {
    const lowerText = text.toLowerCase()
    let spamScore = 0
    const reasons: string[] = []

    // Check for promotional content
    SPAM_PATTERNS.promotional.forEach((pattern) => {
      if (lowerText.includes(pattern)) {
        spamScore += 0.3
        reasons.push("promotional_content")
      }
    })

    // Check for monetary schemes
    SPAM_PATTERNS.monetary.forEach((pattern) => {
      if (lowerText.includes(pattern)) {
        spamScore += 0.4
        reasons.push("monetary_scheme")
      }
    })

    // Check for repetitive patterns
    SPAM_PATTERNS.repetitive.forEach((pattern) => {
      if (lowerText.includes(pattern)) {
        spamScore += 0.2
        reasons.push("repetitive_pattern")
      }
    })

    // Check for suspicious content
    SPAM_PATTERNS.suspicious.forEach((pattern) => {
      if (lowerText.includes(pattern)) {
        spamScore += 0.5
        reasons.push("suspicious_content")
      }
    })

    // Length-based detection
    if (text.length < 10) {
      spamScore += 0.2
      reasons.push("too_short")
    }

    // Excessive emoji detection
    const emojiCount = (
      text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []
    ).length
    if (emojiCount > 5) {
      spamScore += 0.3
      reasons.push("excessive_emojis")
    }

    // All caps detection
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
    if (capsRatio > 0.7 && text.length > 10) {
      spamScore += 0.2
      reasons.push("excessive_caps")
    }

    // URL detection
    if (text.match(/https?:\/\/|www\./)) {
      spamScore += 0.3
      reasons.push("contains_url")
    }

    return {
      isSpam: spamScore > 0.5,
      score: Math.min(1, spamScore),
      reasons: [...new Set(reasons)],
    }
  }

  assessQuality(
    text: string,
    metadata: { likeCount: number; publishedAt: string },
  ): { isQuality: boolean; score: number; factors: string[] } {
    let qualityScore = 0
    const factors: string[] = []

    // Length factor
    if (text.length > 50) {
      qualityScore += 0.2
      factors.push("adequate_length")
    }
    if (text.length > 100) {
      qualityScore += 0.1
      factors.push("detailed_content")
    }

    // Engagement factor
    if (metadata.likeCount > 0) {
      qualityScore += 0.3
      factors.push("has_engagement")
    }
    if (metadata.likeCount > 5) {
      qualityScore += 0.2
      factors.push("high_engagement")
    }

    // Quality indicators
    const lowerText = text.toLowerCase()
    QUALITY_INDICATORS.positive.forEach((indicator) => {
      if (lowerText.includes(indicator)) {
        qualityScore += 0.1
        factors.push("quality_indicator")
      }
    })

    // Sentence structure
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    if (sentences.length > 1) {
      qualityScore += 0.1
      factors.push("multiple_sentences")
    }

    // Proper capitalization
    if (text.charAt(0) === text.charAt(0).toUpperCase()) {
      qualityScore += 0.05
      factors.push("proper_capitalization")
    }

    return {
      isQuality: qualityScore > 0.4,
      score: Math.min(1, qualityScore),
      factors: [...new Set(factors)],
    }
  }

  extractKeywords(text: string, category: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !this.stopWords.has(word))

    // Get category-specific keywords
    const categoryKeywords = CATEGORY_KEYWORDS[category]
    const relevantWords = new Set<string>()

    if (categoryKeywords) {
      ;[...categoryKeywords.primary, ...categoryKeywords.secondary].forEach((keyword) => {
        if (text.toLowerCase().includes(keyword)) {
          relevantWords.add(keyword)
        }
      })
    }

    // Add frequent words
    const wordCounts: Record<string, number> = {}
    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })

    const frequentWords = Object.entries(wordCounts)
      .filter(([word, count]) => count > 1 || word.length > 5)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)

    return [...Array.from(relevantWords), ...frequentWords].slice(0, 8)
  }

  calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
    const words = text.split(/\s+/).filter((w) => w.length > 0).length
    const syllables = this.countSyllables(text)

    if (sentences === 0 || words === 0) return 0

    // Flesch Reading Ease Score (simplified)
    const avgWordsPerSentence = words / sentences
    const avgSyllablesPerWord = syllables / words

    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    return Math.max(0, Math.min(100, score)) / 100 // Normalize to 0-1
  }

  private countSyllables(text: string): number {
    return (
      text
        .toLowerCase()
        .replace(/[^a-z]/g, "")
        .replace(/[aeiouy]+/g, "a")
        .replace(/a$/, "").length || 1
    )
  }

  analyzeComment(comment: any): AnalyzedComment {
    const text = comment.textOriginal || ""
    const metadata = {
      likeCount: comment.likeCount || 0,
      publishedAt: comment.publishedAt || "",
      authorId: comment.authorId || "",
    }

    // Run all analysis functions
    const sentimentResult = this.analyzeSentiment(text)
    const categoryResult = this.categorizeComment(text)
    const spamResult = this.detectSpam(text, metadata)
    const qualityResult = this.assessQuality(text, metadata)
    const keywords = this.extractKeywords(text, categoryResult.category)
    const readabilityScore = this.calculateReadability(text)

    // Determine engagement level
    let engagement: "high" | "medium" | "low" = "low"
    if (metadata.likeCount > 10) engagement = "high"
    else if (metadata.likeCount > 2) engagement = "medium"

    // Calculate relevance score
    const relevanceScore = categoryResult.confidence * 0.4 + qualityResult.score * 0.3 + (1 - spamResult.score) * 0.3

    return {
      commentId: comment.commentId,
      textOriginal: text,
      authorId: metadata.authorId,
      likeCount: metadata.likeCount,
      publishedAt: metadata.publishedAt,

      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.score,
      category: categoryResult.category,
      subcategory: categoryResult.subcategory,
      isSpam: spamResult.isSpam,
      spamScore: spamResult.score,
      isQuality: qualityResult.isQuality,
      qualityScore: qualityResult.score,
      relevanceScore,
      keywords,
      entities: [], // Could be enhanced with NER
      emotions: [], // Could be enhanced with emotion detection
      toxicity: 0, // Could be enhanced with toxicity detection
      engagement,
      language: "en", // Could be enhanced with language detection
      readabilityScore,
    }
  }

  analyzeVideo(video: any): AnalyzedVideo {
    const title = video.title || ""
    const description = video.description || ""

    // Analyze title sentiment
    const titleSentimentResult = this.analyzeSentiment(title)
    const descriptionSentimentResult = this.analyzeSentiment(description)

    // Categorize video content
    const categoryResult = this.categorizeComment(title + " " + description)

    // Extract keywords from title and description
    const keywords = this.extractKeywords(title + " " + description, categoryResult.category)

    // Calculate engagement rate (likes / views)
    const engagementRate = video.viewCount > 0 ? (video.likeCount / video.viewCount) * 100 : 0

    // Calculate popularity score based on views, likes, and comments
    const popularityScore = Math.min(
      100,
      (video.viewCount / 10000) * 0.4 + (video.likeCount / 1000) * 0.3 + (video.commentCount / 100) * 0.3,
    )

    // Determine content quality based on engagement and metrics
    let contentQuality: "high" | "medium" | "low" = "low"
    if (engagementRate > 5 && video.commentCount > 50) contentQuality = "high"
    else if (engagementRate > 2 && video.commentCount > 10) contentQuality = "medium"

    return {
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      channelId: video.channelId,
      publishedAt: video.publishedAt,
      viewCount: video.viewCount || 0,
      likeCount: video.likeCount || 0,
      commentCount: video.commentCount || 0,
      contentDuration: video.contentDuration || "",
      topicCategories: video.topicCategories || [],

      titleSentiment: titleSentimentResult.sentiment,
      titleSentimentScore: titleSentimentResult.score,
      descriptionSentiment: descriptionSentimentResult.sentiment,
      descriptionSentimentScore: descriptionSentimentResult.score,
      category: categoryResult.category,
      keywords,
      engagementRate,
      popularityScore,
      contentQuality,
    }
  }

  analyzeCommentWithVideo(comment: any, video?: any): AnalyzedComment {
    const analyzedComment = this.analyzeComment(comment)

    // Add video context if available
    if (video) {
      analyzedComment.videoId = video.videoId
      analyzedComment.videoTitle = video.title
      analyzedComment.videoViewCount = video.viewCount
      analyzedComment.videoLikeCount = video.likeCount
      analyzedComment.videoCommentCount = video.commentCount
      analyzedComment.videoTopicCategories = video.topicCategories
    }

    return analyzedComment
  }

  generateMetrics(analyzedComments: AnalyzedComment[], analyzedVideos?: AnalyzedVideo[]): AnalysisMetrics {
    const total = analyzedComments.length
    if (total === 0) {
      let videoOnlyMetrics = undefined
      if (analyzedVideos && analyzedVideos.length > 0) {
        const totalViews = analyzedVideos.reduce((sum, v) => sum + v.viewCount, 0)
        const totalLikes = analyzedVideos.reduce((sum, v) => sum + v.likeCount, 0)
        const totalFavorites = analyzedVideos.reduce((sum, v) => sum + (v as any).favouriteCount || 0, 0)
        const avgViewCount = totalViews / analyzedVideos.length
        const avgLikeCount = totalLikes / analyzedVideos.length
        const avgFavoriteCount = totalFavorites / analyzedVideos.length
        const avgCommentCount = analyzedVideos.reduce((sum, v) => sum + v.commentCount, 0) / analyzedVideos.length
        const avgEngagementRate = analyzedVideos.reduce((sum, v) => sum + v.engagementRate, 0) / analyzedVideos.length

        const topPerformingVideos = analyzedVideos
          .sort((a, b) => b.engagementRate - a.engagementRate)
          .slice(0, 5)
          .map((v) => ({
            videoId: v.videoId,
            title: v.title,
            engagementRate: v.engagementRate,
          }))

        const categoryPerformance = analyzedVideos.reduce(
          (acc, video) => {
            if (!acc[video.category]) {
              acc[video.category] = { totalViews: 0, totalEngagement: 0, count: 0 }
            }
            acc[video.category].totalViews += video.viewCount
            acc[video.category].totalEngagement += video.engagementRate
            acc[video.category].count += 1
            return acc
          },
          {} as Record<string, { totalViews: number; totalEngagement: number; count: number }>,
        )

        const categoryPerformanceFormatted = Object.entries(categoryPerformance).reduce(
          (acc, [category, data]) => {
            acc[category] = {
              avgViews: data.totalViews / data.count,
              avgEngagement: data.totalEngagement / data.count,
            }
            return acc
          },
          {} as Record<string, { avgViews: number; avgEngagement: number }>,
        )

        videoOnlyMetrics = {
          totalViews,
          totalLikes,
          totalFavorites,
          avgViewCount,
          avgLikeCount,
          avgFavoriteCount,
          avgCommentCount,
          avgEngagementRate,
          topPerformingVideos,
          categoryPerformance: categoryPerformanceFormatted,
        }
      }

      return {
        totalComments: 0,
        totalVideos: analyzedVideos?.length || 0,
        qualityRatio: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        videoMetrics: videoOnlyMetrics,
        categoryDistribution: {},
        spamRatio: 0,
        averageEngagement: 0,
        topKeywords: [],
        engagementTrends: [],
        qualityIndicators: { avgLength: 0, avgLikes: 0, avgReadability: 0 },
      }
    }

    // Calculate distributions
    const sentimentCounts = analyzedComments.reduce(
      (acc, comment) => {
        acc[comment.sentiment]++
        return acc
      },
      { positive: 0, negative: 0, neutral: 0 },
    )

    const categoryDistribution = analyzedComments.reduce(
      (acc, comment) => {
        acc[comment.category] = (acc[comment.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate keyword frequencies
    const keywordCounts: Record<string, { count: number; sentiment: string }> = {}
    analyzedComments.forEach((comment) => {
      comment.keywords.forEach((keyword) => {
        if (!keywordCounts[keyword]) {
          keywordCounts[keyword] = { count: 0, sentiment: comment.sentiment }
        }
        keywordCounts[keyword].count++
      })
    })

    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 20)
      .map(([keyword, data]) => ({ keyword, count: data.count, sentiment: data.sentiment }))

    // Calculate engagement trends by hour
    const hourlyData: Record<number, { comments: number; totalLikes: number }> = {}
    analyzedComments.forEach((comment) => {
      const hour = new Date(comment.publishedAt).getHours()
      if (!hourlyData[hour]) {
        hourlyData[hour] = { comments: 0, totalLikes: 0 }
      }
      hourlyData[hour].comments++
      hourlyData[hour].totalLikes += comment.likeCount
    })

    const engagementTrends = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      comments: hourlyData[hour]?.comments || 0,
      avgLikes: hourlyData[hour] ? hourlyData[hour].totalLikes / hourlyData[hour].comments : 0,
    }))

    let videoMetrics = undefined
    if (analyzedVideos && analyzedVideos.length > 0) {
      const totalViews = analyzedVideos.reduce((sum, v) => sum + v.viewCount, 0)
      const totalLikes = analyzedVideos.reduce((sum, v) => sum + v.likeCount, 0)
      const totalFavorites = analyzedVideos.reduce((sum, v) => sum + (v as any).favouriteCount || 0, 0)
      const avgViewCount = totalViews / analyzedVideos.length
      const avgLikeCount = totalLikes / analyzedVideos.length
      const avgFavoriteCount = totalFavorites / analyzedVideos.length
      const avgCommentCount = analyzedVideos.reduce((sum, v) => sum + v.commentCount, 0) / analyzedVideos.length
      const avgEngagementRate = analyzedVideos.reduce((sum, v) => sum + v.engagementRate, 0) / analyzedVideos.length

      const topPerformingVideos = analyzedVideos
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 5)
        .map((v) => ({
          videoId: v.videoId,
          title: v.title,
          engagementRate: v.engagementRate,
        }))

      const categoryPerformance = analyzedVideos.reduce(
        (acc, video) => {
          if (!acc[video.category]) {
            acc[video.category] = { totalViews: 0, totalEngagement: 0, count: 0 }
          }
          acc[video.category].totalViews += video.viewCount
          acc[video.category].totalEngagement += video.engagementRate
          acc[video.category].count += 1
          return acc
        },
        {} as Record<string, { totalViews: number; totalEngagement: number; count: number }>,
      )

      const categoryPerformanceFormatted = Object.entries(categoryPerformance).reduce(
        (acc, [category, data]) => {
          acc[category] = {
            avgViews: data.totalViews / data.count,
            avgEngagement: data.totalEngagement / data.count,
          }
          return acc
        },
        {} as Record<string, { avgViews: number; avgEngagement: number }>,
      )

      videoMetrics = {
        totalViews,
        totalLikes,
        totalFavorites,
        avgViewCount,
        avgLikeCount,
        avgFavoriteCount,
        avgCommentCount,
        avgEngagementRate,
        topPerformingVideos,
        categoryPerformance: categoryPerformanceFormatted,
      }
    }

    return {
      totalComments: total,
      totalVideos: analyzedVideos?.length || 0,
      qualityRatio: (analyzedComments.filter((c) => c.isQuality).length / total) * 100,
      sentimentDistribution: {
        positive: (sentimentCounts.positive / total) * 100,
        negative: (sentimentCounts.negative / total) * 100,
        neutral: (sentimentCounts.neutral / total) * 100,
      },
      videoMetrics,
      categoryDistribution,
      spamRatio: (analyzedComments.filter((c) => c.isSpam).length / total) * 100,
      averageEngagement: analyzedComments.reduce((sum, c) => sum + c.likeCount, 0) / total,
      topKeywords,
      engagementTrends,
      qualityIndicators: {
        avgLength: analyzedComments.reduce((sum, c) => sum + c.textOriginal.length, 0) / total,
        avgLikes: analyzedComments.reduce((sum, c) => sum + c.likeCount, 0) / total,
        avgReadability: analyzedComments.reduce((sum, c) => sum + c.readabilityScore, 0) / total,
      },
    }
  }

  parseCSV(csvText: string, expectedColumns: string[]): any[] {
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) return []

    // Try different separators to find the best match
    const separators = [",", ";", "|", "\t"]
    let bestSeparator = ","
    let bestScore = 0

    for (const separator of separators) {
      const headerLine = lines[0]
      const parsedHeader = this.parseCSVLine(headerLine, separator)

      // Score based on how many expected columns we find
      const score = expectedColumns.filter((col) =>
        parsedHeader.some((header) => header.toLowerCase().includes(col.toLowerCase())),
      ).length

      if (score > bestScore) {
        bestScore = score
        bestSeparator = separator
      }
    }

    console.log(`[v0] Using separator: "${bestSeparator}" (score: ${bestScore}/${expectedColumns.length})`)

    // Parse header with best separator
    const headers = this.parseCSVLine(lines[0], bestSeparator)
    const data: any[] = []

    // Parse data lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = this.parseCSVLine(line, bestSeparator)
      if (values.length !== headers.length) {
        console.log(`[v0] Skipping malformed line ${i + 1}: expected ${headers.length} columns, got ${values.length}`)
        continue
      }

      const row: any = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || ""
      })
      data.push(row)
    }

    console.log(`[v0] Parsed ${data.length} rows with headers:`, headers)
    return data
  }

  private parseCSVLine(line: string, separator: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === separator && !inQuotes) {
        // Field separator outside quotes
        result.push(current)
        current = ""
        i++
      } else {
        // Regular character
        current += char
        i++
      }
    }

    // Add the last field
    result.push(current)
    return result
  }

  parseComments(csvText: string): any[] {
    const expectedColumns = [
      "commentId",
      "textOriginal",
      "authorId",
      "likeCount",
      "publishedAt",
      "videoId",
      "channelId",
    ]

    const data = this.parseCSV(csvText, expectedColumns)

    const mapped = data.map((row) => ({
      kind: row.kind || "youtube#comment",
      commentId: row.commentId || row.comment_id || "",
      channelId: row.channelId || row.channel_id || "",
      videoId: row.videoId || row.video_id || "",
      authorId: row.authorId || row.author_id || "",
      textOriginal: row.textOriginal || row.text_original || row.text || "",
      parentCommentId: row.parentCommentId || row.parent_comment_id || "",
      likeCount: row.likeCount || row.like_count || "0",
      publishedAt: row.publishedAt || row.published_at || "",
      updatedAt: row.updatedAt || row.updated_at || "",
    }))

    const { cleaned, stats } = this.cleanCommentData(mapped)
    console.log("[v0] Comment data cleaning stats:", stats)
    return cleaned
  }

  parseVideos(csvText: string): any[] {
    const expectedColumns = ["videoId", "title", "description", "viewCount", "likeCount", "commentCount", "channelId"]

    const data = this.parseCSV(csvText, expectedColumns)

    const mapped = data.map((row) => ({
      kind: row.kind || "youtube#video",
      videoId: row.videoId || row.video_id || "",
      publishedAt: row.publishedAt || row.published_at || "",
      channelId: row.channelId || row.channel_id || "",
      title: row.title || "",
      description: row.description || "",
      tags: row.tags || "",
      defaultLanguage: row.defaultLanguage || row.default_language || "en",
      defaultAudioLanguage: row.defaultAudioLanguage || row.default_audio_language || "en",
      contentDuration: row.contentDuration || row.content_duration || "",
      viewCount: row.viewCount || row.view_count || "0",
      likeCount: row.likeCount || row.like_count || "0",
      favouriteCount: row.favouriteCount || row.favourite_count || "0",
      commentCount: row.commentCount || row.comment_count || "0",
      topicCategories: row.topicCategories || "",
    }))

    const { cleaned, stats } = this.cleanVideoData(mapped)
    console.log("[v0] Video data cleaning stats:", stats)
    return cleaned
  }

  cleanCommentData(comments: any[]): { cleaned: any[]; stats: any } {
    const originalCount = comments.length
    let nullVideoIds = 0
    let nullCommentIds = 0
    let nullTexts = 0
    let invalidDates = 0

    const cleaned = comments.filter((comment) => {
      // Track null values
      if (!comment.videoId || comment.videoId.trim() === "") {
        nullVideoIds++
        return false // Remove comments without videoId
      }
      if (!comment.commentId || comment.commentId.trim() === "") {
        nullCommentIds++
        return false // Remove comments without commentId
      }
      if (!comment.textOriginal || comment.textOriginal.trim() === "") {
        nullTexts++
        return false // Remove comments without text
      }

      // Validate and clean dates
      if (comment.publishedAt && !this.isValidDate(comment.publishedAt)) {
        invalidDates++
        comment.publishedAt = "" // Reset invalid dates
      }

      // Clean numeric fields
      comment.likeCount = Math.max(0, Number.parseInt(comment.likeCount) || 0)

      // Clean text fields
      comment.textOriginal = comment.textOriginal.trim()
      comment.authorId = comment.authorId || "unknown"
      comment.channelId = comment.channelId || ""

      return true
    })

    const stats = {
      originalCount,
      cleanedCount: cleaned.length,
      removedCount: originalCount - cleaned.length,
      nullVideoIds,
      nullCommentIds,
      nullTexts,
      invalidDates,
      cleaningRate: (((originalCount - cleaned.length) / originalCount) * 100).toFixed(1),
    }

    return { cleaned, stats }
  }

  cleanVideoData(videos: any[]): { cleaned: any[]; stats: any } {
    const originalCount = videos.length
    let nullVideoIds = 0
    let nullTitles = 0
    let invalidDates = 0
    let invalidMetrics = 0

    const cleaned = videos.filter((video) => {
      // Track null values
      if (!video.videoId || video.videoId.trim() === "") {
        nullVideoIds++
        return false // Remove videos without videoId
      }
      if (!video.title || video.title.trim() === "") {
        nullTitles++
        return false // Remove videos without title
      }

      // Validate and clean dates
      if (video.publishedAt && !this.isValidDate(video.publishedAt)) {
        invalidDates++
        video.publishedAt = ""
      }

      // Clean and validate numeric fields
      const originalViewCount = video.viewCount
      video.viewCount = Math.max(0, Number.parseInt(video.viewCount) || 0)
      video.likeCount = Math.max(0, Number.parseInt(video.likeCount) || 0)
      video.commentCount = Math.max(0, Number.parseInt(video.commentCount) || 0)
      video.favouriteCount = Math.max(0, Number.parseInt(video.favouriteCount) || 0)

      if (originalViewCount && video.viewCount === 0) {
        invalidMetrics++
      }

      // Clean text fields
      video.title = video.title.trim()
      video.description = video.description || ""
      video.channelId = video.channelId || ""
      video.defaultLanguage = video.defaultLanguage || "en"

      // Clean arrays
      if (typeof video.tags === "string") {
        video.tags = video.tags
          .split("|")
          .filter((tag) => tag.trim())
          .map((tag) => tag.trim())
      }
      if (typeof video.topicCategories === "string") {
        video.topicCategories = video.topicCategories
          .split("|")
          .filter((cat) => cat.trim())
          .map((cat) => cat.trim())
      }

      return true
    })

    const stats = {
      originalCount,
      cleanedCount: cleaned.length,
      removedCount: originalCount - cleaned.length,
      nullVideoIds,
      nullTitles,
      invalidDates,
      invalidMetrics,
      cleaningRate: (((originalCount - cleaned.length) / originalCount) * 100).toFixed(1),
    }

    return { cleaned, stats }
  }

  private isValidDate(dateString: string): boolean {
    if (!dateString) return false
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() > 2005
  }
}

// Export singleton instance
export const commentAnalyzer = new CommentAnalyzer()
