import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Text } from '../atoms/Text';
import { useTheme } from '../../lib/theme-context';
import { spacing, fontFamily } from '../../lib/theme';
import type { DbSkills } from '../../lib/database-types';

interface SkillsCardProps {
  skill: DbSkills;
  onPress?: () => void;
  variant?: 'compact' | 'full';
}

export const SkillsCard: React.FC<SkillsCardProps> = ({
  skill,
  onPress,
  variant = 'full'
}) => {
  const { theme } = useTheme();
  
  const getDifficultyColor = (level: number | null) => {
    if (!level) return theme.success; // Default success color
    if (level <= 2) return theme.success; // Easy - Success green
    if (level <= 4) return theme.warning; // Medium - Warning color
    return theme.destructive; // Hard - Destructive red
  };

  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, isCompact && styles.containerCompact]}
    >
      <Card style={styles.cardInner} variant="outlined">
        <View style={styles.header}>
          <Text variant="callout" color="inherit" style={styles.name}>
            {skill.skill_name}
          </Text>
          <View 
            style={[
              styles.difficultyIndicator, 
              { backgroundColor: getDifficultyColor(skill.difficulty_level) }
            ]} 
          />
        </View>
        
        {skill.description && (
          <Text 
            variant="footnote" 
            color="secondary" 
            style={styles.description} 
            numberOfLines={isCompact ? 2 : 3}
          >
            {skill.description}
          </Text>
        )}

        {!isCompact && skill.emoji && (
          <Text style={styles.emoji}>{skill.emoji}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  containerCompact: {
    width: 180,
    marginRight: spacing.md,
  },
  cardInner: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
    flex: 1,
  },
  description: {
    fontFamily: fontFamily.text,
    lineHeight: 16,
  },
  difficultyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  emoji: {
    fontSize: 20,
    marginTop: spacing.sm,
  },
}); 