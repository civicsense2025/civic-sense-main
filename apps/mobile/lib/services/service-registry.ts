import { PlatformUtils } from '../platform-utils'

type ServiceFactory<T> = () => T | Promise<T>
type ServiceFallback<T> = () => T

interface ServiceConfig<T> {
  factory: ServiceFactory<T>
  fallback?: ServiceFallback<T>
  platforms?: ('ios' | 'android' | 'web')[]
  required?: boolean
}

class ServiceRegistry {
  private services = new Map<string, any>()
  private configs = new Map<string, ServiceConfig<any>>()

  /**
   * Register a service with platform-specific configuration
   */
  register<T>(
    name: string, 
    config: ServiceConfig<T>
  ): void {
    this.configs.set(name, config)
  }

  /**
   * Get a service, initializing it if needed
   */
  async get<T>(name: string): Promise<T | null> {
    // Return cached service if available
    if (this.services.has(name)) {
      return this.services.get(name)
    }

    const config = this.configs.get(name)
    if (!config) {
      console.warn(`Service '${name}' not registered`)
      return null
    }

    try {
      // Check platform compatibility
      if (config.platforms) {
        const currentPlatform = PlatformUtils.isIOS ? 'ios' : 
                              PlatformUtils.isAndroid ? 'android' : 'web'
        
        if (!config.platforms.includes(currentPlatform)) {
          if (config.fallback) {
            const fallbackService = config.fallback()
            this.services.set(name, fallbackService)
            return fallbackService
          }
          
          if (config.required) {
            throw new Error(`Required service '${name}' not available on ${currentPlatform}`)
          }
          
          return null
        }
      }

      // Initialize the service
      const service = await config.factory()
      this.services.set(name, service)
      return service
    } catch (error) {
      console.error(`Failed to initialize service '${name}':`, error)
      
      // Try fallback
      if (config.fallback) {
        try {
          const fallbackService = config.fallback()
          this.services.set(name, fallbackService)
          return fallbackService
        } catch (fallbackError) {
          console.error(`Fallback for service '${name}' also failed:`, fallbackError)
        }
      }
      
      if (config.required) {
        throw error
      }
      
      return null
    }
  }

  /**
   * Check if a service is available without initializing it
   */
  isAvailable(name: string): boolean {
    const config = this.configs.get(name)
    if (!config) return false

    if (config.platforms) {
      const currentPlatform = PlatformUtils.isIOS ? 'ios' : 
                            PlatformUtils.isAndroid ? 'android' : 'web'
      return config.platforms.includes(currentPlatform) || !!config.fallback
    }

    return true
  }

  /**
   * Clear all cached services (useful for testing)
   */
  clear(): void {
    this.services.clear()
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistry()

// Convenience function for service registration
export function registerService<T>(
  name: string,
  config: ServiceConfig<T>
): void {
  serviceRegistry.register(name, config)
}

// Convenience function for service access
export function getService<T>(name: string): Promise<T | null> {
  return serviceRegistry.get<T>(name)
} 