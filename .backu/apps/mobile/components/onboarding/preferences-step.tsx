import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useUIStrings from '../../lib/hooks/useUIStrings'

interface PreferencesStepProps {
  onNext: (data: any) => void
  onBack?: () => void
  data?: any
  userId: string
}

type LocationInputType = 'state' | 'city' | 'zipcode'

export function PreferencesStep({ onNext, data }: PreferencesStepProps) {
  const { uiStrings } = useUIStrings()
  const [preferences, setPreferences] = useState({
    learningStyle: data?.learningStyle || 'mixed',
    difficulty: data?.difficulty || 'adaptive',
    reminders: data?.reminders || true,
    location: data?.location || '',
    locationInputType: (data?.locationInputType || 'city') as LocationInputType,
  })

  const handleContinue = () => {
    // Validate location if provided
    if (preferences.location.trim()) {
      const { location, locationInputType } = preferences
      const trimmedLocation = location.trim()
      
      // Basic validation based on input type
      if (locationInputType === 'zipcode') {
        const zipRegex = /^\d{5}(-\d{4})?$/
        if (!zipRegex.test(trimmedLocation)) {
          Alert.alert(
            uiStrings.onboarding.invalidZipCode,
            uiStrings.onboarding.invalidZipCodeDesc,
            [{ text: uiStrings.actions.ok }]
          )
          return
        }
      } else if (locationInputType === 'state') {
        if (trimmedLocation.length < 2) {
          Alert.alert(
            uiStrings.onboarding.invalidState,
            uiStrings.onboarding.invalidStateDesc,
            [{ text: uiStrings.actions.ok }]
          )
          return
        }
      } else if (locationInputType === 'city') {
        if (trimmedLocation.length < 2) {
          Alert.alert(
            uiStrings.onboarding.invalidCity,
            uiStrings.onboarding.invalidCityDesc,
            [{ text: uiStrings.actions.ok }]
          )
          return
        }
      }
    }

    onNext(preferences)
  }

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const setLocationInputType = (type: LocationInputType) => {
    setPreferences(prev => ({ 
      ...prev, 
      locationInputType: type,
      location: '' // Clear location when changing type
    }))
  }

  const getLocationPlaceholder = () => {
    switch (preferences.locationInputType) {
      case 'state':
        return uiStrings.onboarding.statePlaceholder
      case 'city':
        return uiStrings.onboarding.cityPlaceholder
      case 'zipcode':
        return uiStrings.onboarding.zipCodePlaceholder
      default:
        return uiStrings.onboarding.cityPlaceholder
    }
  }

  const getLocationDescription = () => {
    switch (preferences.locationInputType) {
      case 'state':
        return uiStrings.onboarding.stateLocationDesc
      case 'city':
        return uiStrings.onboarding.cityLocationDesc
      case 'zipcode':
        return uiStrings.onboarding.zipCodeLocationDesc
      default:
        return uiStrings.onboarding.cityLocationDesc
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{uiStrings.onboarding.personalizeExperience}</Text>
          <Text style={styles.subtitle}>
            {uiStrings.onboarding.personalizeExperienceDesc}
          </Text>
        </View>

        {/* Learning Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{uiStrings.onboarding.learningStyle}</Text>
          <Text style={styles.sectionDescription}>
            {uiStrings.onboarding.learningStyleDesc}
          </Text>
          {[
            { key: 'visual', label: uiStrings.onboarding.visual, icon: 'image-outline', desc: uiStrings.onboarding.visualDesc },
            { key: 'reading', label: uiStrings.onboarding.reading, icon: 'book-outline', desc: uiStrings.onboarding.readingDesc },
            { key: 'mixed', label: uiStrings.onboarding.mixed, icon: 'layers-outline', desc: uiStrings.onboarding.mixedDesc }
          ].map(style => (
            <TouchableOpacity
              key={style.key}
              style={[
                styles.optionCard,
                preferences.learningStyle === style.key && styles.optionCardSelected,
              ]}
              onPress={() => updatePreference('learningStyle', style.key)}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name={style.icon as any} 
                  size={24} 
                  color={preferences.learningStyle === style.key ? '#3B82F6' : '#6B7280'} 
                />
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionText,
                    preferences.learningStyle === style.key && styles.optionTextSelected
                  ]}>
                    {style.label}
                  </Text>
                  <Text style={styles.optionDescription}>{style.desc}</Text>
                </View>
              </View>
              {preferences.learningStyle === style.key && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Difficulty Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{uiStrings.onboarding.difficultyLevel}</Text>
          <Text style={styles.sectionDescription}>
            {uiStrings.onboarding.difficultyLevelDesc}
          </Text>
          {[
            { key: 'beginner', label: uiStrings.onboarding.beginner, desc: uiStrings.onboarding.beginnerDesc },
            { key: 'intermediate', label: uiStrings.onboarding.intermediate, desc: uiStrings.onboarding.intermediateDesc },
            { key: 'adaptive', label: uiStrings.onboarding.adaptive, desc: uiStrings.onboarding.adaptiveDesc }
          ].map(level => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.optionCard,
                preferences.difficulty === level.key && styles.optionCardSelected,
              ]}
              onPress={() => updatePreference('difficulty', level.key)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionText,
                    preferences.difficulty === level.key && styles.optionTextSelected
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.optionDescription}>{level.desc}</Text>
                </View>
              </View>
              {preferences.difficulty === level.key && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{uiStrings.onboarding.locationOptional}</Text>
          <Text style={styles.sectionDescription}>
            {getLocationDescription()}
          </Text>
          
          {/* Location Type Selector */}
          <View style={styles.locationTypeSelector}>
            {[
              { key: 'city', label: uiStrings.onboarding.city, icon: 'location-outline' },
              { key: 'state', label: uiStrings.onboarding.state, icon: 'map-outline' },
              { key: 'zipcode', label: uiStrings.onboarding.zipCode, icon: 'pin-outline' }
            ].map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.locationTypeButton,
                  preferences.locationInputType === type.key && styles.locationTypeButtonActive
                ]}
                onPress={() => setLocationInputType(type.key as LocationInputType)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={16} 
                  color={preferences.locationInputType === type.key ? '#FFFFFF' : '#64748B'} 
                />
                <Text style={[
                  styles.locationTypeButtonText,
                  preferences.locationInputType === type.key && styles.locationTypeButtonTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder={getLocationPlaceholder()}
            value={preferences.location}
            onChangeText={(text) => updatePreference('location', text)}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Daily Reminders */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>{uiStrings.onboarding.dailyReminders}</Text>
              <Text style={styles.switchDescription}>
                {uiStrings.onboarding.dailyRemindersDesc}
              </Text>
            </View>
            <Switch
              value={preferences.reminders}
              onValueChange={(value) => updatePreference('reminders', value)}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={preferences.reminders ? '#3B82F6' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Assessment Note */}
        <View style={styles.assessmentNote}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <View style={styles.assessmentNoteText}>
            <Text style={styles.assessmentNoteTitle}>{uiStrings.onboarding.whatsNext}</Text>
            <Text style={styles.assessmentNoteDescription}>
              {uiStrings.onboarding.whatsNextDesc}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>{uiStrings.onboarding.completeSetup}</Text>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  locationTypeSelector: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  locationTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  locationTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  locationTypeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  locationTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },
  switchRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  assessmentNote: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  assessmentNoteText: {
    flex: 1,
  },
  assessmentNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  assessmentNoteDescription: {
    fontSize: 13,
    color: '#3730A3',
    lineHeight: 18,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}) 