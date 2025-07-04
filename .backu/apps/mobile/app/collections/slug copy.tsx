import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { spacing, borderRadius, typography, fontFamily } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { BookmarkService } from '../../lib/services/bookmark-service';

interface CollectionItem {
  id: string;
  type: 'bookmark' | 'snippet';
  title: string;
  description?: string;
  url?: string;
  snippet_text?: string;
  highlight_color?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  source_type?: string;
  image_url?: string;
  emoji?: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function CollectionDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('📁 CollectionDetailScreen mounted with params:', { slug, userId: user?.id });
    if (slug && user?.id) {
      loadCollection();
    }
  }, [slug, user?.id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      
      // Load collection details
      const { data: collectionData, error: collectionError } = await supabase
        .from('bookmark_collections')
        .select('*')
        .eq('id', slug)
        .eq('user_id', user?.id)
        .single();

      if (collectionError) throw collectionError;

      if (collectionData) {
        setCollection(collectionData);
        
        // Load collection items
        await loadCollectionItems(collectionData.id);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      Alert.alert('Error', 'Failed to load collection');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionItems = async (collectionId: string) => {
    try {
      // Load bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Load snippets
      const { data: snippets, error: snippetsError } = await supabase
        .from('bookmark_snippets')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookmarksError) console.error('Error loading bookmarks:', bookmarksError);
      if (snippetsError) console.error('Error loading snippets:', snippetsError);

      // Combine and format items
      const allItems: CollectionItem[] = [
        ...(bookmarks || []).map(bookmark => ({
          id: `bookmark-${bookmark.id}`,
          type: 'bookmark' as const,
          title: bookmark.title || 'Untitled Bookmark',
          description: bookmark.description,
          url: bookmark.url,
          notes: bookmark.notes,
          tags: bookmark.tags,
          created_at: bookmark.created_at,
          source_type: bookmark.source_type,
          image_url: bookmark.image_url,
          emoji: bookmark.emoji,
        })),
        ...(snippets || []).map(snippet => ({
          id: `snippet-${snippet.id}`,
          type: 'snippet' as const,
          title: snippet.title || 'Highlighted Text',
          description: snippet.context,
          url: snippet.source_url,
          snippet_text: snippet.snippet_text,
          highlight_color: snippet.highlight_color,
          notes: snippet.notes,
          created_at: snippet.created_at,
          source_type: snippet.source_type,
        }))
      ];

      // Sort by creation date
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setItems(allItems);
    } catch (error) {
      console.error('Error loading collection items:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (collection) {
      await loadCollectionItems(collection.id);
    }
    setRefreshing(false);
  }, [collection]);

  const handleEditCollection = () => {
    Alert.alert(
      'Edit Collection',
      'What would you like to do with this collection?',
      [
        {
          text: 'Edit Details',
          onPress: () => {
            // TODO: Navigate to collection editor
            Alert.alert('Coming Soon', 'Collection editing functionality will be available soon!');
          }
        },
        {
          text: 'Manage Items',
          onPress: () => {
            // TODO: Navigate to item manager
            Alert.alert('Coming Soon', 'Item management functionality will be available soon!');
          }
        },
        {
          text: collection?.is_public ? 'Make Private' : 'Make Public',
          onPress: () => {
            handleTogglePrivacy();
          }
        },
        {
          text: 'Delete Collection',
          style: 'destructive',
          onPress: () => {
            handleDeleteCollection();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleTogglePrivacy = async () => {
    if (!collection) return;

    const newPrivacy = !collection.is_public;
    
    Alert.alert(
      `Make Collection ${newPrivacy ? 'Public' : 'Private'}?`,
      `Are you sure you want to make this collection ${newPrivacy ? 'public' : 'private'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newPrivacy ? 'Make Public' : 'Make Private',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookmark_collections')
                .update({ 
                  is_public: newPrivacy,
                  updated_at: new Date().toISOString()
                })
                .eq('id', slug)
                .eq('user_id', user?.id);

              if (error) throw error;

              setCollection(prev => prev ? { ...prev, is_public: newPrivacy } : null);
              
              Alert.alert(
                'Success',
                `Collection is now ${newPrivacy ? 'public' : 'private'}!`
              );
            } catch (error) {
              console.error('Error updating collection privacy:', error);
              Alert.alert('Error', 'Failed to update collection privacy. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;

    Alert.alert(
      'Delete Collection',
      `Are you sure you want to permanently delete "${collection.name}"? This will remove the collection but keep all your bookmarks and snippets.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookmark_collections')
                .delete()
                .eq('id', slug)
                .eq('user_id', user?.id);

              if (error) throw error;

              Alert.alert(
                'Collection Deleted',
                'Your collection has been deleted. All items are still saved in your library.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.back();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Failed to delete collection. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleItemPress = (item: CollectionItem) => {
    if (item.url) {
      // Navigate to content view with the URL
      router.push({
        pathname: '/saved/[itemId]',
        params: {
          itemId: item.id,
          itemType: item.type,
          itemTitle: item.title,
        },
      } as any);
    }
  };

  const handleRemoveItem = (item: CollectionItem) => {
    Alert.alert(
      'Remove from Collection',
      `Remove "${item.title}" from this collection? The item will still be saved in your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const itemId = item.id.startsWith('bookmark-') 
                ? item.id.substring(9) 
                : item.id.substring(8);
              
              const table = item.type === 'bookmark' ? 'bookmarks' : 'bookmark_snippets';
              
              const { error } = await supabase
                .from(table)
                .update({ collection_id: null })
                .eq('id', itemId)
                .eq('user_id', user?.id);

              if (error) throw error;

              // Remove from local state
              setItems(prev => prev.filter(i => i.id !== item.id));
              
            } catch (error) {
              console.error('Error removing item from collection:', error);
              Alert.alert('Error', 'Failed to remove item. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: CollectionItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        {/* Item icon/visual */}
        <View style={styles.itemIcon}>
          {item.emoji ? (
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
          ) : (
            <View style={[styles.itemIconContainer, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons 
                name={item.type === 'snippet' ? 'text-outline' : 'bookmark-outline'} 
                size={20} 
                color={theme.primary} 
              />
            </View>
          )}
        </View>

        {/* Item content */}
        <View style={styles.itemText}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, { color: theme.foreground }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item)}
                style={styles.removeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color={theme.foregroundSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Type indicator */}
          <View style={styles.itemMeta}>
            <View style={[styles.typeBadge, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.typeText, { color: theme.primary }]}>
                {item.type === 'snippet' ? 'HIGHLIGHT' : 'BOOKMARK'}
              </Text>
            </View>
            <Text style={[styles.itemDate, { color: theme.foregroundSecondary }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Description or snippet text */}
          {(item.description || item.snippet_text) && (
            <Text style={[styles.itemDescription, { color: theme.foregroundSecondary }]} numberOfLines={2}>
              {item.snippet_text || item.description}
            </Text>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: theme.primary + '10' }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>#{tag}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={[styles.moreTagsText, { color: theme.foregroundSecondary }]}>
                  +{item.tags.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'Loading...',
            headerShown: true,
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.foreground,
            headerTitleStyle: { 
              color: theme.foreground,
              fontFamily: fontFamily.display,
              fontWeight: '600',
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ paddingLeft: 8, paddingRight: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={{ fontSize: 24, color: theme.primary, fontWeight: '600' }}>‹</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading collection...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen 
          options={{
            title: 'Collection Not Found',
            headerShown: true,
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.foreground,
            headerTitleStyle: { 
              color: theme.foreground,
              fontFamily: fontFamily.display,
              fontWeight: '600',
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ paddingLeft: 8, paddingRight: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={{ fontSize: 24, color: theme.primary, fontWeight: '600' }}>‹</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.foreground }]}>
            Collection not found
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: collection.name.length > 20 ? collection.name.substring(0, 20) + '...' : collection.name,
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerTitleStyle: { 
            color: theme.foreground,
            fontFamily: fontFamily.display,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 8, paddingRight: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={{ fontSize: 24, color: theme.primary, fontWeight: '600' }}>‹</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleEditCollection}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel="Edit collection"
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <Card style={[styles.headerCard, { backgroundColor: theme.card }]}>
            <View style={styles.collectionHeader}>
              <View style={styles.collectionIcon}>
                {collection.emoji ? (
                  <Text style={styles.collectionEmoji}>{collection.emoji}</Text>
                ) : (
                  <View style={[styles.defaultIcon, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="folder" size={32} color={theme.primary} />
                  </View>
                )}
              </View>
              
              <View style={styles.collectionInfo}>
                <Text style={[styles.collectionName, { color: theme.foreground }]}>
                  {collection.name}
                </Text>
                
                <View style={styles.collectionMeta}>
                  <View style={[
                    styles.privacyBadge, 
                    { backgroundColor: collection.is_public ? '#10B981' : theme.primary }
                  ]}>
                    <Ionicons 
                      name={collection.is_public ? 'globe-outline' : 'lock-closed-outline'} 
                      size={12} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.privacyText}>
                      {collection.is_public ? 'PUBLIC' : 'PRIVATE'}
                    </Text>
                  </View>
                  
                  <Text style={[styles.itemCount, { color: theme.foregroundSecondary }]}>
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {collection.description && (
                  <Text style={[styles.collectionDescription, { color: theme.foregroundSecondary }]}>
                    {collection.description}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.border }]}>
              <Ionicons name="folder-open-outline" size={32} color={theme.foregroundSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              No Items in Collection
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.foregroundSecondary }]}>
              Add bookmarks and highlights to this collection to organize your content.
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    fontFamily: fontFamily.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.mono,
  },
  editButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  listContainer: {
    flexGrow: 1,
    paddingTop: spacing.md,
  },

  // Header Card
  headerCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  collectionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  defaultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    ...typography.title1,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
  },
  collectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    gap: spacing.xs,
  },
  privacyText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.mono,
  },
  itemCount: {
    ...typography.footnote,
    fontFamily: fontFamily.mono,
  },
  collectionDescription: {
    ...typography.body,
    fontFamily: fontFamily.text,
    lineHeight: typography.body.lineHeight * 1.4,
  },

  // Item Card
  itemCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  itemIcon: {
    marginRight: spacing.md,
  },
  itemEmoji: {
    fontSize: 24,
    lineHeight: 32,
  },
  itemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  itemTitle: {
    ...typography.callout,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    padding: spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  typeText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  itemDate: {
    ...typography.caption1,
    fontSize: 11,
    fontFamily: fontFamily.mono,
  },
  itemDescription: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    lineHeight: typography.footnote.lineHeight * 1.3,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },
  moreTagsText: {
    ...typography.caption1,
    fontSize: 10,
    fontFamily: fontFamily.text,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.title2,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight * 1.4,
  },
}); 