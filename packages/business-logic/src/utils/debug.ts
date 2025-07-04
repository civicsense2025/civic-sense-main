export const debug = {
  log: (category: string, message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${category}]`, message, ...args)
    }
  },
  warn: (category: string, message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${category}]`, message, ...args)
    }
  }
} 