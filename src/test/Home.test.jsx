import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { DeckProvider } from '../context/DeckContext'
import Home from '../pages/Home'

// Mock the context to provide test data
vi.mock('../context/DeckContext', () => ({
  DeckProvider: ({ children }) => children,
  useDeck: () => ({
    decks: [
      {
        id: '1',
        title: 'Test Deck',
        description: 'A test deck',
        cards: [
          { id: '1', front: 'Question 1', back: 'Answer 1' },
          { id: '2', front: 'Question 2', back: 'Answer 2' },
        ],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      },
    ],
    progress: {},
    deleteDeck: vi.fn(),
    createDeck: vi.fn(),
    setDailyGoal: vi.fn(),
    studyStreak: {
      currentStreak: 2,
      longestStreak: 5,
      lastStudyDate: '2026-04-10',
      dailyGoal: 20,
      cardsStudiedToday: 4,
      goalCompletedToday: false,
    },
  }),
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <DeckProvider>
        {component}
      </DeckProvider>
    </BrowserRouter>
  )
}

describe('Home', () => {
  it('renders the app title', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText('集験アプリ')).toBeInTheDocument()
  })

  it('displays deck cards when decks exist', () => {
    renderWithProviders(<Home />)
    expect(screen.getAllByText('Test Deck').length).toBeGreaterThan(0)
    expect(screen.getByText('A test deck')).toBeInTheDocument()
  })

  it('shows a daily study queue summary', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText("Today's Study Queue")).toBeInTheDocument()
    expect(screen.getByText(/cards are due across/i)).toBeInTheDocument()
  })

  it('shows streak and daily goal information', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText('Study Streak')).toBeInTheDocument()
    expect(screen.getByText('Current Streak')).toBeInTheDocument()
    expect(screen.getByText('Daily goal progress')).toBeInTheDocument()
  })

  it('shows create deck button', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText('Create New Deck')).toBeInTheDocument()
  })

  it('shows import deck functionality', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText('Import Deck')).toBeInTheDocument()
  })
})