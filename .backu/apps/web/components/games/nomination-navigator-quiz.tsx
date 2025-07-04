import { MockGameWrapper } from "./mock-game-wrapper"

interface GameProps {
  onComplete: () => void
}

export function NominationNavigatorQuiz({ onComplete }: GameProps) {
  return (
    <MockGameWrapper gameName="Nomination Navigator Quiz" onComplete={onComplete}>
      <p>Welcome to the Nomination Navigator Quiz!</p>
      <p>This quiz tests your knowledge of the Supreme Court nomination process.</p>
      <ol>
        <li>A vacancy occurs on the Supreme Court.</li>
        <li>The President nominates a candidate.</li>
        <li>The Senate Judiciary Committee holds hearings.</li>
        <li>The full Senate debates and votes on the nomination.</li>
      </ol>
      <p>Imagine you've answered all questions correctly!</p>
    </MockGameWrapper>
  )
}
