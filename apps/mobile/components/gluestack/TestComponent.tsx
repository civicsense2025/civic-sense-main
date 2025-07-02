import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CivicButton } from './CivicButton';
import { CivicCard } from './CivicCard';
import { CivicInput } from './CivicInput';

export const TestComponent: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [emailValue, setEmailValue] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Gluestack UI Test
      </Text>
      
      {/* Input Components Section */}
      <CivicCard variant="elevated" padding="lg">
        <Text style={styles.cardTitle}>
          CivicInput Components
        </Text>
        
        <CivicInput
          label="Default Input"
          placeholder="Enter your name"
          value={inputValue}
          onChangeText={setInputValue}
          helperText="This is a default input with helper text"
        />
        
        <CivicInput
          label="Email Address"
          placeholder="Enter your email"
          value={emailValue}
          onChangeText={setEmailValue}
          variant="filled"
          size="lg"
          isRequired
        />
        
        <CivicInput
          label="Disabled Input"
          placeholder="This is disabled"
          variant="underlined"
          isDisabled
          helperText="This input is disabled"
        />
        
        <CivicInput
          label="Error Input"
          placeholder="This has an error"
          error="This field is required"
          isInvalid
        />
      </CivicCard>
      
      {/* Button Components Section */}
      <CivicCard variant="elevated" padding="lg">
        <Text style={styles.cardTitle}>
          CivicButton Components
        </Text>
        <Text style={styles.cardDescription}>
          Different button variants and sizes with CivicSense styling.
        </Text>
        
        <View style={styles.buttonRow}>
          <CivicButton
            title="Primary"
            variant="primary"
            size="sm"
            onPress={() => console.log('Primary pressed')}
          />
          <CivicButton
            title="Secondary"
            variant="secondary"
            size="sm"
            onPress={() => console.log('Secondary pressed')}
          />
          <CivicButton
            title="Outline"
            variant="outline"
            size="sm"
            onPress={() => console.log('Outline pressed')}
          />
        </View>
      </CivicCard>
      
      {/* Card Components Section */}
      <CivicCard variant="outlined" padding="md">
        <Text style={styles.cardTitle}>
          CivicCard Component
        </Text>
        <Text style={styles.cardText}>
          This is an outlined card with medium padding. The Gluestack UI integration is working with React Native components and CivicSense styling!
        </Text>
      </CivicCard>
      
      {/* Size Variations */}
      <CivicCard variant="ghost" padding="sm">
        <Text style={styles.cardTitle}>
          Button Size Variations
        </Text>
        <View style={styles.sizeTestRow}>
          <CivicButton
            title="Small"
            size="sm"
            variant="ghost"
            onPress={() => console.log('Small pressed')}
          />
          <CivicButton
            title="Medium"
            size="md"
            variant="primary"
            onPress={() => console.log('Medium pressed')}
          />
          <CivicButton
            title="Large"
            size="lg"
            variant="secondary"
            onPress={() => console.log('Large pressed')}
          />
        </View>
      </CivicCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sizeTestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
}); 