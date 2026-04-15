import { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSampleDecks } from '../utils/helpers';
import { api } from '../utils/api';

const DeckContext = createContext();

const DEFAULT_STUDY_STREAK = {
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  dailyGoal: 20,
  cardsStudiedToday: 0,
  goalCompletedToday: false,
  activityHistory: {},
};

const DEFAULT_RECENT_MISTAKES = {};
const MISTAKE_HISTORY_DAYS = 14;
const MISTAKE_HISTORY_MAX_PER_DECK = 200;

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDayDifference = (fromDateKey, toDateKey) => {
  if (!fromDateKey || !toDateKey) return 0;

  const fromDate = parseDateKey(fromDateKey);
  const toDate = parseDateKey(toDateKey);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return 0;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((toDate.getTime() - fromDate.getTime()) / msPerDay);
};

const normalizeActivityHistory = (history) => {
  const entries = Object.entries(history || {});
  const normalized = {};
  const todayKey = getDateKey();

  entries.forEach(([dateKey, value]) => {
    const safeValue = Math.max(0, Number(value) || 0);
    if (safeValue <= 0) return;

    const dayGap = getDayDifference(dateKey, todayKey);
    if (dayGap < 0 || dayGap > 365) return;

    normalized[dateKey] = safeValue;
  });

  return normalized;
};

const normalizeStudyStreak = (value) => {
  const normalized = {
    ...DEFAULT_STUDY_STREAK,
    ...(value || {}),
  };

  normalized.currentStreak = Math.max(0, Number(normalized.currentStreak) || 0);
  normalized.longestStreak = Math.max(0, Number(normalized.longestStreak) || 0);
  normalized.dailyGoal = Math.max(1, Number(normalized.dailyGoal) || DEFAULT_STUDY_STREAK.dailyGoal);
  normalized.cardsStudiedToday = Math.max(0, Number(normalized.cardsStudiedToday) || 0);
  normalized.activityHistory = normalizeActivityHistory(normalized.activityHistory);

  const todayKey = getDateKey();
  const dayGap = normalized.lastStudyDate
    ? getDayDifference(normalized.lastStudyDate, todayKey)
    : 0;

  if (dayGap > 1) {
    normalized.currentStreak = 0;
  }

  if (dayGap !== 0) {
    normalized.cardsStudiedToday = 0;
    normalized.goalCompletedToday = false;
  }

  normalized.goalCompletedToday = normalized.cardsStudiedToday >= normalized.dailyGoal;
  normalized.longestStreak = Math.max(normalized.longestStreak, normalized.currentStreak);

  return normalized;
};

const isSameStudyStreak = (left, right) => {
  if (!left || !right) return false;

  return left.currentStreak === right.currentStreak &&
    left.longestStreak === right.longestStreak &&
    left.lastStudyDate === right.lastStudyDate &&
    left.dailyGoal === right.dailyGoal &&
    left.cardsStudiedToday === right.cardsStudiedToday &&
    left.goalCompletedToday === right.goalCompletedToday &&
    JSON.stringify(left.activityHistory || {}) === JSON.stringify(right.activityHistory || {});
};

const getDuplicateTitle = (existingDecks, originalTitle) => {
  const baseTitle = `${originalTitle} (Copy)`;
  const existingTitles = new Set(existingDecks.map((deck) => deck.title));

  if (!existingTitles.has(baseTitle)) {
    return baseTitle;
  }

  let count = 2;
  let candidate = `${originalTitle} (Copy ${count})`;
  while (existingTitles.has(candidate)) {
    count += 1;
    candidate = `${originalTitle} (Copy ${count})`;
  }

  return candidate;
};

