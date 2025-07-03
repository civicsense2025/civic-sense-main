import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStrings } from '../contexts/UIStringsContext';

export function SettingsScreen() {
  const { t, language } = useStrings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.subtitle}>{t('settings.language')}</Text>
      <Text style={styles.text}>{t(`languages.${language}`)}</Text>
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