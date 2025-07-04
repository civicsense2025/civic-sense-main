import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../atoms/Text';
import { usePremium } from '../../lib/hooks/usePremium';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { spacing } from '../../lib/theme';

export function DatabaseDebugger() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { debugDatabaseConnection, refreshSubscription } = usePremium();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.foreground }]}>
        🔧 Database Debugger
      </Text>
      
      <Text style={[styles.info, { color: theme.foregroundSecondary }]}>
        User ID: {user?.id || 'Not logged in'}
      </Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={debugDatabaseConnection}
        >
          <Text style={styles.buttonText}>🧪 Test Database</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#F59E0B' }]}
          onPress={refreshSubscription}
        >
          <Text style={styles.buttonText}>🔄 Refresh Subscription</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.note, { color: theme.foregroundSecondary }]}>
        Check console for detailed debug output
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  info: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  note: {
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 