"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  Filter
} from "lucide-react"

// Define types for skill map
interface SkillNode {
  id: string
  name: string
  slug: string
  category: string
  mastery: string
  progress: number
  x?: number
  y?: number
}

interface SkillEdge {
  source: string
  target: string
  required_level: string
  is_strict: boolean
}

interface SkillMapProps {
  userId: string
  selectedCategory?: string
}

export function SkillRelationshipMap({ userId, selectedCategory }: SkillMapProps) {
  const [skills, setSkills] = useState<SkillNode[]>([])
  const [edges, setEdges] = useState<SkillEdge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [showOnlyMastered, setShowOnlyMastered] = useState(false)
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)

  // Load skill map data
  useEffect(() => {
    const loadSkillMap = async () => {
      if (!userId) return
      
      try {
        setIsLoading(true)
        
        // Build the API URL with category filter if provided
        const apiUrl = selectedCategory 
          ? `/api/skills/relationships?category=${encodeURIComponent(selectedCategory)}`
          : '/api/skills/relationships';
        
        // Fetch skill relationships from API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.nodes && data.links) {
          // Position nodes using a simple force-directed layout
          const positionedNodes = positionNodes(data.nodes, data.links);
          
          setSkills(positionedNodes);
          setEdges(data.links);
        } else {
          throw new Error('Invalid relationship data returned');
        }
      } catch (error) {
        console.error('Error loading skill map:', error);
        setError('Failed to load skill relationships');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSkillMap();
  }, [userId, selectedCategory]);
  
  // Simple force-directed layout algorithm
  const positionNodes = (nodes: SkillNode[], edges: SkillEdge[]): SkillNode[] => {
    // This is a simplified version - in a real app, you'd use a proper graph layout library
    const width = 800
    const height = 600
    const nodesCopy = [...nodes]
    
    // Initial random positions
    nodesCopy.forEach(node => {
      node.x = Math.random() * width
      node.y = Math.random() * height
    })
    
    // Create a map for quick lookup
    const nodeMap = new Map<string, SkillNode>()
    nodesCopy.forEach(node => nodeMap.set(node.id, node))
    
    // Simple force-directed layout
    for (let i = 0; i < 100; i++) {
      // Repulsive forces between all nodes
      for (let a = 0; a < nodesCopy.length; a++) {
        for (let b = a + 1; b < nodesCopy.length; b++) {
          const nodeA = nodesCopy[a]
          const nodeB = nodesCopy[b]
          
          if (nodeA.x === undefined || nodeA.y === undefined || 
              nodeB.x === undefined || nodeB.y === undefined) continue
          
          const dx = nodeB.x - nodeA.x
          const dy = nodeB.y - nodeA.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          
          // Repulsive force
          const repulsiveForce = 2000 / (distance * distance)
          
          // Apply force
          const forceX = (dx / distance) * repulsiveForce
          const forceY = (dy / distance) * repulsiveForce
          
          nodeA.x -= forceX
          nodeA.y -= forceY
          nodeB.x += forceX
          nodeB.y += forceY
        }
      }
      
      // Attractive forces along edges
      for (const edge of edges) {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        
        if (!source || !target || 
            source.x === undefined || source.y === undefined || 
            target.x === undefined || target.y === undefined) continue
        
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        
        // Attractive force
        const attractiveForce = distance / 10
        
        // Apply force
        const forceX = (dx / distance) * attractiveForce
        const forceY = (dy / distance) * attractiveForce
        
        source.x += forceX
        source.y += forceY
        target.x -= forceX
        target.y -= forceY
      }
    }
    
    // Normalize positions to fit in canvas
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    nodesCopy.forEach(node => {
      if (node.x === undefined || node.y === undefined) return
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x)
      maxY = Math.max(maxY, node.y)
    })
    
    const padding = 50
    const scaleX = (width - padding * 2) / (maxX - minX || 1)
    const scaleY = (height - padding * 2) / (maxY - minY || 1)
    
    nodesCopy.forEach(node => {
      if (node.x === undefined || node.y === undefined) return
      node.x = padding + (node.x - minX) * scaleX
      node.y = padding + (node.y - minY) * scaleY
    })
    
    return nodesCopy
  }
  
  // Draw the skill map
  useEffect(() => {
    if (!canvasRef.current || skills.length === 0 || edges.length === 0) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Apply zoom
    ctx.save()
    ctx.scale(zoom, zoom)
    
    // Draw edges
    edges.forEach(edge => {
      const source = skills.find(n => n.id === edge.source)
      const target = skills.find(n => n.id === edge.target)
      
      if (!source || !target || 
          source.x === undefined || source.y === undefined || 
          target.x === undefined || target.y === undefined) return
      
      // Skip if filtering
      if (showOnlyMastered && 
          (source.mastery === 'novice' || target.mastery === 'novice')) return
      
      if (showOnlyAvailable) {
        // Only show edges where source is mastered enough for target
        const requiredLevel = edge.required_level
        const sourceLevel = source.mastery
        
        const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
        const sourceIndex = levels.indexOf(sourceLevel)
        const requiredIndex = levels.indexOf(requiredLevel)
        
        if (sourceIndex < requiredIndex) return
      }
      
      // Draw edge
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      
      // Style based on relationship
      if (edge.is_strict) {
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)' // Red for strict requirements
        ctx.lineWidth = 2
      } else {
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)' // Slate for optional
        ctx.lineWidth = 1.5
      }
      
      ctx.stroke()
      
      // Draw arrow
      const angle = Math.atan2(target.y - source.y, target.x - source.x)
      const arrowSize = 8
      
      ctx.beginPath()
      ctx.moveTo(
        target.x - arrowSize * Math.cos(angle) + arrowSize * Math.sin(angle) / 2,
        target.y - arrowSize * Math.sin(angle) - arrowSize * Math.cos(angle) / 2
      )
      ctx.lineTo(target.x, target.y)
      ctx.lineTo(
        target.x - arrowSize * Math.cos(angle) - arrowSize * Math.sin(angle) / 2,
        target.y - arrowSize * Math.sin(angle) + arrowSize * Math.cos(angle) / 2
      )
      
      ctx.fillStyle = edge.is_strict ? 'rgba(220, 38, 38, 0.6)' : 'rgba(100, 116, 139, 0.4)'
      ctx.fill()
    })
    
    // Draw nodes
    skills.forEach(node => {
      if (node.x === undefined || node.y === undefined) return
      
      // Skip if filtering
      if (showOnlyMastered && node.mastery === 'novice') return
      
      // Node size based on mastery
      let nodeSize = 10
      switch (node.mastery) {
        case 'expert': nodeSize = 22; break
        case 'advanced': nodeSize = 18; break
        case 'intermediate': nodeSize = 14; break
        case 'beginner': nodeSize = 12; break
        default: nodeSize = 10
      }
      
      // Node color based on category
      let nodeColor = '#64748b' // Default slate
      switch (node.category) {
        case 'Government': nodeColor = '#3b82f6'; break // Blue
        case 'Elections': nodeColor = '#8b5cf6'; break // Purple
        case 'Media Literacy': nodeColor = '#10b981'; break // Green
        case 'Economy': nodeColor = '#f59e0b'; break // Amber
        case 'Digital Literacy': nodeColor = '#06b6d4'; break // Cyan
        case 'Healthcare Literacy': nodeColor = '#ec4899'; break // Pink
        case 'Financial Literacy': nodeColor = '#84cc16'; break // Lime
        case 'Civil Rights': nodeColor = '#ef4444'; break // Red
      }
      
      // Draw progress ring
      if (node.progress > 0) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeSize + 2, 0, Math.PI * 2 * node.progress / 100)
        ctx.strokeStyle = '#0ea5e9' // Blue
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      // Draw node
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2)
      ctx.fillStyle = nodeColor
      ctx.fill()
      
      // Draw node border
      ctx.strokeStyle = '#f8fafc' // Light border
      ctx.lineWidth = 1.5
      ctx.stroke()
      
      // Node label
      ctx.font = '10px sans-serif'
      ctx.fillStyle = '#f8fafc'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.name.substring(0, 1), node.x, node.y)
      
      // Skill name below
      ctx.font = '9px sans-serif'
      ctx.fillStyle = '#1e293b'
      ctx.fillText(node.name, node.x, node.y + nodeSize + 10)
    })
    
    ctx.restore()
  }, [skills, edges, zoom, showOnlyMastered, showOnlyAvailable])
  
  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-50"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  if (skills.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">No skill relationships found</p>
        </div>
      </div>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Network className="h-5 w-5" />
            Skill Relationships
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlyMastered(!showOnlyMastered)}
              className={showOnlyMastered ? "bg-slate-200 dark:bg-slate-800" : ""}
            >
              <Filter className="h-4 w-4 mr-1" />
              Mastered
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className={showOnlyAvailable ? "bg-slate-200 dark:bg-slate-800" : ""}
            >
              <Filter className="h-4 w-4 mr-1" />
              Available
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            className="w-full h-[500px] bg-white dark:bg-slate-950"
          />
          
          <div className="absolute bottom-2 right-2 flex flex-wrap gap-1">
            {Array.from(new Set(skills.map(s => s.category))).map(category => {
              let color = '#64748b' // Default slate
              switch (category) {
                case 'Government': color = '#3b82f6'; break // Blue
                case 'Elections': color = '#8b5cf6'; break // Purple
                case 'Media Literacy': color = '#10b981'; break // Green
                case 'Economy': color = '#f59e0b'; break // Amber
                case 'Digital Literacy': color = '#06b6d4'; break // Cyan
                case 'Healthcare Literacy': color = '#ec4899'; break // Pink
                case 'Financial Literacy': color = '#84cc16'; break // Lime
                case 'Civil Rights': color = '#ef4444'; break // Red
              }
              
              return (
                <Badge 
                  key={category} 
                  variant="outline" 
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                >
                  <span 
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: color }}
                  />
                  {category}
                </Badge>
              )
            })}
          </div>
        </div>
        
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          <p>Skill nodes show your current mastery level. Larger nodes indicate higher mastery.</p>
          <p className="mt-1">Red arrows indicate strict prerequisites, while gray arrows show recommended learning paths.</p>
        </div>
      </CardContent>
    </Card>
  )
} 