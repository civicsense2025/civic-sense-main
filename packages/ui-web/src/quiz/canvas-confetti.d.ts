declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number
    angle?: number
    spread?: number
    startVelocity?: number
    decay?: number
    gravity?: number
    drift?: number
    ticks?: number
    origin?: {
      x?: number
      y?: number
    }
    colors?: string[]
    shapes?: string[]
    scalar?: number
    zIndex?: number
    disableForReducedMotion?: boolean
  }

  interface ConfettiFunction {
    (options?: ConfettiOptions): Promise<null>
    reset: () => void
  }

  const confetti: ConfettiFunction
  export default confetti
}
