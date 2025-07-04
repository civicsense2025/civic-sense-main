import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Animated,
  PanResponder,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { spacing, borderRadius, typography } from '../../lib/theme';
import { BookmarkService } from '../../lib/services/bookmark-service';

// ============================================================================
// INTERFACES
// ============================================================================

interface HighlightableTextProps {
  children: string;
  sourceId: string;
  sourceTitle: string;
  sourceType?: string;
  paragraphIndex?: number;
  onSnippetSaved?: (snippet: any) => void;
  style?: any;
  testID?: string;
}

interface SelectionData {
  text: string;
  start: number;
  end: number;
  isVisible: boolean;
}

// ============================================================================
// HIGHLIGHTABLE TEXT COMPONENT
// ============================================================================

export const HighlightableText: React.FC<HighlightableTextProps> = ({
  children,
  sourceId,
  sourceTitle,
  sourceType = 'content',
  paragraphIndex = 0,
  onSnippetSaved,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [selection, setSelection] = useState<SelectionData>({
    text: '',
    start: 0,
    end: 0,
    isVisible: false,
  });
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FEF08A'); // Default yellow

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Selection state
  const selectionRef = useRef<SelectionData | null>(null);

  const handleTextSelection = useCallback((event: any) => {
    const { selectionStart, selectionEnd } = event.nativeEvent.selection || {};
    
    if (selectionStart !== undefined && selectionEnd !== undefined && selectionStart !== selectionEnd) {
      const selectedText = children.substring(selectionStart, selectionEnd);
      
      const newSelection = {
        text: selectedText,
        start: selectionStart,
        end: selectionEnd,
        isVisible: true,
      };
      
      setSelection(newSelection);
      selectionRef.current = newSelection;
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate([10]);
      }
      
      // Show highlight animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      hideSelection();
    }
  }, [children]);

  const hideSelection = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelection(prev => ({ ...prev, isVisible: false }));
      selectionRef.current = null;
    });
  }, []);

  const handleSaveSnippet = useCallback(async () => {
    if (!user || !selectionRef.current) return;

    setSaving(true);
    
    try {
             const trimmedNotes = userNotes.trim();
       const snippetData: any = {
         snippetText: selectionRef.current.text,
         sourceId,
         sourceType,
         sourceTitle,
         sourceUrl: `/content/${sourceId}`,
         selectionStart: selectionRef.current.start,
         selectionEnd: selectionRef.current.end,
         paragraphIndex,
         fullContext: children,
         highlightColor,
         tags: ['highlight'],
       };
       
       if (trimmedNotes) {
         snippetData.userNotes = trimmedNotes;
       }
       
       const { snippet, error } = await BookmarkService.createSnippet(user.id, snippetData);

      if (error) throw error;

      if (snippet && onSnippetSaved) {
        onSnippetSaved(snippet);
      }

      setShowSnippetModal(false);
      setUserNotes('');
      hideSelection();
      
      Alert.alert('✨ Snippet Saved', 'Your highlight has been saved to your bookmarks!');
    } catch (error) {
      console.error('Error saving snippet:', error);
      Alert.alert('Error', 'Failed to save snippet. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, sourceId, sourceTitle, sourceType, paragraphIndex, children, highlightColor, userNotes, onSnippetSaved]);

  const renderHighlightedText = () => {
    if (!selection.isVisible || !selectionRef.current) {
      return (
        <Text style={[styles.text, { color: theme.foreground }, style]} testID={testID}>
          {children}
        </Text>
      );
    }

    const { start, end } = selectionRef.current;
    const beforeText = children.substring(0, start);
    const selectedText = children.substring(start, end);
    const afterText = children.substring(end);

    return (
      <Text style={[styles.text, { color: theme.foreground }, style]} testID={testID}>
        {beforeText}
        <Text style={[styles.highlightedText, { backgroundColor: highlightColor + '80' }]}>
          {selectedText}
        </Text>
        {afterText}
      </Text>
    );
  };

  const colorOptions = [
    { color: '#FEF08A', name: 'Yellow' },
    { color: '#BBF7D0', name: 'Green' },
    { color: '#BFDBFE', name: 'Blue' },
    { color: '#F3E8FF', name: 'Purple' },
    { color: '#FED7AA', name: 'Orange' },
    { color: '#FECACA', name: 'Red' },
  ];

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.hiddenInput, { color: 'transparent' }]}
        value={children}
        multiline
        editable
        selection={selection.isVisible ? { start: selection.start, end: selection.end } : undefined}
        onSelectionChange={handleTextSelection}
        selectionColor={highlightColor + '60'}
        testID={`${testID}-input`}
      />
      
      <View style={styles.textOverlay} pointerEvents="none">
        {renderHighlightedText()}
      </View>

      {/* Selection Toolbar */}
      {selection.isVisible && (
        <Animated.View
          style={[
            styles.selectionToolbar,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowSnippetModal(true)}
            disabled={!user}
          >
            <Ionicons name="bookmark" size={16} color="#FFFFFF" />
            <Text style={styles.toolbarButtonText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: theme.foregroundSecondary }]}
            onPress={hideSelection}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Snippet Modal */}
      <Modal
        visible={showSnippetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSnippetModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowSnippetModal(false)}>
              <Text style={[styles.modalButton, { color: theme.foregroundSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.foreground }]}>
              Save Snippet
            </Text>
            <TouchableOpacity onPress={handleSaveSnippet} disabled={saving}>
              <Text style={[styles.modalButton, { color: theme.primary }]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Selected Text Preview */}
            <View style={[styles.previewContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.previewLabel, { color: theme.foregroundSecondary }]}>
                Selected Text
              </Text>
              <Text style={[styles.previewText, { color: theme.foreground, backgroundColor: highlightColor + '40' }]}>
                "{selection.text}"
              </Text>
            </View>

            {/* Highlight Color Picker */}
            <View style={styles.colorSection}>
              <Text style={[styles.sectionLabel, { color: theme.foreground }]}>
                Highlight Color
              </Text>
              <View style={styles.colorOptions}>
                {colorOptions.map((option) => (
                  <TouchableOpacity
                    key={option.color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: option.color },
                      highlightColor === option.color && styles.selectedColor,
                    ]}
                    onPress={() => setHighlightColor(option.color)}
                    activeOpacity={0.7}
                  >
                    {highlightColor === option.color && (
                      <Ionicons name="checkmark" size={16} color="#000000" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.notesSection}>
              <Text style={[styles.sectionLabel, { color: theme.foreground }]}>
                Add Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.foreground,
                  },
                ]}
                value={userNotes}
                onChangeText={setUserNotes}
                placeholder="Why is this important to you?"
                placeholderTextColor={theme.foregroundSecondary}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.characterCount, { color: theme.foregroundSecondary }]}>
                {userNotes.length}/500
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
    margin: 0,
  },
  textOverlay: {
    position: 'relative',
    zIndex: 1,
  },
  text: {
    ...typography.body,
    lineHeight: 24,
  },
  highlightedText: {
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  selectionToolbar: {
    position: 'absolute',
    top: -50,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  toolbarButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalButton: {
    ...typography.callout,
    fontWeight: '500',
  },
  modalTitle: {
    ...typography.title3,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  previewContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  previewLabel: {
    ...typography.caption,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  previewText: {
    ...typography.body,
    fontStyle: 'italic',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  sectionLabel: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  colorSection: {
    marginTop: spacing.sm,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000000',
  },
  notesSection: {
    marginTop: spacing.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    minHeight: 80,
  },
  characterCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
}); 