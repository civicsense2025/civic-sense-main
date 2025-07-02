declare module 'debug' {
  interface Debug {
    (namespace: string): Debug;
    enable(namespaces: string): void;
    disable(): string;
    enabled(namespace: string): boolean;
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  }

  const debug: Debug;
  export = debug;
} 