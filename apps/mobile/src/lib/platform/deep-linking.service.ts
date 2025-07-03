import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

interface DeepLinkConfig {
  path: string;
  screen: string;
  params?: Record<string, string>;
}

export class DeepLinkingService {
  private static instance: DeepLinkingService;
  private isInitialized = false;
  private linkingConfigs: DeepLinkConfig[] = [
    { path: 'quiz/:id', screen: 'quiz' },
    { path: 'topic/:id', screen: 'topic' },
    { path: 'multiplayer/:roomId', screen: 'multiplayer' },
    { path: 'assessment/:sessionId', screen: 'assessment' },
    { path: 'profile/:userId', screen: 'profile' },
  ];

  private constructor() {}

  static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Handle initial URL
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.handleDeepLink(initialUrl);
      }

      // Add event listeners
      Linking.addEventListener('url', ({ url }) => {
        this.handleDeepLink(url);
      });

      // Handle notification deep links
      Notifications.addNotificationResponseReceivedListener(response => {
        const deepLink = response.notification.request.content.data?.deepLink;
        if (deepLink && typeof deepLink === 'string') {
          this.handleDeepLink(deepLink);
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize deep linking:', error);
      throw error;
    }
  }

  async handleDeepLink(url: string): Promise<void> {
    try {
      const { path, queryParams } = this.parseUrl(url);
      const config = this.findMatchingConfig(path);

      if (config) {
        // Extract dynamic params from path
        const dynamicParams = this.extractDynamicParams(config.path, path);
        
        // Combine dynamic params with query params
        const params = {
          ...dynamicParams,
          ...queryParams,
          ...config.params,
        };

        // Navigate using expo-router
        router.push({
          pathname: `/${config.screen}`,
          params,
        });
      } else {
        console.warn('No matching deep link configuration for:', path);
      }
    } catch (error) {
      console.error('Failed to handle deep link:', error);
    }
  }

  async createDeepLink(
    screen: string,
    params?: Record<string, string>
  ): Promise<string> {
    const config = this.linkingConfigs.find(c => c.screen === screen);
    if (!config) {
      throw new Error(`No deep link configuration found for screen: ${screen}`);
    }

    let path = config.path;
    
    // Replace dynamic parameters in path
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          path = path.replace(`:${key}`, value);
        }
      });
    }

    // Create query string for remaining params
    const remainingParams = { ...params };
    path.split('/').forEach(segment => {
      if (segment.startsWith(':')) {
        delete remainingParams[segment.slice(1)];
      }
    });

    const queryString = Object.entries(remainingParams)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return `civicsense://${path}${queryString ? `?${queryString}` : ''}`;
  }

  private parseUrl(url: string): { path: string; queryParams: Record<string, string> } {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname.slice(1); // Remove leading slash
    
    // Parse query parameters
    const queryParams: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      if (value) {
        queryParams[key] = value;
      }
    });

    return { path, queryParams };
  }

  private findMatchingConfig(path: string): DeepLinkConfig | undefined {
    return this.linkingConfigs.find(config => {
      const configParts = config.path.split('/');
      const pathParts = path.split('/');

      if (configParts.length !== pathParts.length) {
        return false;
      }

      return configParts.every((part, index) => {
        if (part.startsWith(':')) {
          return true; // Dynamic parameter matches anything
        }
        return part === pathParts[index];
      });
    });
  }

  private extractDynamicParams(
    configPath: string,
    actualPath: string
  ): Record<string, string> {
    const params: Record<string, string> = {};
    const configParts = configPath.split('/');
    const pathParts = actualPath.split('/');

    configParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        const value = pathParts[index];
        if (value) {
          params[paramName] = value;
        }
      }
    });

    return params;
  }
}

// Export singleton instance
export const deepLinkingService = DeepLinkingService.getInstance(); 