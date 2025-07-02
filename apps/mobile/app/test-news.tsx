import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/atoms/Text';
import { getLatestNews } from '../lib/database';
import { spacing } from '../lib/theme';

export default function TestNewsScreen() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 Test: Loading news...');
      const data = await getLatestNews(5);
      console.log('🧪 Test: Received data:', data);
      setNewsItems(data);
    } catch (err) {
      console.error('🧪 Test: Error loading news:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = () => {
    Alert.alert(
      'News Data',
      `Found ${newsItems.length} news items\n\nFirst item: ${newsItems[0]?.title || 'None'}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text variant="title1" style={styles.title}>
          News Data Test
        </Text>
        
        <Text variant="body" style={styles.status}>
          Status: {loading ? 'Loading...' : error ? `Error: ${error}` : `Found ${newsItems.length} items`}
        </Text>

        {newsItems.length > 0 && (
          <View style={styles.newsContainer}>
            {newsItems.map((item, index) => (
              <View key={item.id || index} style={styles.newsItem}>
                <Text variant="callout" style={styles.newsTitle}>
                  {item.title || 'No title'}
                </Text>
                <Text variant="caption" style={styles.newsDetails}>
                  Domain: {item.domain || 'No domain'}
                </Text>
                <Text variant="caption" style={styles.newsDetails}>
                  Published: {item.published_time || 'No date'}
                </Text>
                <Text variant="caption" style={styles.newsDetails}>
                  Active: {item.is_active ? 'Yes' : 'No'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={loadNews} style={styles.button}>
            <Text variant="body" style={styles.buttonText}>
              Reload News
            </Text>
          </TouchableOpacity>
          {newsItems.length > 0 && (
            <TouchableOpacity onPress={showAlert} style={styles.button}>
              <Text variant="body" style={styles.buttonText}>
                Show Alert
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  status: {
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  newsContainer: {
    marginBottom: spacing.lg,
  },
  newsItem: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  newsTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  newsDetails: {
    marginBottom: spacing.xs,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
  },
  button: {
    padding: spacing.md,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center' as const,
  },
  buttonText: {
    color: '#fff',
  },
}); 