const createDuplicateCardId = (index) => `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;

const normalizeRecentMistakes = (history, decks) => {
  const now = new Date();
  const byDeck = history || {};
  const validCardIdsByDeck = new Map(
    (decks || []).map((deck) => [deck.id, new Set((deck.cards || []).map((card) => card.id))])
  );

  const normalized = {};

  Object.entries(byDeck).forEach(([deckId, entries]) => {
    if (!Array.isArray(entries)) return;

    const validCardIds = validCardIdsByDeck.get(deckId);
    if (!validCardIds) return;

    const sanitized = entries
      .map((entry) => ({
        cardId: entry?.cardId,
        confidence: String(entry?.confidence || 'medium').toLowerCase(),
        at: entry?.at,
      }))
      .filter((entry) => {
        if (!entry.cardId || !validCardIds.has(entry.cardId)) return false;
        const atDate = new Date(entry.at);
        if (Number.isNaN(atDate.getTime())) return false;
        const daysAgo = (now.getTime() - atDate.getTime()) / (24 * 60 * 60 * 1000);
        return daysAgo >= 0 && daysAgo <= MISTAKE_HISTORY_DAYS;
      })
      .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
      .slice(0, MISTAKE_HISTORY_MAX_PER_DECK);

    if (sanitized.length > 0) {
      normalized[deckId] = sanitized;
    }
  });

  return normalized;
};

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
    case 'SET_STREAK':
      return { ...state, studyStreak: action.payload };
    case 'SET_RECENT_MISTAKES':
      return { ...state, recentMistakes: action.payload };
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
  studyStreak: DEFAULT_STUDY_STREAK,
  recentMistakes: DEFAULT_RECENT_MISTAKES,
  loading: false,
  error: null,
};

export const DeckProvider = ({ children }) => {
  const [state, dispatch] = useReducer(deckReducer, initialState);
  const [localDecks, setLocalDecks] = useLocalStorage('shuken-decks', []);
  const [localProgress, setLocalProgress] = useLocalStorage('shuken-progress', {});
  const [localStudyStreak, setLocalStudyStreak] = useLocalStorage('shuken-study-streak', DEFAULT_STUDY_STREAK);
  const [localRecentMistakes, setLocalRecentMistakes] = useLocalStorage('shuken-recent-mistakes', DEFAULT_RECENT_MISTAKES);

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

    const normalizedStreak = normalizeStudyStreak(localStudyStreak);
    dispatch({ type: 'SET_STREAK', payload: normalizedStreak });
    if (!isSameStudyStreak(normalizedStreak, localStudyStreak)) {
      setLocalStudyStreak(normalizedStreak);
    }

    const normalizedRecentMistakes = normalizeRecentMistakes(localRecentMistakes, localDecks);
    dispatch({ type: 'SET_RECENT_MISTAKES', payload: normalizedRecentMistakes });
    if (JSON.stringify(normalizedRecentMistakes) !== JSON.stringify(localRecentMistakes || {})) {
      setLocalRecentMistakes(normalizedRecentMistakes);
    }
  }, [
    localDecks,
    localProgress,
    localStudyStreak,
    localRecentMistakes,
    setLocalDecks,
    setLocalStudyStreak,
    setLocalRecentMistakes,
  ]);

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

  const duplicateDeck = async (deckId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const sourceDeck = state.decks.find((deck) => deck.id === deckId);
      if (!sourceDeck) {
        throw new Error('Deck not found');
      }

      const nowIso = new Date().toISOString();
      const duplicatedDeck = {
        ...sourceDeck,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: getDuplicateTitle(state.decks, sourceDeck.title),
        cards: (sourceDeck.cards || []).map((card, index) => ({
          ...card,
          id: createDuplicateCardId(index),
        })),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      try {
        const createdDeck = await api.createDeck(duplicatedDeck);
        dispatch({ type: 'ADD_DECK', payload: createdDeck });
        setLocalDecks(prev => [...prev, createdDeck]);
      } catch (error) {
        // Fallback to localStorage
        dispatch({ type: 'ADD_DECK', payload: duplicatedDeck });
        setLocalDecks(prev => [...prev, duplicatedDeck]);
      }

      return duplicatedDeck;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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

  const recordSessionMistakes = (deckId, answerLog = []) => {
    if (!deckId || !Array.isArray(answerLog) || answerLog.length === 0) {
      return;
    }

    const sourceDeck = state.decks.find((deck) => deck.id === deckId);
    if (!sourceDeck) return;

    const validCardIds = new Set((sourceDeck.cards || []).map((card) => card.id));
    const nowIso = new Date().toISOString();
    const newEntries = answerLog
      .filter((entry) => !entry.isCorrect && validCardIds.has(entry.cardId))
      .map((entry) => ({
        cardId: entry.cardId,
        confidence: String(entry.confidence || 'medium').toLowerCase(),
        at: nowIso,
      }));

    if (newEntries.length === 0) return;

    const merged = {
      ...(localRecentMistakes || {}),
      [deckId]: [
        ...newEntries,
        ...((localRecentMistakes || {})[deckId] || []),
      ],
    };

    const normalizedRecentMistakes = normalizeRecentMistakes(merged, state.decks);
    setLocalRecentMistakes(normalizedRecentMistakes);
    dispatch({ type: 'SET_RECENT_MISTAKES', payload: normalizedRecentMistakes });
  };

  const recordStudyActivity = (cardsReviewed = 0) => {
    const safeCardsReviewed = Math.max(0, Number(cardsReviewed) || 0);
    const todayKey = getDateKey();
    const currentStreak = normalizeStudyStreak(localStudyStreak);
    const updatedStreak = { ...currentStreak };

    if (updatedStreak.lastStudyDate !== todayKey) {
      const dayGap = updatedStreak.lastStudyDate
        ? getDayDifference(updatedStreak.lastStudyDate, todayKey)
        : 0;

      updatedStreak.currentStreak = dayGap === 1 ? updatedStreak.currentStreak + 1 : 1;
      updatedStreak.lastStudyDate = todayKey;
      updatedStreak.cardsStudiedToday = 0;
    }

    updatedStreak.cardsStudiedToday += safeCardsReviewed;
    updatedStreak.activityHistory = {
      ...(updatedStreak.activityHistory || {}),
      [todayKey]: Math.max(0, Number(updatedStreak.activityHistory?.[todayKey]) || 0) + safeCardsReviewed,
    };
    updatedStreak.goalCompletedToday = updatedStreak.cardsStudiedToday >= updatedStreak.dailyGoal;
    updatedStreak.longestStreak = Math.max(updatedStreak.longestStreak, updatedStreak.currentStreak);

    const normalizedUpdatedStreak = normalizeStudyStreak(updatedStreak);
    setLocalStudyStreak(normalizedUpdatedStreak);
    dispatch({ type: 'SET_STREAK', payload: normalizedUpdatedStreak });
  };

  const setDailyGoal = (nextGoal) => {
    const sanitizedGoal = Math.min(200, Math.max(1, Number(nextGoal) || DEFAULT_STUDY_STREAK.dailyGoal));
    const currentStreak = normalizeStudyStreak(localStudyStreak);

    const updatedStreak = {
      ...currentStreak,
      dailyGoal: sanitizedGoal,
      goalCompletedToday: currentStreak.cardsStudiedToday >= sanitizedGoal,
    };

    setLocalStudyStreak(updatedStreak);
    dispatch({ type: 'SET_STREAK', payload: updatedStreak });
  };

  const value = {
    ...state,
    createDeck,
    updateDeck,
    deleteDeck,
    duplicateDeck,
    updateProgress,
    recordSessionMistakes,
    syncWithBackend,
    recordStudyActivity,
    setDailyGoal,
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