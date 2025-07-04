import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, fontFamily, shadows, responsiveFontSizes } from '../../lib/theme';
import type { DbCategory } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.8;

interface FeaturedCategoryCardProps {
  category: DbCategory;
  width?: number;
  onPress?: (category: DbCategory) => void;
}

export const FeaturedCategoryCard: React.FC<FeaturedCategoryCardProps> = ({
  category,
  width = cardWidth,
  onPress,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress(category);
    } else {
      router.push(`/category/${category.id}` as any);
    }
  };

  const styles = StyleSheet.create({
    container: {
      width,
      marginRight: spacing.md,
    },
    card: {
      padding: spacing.lg,
      height: 220, // Increased height to accommodate shadow
      justifyContent: 'space-between',
      ...shadows.card, // Ensure shadow is properly applied
    },
    icon: {
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    emoji: {
      fontSize: responsiveFontSizes.emojiSmall + 8, // Slightly larger for featured cards
      lineHeight: responsiveFontSizes.emojiSmall + 16,
      textAlign: 'center',
    },
    title: {
      fontFamily: fontFamily.display,
      fontWeight: '400',
      marginBottom: spacing.xs,
    },
    description: {
      fontFamily: fontFamily.text,
      lineHeight: 20,
      fontSize: 14,
      flex: 1,
      marginBottom: spacing.md,
    },
    footer: {
      marginTop: 'auto',
    },
    exploreButton: {
      fontFamily: fontFamily.mono,
      fontWeight: '500',
      fontSize: 14,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Card style={styles.card} variant="elevated">
        <View style={styles.icon}>
          <Text style={styles.emoji}>{category.emoji || '📚'}</Text>
        </View>
        
        <Text variant="title2" color="inherit" style={styles.title}>
          {category.name}
        </Text>
        
        <Text variant="body" color="secondary" style={styles.description}>
          {category.description || 'Explore civic concepts and democratic principles'}
        </Text>
        
        <View style={styles.footer}>
          <Text variant="callout" color="primary" style={styles.exploreButton}>
            Explore Category →
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}; 