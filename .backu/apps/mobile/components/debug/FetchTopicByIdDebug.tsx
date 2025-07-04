import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { StandardizedDataService } from '../../lib/standardized-data-service';

export function FetchTopicByIdDebug() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testTopicId, setTestTopicId] = useState('politics');

  const testFetchTopicById = async (topicId: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`🔍 Testing fetchTopicById with topicId: ${topicId}`);
      
      const dataService = new StandardizedDataService();
      const response = await dataService.fetchTopicById(topicId);
      
      console.log('📋 fetchTopicById response:', response);
      
      setResult({
        success: true,
        data: response.data,
        error: response.error,
        metadata: response.metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ fetchTopicById error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testTopics = [
    'politics',
    'civics-comprehensive-test',
    'constitutional-rights',
    'government-basics',
    'elections',
    'american-history'
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FetchTopicById Debug</Text>
      
      <View style={styles.buttonContainer}>
        {testTopics.map((topicId) => (
          <TouchableOpacity
            key={topicId}
            style={[
              styles.button,
              testTopicId === topicId && styles.activeButton
            ]}
            onPress={() => {
              setTestTopicId(topicId);
              testFetchTopicById(topicId);
            }}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{topicId}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <Text style={styles.loading}>Testing fetchTopicById...</Text>
      )}

      {result && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            Result ({result.success ? 'SUCCESS' : 'ERROR'})
          </Text>
          <Text style={styles.resultText}>
            {JSON.stringify(result, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
  },
  activeButton: {
    backgroundColor: '#0056CC',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  loading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    maxHeight: 400,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
}); 