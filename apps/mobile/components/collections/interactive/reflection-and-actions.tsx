import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { CompletionCallback } from './types'

export function Reflection({ 
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
      <Text style={styles.title}>Reflection</Text>
      <Text style={styles.content}>{content}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onComplete(true)}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

export function ActionChecklist({ 
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
      <Text style={styles.title}>Action Checklist</Text>
      <Text style={styles.content}>{content}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onComplete(true)}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

export function ContactForm({ 
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
      <Text style={styles.title}>Contact Form</Text>
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