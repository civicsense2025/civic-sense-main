import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, fontFamily, responsiveFontSizes } from '../../lib/theme';
import type { DbCategory } from '../../lib/supabase';

interface CategoryGridCardProps {
  category: DbCategory;
  onPress?: (category: DbCategory) => void;
}

export const CategoryGridCard: React.FC<CategoryGridCardProps> = ({
  category,
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
      width: '100%',
      flex: 1,
    },
    card: {
      padding: spacing.lg,
      minHeight: 140,
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'column',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      width: '100%',
    },
    emoji: {
      fontSize: responsiveFontSizes.emojiSmall,
      marginBottom: spacing.sm,
      lineHeight: responsiveFontSizes.emojiSmall + 8,
      textAlign: 'center',
    },
    title: {
      fontFamily: fontFamily.text,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: spacing.xs,
      fontSize: 15,
      lineHeight: 18,
      flexShrink: 1,
    },
    description: {
      fontFamily: fontFamily.text,
      textAlign: 'center',
      fontSize: 12,
      lineHeight: 16,
      marginTop: spacing.xs,
      flexShrink: 1,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Card style={styles.card} variant="outlined">
        <View style={styles.content}>
          <Text style={styles.emoji}>{category.emoji || '📚'}</Text>
          <Text variant="callout" color="inherit" style={styles.title} numberOfLines={2}>
            {category.name}
          </Text>
          {category.description && (
            <Text variant="footnote" color="secondary" style={styles.description} numberOfLines={3}>
              {category.description}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}; 