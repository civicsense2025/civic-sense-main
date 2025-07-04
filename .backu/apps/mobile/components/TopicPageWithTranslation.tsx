import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PageTranslationControls, type ContentSection } from './audio/PageTranslationControls';

interface TopicData {
  topic_id: string;
  topic_title: string;
  description: string;
  why_this_matters: string;
  emoji: string;
}

interface TopicPageWithTranslationProps {
  topicData: TopicData;
}

export function TopicPageWithTranslation({ topicData }: TopicPageWithTranslationProps) {
  const [isTranslationVisible, setIsTranslationVisible] = useState(false);

  // Prepare content sections for translation
  const contentSections: ContentSection[] = [
    {
      id: 'title',
      label: 'Topic Title',
      content: topicData.topic_title,
      emoji: '📚'
    },
    {
      id: 'description',
      label: 'Description',
      content: topicData.description,
      emoji: '📖'
    },
    {
      id: 'why_this_matters',
      label: 'Why This Matters',
      content: topicData.why_this_matters,
      emoji: '💡'
    }
  ];

  const handleTranslationStart = (language: string) => {
    console.log(`🌍 Starting translation to ${language}`);
  };

  const handleTranslationComplete = (language: string) => {
    console.log(`✅ Translation completed to ${language}`);
  };

  const handleAudioStart = (sectionId: string, language: string) => {
    console.log(`🎵 Playing audio for ${sectionId} in ${language}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.emoji}>{topicData.emoji}</Text>
            <Text style={styles.title}>{topicData.topic_title}</Text>
          </View>
        </View>

        {/* Content sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionContent}>{topicData.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Matters</Text>
          <Text style={styles.sectionContent}>{topicData.why_this_matters}</Text>
        </View>

        {/* Placeholder for quiz/additional content */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Translation Button */}
      <TouchableOpacity
        style={styles.floatingTranslationButton}
        onPress={() => setIsTranslationVisible(true)}
      >
        <Ionicons name="globe-outline" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Translation Controls */}
      <PageTranslationControls
        isVisible={isTranslationVisible}
        onClose={() => setIsTranslationVisible(false)}
        contentSections={contentSections}
        onTranslationStart={handleTranslationStart}
        onTranslationComplete={handleTranslationComplete}
        onAudioStart={handleAudioStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCF9',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF5D9',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B1B',
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E4057',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A4A4A',
  },
  actionSection: {
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#E0A63E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  floatingTranslationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6096BA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
}); 