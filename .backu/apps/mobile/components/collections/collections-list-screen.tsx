import React, { useState } from 'react'
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  Pressable, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet 
} from 'react-native'
import { useCollections, useFeaturedCollections } from '@/hooks/useCollections'
import { Collection, CollectionFilters } from '@/types/collections'
import { formatMobileEstimatedTime, getDifficultyInfo } from '@/types/collections'

interface CollectionCardProps {
  collection: Collection
  onPress: (collection: Collection) => void
}

function CollectionCard({ collection, onPress }: CollectionCardProps) {
  const difficultyInfo = getDifficultyInfo(collection.difficulty_level)
  
  return (
    <Pressable 
      style={styles.card}
      onPress={() => onPress(collection)}
      android_ripple={{ color: '#e0e7ff' }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{collection.emoji}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.difficulty}>{difficultyInfo.label}</Text>
          <Text style={styles.time}>
            {formatMobileEstimatedTime(collection.estimated_minutes)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.title}>{collection.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {collection.description}
      </Text>
      
      {collection.progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${collection.progress.progress_percentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(collection.progress.progress_percentage)}% complete
          </Text>
        </View>
      )}
      
      <View style={styles.tags}>
        {collection.categories.slice(0, 2).map((category, index) => (
          <Text key={index} style={styles.tag}>
            {category}
          </Text>
        ))}
      </View>
    </Pressable>
  )
}

interface CollectionsListScreenProps {
  onCollectionPress?: (collection: Collection) => void
}

export default function CollectionsListScreen({ 
  onCollectionPress 
}: CollectionsListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<CollectionFilters>({})
  
  // Use featured collections for initial load
  const {
    collections: featuredCollections,
    loading: featuredLoading,
    error: featuredError,
    refetch: refetchFeatured
  } = useFeaturedCollections()
  
  // Use main collections hook for search/filtering
  const {
    collections,
    loading,
    error,
    total,
    refetch,
    searchCollections,
    loadMore
  } = useCollections(activeFilters)
  
  const [isSearchMode, setIsSearchMode] = useState(false)
  
  const displayedCollections = isSearchMode ? collections : featuredCollections
  const displayedLoading = isSearchMode ? loading : featuredLoading
  const displayedError = isSearchMode ? error : featuredError
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim()) {
      setIsSearchMode(true)
      try {
        await searchCollections(query)
      } catch (error) {
        Alert.alert('Search Error', 'Failed to search collections. Please try again.')
      }
    } else {
      setIsSearchMode(false)
    }
  }
  
  const handleFilterChange = (filters: CollectionFilters) => {
    setActiveFilters(filters)
    setIsSearchMode(true)
  }
  
  const handleCollectionPress = (collection: Collection) => {
    if (onCollectionPress) {
      onCollectionPress(collection)
    } else {
      // Default navigation behavior
      Alert.alert(
        collection.title,
        `Start learning about ${collection.title}?\n\nEstimated time: ${formatMobileEstimatedTime(collection.estimated_minutes)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Learning', onPress: () => console.log('Navigate to collection:', collection.slug) }
        ]
      )
    }
  }
  
  const handleRefresh = async () => {
    try {
      if (isSearchMode) {
        await refetch()
      } else {
        await refetchFeatured()
      }
    } catch (error) {
      Alert.alert('Refresh Error', 'Failed to refresh collections. Please try again.')
    }
  }
  
  const renderEmptyState = () => {
    if (displayedLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading collections...</Text>
        </View>
      )
    }
    
    if (displayedError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ {displayedError}</Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )
    }
    
    if (isSearchMode && searchQuery) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            No collections found for "{searchQuery}"
          </Text>
          <Text style={styles.emptySubtext}>
            Try different keywords or browse featured collections
          </Text>
        </View>
      )
    }
    
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No collections available</Text>
      </View>
    )
  }
  
  const renderDifficultyFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Difficulty:</Text>
      <View style={styles.filterButtons}>
        {[1, 2, 3, 4, 5].map((level) => {
          const info = getDifficultyInfo(level as 1 | 2 | 3 | 4 | 5)
          const isActive = activeFilters.difficulty_level?.includes(level)
          
          return (
            <Pressable
              key={level}
              style={[styles.filterButton, isActive && styles.filterButtonActive]}
              onPress={() => {
                const currentLevels = activeFilters.difficulty_level || []
                const newLevels = isActive
                  ? currentLevels.filter(l => l !== level)
                  : [...currentLevels, level]
                
                handleFilterChange({
                  ...activeFilters,
                  difficulty_level: newLevels.length > 0 ? newLevels : undefined
                })
              }}
            >
              <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                {info.icon} {info.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search civic lessons..."
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>
      
      {renderDifficultyFilter()}
      
      {isSearchMode && (
        <View style={styles.searchInfo}>
          <Text style={styles.searchResults}>
            {loading ? 'Searching...' : `${collections.length} collections found`}
          </Text>
          <Pressable 
            onPress={() => {
              setIsSearchMode(false)
              setSearchQuery('')
              setActiveFilters({})
            }}
          >
            <Text style={styles.clearSearch}>Clear search</Text>
          </Pressable>
        </View>
      )}
      
      <FlatList
        data={displayedCollections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CollectionCard
            collection={item}
            onPress={handleCollectionPress}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={displayedLoading}
            onRefresh={handleRefresh}
            colors={['#4f46e5']}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  searchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  searchResults: {
    fontSize: 14,
    color: '#475569',
  },
  clearSearch: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  difficulty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  time: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#475569',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
}) 