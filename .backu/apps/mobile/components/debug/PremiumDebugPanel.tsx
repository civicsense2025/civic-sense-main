import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { usePremium } from '../../lib/hooks/usePremium';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { spacing, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface PremiumDebugPanelProps {
  minimized?: boolean;
}

export function PremiumDebugPanel({ minimized = false }: PremiumDebugPanelProps) {
  const { user } = useAuth();
  const { 
    isPremium, 
    hasGenerationAccess, 
    isLoading,
    subscription,
    isActive,
    isPro,
    daysUntilExpiry,
  } = usePremium();
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(!minimized);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={[styles.minimizedContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setIsExpanded(true)}
      >
        <Ionicons name="bug" size={16} color={theme.foregroundSecondary} />
        <Text style={[styles.minimizedText, { color: theme.foregroundSecondary }]}>
          Debug
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(false)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="bug" size={16} color={theme.primary} />
          <Text style={[styles.title, { color: theme.foreground }]}>
            Debug Panel
          </Text>
        </View>
        <Ionicons name="chevron-up" size={16} color={theme.foregroundSecondary} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          User ID: {user?.id || 'Not logged in'}
        </Text>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Loading: {isLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Has Subscription: {subscription ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Tier: {subscription?.subscription_tier || 'None'}
        </Text>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Status: {subscription?.subscription_status || 'Unknown'}
        </Text>
        {subscription && (
          <>
            <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
              Billing Cycle: {subscription.billing_cycle || 'Unknown'}
            </Text>
            {subscription.subscription_end_date && (
              <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
                Expires: {new Date(subscription.subscription_end_date).toLocaleDateString()}
                {daysUntilExpiry && ` (${daysUntilExpiry} days)`}
              </Text>
            )}
          </>
        )}
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Premium: {isPremium ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Generation Access: {hasGenerationAccess ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Is Active: {isActive ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
          Is Pro: {isPro ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  minimizedContainer: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.footnote,
    fontWeight: '600',
  },
  minimizedText: {
    ...typography.caption1,
    fontWeight: '600',
    fontSize: 10,
  },
  content: {
    padding: spacing.sm,
    paddingTop: 0,
    gap: spacing.xs,
  },
  label: {
    ...typography.caption1,
    fontSize: 10,
  },
}); 