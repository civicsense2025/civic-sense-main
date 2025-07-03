import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStrings } from '../contexts/UIStringsContext';

export function TopicsScreen() {
  const { t } = useStrings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('topic.loading')}</Text>
      <Text style={styles.subtitle}>{t('topic.loadingDetails')}</Text>
      <Text style={styles.text}>{t('topic.whyThisMatters')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#666',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
}); 