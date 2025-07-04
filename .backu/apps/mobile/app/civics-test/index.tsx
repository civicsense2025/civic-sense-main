import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function CivicsTestScreen() {
  const { theme } = useTheme();
  const [questionCount, setQuestionCount] = useState<number>(50); // Default fallback
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadQuestionCount();
  }, []);

  const loadQuestionCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_assessment_questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (error) {
        console.error('Error loading question count:', error);
      } else if (count) {
        setQuestionCount(count);
      }
    } catch (error) {
      console.error('Error loading question count:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartTest = () => {
    router.push('/assessment-session/civics-comprehensive-test?type=civics_test' as any);
  };

  const topics = [
    'The Constitution',
    'Three Branches of Government', 
    'Federal vs State Powers',
    'Voting Rights and Elections',
    'Civil Rights and Liberties',
    'Political Participation',
    'Government Institutions',
    'Policy Making Process',
    'American Political Culture',
    'Federalism and Local Government'
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'center',
          paddingVertical: 20,
          paddingHorizontal: 16,
          minHeight: '100%'
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          maxWidth: 600, 
          width: '100%',
          alignSelf: 'center'
        }}>
          <Card style={{ 
            padding: 24,
            backgroundColor: theme.card,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Ionicons 
                name="school" 
                size={64} 
                color={theme.primary} 
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: theme.foreground,
                textAlign: 'center',
                marginBottom: 8
              }}>
                U.S. Civics Test
              </Text>
              <Text style={{
                fontSize: 16,
                color: theme.foregroundSecondary,
                textAlign: 'center'
              }}>
                Test your knowledge of American government and history
              </Text>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.foreground,
                marginBottom: 12
              }}>
                What's Covered:
              </Text>
              {topics.map((topic, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  <Text style={{
                    fontSize: 16,
                    color: theme.foreground,
                    marginLeft: 8
                  }}>
                    {topic}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ 
              backgroundColor: theme.muted,
              padding: 16,
              borderRadius: 8,
              marginBottom: 24
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: theme.foregroundSecondary }}>Questions:</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.foreground }}>{questionCount}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: theme.foregroundSecondary }}>Time Limit:</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.foreground }}>45 minutes</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: theme.foregroundSecondary }}>Passing Score:</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.foreground }}>70%</Text>
              </View>
            </View>

            <Pressable
              onPress={handleStartTest}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.primaryDark : theme.primary,
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: 'center',
                transform: [{ scale: pressed ? 0.98 : 1 }]
              })}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#FFFFFF'
              }}>
                Start Test
              </Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
} 