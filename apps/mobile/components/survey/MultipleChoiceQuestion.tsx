import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Ionicons } from '@expo/vector-icons';
import type { MultipleChoiceQuestionProps } from '../../lib/types/survey-mobile';

export function MultipleChoiceQuestion({
  question,
  value,
  onChange,
  isRequired,
  error
}: MultipleChoiceQuestionProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    questionHeader: {
      marginBottom: 12,
    },
    questionText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.foreground,
      marginBottom: 4,
    },
    requiredIndicator: {
      color: theme.destructive,
    },
    description: {
      fontSize: 14,
      color: theme.foregroundSecondary,
      marginTop: 4,
    },
    optionsContainer: {
      gap: 8,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    optionButtonSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight || theme.primary + '10',
    },
    radioIcon: {
      marginRight: 12,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: theme.foreground,
    },
    errorText: {
      fontSize: 14,
      color: theme.destructive,
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionText}>
          {question.question}
          {isRequired && <Text style={styles.requiredIndicator}> *</Text>}
        </Text>
        {question.description && (
          <Text style={styles.description}>{question.description}</Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {question.options?.map((option, index) => {
          const isSelected = value === option;
          
          return (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
              ]}
              onPress={() => onChange(option)}
            >
              <View style={styles.radioIcon}>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={isSelected ? theme.primary : theme.foregroundSecondary}
                />
              </View>
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
} 