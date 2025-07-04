import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { spacing, typography, borderRadius, shadows } from '../../lib/theme';
import { Button } from '../../components/Button';

export default function DebugAuthScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, session, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Auth Debug Screen
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.foreground }]}>
            Authentication Status
          </Text>
          
          <Text style={[styles.label, { color: theme.foreground }]}>
            Loading: {loading ? 'Yes' : 'No'}
          </Text>
          
          <Text style={[styles.label, { color: theme.foreground }]}>
            User: {user ? 'Authenticated' : 'Not authenticated'}
          </Text>
          
          <Text style={[styles.label, { color: theme.foreground }]}>
            Session: {session ? 'Active' : 'None'}
          </Text>
          
          <Text style={[styles.label, { color: theme.foreground }]}>
            Profile: {profile ? 'Loaded' : 'None'}
          </Text>
          
          {user && (
            <>
              <Text style={[styles.label, { color: theme.foreground }]}>
                Email: {user.email}
              </Text>
              <Text style={[styles.label, { color: theme.foreground }]}>
                Provider: {user.app_metadata?.provider || 'email'}
              </Text>
            </>
          )}
          
          {profile && (
            <Text style={[styles.label, { color: theme.foreground }]}>
              Name: {profile.full_name || 'Not set'}
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.foreground }]}>
            CSS Shadow Test
          </Text>
          <Text style={[styles.label, { color: theme.foregroundSecondary }]}>
            This card should have a shadow without CSS errors
          </Text>
        </View>

        <Button
          title="Test Button with Shadow"
          onPress={() => console.log('Button pressed')}
          variant="primary"
          style={styles.testButton}
        />

        {user && (
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="destructive"
            style={styles.signOutButton}
          />
        )}

        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.foreground }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    ...typography['2xl'],
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.card,
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.base,
    fontWeight: '500',
  },
  testButton: {
    marginVertical: spacing.md,
  },
  signOutButton: {
    marginTop: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    ...typography.base,
    fontWeight: '500',
  },
}); 