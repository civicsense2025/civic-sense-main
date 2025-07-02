declare module 'supabase' {
  export interface SupabaseClient {
    from: (table: string) => any;
    auth: {
      signIn: (credentials: any) => Promise<any>;
      signOut: () => Promise<any>;
      user: () => any;
    };
    storage: {
      from: (bucket: string) => any;
    };
  }

  export interface SupabaseConfig {
    supabaseUrl: string;
    supabaseKey: string;
  }
} 