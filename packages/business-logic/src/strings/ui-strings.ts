/**
 * CivicSense UI Strings Interface
 * This file contains all user-facing text strings used throughout the application.
 * It serves as the single source of truth for UI text and facilitates translation.
 */

import { type UIStrings } from '@civicsense/types/ui-strings'

export const uiStrings: UIStrings = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    submit: 'Submit'
  },
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password'
  },
  quiz: {
    start: 'Start Quiz',
    next: 'Next Question',
    previous: 'Previous Question',
    submit: 'Submit Answers',
    correct: 'Correct!',
    incorrect: 'Incorrect'
  }
}

export type UIStringKey = keyof typeof uiStrings