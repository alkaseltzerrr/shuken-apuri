import { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSampleDecks } from '../utils/helpers';
import { api } from '../utils/api';

const DeckContext = createContext();

const deckReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DECKS':
      return { ...state, decks: action.payload };
    case 'ADD_DECK':
      return { ...state, decks: [...state.decks, action.payload] };
    case 'UPDATE_DECK':
      return {
        ...state,
        decks: state.decks.map(deck =>
          deck.id === action.payload.id ? action.payload : deck
        ),
      };
    case 'DELETE_DECK':
      return {
        ...state,
        decks: state.decks.filter(deck => deck.id !== action.payload),
      };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'UPDATE_DECK_PROGRESS':
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.payload.deckId]: action.payload.progress,
        },
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const initialState = {
  decks: [],
  progress: {},
  loading: false,
  error: null,
};

export const DeckProvider = ({ children }) => {
  const [state, dispatch] = useReducer(deckReducer, initialState);
  const [localDecks, setLocalDecks] = useLocalStorage('shuken-decks', []);
  const [localProgress, setLocalProgress] = useLocalStorage('shuken-progress', {});

  // Initialize with sample decks if none exist
  useEffect(() => {
    if (localDecks.length === 0) {
      const sampleDecks = generateSampleDecks();
      setLocalDecks(sampleDecks);
      dispatch({ type: 'SET_DECKS', payload: sampleDecks });
    } else {
      dispatch({ type: 'SET_DECKS', payload: localDecks });
    }
    dispatch({ type: 'SET_PROGRESS', payload: localProgress });
  }, [localDecks, localProgress, setLocalDecks]);

  // Try to sync with backend
  const syncWithBackend = async () => {
    try {
      const backendDecks = await api.getDecks();
      dispatch({ type: 'SET_DECKS', payload: backendDecks });
      setLocalDecks(backendDecks);
    } catch (error) {
      // Backend not available, use localStorage
      console.log('Using localStorage fallback');
    }
  };

  const createDeck = async (deckData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newDeck = {
        ...deckData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const createdDeck = await api.createDeck(newDeck);
        dispatch({ type: 'ADD_DECK', payload: createdDeck });
        setLocalDecks(prev => [...prev, createdDeck]);
      } catch (error) {
        // Fallback to localStorage
        dispatch({ type: 'ADD_DECK', payload: newDeck });
        setLocalDecks(prev => [...prev, newDeck]);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateDeck = async (deckId, updates) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedDeck = {
        ...state.decks.find(d => d.id === deckId),
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      try {
        const result = await api.updateDeck(deckId, updatedDeck);
        dispatch({ type: 'UPDATE_DECK', payload: result });
        setLocalDecks(prev => prev.map(d => d.id === deckId ? result : d));
      } catch (error) {
        // Fallback to localStorage
        dispatch({ type: 'UPDATE_DECK', payload: updatedDeck });
        setLocalDecks(prev => prev.map(d => d.id === deckId ? updatedDeck : d));
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteDeck = async (deckId) => {
    try {
      try {
        await api.deleteDeck(deckId);
      } catch (error) {
        // Continue with local deletion even if backend fails
      }
      
      dispatch({ type: 'DELETE_DECK', payload: deckId });
      setLocalDecks(prev => prev.filter(d => d.id !== deckId));
      
      // Also remove progress data
      const newProgress = { ...localProgress };
      delete newProgress[deckId];
      setLocalProgress(newProgress);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateProgress = (deckId, progressData) => {
    const newProgress = {
      ...localProgress,
      [deckId]: progressData,
    };
    setLocalProgress(newProgress);
    dispatch({ type: 'UPDATE_DECK_PROGRESS', payload: { deckId, progress: progressData } });
  };

  const value = {
    ...state,
    createDeck,
    updateDeck,
    deleteDeck,
    updateProgress,
    syncWithBackend,
  };

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
};