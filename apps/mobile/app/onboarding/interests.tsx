import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing } from '../../lib/theme';
import { getCategories } from '../../lib/database';
import type { DbCategory } from '../../lib/supabase';

export default function OnboardingInterestsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = async () => {
    // Save selected interests to user preferences
    console.log('Selected categories:', selectedCategories);
    router.push('/onboarding/complete' as any);
  };

  const handleSkip = () => {
    router.replace('/(tabs)/' as any);
  };

  const renderCategoryCard = ({ item }: { item: DbCategory }) => {
    const isSelected = selectedCategories.includes(item.id);
    const selectedStyle = isSelected ? {
      borderColor: theme.primary, 
      backgroundColor: `${theme.primary}10` 
    } : {};
    
    return (
      <TouchableOpacity
        style={styles.categoryContainer}
        onPress={() => toggleCategory(item.id)}
        activeOpacity={0.8}
      >
        <Card
          style={[styles.categoryCard, selectedStyle]}
          variant="outlined"
        >
          <View style={styles.categoryContent}>
            <Text style={styles.categoryEmoji}>{item.emoji}</Text>
            <Text variant="callout" color="inherit" style={styles.categoryName}>
              {item.name}
            </Text>
            <Text variant="footnote" color="secondary" style={styles.categoryDescription}>
              {item.description || 'Learn about civic concepts and democratic principles'}
            </Text>
            {isSelected && (
              <View style={[styles.selectedIndicator, { backgroundColor: theme.primary }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Loading topics..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text variant="callout" color="primary">← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text variant="callout" color="secondary">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text variant="title1" color="inherit" style={styles.title}>
              What interests you?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Choose topics you'd like to explore. We'll personalize your learning experience.
            </Text>
          </View>

          <View style={styles.categoriesSection}>
            <FlatList
              data={categories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesGrid}
              columnWrapperStyle={styles.categoryRow}
            />
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Text variant="footnote" color="secondary" style={styles.selectionCount}>
            {selectedCategories.length} topic{selectedCategories.length !== 1 ? 's' : ''} selected
          </Text>
          
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={selectedCategories.length === 0}
            style={[
              styles.continueButton,
              selectedCategories.length === 0 && { opacity: 0.5 }
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  skipButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    lineHeight: 24,
  },
  categoriesSection: {
    paddingHorizontal: spacing.lg,
  },
  categoriesGrid: {
    gap: spacing.md,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryContainer: {
    flex: 0.48,
    marginBottom: spacing.md,
  },
  categoryCard: {
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  categoryContent: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 120,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  categoryName: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 11,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  selectionCount: {
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
  },
}); 