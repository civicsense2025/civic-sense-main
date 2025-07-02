import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FeedbackService } from '../../lib/services';
import { useAuth } from '../../lib/auth-context';
import { useGuestAccess } from '../../lib/hooks/use-guest-access';
import type { FeedbackData } from '../../lib/types/feedback';

interface FeedbackButtonProps {
  style?: any;
  floating?: boolean;
}

export function FeedbackButton({ style, floating = true }: FeedbackButtonProps) {
  const { user } = useAuth();
  const { getOrCreateGuestToken } = useGuestAccess();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('feature');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  const guestToken = !user ? getOrCreateGuestToken() : undefined;

  const resetForm = () => {
    setFeedbackType('feature');
    setSubject('');
    setMessage('');
    if (!user) setEmail('');
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please provide both a subject and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        subject: subject.trim(),
        message: message.trim()
      };

      // Only include optional fields if they have values
      const trimmedEmail = email.trim();
      if (trimmedEmail) {
        feedbackData.email = trimmedEmail;
      }
      if (user?.id) {
        feedbackData.user_id = user.id;
      }
      if (guestToken) {
        feedbackData.guest_token = guestToken;
      }

      const response = await FeedbackService.submitFeedback(feedbackData);

      if (response.success) {
        Alert.alert('Thank You!', response.message || 'Your feedback has been submitted.');
        setIsModalVisible(false);
        resetForm();
      } else {
        Alert.alert('Error', response.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: 'bug-report' },
    { value: 'feature', label: 'Feature Request', icon: 'lightbulb' },
    { value: 'content', label: 'Content Issue', icon: 'article' },
    { value: 'accessibility', label: 'Accessibility', icon: 'accessibility' },
    { value: 'other', label: 'Other', icon: 'help' }
  ] as const;

  return (
    <>
      <TouchableOpacity
        style={[
          floating ? styles.floatingButton : styles.button,
          style
        ]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="feedback" size={24} color="#FFFFFF" />
        {!floating && <Text style={styles.buttonText}>Feedback</Text>}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Feedback Type Selection */}
              <Text style={styles.label}>What's this about?</Text>
              <View style={styles.typeContainer}>
                {feedbackTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      feedbackType === type.value && styles.typeButtonActive
                    ]}
                    onPress={() => setFeedbackType(type.value)}
                  >
                    <MaterialIcons
                      name={type.icon as any}
                      size={20}
                      color={feedbackType === type.value ? '#FFFFFF' : '#666666'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        feedbackType === type.value && styles.typeTextActive
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject Input */}
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your feedback"
                placeholderTextColor="#999999"
                maxLength={100}
              />

              {/* Message Input */}
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Please provide details..."
                placeholderTextColor="#999999"
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />

              {/* Email Input (optional) */}
              {!user && (
                <>
                  <Text style={styles.label}>Email (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    placeholderTextColor="#999999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.helpText}>
                    Provide your email if you'd like us to follow up
                  </Text>
                </>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!subject.trim() || !message.trim() || isSubmitting) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!subject.trim() || !message.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Send Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333'
  },
  closeButton: {
    padding: 4
  },
  formContainer: {
    padding: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
    marginTop: 16
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF'
  },
  typeButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A'
  },
  typeText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6
  },
  typeTextActive: {
    color: '#FFFFFF'
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FAFAFA'
  },
  messageInput: {
    height: 120,
    paddingTop: 12
  },
  helpText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC'
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
}); 