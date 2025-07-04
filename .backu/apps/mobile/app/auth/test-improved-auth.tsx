import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TextInput } from 'react-native';

// Import the improved auth context
import { useAuth } from '../../lib/auth-context-improved';

export default function TestImprovedAuthScreen() {
  const { 
    user, 
    profile, 
    loading, 
    initialized,
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOut 
  } = useAuth();
  
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        Alert.alert('Sign In Failed', error.message);
      } else {
        Alert.alert('Success', 'Signed in successfully!');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert('Success', 'Account created! Please check your email for verification.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error, cancelled } = await signInWithGoogle();
      
      if (cancelled) {
        Alert.alert('Cancelled', 'Google sign-in was cancelled');
      } else if (error) {
        Alert.alert('Google Sign In Failed', error.message);
      } else {
        Alert.alert('Success', 'Signed in with Google successfully!');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred with Google sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        Alert.alert('Sign Out Failed', error.message);
      } else {
        Alert.alert('Success', 'Signed out successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing auth...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Test Improved Auth</Text>
        
        {/* Auth Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Auth Status:</Text>
          <Text style={styles.statusText}>Loading: {loading ? 'Yes' : 'No'}</Text>
          <Text style={styles.statusText}>Initialized: {initialized ? 'Yes' : 'No'}</Text>
          <Text style={styles.statusText}>User: {user ? user.email : 'Not signed in'}</Text>
          <Text style={styles.statusText}>Profile: {profile ? profile.full_name || 'No name' : 'No profile'}</Text>
        </View>

        {!user ? (
          // Sign In/Up Form
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Sign In / Sign Up</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name (for sign up)"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <Text style={styles.dividerText}>OR</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.googleButtonText}>
                {isLoading ? 'Connecting...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Signed In State
          <View style={styles.signedInContainer}>
            <Text style={styles.sectionTitle}>Welcome!</Text>
            <Text style={styles.welcomeText}>You are signed in as {user.email}</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.signOutButton]}
              onPress={handleSignOut}
              disabled={isLoading}
            >
              <Text style={styles.signOutButtonText}>
                {isLoading ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: '#E5E7EB',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  signedInContainer: {
    backgroundColor: '#D1FAE5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6B7280',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#DC2626',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  welcomeText: {
    fontSize: 16,
    color: '#065F46',
    marginBottom: 15,
  },
}); 