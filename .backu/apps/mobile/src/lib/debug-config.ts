type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DebugConfig {
  enabled: boolean;
  logLevel: LogLevel;
  modules: Record<string, boolean>;
}

class Debug {
  private config: DebugConfig = {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'debug',
    modules: {
      'apple-iap': true,
      'google-iap': true,
      'auth': true,
      'network': true,
      'cache': true,
      'ui': true,
      'api': true,
      'storage': true,
      'sync': true,
      'performance': true,
    }
  };

  log(module: string, ...args: any[]) {
    if (this.shouldLog(module, 'debug')) {
      console.log(`[${module}]`, ...args);
    }
  }

  info(module: string, ...args: any[]) {
    if (this.shouldLog(module, 'info')) {
      console.info(`[${module}]`, ...args);
    }
  }

  warn(module: string, ...args: any[]) {
    if (this.shouldLog(module, 'warn')) {
      console.warn(`[${module}]`, ...args);
    }
  }

  error(module: string, ...args: any[]) {
    if (this.shouldLog(module, 'error')) {
      console.error(`[${module}]`, ...args);
    }
  }

  private shouldLog(module: string, level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    if (!this.config.modules[module]) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const currentLevelIndex = levels.indexOf(level);

    return currentLevelIndex >= configLevelIndex;
  }

  enableModule(module: string) {
    this.config.modules[module] = true;
  }

  disableModule(module: string) {
    this.config.modules[module] = false;
  }

  setLogLevel(level: LogLevel) {
    this.config.logLevel = level;
  }

  enable() {
    this.config.enabled = true;
  }

  disable() {
    this.config.enabled = false;
  }
}

export const debug = new Debug(); 