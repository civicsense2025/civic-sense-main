import { MockGameWrapper } from "./mock-game-wrapper"

interface GameProps {
  onComplete: () => void
}

export function PolicyImpactPuzzle({ onComplete }: GameProps) {
  return (
    <MockGameWrapper gameName="Policy Impact Puzzle" onComplete={onComplete}>
      <p>Welcome to the Policy Impact Puzzle Quiz!</p>
      <p>In this quiz, you'll test your knowledge about how different economic policies affect the nation.</p>
      <p>For example:</p>
      <ul>
        <li>Policy: Lower interest rates. Outcome: Increased borrowing, potential inflation.</li>
        <li>Policy: Invest in infrastructure. Outcome: Job creation, long-term growth.</li>
      </ul>
      <p>You've successfully answered all questions!</p>
    </MockGameWrapper>
  )
}
