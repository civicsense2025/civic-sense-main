import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { getCivicSkills } from '../../lib/content-service';
import type { DbSkills } from '../../lib/database-types';
import { Text } from '../../components/atoms/Text';
import { SkillsCard } from '../../components/ui/SkillsCard';
import { spacing, fontFamily } from '../../lib/theme';

export default function SkillsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [skills, setSkills] = useState<DbSkills[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const skillsData = await getCivicSkills();
      setSkills(skillsData);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillPress = (skillId: string) => {
    router.push(`/skill/${skillId}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading skills...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text variant="title" color="inherit" style={styles.title}>
            Civic Skills
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Master the skills needed for effective civic engagement
          </Text>
        </View>

        <View style={styles.skillsGrid}>
          {skills.map((skill) => (
            <View key={skill.id} style={styles.skillCard}>
              <SkillsCard
                skill={skill}
                onPress={() => handleSkillPress(skill.id)}
                variant="full"
              />
            </View>
          ))}
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: fontFamily.text,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.text,
    opacity: 0.7,
  },
  skillsGrid: {
    padding: spacing.lg,
  },
  skillCard: {
    marginBottom: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
}); 