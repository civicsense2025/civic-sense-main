import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

interface CollectionData {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  visibility: 'private' | 'public' | 'unlisted';
  status: string;
  question_count: number;
  created_at: string;
}

interface ShareData {
  id: string;
  share_code: string;
  share_type: 'link' | 'email' | 'social';
  allow_remix: boolean;
  allow_download: boolean;
  expires_at: string | null;
  shared_by: string;
  created_at: string;
}

interface CollaboratorData {
  id: string;
  user_id: string;
  role: 'editor' | 'viewer' | 'admin';
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  user_profile?: {
    display_name?: string;
    username?: string;
    email?: string;
  };
}

export default function ShareCollectionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  
  // State
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [shares, setShares] = useState<ShareData[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  
  // Settings
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted'>('private');
  const [allowRemix, setAllowRemix] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);

  useEffect(() => {
    if (collectionId && user?.id) {
      loadCollectionData();
    }
  }, [collectionId, user?.id]);

  const loadCollectionData = async () => {
    try {
      setLoading(true);

      // Load collection
      const { data: collectionData, error: collectionError } = await supabase
        .from('custom_content_collections')
        .select('*')
        .eq('id', collectionId)
        .eq('owner_id', user!.id)
        .single();

      if (collectionError) throw collectionError;
      
      setCollection(collectionData);
      setVisibility(collectionData.visibility);

      // Load existing shares
      const { data: sharesData, error: sharesError } = await supabase
        .from('collection_shares')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('shared_by', user!.id);

      if (sharesData) {
        setShares(sharesData);
        if (sharesData.length > 0) {
          setAllowRemix(sharesData[0].allow_remix);
          setAllowDownload(sharesData[0].allow_download);
        }
      }

      // Load collaborators
      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from('collection_collaborators')
        .select(`
          *,
          user_profile:profiles(display_name, username, email)
        `)
        .eq('collection_id', collectionId);

      if (collaboratorsData) {
        setCollaborators(collaboratorsData);
      }

    } catch (error) {
      console.error('Error loading collection data:', error);
      Alert.alert('Error', 'Failed to load collection data. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (newVisibility: 'private' | 'public' | 'unlisted') => {
    try {
      const { error } = await supabase
        .from('custom_content_collections')
        .update({ visibility: newVisibility })
        .eq('id', collectionId)
        .eq('owner_id', user!.id);

      if (error) throw error;

      setVisibility(newVisibility);
      
      // Track analytics
      await supabase
        .from('collection_analytics_events')
        .insert({
          collection_id: collectionId,
          user_id: user?.id,
          event_type: 'visibility_change',
          event_data: { from: visibility, to: newVisibility },
        });

    } catch (error) {
      console.error('Error updating visibility:', error);
      Alert.alert('Error', 'Failed to update visibility. Please try again.');
    }
  };

  const createShareLink = async () => {
    try {
      setCreating(true);

      const { data: shareData, error } = await supabase
        .from('collection_shares')
        .insert({
          collection_id: collectionId,
          shared_by: user!.id,
          share_type: 'link',
          allow_remix: allowRemix,
          allow_download: allowDownload,
        })
        .select('*')
        .single();

      if (error) throw error;

      setShares(prev => [...prev, shareData]);

      // Generate share URL
      const shareUrl = `https://civicsense.com/quiz/${shareData.share_code}`;
      
      await Share.share({
        message: `🧠 Check out this custom CivicSense quiz: "${collection?.title}"\n\n${shareUrl}\n\nGenerated with CivicSense Pro - AI-powered civic education that reveals how power actually works.`,
        title: `Share: ${collection?.title}`,
        url: shareUrl,
      });

      // Track share analytics
      await supabase
        .from('collection_analytics_events')
        .insert({
          collection_id: collectionId,
          user_id: user?.id,
          event_type: 'share_created',
          event_data: { share_type: 'link', allow_remix: allowRemix, allow_download: allowDownload },
        });

    } catch (error) {
      console.error('Error creating share link:', error);
      Alert.alert('Error', 'Failed to create share link. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Email Required', 'Please enter an email address to invite.');
      return;
    }

    try {
      setCreating(true);

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', inviteEmail.trim())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!userData) {
        Alert.alert(
          'User Not Found',
          'This email address is not associated with a CivicSense account. Invite them to join first!'
        );
        return;
      }

      // Create collaboration invitation
      const { error: inviteError } = await supabase
        .from('collection_collaborators')
        .insert({
          collection_id: collectionId,
          user_id: userData.id,
          role: inviteRole,
          invited_by: user!.id,
          status: 'pending',
        });

      if (inviteError) {
        if (inviteError.code === '23505') {
          Alert.alert('Already Invited', 'This user is already a collaborator on this collection.');
        } else {
          throw inviteError;
        }
        return;
      }

      // Track analytics
      await supabase
        .from('collection_analytics_events')
        .insert({
          collection_id: collectionId,
          user_id: user?.id,
          event_type: 'collaborator_invited',
          event_data: { invited_user: userData.id, role: inviteRole },
        });

      setInviteEmail('');
      await loadCollectionData(); // Refresh collaborators list

      Alert.alert('Invitation Sent', 'Collaboration invitation has been sent successfully.');

    } catch (error) {
      console.error('Error inviting collaborator:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const copyShareLink = async (shareCode: string) => {
    const shareUrl = `https://civicsense.com/quiz/${shareCode}`;
    
    try {
      await Share.share({
        message: shareUrl,
        title: 'Quiz Share Link',
      });
    } catch (error) {
      // Fallback for devices that don't support share
      Alert.alert(
        'Share Link',
        shareUrl,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => Linking.openURL(shareUrl) },
        ]
      );
    }
  };

  const removeShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('collection_shares')
        .delete()
        .eq('id', shareId)
        .eq('shared_by', user!.id);

      if (error) throw error;

      setShares(prev => prev.filter(share => share.id !== shareId));
      
      Alert.alert('Share Removed', 'Share link has been revoked.');
    } catch (error) {
      console.error('Error removing share:', error);
      Alert.alert('Error', 'Failed to remove share. Please try again.');
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from('collection_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      setCollaborators(prev => prev.filter(collab => collab.id !== collaboratorId));
      
      Alert.alert('Collaborator Removed', 'Collaborator access has been revoked.');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      Alert.alert('Error', 'Failed to remove collaborator. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Share Collection', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading sharing settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Share Collection', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.foreground }]}>
            Collection not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Share & Collaborate',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]} numberOfLines={2}>
            {collection.title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.foregroundSecondary }]}>
            {collection.question_count} questions • {visibility} collection
          </Text>
        </View>

        {/* Visibility Settings */}
        <Card style={styles.sectionCard} variant="outlined">
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            🔒 Privacy Settings
          </Text>
          
          <View style={styles.visibilityOptions}>
            {([
              { key: 'private', label: 'Private', desc: 'Only you and collaborators can access', icon: 'lock-closed' },
              { key: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link can access', icon: 'link' },
              { key: 'public', label: 'Public', desc: 'Discoverable by anyone in the community', icon: 'globe' },
            ] as const).map(({ key, label, desc, icon }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.visibilityOption,
                  {
                    backgroundColor: visibility === key ? theme.primary + '10' : theme.card,
                    borderColor: visibility === key ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => handleVisibilityChange(key)}
              >
                <Ionicons
                  name={icon as any}
                  size={20}
                  color={visibility === key ? theme.primary : theme.foregroundSecondary}
                />
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    { color: visibility === key ? theme.primary : theme.foreground }
                  ]}>
                    {label}
                  </Text>
                  <Text style={[styles.optionDesc, { color: theme.foregroundSecondary }]}>
                    {desc}
                  </Text>
                </View>
                {visibility === key && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Share Settings */}
        <Card style={styles.sectionCard} variant="outlined">
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            🔗 Share Settings
          </Text>
          
          {/* Permission Toggles */}
          <View style={styles.permissionToggles}>
            <View style={styles.permissionToggle}>
              <View style={styles.permissionLeft}>
                <Text style={[styles.permissionLabel, { color: theme.foreground }]}>
                  Allow Remixing
                </Text>
                <Text style={[styles.permissionDesc, { color: theme.foregroundSecondary }]}>
                  Let others create variations of your quiz
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: allowRemix ? theme.primary : theme.border }
                ]}
                onPress={() => setAllowRemix(!allowRemix)}
              >
                <View style={[
                  styles.toggleKnob,
                  { transform: [{ translateX: allowRemix ? 16 : 0 }] }
                ]} />
              </TouchableOpacity>
            </View>

            <View style={styles.permissionToggle}>
              <View style={styles.permissionLeft}>
                <Text style={[styles.permissionLabel, { color: theme.foreground }]}>
                  Allow Downloads
                </Text>
                <Text style={[styles.permissionDesc, { color: theme.foregroundSecondary }]}>
                  Let others download quiz content
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: allowDownload ? theme.primary : theme.border }
                ]}
                onPress={() => setAllowDownload(!allowDownload)}
              >
                <View style={[
                  styles.toggleKnob,
                  { transform: [{ translateX: allowDownload ? 16 : 0 }] }
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Share Link */}
          <TouchableOpacity
            style={[styles.createShareButton, { backgroundColor: theme.primary }]}
            onPress={createShareLink}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.createShareButtonText}>Create Share Link</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Existing Shares */}
          {shares.length > 0 && (
            <View style={styles.existingShares}>
              <Text style={[styles.subsectionTitle, { color: theme.foreground }]}>
                Active Share Links
              </Text>
              {shares.map(share => (
                <View key={share.id} style={[styles.shareItem, { backgroundColor: theme.card }]}>
                  <View style={styles.shareInfo}>
                    <Text style={[styles.shareCode, { color: theme.foreground }]}>
                      civicsense.com/quiz/{share.share_code}
                    </Text>
                    <Text style={[styles.shareDate, { color: theme.foregroundSecondary }]}>
                      Created {new Date(share.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.shareActions}>
                    <TouchableOpacity
                      style={styles.shareAction}
                      onPress={() => copyShareLink(share.share_code)}
                    >
                      <Ionicons name="copy" size={16} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shareAction}
                      onPress={() => removeShare(share.id)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Collaboration */}
        <Card style={styles.sectionCard} variant="outlined">
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            👥 Collaborators
          </Text>
          
          {/* Invite Form */}
          <View style={styles.inviteForm}>
            <Text style={[styles.subsectionTitle, { color: theme.foreground }]}>
              Invite Collaborator
            </Text>
            
            <View style={[styles.inviteRow, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.emailInput, { color: theme.foreground }]}
                placeholder="Enter email address"
                placeholderTextColor={theme.foregroundSecondary}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View style={styles.roleSelector}>
                {(['viewer', 'editor'] as const).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor: inviteRole === role ? theme.primary : theme.card,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => setInviteRole(role)}
                  >
                    <Text style={[
                      styles.roleText,
                      { color: inviteRole === role ? '#FFFFFF' : theme.foreground }
                    ]}>
                      {role === 'viewer' ? '👁️ View' : '✏️ Edit'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.inviteButton, { backgroundColor: theme.primary }]}
              onPress={inviteCollaborator}
              disabled={creating || !inviteEmail.trim()}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.inviteButtonText}>Send Invitation</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Existing Collaborators */}
          {collaborators.length > 0 && (
            <View style={styles.collaboratorsList}>
              <Text style={[styles.subsectionTitle, { color: theme.foreground }]}>
                Current Collaborators
              </Text>
              {collaborators.map(collaborator => (
                <View key={collaborator.id} style={[styles.collaboratorItem, { backgroundColor: theme.card }]}>
                  <View style={styles.collaboratorInfo}>
                    <Text style={[styles.collaboratorName, { color: theme.foreground }]}>
                      {collaborator.user_profile?.display_name || collaborator.user_profile?.username || 'Anonymous'}
                    </Text>
                    <View style={styles.collaboratorMeta}>
                      <Text style={[styles.collaboratorRole, { color: theme.primary }]}>
                        {collaborator.role === 'viewer' ? '👁️ Viewer' : '✏️ Editor'}
                      </Text>
                      <Text style={[styles.collaboratorStatus, { color: theme.foregroundSecondary }]}>
                        {collaborator.status}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeCollaborator}
                    onPress={() => removeCollaborator(collaborator.id)}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.title3,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.title2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.footnote,
    textAlign: 'center',
  },

  // Sections
  sectionCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.title3,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  subsectionTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Visibility
  visibilityOptions: {
    gap: spacing.sm,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionDesc: {
    ...typography.footnote,
    lineHeight: 16,
  },

  // Permissions
  permissionToggles: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  permissionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionLeft: {
    flex: 1,
  },
  permissionLabel: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  permissionDesc: {
    ...typography.footnote,
    lineHeight: 16,
  },
  toggleSwitch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 2,
  },

  // Share Actions
  createShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  createShareButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  existingShares: {
    gap: spacing.sm,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
  },
  shareInfo: {
    flex: 1,
  },
  shareCode: {
    ...typography.footnote,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  shareDate: {
    ...typography.caption1,
  },
  shareActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  shareAction: {
    padding: spacing.sm,
  },

  // Collaboration
  inviteForm: {
    marginBottom: spacing.lg,
  },
  inviteRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleText: {
    ...typography.footnote,
    fontWeight: '600',
  },
  inviteButton: {
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Collaborators List
  collaboratorsList: {
    gap: spacing.sm,
  },
  collaboratorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  collaboratorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  collaboratorRole: {
    ...typography.caption1,
    fontWeight: '600',
  },
  collaboratorStatus: {
    ...typography.caption1,
  },
  removeCollaborator: {
    padding: spacing.sm,
  },
}); 