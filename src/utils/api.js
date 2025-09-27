const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('API call failed, falling back to localStorage:', error);
    throw error;
  }
};

export const api = {
  // Decks
  getDecks: () => apiCall('/decks'),
  getDeck: (id) => apiCall(`/decks/${id}`),
  createDeck: (deck) => apiCall('/decks', {
    method: 'POST',
    body: JSON.stringify(deck),
  }),
  updateDeck: (id, deck) => apiCall(`/decks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(deck),
  }),
  deleteDeck: (id) => apiCall(`/decks/${id}`, {
    method: 'DELETE',
  }),

  // Cards
  getCards: (deckId) => apiCall(`/decks/${deckId}/cards`),
  createCard: (deckId, card) => apiCall(`/decks/${deckId}/cards`, {
    method: 'POST',
    body: JSON.stringify(card),
  }),
  updateCard: (deckId, cardId, card) => apiCall(`/decks/${deckId}/cards/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(card),
  }),
  deleteCard: (deckId, cardId) => apiCall(`/decks/${deckId}/cards/${cardId}`, {
    method: 'DELETE',
  }),

  // Progress
  getProgress: (deckId) => apiCall(`/progress/${deckId}`),
  updateProgress: (deckId, progress) => apiCall(`/progress/${deckId}`, {
    method: 'PUT',
    body: JSON.stringify(progress),
  }),
};