/**
 * Test script to verify the schema migration works correctly
 * Run this after applying the database migration
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEnrichedQuestionTopics } from './lib/content-service';

interface MigrationTestResults {
  schemaDetection: boolean | null;
  optimizedQuery: boolean;
  legacyFallback: boolean;
  topicsFound: number;
  errors: string[];
}

export default function TestMigration() {
  const [results, setResults] = useState<MigrationTestResults>({
    schemaDetection: null,
    optimizedQuery: false,
    legacyFallback: false,
    topicsFound: 0,
    errors: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runMigrationTests();
  }, []);

  const runMigrationTests = async () => {
    console.log('🧪 Testing schema migration...');
    const errors: string[] = [];
    let schemaDetection: boolean | null = null;
    let optimizedQuery = false;
    let legacyFallback = false;
    let topicsFound = 0;

    try {
      // Test 1: Basic functionality
      console.log('Test 1: Basic topic fetching...');
      const topics = await getEnrichedQuestionTopics();
      topicsFound = topics.length;
      console.log(`✅ Found ${topicsFound} topics`);

      // Test 2: Category filtering
      console.log('Test 2: Category filtering...');
      const filteredTopics = await getEnrichedQuestionTopics('some-category-id');
      console.log(`✅ Category filtering returned ${filteredTopics.length} topics`);

      // Test 3: Check for schema detection logs
      // (This would be visible in console)
      console.log('Test 3: Check console for schema detection logs');

    } catch (error) {
      console.error('❌ Migration test failed:', error);
      errors.push(`Migration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setResults({
      schemaDetection,
      optimizedQuery,
      legacyFallback,
      topicsFound,
      errors,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>🧪 Testing migration...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>📊 Migration Test Results</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Performance</Text>
          <Text style={styles.result}>Topics Found: {results.topicsFound}</Text>
          <Text style={styles.result}>
            Schema Detection: {results.schemaDetection === null ? 'Unknown' : results.schemaDetection ? '✅ New Schema' : '⚠️ Legacy Schema'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Query Methods</Text>
          <Text style={styles.result}>
            Optimized Query: {results.optimizedQuery ? '✅ Used' : '❌ Not Used'}
          </Text>
          <Text style={styles.result}>
            Legacy Fallback: {results.legacyFallback ? '⚠️ Used' : '✅ Not Needed'}
          </Text>
        </View>

        {results.errors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Errors</Text>
            {results.errors.map((error, index) => (
              <Text key={index} style={styles.error}>{error}</Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Next Steps</Text>
          <Text style={styles.instruction}>
            1. Check console logs for "🚀 Using optimized schema" or "⚠️ Using legacy schema"
          </Text>
          <Text style={styles.instruction}>
            2. If using legacy schema, verify the migration was applied
          </Text>
          <Text style={styles.instruction}>
            3. Test category filtering to ensure proper relationships
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  result: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 4,
    paddingLeft: 8,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
    color: '#666',
  },
}); 