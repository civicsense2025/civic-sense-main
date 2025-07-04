/**
 * Test page for Instagram Story Share V2 Component
 * Demonstrates integration with the dynamic image generation system
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { InstagramStoryShareV2 } from '@/components/ui/InstagramStoryShareV2';

// Test data
const testTopic = {
  id: 'const-rights',
  title: 'Constitutional Rights',
  description: 'Understanding your fundamental protections and how power structures can limit them',
  emoji: '🏛️',
  category: 'Government',
  difficulty: 'medium' as const,
};

const testUserProgress = {
  score: 85,
  totalQuestions: 12,
  streak: 7,
  timeSpent: 240,
  completedAt: new Date(),
};

const testAchievement = {
  title: 'Civic Champion',
  description: 'Completed 10 quizzes with 80% or higher',
  badge: '🏆',
  unlockedAt: new Date(),
};

export default function TestStoryShareScreen() {
  const [selectedType, setSelectedType] = useState<'topic' | 'result' | 'streak' | 'achievement'>('topic');
  const [userId] = useState('test-user-123');
  const [userName] = useState('Test User');

  const handleShareComplete = (result: { success: boolean; method?: string; error?: string }) => {
    if (result.success) {
      Alert.alert('Success', `Shared via ${result.method || 'platform'}`);
    } else {
      console.error('Share failed:', result.error);
    }
  };

  const renderShareComponent = () => {
    const commonProps = {
      userId,
      userName,
      onShareStart: () => console.log('Share started'),
      onShareComplete: handleShareComplete,
      onError: (error: string) => console.error('Share error:', error),
    };

    switch (selectedType) {
      case 'topic':
        return (
          <InstagramStoryShareV2
            type="topic"
            topic={testTopic}
            {...commonProps}
          />
        );
      case 'result':
        return (
          <InstagramStoryShareV2
            type="result"
            topic={testTopic}
            userProgress={testUserProgress}
            {...commonProps}
          />
        );
      case 'streak':
        return (
          <InstagramStoryShareV2
            type="streak"
            streakCount={7}
            {...commonProps}
          />
        );
      case 'achievement':
        return (
          <InstagramStoryShareV2
            type="achievement"
            achievement={testAchievement}
            {...commonProps}
          />
        );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test Story Share',
          headerStyle: { backgroundColor: '#1E3A8A' },
          headerTintColor: '#fff',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Instagram Story Share Test</Text>
            <Text style={styles.subtitle}>
              Test the dynamic image generation system
            </Text>
          </View>

          {/* Type Selector */}
          <View style={styles.typeSelector}>
            <Text style={styles.sectionTitle}>Select Share Type:</Text>
            <View style={styles.typeButtons}>
              {(['topic', 'result', 'streak', 'achievement'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Test Data Display */}
          <View style={styles.testDataSection}>
            <Text style={styles.sectionTitle}>Test Data:</Text>
            <View style={styles.testDataBox}>
              {selectedType === 'topic' && (
                <>
                  <Text style={styles.dataLabel}>Topic: {testTopic.title}</Text>
                  <Text style={styles.dataValue}>{testTopic.description}</Text>
                  <Text style={styles.dataLabel}>Category: {testTopic.category}</Text>
                  <Text style={styles.dataLabel}>Difficulty: {testTopic.difficulty}</Text>
                </>
              )}
              {selectedType === 'result' && (
                <>
                  <Text style={styles.dataLabel}>Quiz: {testTopic.title}</Text>
                  <Text style={styles.dataLabel}>Score: {testUserProgress.score}%</Text>
                  <Text style={styles.dataLabel}>Questions: {testUserProgress.totalQuestions}</Text>
                  <Text style={styles.dataLabel}>Streak: {testUserProgress.streak} days</Text>
                </>
              )}
              {selectedType === 'streak' && (
                <>
                  <Text style={styles.dataLabel}>Current Streak: 7 days 🔥</Text>
                  <Text style={styles.dataValue}>
                    Keep up the great work on your civic education journey!
                  </Text>
                </>
              )}
              {selectedType === 'achievement' && (
                <>
                  <Text style={styles.dataLabel}>Achievement: {testAchievement.title}</Text>
                  <Text style={styles.dataValue}>{testAchievement.description}</Text>
                  <Text style={styles.dataLabel}>Badge: {testAchievement.badge}</Text>
                </>
              )}
            </View>
          </View>

          {/* Share Component */}
          <View style={styles.shareSection}>
            <Text style={styles.sectionTitle}>Share Component:</Text>
            {renderShareComponent()}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How it Works:</Text>
            <Text style={styles.infoText}>
              1. Select a share type above{'\n'}
              2. The component generates a branded image using the API{'\n'}
              3. Click "Share to Stories" to share via platform share sheet{'\n'}
              4. Click "Save to Photos" to download the image locally{'\n'}
              5. Images are optimized for Instagram Stories (1080x1920)
            </Text>
          </View>

          {/* API Info */}
          <View style={styles.apiSection}>
            <Text style={styles.infoTitle}>API Endpoints:</Text>
            <Text style={styles.codeText}>
              GET /api/generate-image{'\n'}
              POST /api/image-analytics
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    backgroundColor: '#1E3A8A',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  typeSelector: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1E3A8A',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0A63E',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#E0A63E',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0A63E',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  testDataSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testDataBox: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  shareSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  apiSection: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  codeText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#666',
    marginTop: 8,
  },
}); 