declare module 'email' {
  export interface EmailConfig {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
  }

  export interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
  }
} 