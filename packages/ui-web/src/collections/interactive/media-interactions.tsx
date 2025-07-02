import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { CheckCircle, MapPin, Target } from 'lucide-react'
import type { 
  TimelineConfig, 
  ImageHotspotsConfig, 
  DragDropConfig, 
  MapInteractionConfig,
  CompletionCallback 
} from './types'

// Timeline Component
export function Timeline({ config, onComplete }: { config: TimelineConfig; onComplete: CompletionCallback }) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [viewedEvents, setViewedEvents] = useState<Set<number>>(new Set([0]))

  const handleEventClick = (index: number) => {
    setCurrentEventIndex(index)
    setViewedEvents(prev => new Set([...prev, index]))
    
    if (index === config.events.length - 1) {
      onComplete(true, { viewedEvents: viewedEvents.size + 1 })
    }
  }

  const currentEvent = config.events[currentEventIndex]
  const progress = ((currentEventIndex + 1) / config.events.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>📅 Interactive Timeline</CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {config.events.map((event, index) => (
            <button
              key={index}
              onClick={() => handleEventClick(index)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                index === currentEventIndex 
                  ? 'bg-blue-600 text-white' 
                  : viewedEvents.has(index)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {event.date}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <Badge variant="outline">{currentEvent.date}</Badge>
          <h3 className="text-xl font-semibold my-3">{currentEvent.actor}: {currentEvent.action}</h3>
          <p className="text-gray-700">{currentEvent.result}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Image Hotspots Component
export function ImageHotspots({ config, onComplete }: { config: ImageHotspotsConfig; onComplete: CompletionCallback }) {
  const [clickedHotspots, setClickedHotspots] = useState<Set<number>>(new Set())
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null)

  const handleHotspotClick = (index: number) => {
    setClickedHotspots(prev => new Set([...prev, index]))
    setSelectedHotspot(index)
    
    if (clickedHotspots.size + 1 === config.hotspots.length) {
      onComplete(true, { clickedHotspots: clickedHotspots.size + 1 })
    }
  }

  const progress = (clickedHotspots.size / config.hotspots.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle><Target className="h-5 w-5 inline mr-2" />Explore the Image</CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent>
        <div className="relative mb-6">
          <img src={config.image_url} alt="Interactive image" className="w-full rounded-lg" />
          
          {config.hotspots.map((hotspot, index) => (
            <button
              key={index}
              onClick={() => handleHotspotClick(index)}
              className={`absolute w-8 h-8 rounded-full border-2 transition-all ${
                clickedHotspots.has(index)
                  ? 'bg-green-500 border-green-600 text-white'
                  : 'bg-blue-500 border-blue-600 text-white animate-pulse'
              }`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {clickedHotspots.has(index) ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </button>
          ))}
        </div>

        {selectedHotspot !== null && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              {config.hotspots[selectedHotspot].title}
            </h4>
            <p className="text-blue-800">{config.hotspots[selectedHotspot].description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Drag and Drop Component
export function DragDrop({ config, onComplete }: { config: DragDropConfig; onComplete: CompletionCallback }) {
  const [items, setItems] = useState(config.items)
  const [targets, setTargets] = useState<Record<string, string[]>>(
    Object.fromEntries(config.targets.map(target => [target.id, []]))
  )

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    const target = config.targets.find(t => t.id === targetId)
    
    if (target && target.accepts.includes(itemId)) {
      setTargets(prev => ({
        ...prev,
        [targetId]: [...prev[targetId], itemId]
      }))

      setItems(prev => prev.filter(item => item.id !== itemId))

      const totalPlaced = Object.values(targets).reduce((sum, target) => sum + target.length, 0) + 1
      if (totalPlaced === config.items.length) {
        onComplete(true, { completed: true })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚡ Drag and Drop</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <h4 className="font-medium mb-3">Available Items</h4>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg cursor-move hover:bg-blue-200"
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {config.targets.map((target) => (
            <div
              key={target.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, target.id)}
              className={`min-h-[100px] p-4 border-2 border-dashed rounded-lg ${
                targets[target.id].length > 0 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <h4 className="font-medium mb-2">{target.label}</h4>
              <div className="flex flex-wrap gap-2">
                {targets[target.id].map((itemId) => {
                  const item = config.items.find(i => i.id === itemId)
                  return (
                    <div key={itemId} className="px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                      {item?.text}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Map Interaction Component
export function MapInteraction({ config, onComplete }: { config: MapInteractionConfig; onComplete: CompletionCallback }) {
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())

  const handleRegionClick = (region: string) => {
    setSelectedRegions(prev => new Set([...prev, region]))
    
    if (selectedRegions.size + 1 === config.interactions.length) {
      onComplete(true, { selectedRegions: selectedRegions.size + 1 })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><MapPin className="h-5 w-5 inline mr-2" />Interactive Map</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {config.interactions.map((interaction, index) => (
            <button
              key={interaction.region}
              onClick={() => handleRegionClick(interaction.region)}
              className={`w-full p-4 text-left rounded-lg transition-colors ${
                selectedRegions.has(interaction.region)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedRegions.has(interaction.region) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <MapPin className="h-5 w-5" />
                )}
                <div>
                  <h4 className="font-medium">{interaction.region}</h4>
                  <p className="text-sm mt-1">{interaction.popup_content}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 