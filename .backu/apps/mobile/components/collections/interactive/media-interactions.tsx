import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { CompletionCallback } from './types'

export function Timeline({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: any
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.content}>{content}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onComplete(true)}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

export function ImageHotspots({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: any
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Hotspots</Text>
      <Text style={styles.content}>{content}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onComplete(true)}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

export function DragDrop({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: any
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drag & Drop</Text>
      <Text style={styles.content}>{content}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onComplete(true)}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

export function MapInteraction({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: any
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Interaction</Text>
      <Text style={styles.content}>{content}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onComplete(true)}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}) 