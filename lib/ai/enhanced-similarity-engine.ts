/**
 * Enhanced Semantic Similarity Engine for Collection Organization
 * 
 * Optimized algorithms with:
 * - Vector embeddings for true semantic similarity
 * - Multi-level caching system
 * - Batch processing for better performance
 * - Content fingerprinting for duplicate detection
 * - Hierarchical clustering for theme detection
 */

import OpenAI from 'openai'

interface ContentItem {
  id: string
  type: 'topic' | 'question' | 'glossary_term' | 'survey'
  title: string
  description: string
  content?: string
  categories: string[]
  metadata?: any
}

interface EmbeddingVector {
  content_id: string
  vector: number[]
  content_hash: string
  created_at: string
  model_version: string
}

interface SimilarityCluster {
  id: string
  centroid: number[]
  items: ContentItem[]
  theme: string
  confidence: number
  coherence_score: number
}

interface SimilarityCache {
  key: string
  similarity_score: number
  computed_at: string
  algorithm_version: string
}

export class EnhancedSimilarityEngine {
  private openai: OpenAI | null = null
  private embeddingCache = new Map<string, number[]>()
  private similarityCache = new Map<string, number>()
  private contentFingerprints = new Map<string, string>()

  // Performance configuration
  private readonly BATCH_SIZE = 50
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private readonly SIMILARITY_THRESHOLD = 0.75
  private readonly MIN_CLUSTER_SIZE = 3
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small' // More cost-effective

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
  }

  /**
   * Enhanced content analysis with optimized similarity calculation
   */
  async analyzeContentSimilarity(
    content: ContentItem[],
    options: {
      useCache?: boolean
      enableClustering?: boolean
      similarityThreshold?: number
      batchSize?: number
    } = {}
  ): Promise<{
    similarity_matrix: number[][]
    clusters: SimilarityCluster[]
    performance_metrics: {
      cache_hits: number
      cache_misses: number
      processing_time_ms: number
      items_processed: number
      clustering_time_ms?: number
    }
  }> {
    const startTime = Date.now()
    let cacheHits = 0
    let cacheMisses = 0

    const {
      useCache = true,
      enableClustering = true,
      similarityThreshold = this.SIMILARITY_THRESHOLD,
      batchSize = this.BATCH_SIZE
    } = options

    console.log(`🔍 Analyzing similarity for ${content.length} items with enhanced algorithms`)

    // Step 1: Generate or retrieve embeddings with batching
    const embeddings = await this.getContentEmbeddings(content, { useCache, batchSize })
    
    // Step 2: Compute similarity matrix with optimized algorithm
    const similarityMatrix: number[][] = []
    
    for (let i = 0; i < content.length; i++) {
      similarityMatrix[i] = []
      
      for (let j = 0; j < content.length; j++) {
        if (i === j) {
          similarityMatrix[i][j] = 1.0
          continue
        }

        // Check cache first
        const cacheKey = `${content[i].id}-${content[j].id}`
        const reverseCacheKey = `${content[j].id}-${content[i].id}`
        
        if (useCache && (this.similarityCache.has(cacheKey) || this.similarityCache.has(reverseCacheKey))) {
          similarityMatrix[i][j] = this.similarityCache.get(cacheKey) || this.similarityCache.get(reverseCacheKey) || 0
          cacheHits++
        } else {
          // Compute enhanced similarity
          const similarity = this.computeEnhancedSimilarity(
            embeddings[i],
            embeddings[j],
            content[i],
            content[j]
          )
          
          similarityMatrix[i][j] = similarity
          
          if (useCache) {
            this.similarityCache.set(cacheKey, similarity)
          }
          cacheMisses++
        }
      }
    }

    let clusters: SimilarityCluster[] = []
    let clusteringTime = 0

    // Step 3: Enhanced clustering if enabled
    if (enableClustering) {
      const clusterStart = Date.now()
      clusters = await this.performHierarchicalClustering(
        content,
        embeddings,
        similarityMatrix,
        similarityThreshold
      )
      clusteringTime = Date.now() - clusterStart
      console.log(`📊 Generated ${clusters.length} clusters in ${clusteringTime}ms`)
    }

    const processingTime = Date.now() - startTime

    return {
      similarity_matrix: similarityMatrix,
      clusters,
      performance_metrics: {
        cache_hits: cacheHits,
        cache_misses: cacheMisses,
        processing_time_ms: processingTime,
        items_processed: content.length,
        clustering_time_ms: enableClustering ? clusteringTime : undefined
      }
    }
  }

  /**
   * Batch processing for embeddings with intelligent caching
   */
  private async getContentEmbeddings(
    content: ContentItem[],
    options: { useCache?: boolean; batchSize?: number }
  ): Promise<number[][]> {
    const { useCache = true, batchSize = this.BATCH_SIZE } = options
    const embeddings: number[][] = []
    const itemsToProcess: { index: number; item: ContentItem; text: string }[] = []

    // Step 1: Check cache and prepare items for processing
    for (let i = 0; i < content.length; i++) {
      const item = content[i]
      const contentText = this.extractContentText(item)
      const contentHash = this.generateContentHash(contentText)
      
      // Update fingerprint
      this.contentFingerprints.set(item.id, contentHash)

      if (useCache && this.embeddingCache.has(item.id)) {
        embeddings[i] = this.embeddingCache.get(item.id)!
      } else {
        itemsToProcess.push({ index: i, item, text: contentText })
      }
    }

    if (itemsToProcess.length === 0) {
      console.log(`✅ All embeddings found in cache`)
      return embeddings
    }

    console.log(`🔄 Computing embeddings for ${itemsToProcess.length} items (${content.length - itemsToProcess.length} from cache)`)

    // Step 2: Process in batches
    if (this.openai) {
      for (let i = 0; i < itemsToProcess.length; i += batchSize) {
        const batch = itemsToProcess.slice(i, i + batchSize)
        const texts = batch.map(item => item.text)

        try {
          const response = await this.openai.embeddings.create({
            model: this.EMBEDDING_MODEL,
            input: texts,
          })

          for (let j = 0; j < batch.length; j++) {
            const embedding = response.data[j].embedding
            const itemIndex = batch[j].index
            
            embeddings[itemIndex] = embedding
            
            if (useCache) {
              this.embeddingCache.set(batch[j].item.id, embedding)
            }
          }

          console.log(`📦 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(itemsToProcess.length / batchSize)}`)
          
        } catch (error) {
          console.error(`❌ Error processing batch starting at ${i}:`, error)
          // Fill with fallback similarity for failed items
          for (let j = 0; j < batch.length; j++) {
            const itemIndex = batch[j].index
            embeddings[itemIndex] = this.generateFallbackEmbedding(batch[j].text)
          }
        }
      }
    } else {
      // Fallback: Use text-based similarity
      console.log(`⚠️ OpenAI not available, using fallback embeddings`)
      for (const item of itemsToProcess) {
        embeddings[item.index] = this.generateFallbackEmbedding(item.text)
      }
    }

    return embeddings
  }

  /**
   * Enhanced similarity computation combining multiple signals
   */
  private computeEnhancedSimilarity(
    embedding1: number[],
    embedding2: number[],
    content1: ContentItem,
    content2: ContentItem
  ): number {
    // 1. Semantic similarity (70% weight)
    const semanticSim = this.cosineSimilarity(embedding1, embedding2)
    
    // 2. Category overlap (20% weight)
    const categorySim = this.calculateCategoryOverlap(content1.categories, content2.categories)
    
    // 3. Content type compatibility (10% weight)
    const typeSim = content1.type === content2.type ? 1.0 : 0.5

    // Combined weighted score
    const combinedScore = (semanticSim * 0.7) + (categorySim * 0.2) + (typeSim * 0.1)
    
    return Math.min(Math.max(combinedScore, 0), 1)
  }

  /**
   * Hierarchical clustering for theme detection
   */
  private async performHierarchicalClustering(
    content: ContentItem[],
    embeddings: number[][],
    similarityMatrix: number[][],
    threshold: number
  ): Promise<SimilarityCluster[]> {
    const clusters: SimilarityCluster[] = []
    const used = new Set<number>()

    // Find high-similarity groups
    for (let i = 0; i < content.length; i++) {
      if (used.has(i)) continue

      const cluster: number[] = [i]
      used.add(i)

      // Find similar items
      for (let j = i + 1; j < content.length; j++) {
        if (used.has(j)) continue
        
        if (similarityMatrix[i][j] >= threshold) {
          cluster.push(j)
          used.add(j)
        }
      }

      // Only create clusters with minimum size
      if (cluster.length >= this.MIN_CLUSTER_SIZE) {
        const clusterItems = cluster.map(idx => content[idx])
        const centroid = this.calculateCentroid(cluster.map(idx => embeddings[idx]))
        const theme = await this.generateClusterTheme(clusterItems)
        const coherence = this.calculateClusterCoherence(cluster, similarityMatrix)

        clusters.push({
          id: `cluster_${clusters.length}`,
          centroid,
          items: clusterItems,
          theme,
          confidence: this.calculateClusterConfidence(cluster, similarityMatrix),
          coherence_score: coherence
        })
      }
    }

    return clusters.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Optimized cosine similarity calculation
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    if (norm1 === 0 || norm2 === 0) return 0
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Category overlap calculation
   */
  private calculateCategoryOverlap(categories1: string[], categories2: string[]): number {
    if (!categories1.length || !categories2.length) return 0
    
    const set1 = new Set(categories1.map(c => c.toLowerCase()))
    const set2 = new Set(categories2.map(c => c.toLowerCase()))
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size // Jaccard similarity
  }

  /**
   * Extract content text for embedding
   */
  private extractContentText(item: ContentItem): string {
    const parts = [
      item.title,
      item.description,
      item.content || '',
      ...(item.categories || [])
    ].filter(Boolean)
    
    return parts.join(' ').substring(0, 8000) // Limit for API
  }

  /**
   * Generate content hash for deduplication
   */
  private generateContentHash(text: string): string {
    // Simple hash function for content fingerprinting
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  /**
   * Fallback embedding generation when API unavailable
   */
  private generateFallbackEmbedding(text: string): number[] {
    // Simple TF-IDF style embedding
    const words = text.toLowerCase().match(/\w+/g) || []
    const vocab = Array.from(new Set(words))
    const embedding = new Array(100).fill(0) // Fixed size vector
    
    // Simple frequency-based encoding
    for (let i = 0; i < Math.min(vocab.length, 100); i++) {
      const word = vocab[i]
      const frequency = words.filter(w => w === word).length
      embedding[i] = frequency / words.length
    }
    
    return embedding
  }

  /**
   * Calculate cluster centroid
   */
  private calculateCentroid(embeddings: number[][]): number[] {
    if (!embeddings.length) return []
    
    const dimensions = embeddings[0].length
    const centroid = new Array(dimensions).fill(0)
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i]
      }
    }
    
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= embeddings.length
    }
    
    return centroid
  }

  /**
   * Generate theme for cluster using AI
   */
  private async generateClusterTheme(items: ContentItem[]): Promise<string> {
    if (!this.openai) {
      // Fallback: Use most common category
      const categories = items.flatMap(item => item.categories)
      const categoryCount = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'General Theme'
    }

    try {
      const titles = items.map(item => item.title).join(', ')
      const prompt = `Analyze these related content titles and generate a concise theme name (2-4 words): ${titles}`
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 0.3
      })
      
      return response.choices[0]?.message?.content?.trim() || 'Generated Theme'
    } catch (error) {
      console.warn('Error generating theme:', error)
      return 'Content Cluster'
    }
  }

  /**
   * Calculate cluster coherence score
   */
  private calculateClusterCoherence(cluster: number[], similarityMatrix: number[][]): number {
    if (cluster.length < 2) return 1.0
    
    let totalSimilarity = 0
    let comparisons = 0
    
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        totalSimilarity += similarityMatrix[cluster[i]][cluster[j]]
        comparisons++
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0
  }

  /**
   * Calculate cluster confidence
   */
  private calculateClusterConfidence(cluster: number[], similarityMatrix: number[][]): number {
    const coherence = this.calculateClusterCoherence(cluster, similarityMatrix)
    const sizeBonus = Math.min(cluster.length / 10, 0.2) // Bonus for larger clusters
    
    return Math.min(coherence + sizeBonus, 1.0)
  }

  /**
   * Clear caches to free memory
   */
  clearCaches(): void {
    this.embeddingCache.clear()
    this.similarityCache.clear()
    this.contentFingerprints.clear()
    console.log('🧹 Similarity engine caches cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    embedding_cache_size: number
    similarity_cache_size: number
    fingerprint_cache_size: number
    memory_usage_estimate: string
  } {
    const embeddingSize = this.embeddingCache.size
    const similaritySize = this.similarityCache.size
    const fingerprintSize = this.contentFingerprints.size
    
    // Rough memory estimate
    const embeddingMemory = embeddingSize * 1536 * 4 // 1536-dim vectors, 4 bytes per float
    const similarityMemory = similaritySize * 8 // 8 bytes per similarity score
    const fingerprintMemory = fingerprintSize * 50 // ~50 bytes per fingerprint
    
    const totalMB = (embeddingMemory + similarityMemory + fingerprintMemory) / (1024 * 1024)
    
    return {
      embedding_cache_size: embeddingSize,
      similarity_cache_size: similaritySize,
      fingerprint_cache_size: fingerprintSize,
      memory_usage_estimate: `${totalMB.toFixed(2)} MB`
    }
  }
} 