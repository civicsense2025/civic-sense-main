declare module 'assessment-framework' {
  // Add assessment framework type definitions here
  export interface AssessmentConfig {
    id: string;
    name: string;
    type: string;
    questions: any[];
  }
} 