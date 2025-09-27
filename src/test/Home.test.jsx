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
    expect(screen.getByText('Test Deck')).toBeInTheDocument()
    expect(screen.getByText('A test deck')).toBeInTheDocument()
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