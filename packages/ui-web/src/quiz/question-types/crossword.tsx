'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { QuizQuestion } from '@civicsense/ui-web'
import { Button } from '@civicsense/ui-web'
import { Card } from '@civicsense/ui-web'
import { cn } from '@civicsense/ui-web'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface CrosswordQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string, isCorrect: boolean) => void
  showHint?: boolean
  disabled?: boolean
}

interface CellState {
  letter: string
  isCorrect?: boolean
  isHighlighted: boolean
  isActive: boolean
  wordNumber?: number
  isBlocked?: boolean
}

export function CrosswordQuestion({
  question,
  onAnswer,
  showHint = false,
  disabled = false
}: CrosswordQuestionProps) {
  const crosswordData = question.crossword_data
  
  // Return error message if no crossword data is available
  if (!crosswordData) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Crossword data missing</h3>
        <p className="text-red-700 mt-2">
          This question is configured as a crossword puzzle but doesn't have the required data.
        </p>
      </div>
    )
  }
  
  const { size, words, layout } = crosswordData
  const { rows, cols } = size
  
  // Utility to determine if a cell is blocked based on layout
  const isBlockedCell = useCallback(
    (r: number, c: number): boolean => {
      if (!layout || layout.length === 0) return false
      if (r >= layout.length) return false
      const rowString = layout[r]
      if (!rowString || c >= rowString.length) return false
      return rowString[c] === '#'
    },
    [layout]
  )
  
  // Initialize the grid state
  const [grid, setGrid] = useState<CellState[][]>(() => {
    // Create empty grid
    const initialGrid: CellState[][] = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({
        letter: '',
        isHighlighted: false,
        isActive: false,
        isBlocked: false
      }))
    )
    
    // Mark blocked cells first (from layout)
    if (layout && layout.length === rows) {
      for (let r = 0; r < rows; r++) {
        const rowString = layout[r]
        for (let c = 0; c < cols && c < rowString.length; c++) {
          if (rowString[c] === '#') {
            initialGrid[r][c].isBlocked = true
          }
        }
      }
    }
    
    // Mark cells with word numbers
    words.forEach(word => {
      const { position, direction, number } = word
      const { row, col } = position
      
      if (initialGrid[row] && initialGrid[row][col]) {
        initialGrid[row][col].wordNumber = number
      }
    })
    
    return initialGrid
  })
  
  // Track active clue and position
  const [activeClue, setActiveClue] = useState<number | null>(null)
  const [activeDirection, setActiveDirection] = useState<'across' | 'down'>('across')
  const [activePosition, setActivePosition] = useState<{ row: number, col: number } | null>(null)
  
  // Track submission state
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0 })
  
  // Organize clues by direction and number
  const clues = useMemo(() => {
    const acrossClues: Array<{ number: number; clue: string }> = []
    const downClues: Array<{ number: number; clue: string }> = []
    
    words.forEach(word => {
      const { clue, direction, number } = word
      if (direction === 'across') {
        acrossClues.push({ number, clue })
      } else {
        downClues.push({ number, clue })
      }
    })
    
    // Sort clues by number
    return {
      across: acrossClues.sort((a, b) => a.number - b.number),
      down: downClues.sort((a, b) => a.number - b.number)
    }
  }, [words])
  
  // Find word by number and direction
  const findWord = useCallback((number: number, direction: 'across' | 'down') => {
    return words.find(word => word.number === number && word.direction === direction)
  }, [words])
  
  // Highlight cells for the active word
  const highlightActiveWord = useCallback(() => {
    if (activeClue === null || !activeDirection) return
    
    const word = findWord(activeClue, activeDirection)
    if (!word) return
    
    const { position, direction } = word
    const { row, col } = position
    const wordLength = word.word.length
    
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row])
      
      // Clear all highlights first
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          newGrid[r][c] = { ...newGrid[r][c], isHighlighted: false, isActive: false }
        }
      }
      
      // Set new highlights
      if (direction === 'across') {
        for (let c = col; c < col + wordLength && c < cols; c++) {
          if (newGrid[row] && newGrid[row][c]) {
            newGrid[row][c].isHighlighted = true
          }
        }
      } else {
        for (let r = row; r < row + wordLength && r < rows; r++) {
          if (newGrid[r] && newGrid[r][col]) {
            newGrid[r][col].isHighlighted = true
          }
        }
      }
      
      // Set active cell
      if (activePosition && newGrid[activePosition.row] && newGrid[activePosition.row][activePosition.col]) {
        newGrid[activePosition.row][activePosition.col].isActive = true
      }
      
      return newGrid
    })
  }, [activeClue, activeDirection, activePosition, findWord, rows, cols])
  
  // Update highlights when active clue changes
  useEffect(() => {
    highlightActiveWord()
  }, [activeClue, activeDirection, activePosition, highlightActiveWord])
  
  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (disabled || isSubmitted) return
    
    // Find words that include this cell
    const acrossWord = words.find(word => 
      word.direction === 'across' && 
      word.position.row === row && 
      col >= word.position.col && 
      col < word.position.col + word.word.length
    )
    
    const downWord = words.find(word => 
      word.direction === 'down' && 
      word.position.col === col && 
      row >= word.position.row && 
      row < word.position.row + word.word.length
    )
    
    // If cell is already active, toggle direction
    if (activePosition?.row === row && activePosition?.col === col) {
      if (acrossWord && downWord) {
        setActiveDirection(prev => prev === 'across' ? 'down' : 'across')
        setActiveClue(prev => prev === acrossWord.number ? downWord.number : acrossWord.number)
      }
    } else {
      // Otherwise, set new active cell and direction
      setActivePosition({ row, col })
      
      // Prefer to continue in current direction if possible
      if (activeDirection === 'across' && acrossWord) {
        setActiveClue(acrossWord.number)
      } else if (activeDirection === 'down' && downWord) {
        setActiveClue(downWord.number)
      } else if (acrossWord) {
        setActiveClue(acrossWord.number)
        setActiveDirection('across')
      } else if (downWord) {
        setActiveClue(downWord.number)
        setActiveDirection('down')
      }
    }
  }, [activeDirection, activePosition, disabled, isSubmitted, words])
  
  // Handle clue click
  const handleClueClick = useCallback((number: number, direction: 'across' | 'down') => {
    if (disabled || isSubmitted) return
    
    const word = findWord(number, direction)
    if (!word) return
    
    setActiveClue(number)
    setActiveDirection(direction)
    setActivePosition(word.position)
  }, [disabled, isSubmitted, findWord])
  
  // Handle key press in cell
  const handleKeyPress = useCallback((event: React.KeyboardEvent, row: number, col: number) => {
    if (disabled || isSubmitted) return
    
    const key = event.key
    
    // Handle letter input
    if (/^[a-zA-Z]$/.test(key)) {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row])
        newGrid[row][col].letter = key.toUpperCase()
        return newGrid
      })
      
      // Move to next cell
      moveToNextCell()
    } 
    // Handle backspace
    else if (key === 'Backspace') {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row])
        
        // If current cell is empty, move to previous and clear it
        if (!newGrid[row][col].letter) {
          moveToPreviousCell()
        } else {
          newGrid[row][col].letter = ''
        }
        
        return newGrid
      })
    }
    // Handle arrow keys
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault()
      
      switch (key) {
        case 'ArrowUp':
          moveToCell(row - 1, col)
          break
        case 'ArrowDown':
          moveToCell(row + 1, col)
          break
        case 'ArrowLeft':
          moveToCell(row, col - 1)
          break
        case 'ArrowRight':
          moveToCell(row, col + 1)
          break
      }
    }
  }, [disabled, isSubmitted])
  
  // Move to next cell in the current word
  const moveToNextCell = useCallback(() => {
    if (!activePosition || !activeClue || !activeDirection) return
    
    const word = findWord(activeClue, activeDirection)
    if (!word) return
    
    const { position, direction } = word
    const { row, col } = position
    const wordLength = word.word.length
    
    if (direction === 'across') {
      const nextCol = activePosition.col + 1
      if (nextCol < col + wordLength && nextCol < cols) {
        moveToCell(activePosition.row, nextCol)
      }
    } else {
      const nextRow = activePosition.row + 1
      if (nextRow < row + wordLength && nextRow < rows) {
        moveToCell(nextRow, activePosition.col)
      }
    }
  }, [activePosition, activeClue, activeDirection, findWord, rows, cols])
  
  // Move to previous cell in the current word
  const moveToPreviousCell = useCallback(() => {
    if (!activePosition || !activeClue || !activeDirection) return
    
    const word = findWord(activeClue, activeDirection)
    if (!word) return
    
    const { position, direction } = word
    const { row, col } = position
    
    if (direction === 'across') {
      const prevCol = activePosition.col - 1
      if (prevCol >= col) {
        moveToCell(activePosition.row, prevCol)
      }
    } else {
      const prevRow = activePosition.row - 1
      if (prevRow >= row) {
        moveToCell(prevRow, activePosition.col)
      }
    }
  }, [activePosition, activeClue, activeDirection, findWord])
  
  // Move to a specific cell
  const moveToCell = useCallback((row: number, col: number) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return
    
    // Check if cell is part of a word
    const acrossWord = words.find(word => 
      word.direction === 'across' && 
      word.position.row === row && 
      col >= word.position.col && 
      col < word.position.col + word.word.length
    )
    
    const downWord = words.find(word => 
      word.direction === 'down' && 
      word.position.col === col && 
      row >= word.position.row && 
      row < word.position.row + word.word.length
    )
    
    if (acrossWord || downWord) {
      setActivePosition({ row, col })
      
      // Try to maintain current direction
      if (activeDirection === 'across' && acrossWord) {
        setActiveClue(acrossWord.number)
      } else if (activeDirection === 'down' && downWord) {
        setActiveClue(downWord.number)
      } else if (acrossWord) {
        setActiveClue(acrossWord.number)
        setActiveDirection('across')
      } else if (downWord) {
        setActiveClue(downWord.number)
        setActiveDirection('down')
      }
    }
  }, [activeDirection, rows, cols, words])
  
  // Handle reset button
  const handleReset = useCallback(() => {
    setGrid(prevGrid => {
      return prevGrid.map(row => 
        row.map(cell => ({
          ...cell,
          letter: '',
          isCorrect: undefined
        }))
      )
    })
    setIsSubmitted(false)
    setScore({ correct: 0, total: 0, percentage: 0 })
  }, [])
  
  // Check if grid is complete
  const isGridComplete = useMemo(() => {
    for (const word of words) {
      const { position, direction, word: correctWord } = word
      const { row, col } = position
      
      for (let i = 0; i < correctWord.length; i++) {
        const r = direction === 'across' ? row : row + i
        const c = direction === 'across' ? col + i : col
        
        if (!grid[r] || !grid[r][c] || !grid[r][c].letter) {
          return false
        }
      }
    }
    
    return true
  }, [grid, words])
  
  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!isGridComplete || isSubmitted) return
    
    let correctWords = 0
    const totalWords = words.length
    
    // Check each word
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row])
      
      words.forEach(word => {
        const { position, direction, word: correctWord } = word
        const { row, col } = position
        let isWordCorrect = true
        
        for (let i = 0; i < correctWord.length; i++) {
          const r = direction === 'across' ? row : row + i
          const c = direction === 'across' ? col + i : col
          
          const userLetter = newGrid[r][c].letter
          const correctLetter = correctWord[i].toUpperCase()
          
          newGrid[r][c].isCorrect = userLetter === correctLetter
          
          if (userLetter !== correctLetter) {
            isWordCorrect = false
          }
        }
        
        if (isWordCorrect) {
          correctWords++
        }
      })
      
      return newGrid
    })
    
    const percentage = Math.round((correctWords / totalWords) * 100)
    setScore({ correct: correctWords, total: totalWords, percentage })
    setIsSubmitted(true)
    
    onAnswer(`${correctWords}/${totalWords} words correct (${percentage}%)`, correctWords === totalWords)
  }, [isGridComplete, isSubmitted, words, onAnswer])
  
  // Determine if a cell is part of a word
  const isCellInWord = useCallback((row: number, col: number) => {
    if (isBlockedCell(row, col)) return false
    return words.some(word => {
      const { position, direction, word: wordText } = word
      const { row: wordRow, col: wordCol } = position
      
      if (direction === 'across') {
        return row === wordRow && col >= wordCol && col < wordCol + wordText.length
      } else {
        return col === wordCol && row >= wordRow && row < wordRow + wordText.length
      }
    })
  }, [words, isBlockedCell])
  
  return (
    <div className="space-y-6">
      <div className="text-lg font-medium">{question.question}</div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crossword Grid */}
        <div className="lg:col-span-2">
          <div 
            className="grid gap-px bg-slate-300 dark:bg-slate-700 p-px rounded-lg shadow-inner"
            style={{ 
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              width: 'fit-content',
              margin: '0 auto'
            }}
          >
            {Array.from({ length: rows }).map((_, rowIndex) => (
              Array.from({ length: cols }).map((_, colIndex) => {
                const cell = grid[rowIndex][colIndex]
                const isBlocked = cell.isBlocked
                const isInWord = !isBlocked && isCellInWord(rowIndex, colIndex)
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "relative w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center transition-all",
                      isBlocked && "bg-slate-700 dark:bg-slate-800",
                      !isBlocked && "bg-white dark:bg-slate-900",
                      !isBlocked && !isInWord && "bg-slate-200 dark:bg-slate-800",
                      cell.isHighlighted && "bg-blue-50 dark:bg-blue-900/30",
                      cell.isActive && "bg-blue-100 dark:bg-blue-800/40 ring-2 ring-blue-500",
                      isSubmitted && cell.isCorrect === true && "bg-green-50 dark:bg-green-900/30",
                      isSubmitted && cell.isCorrect === false && "bg-red-50 dark:bg-red-900/30",
                      disabled && "opacity-70",
                      isBlocked && "cursor-default"
                    )}
                    onClick={() => !isBlocked && isInWord && handleCellClick(rowIndex, colIndex)}
                    tabIndex={!isBlocked && isInWord ? 0 : -1}
                    onKeyDown={(e) => !isBlocked && handleKeyPress(e, rowIndex, colIndex)}
                  >
                    {/* Word number */}
                    {cell.wordNumber && !isBlocked && (
                      <span className="absolute top-0.5 left-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {cell.wordNumber}
                      </span>
                    )}
                    
                    {/* Cell content */}
                    {!isBlocked && isInWord ? (
                      <span className={cn(
                        "text-lg sm:text-xl font-semibold",
                        isSubmitted && cell.isCorrect === true && "text-green-600 dark:text-green-400",
                        isSubmitted && cell.isCorrect === false && "text-red-600 dark:text-red-400"
                      )}>
                        {cell.letter}
                      </span>
                    ) : (
                      <span className={cn("w-full h-full", isBlocked ? "bg-slate-700 dark:bg-slate-700" : "bg-slate-300 dark:bg-slate-700")}></span>
                    )}
                  </div>
                )
              })
            ))}
          </div>
          
          {/* Instructions */}
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mt-4">
            💡 Click a cell to start. Type letters to fill in the crossword. Use arrow keys to navigate.
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleSubmit}
              disabled={!isGridComplete || isSubmitted || disabled}
              className="flex-1"
            >
              Submit Crossword
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!grid.some(row => row.some(cell => cell.letter)) || disabled}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
        
        {/* Clues */}
        <div className="space-y-6">
          {/* Across Clues */}
          {clues.across.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Across</h3>
              <div className="space-y-2">
                {clues.across.map(({ number, clue }) => (
                  <div 
                    key={`across-${number}`}
                    className={cn(
                      "p-2 rounded-lg cursor-pointer",
                      activeClue === number && activeDirection === 'across' && "bg-blue-50 dark:bg-blue-900/30",
                      disabled && "cursor-not-allowed opacity-70"
                    )}
                    onClick={() => handleClueClick(number, 'across')}
                  >
                    <span className="font-medium">{number}.</span> {clue}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Down Clues */}
          {clues.down.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Down</h3>
              <div className="space-y-2">
                {clues.down.map(({ number, clue }) => (
                  <div 
                    key={`down-${number}`}
                    className={cn(
                      "p-2 rounded-lg cursor-pointer",
                      activeClue === number && activeDirection === 'down' && "bg-blue-50 dark:bg-blue-900/30",
                      disabled && "cursor-not-allowed opacity-70"
                    )}
                    onClick={() => handleClueClick(number, 'down')}
                  >
                    <span className="font-medium">{number}.</span> {clue}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Results (shown after submission) */}
      {isSubmitted && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-semibold mb-2">Results</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">
              {score.correct}/{score.total} words correct ({score.percentage}%)
            </span>
            {score.correct === score.total ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
        </Card>
      )}
      
      {/* Hint */}
      {showHint && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">💡 Hint:</div>
          <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">{question.hint}</div>
        </div>
      )}
    </div>
  )
} 