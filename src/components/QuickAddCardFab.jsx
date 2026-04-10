import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, X, Sparkles } from 'lucide-react';
import { useDeck } from '../context/DeckContext';

const getDeckIdFromPath = (path) => {
  const match = path.match(/^\/deck\/([^/]+)/);
  return match ? match[1] : null;
};

const QuickAddCardFab = () => {
  const location = useLocation();
  const { decks, updateDeck } = useDeck();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const deckFromRoute = useMemo(() => {
    const deckId = getDeckIdFromPath(location.pathname);
    return decks.find((deck) => deck.id === deckId) || null;
  }, [location.pathname, decks]);

  useEffect(() => {
    if (!isOpen) return;

    if (deckFromRoute) {
      setSelectedDeckId(deckFromRoute.id);
    } else if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [isOpen, deckFromRoute, decks, selectedDeckId]);

  useEffect(() => {
    setIsOpen(false);
    setFeedback('');
  }, [location.pathname]);

  const closePanel = () => {
    setIsOpen(false);
    setFeedback('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!selectedDeckId) {
      setFeedback('Select a deck first.');
      return;
    }

    if (!trimmedFront || !trimmedBack) {
      setFeedback('Both front and back are required.');
      return;
    }

    const targetDeck = decks.find((deck) => deck.id === selectedDeckId);
    if (!targetDeck) {
      setFeedback('Selected deck was not found.');
      return;
    }

    setIsSubmitting(true);
    setFeedback('');

    try {
      const newCard = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        front: trimmedFront,
        back: trimmedBack,
      };

      const updatedCards = [...(targetDeck.cards || []), newCard];
      await updateDeck(targetDeck.id, { cards: updatedCards });

      setFront('');
      setBack('');
      setFeedback('Card added successfully.');
    } catch (error) {
      setFeedback('Failed to add card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasDecks = decks.length > 0;

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-5 sm:right-8 z-50 w-[22rem] max-w-[calc(100vw-2rem)] animate-slide-down">
          <div className="bg-card/95 dark:bg-dark-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-primary/25 dark:border-dark-primary/30 overflow-hidden">
            <div className="px-4 py-3 bg-primary/10 dark:bg-dark-primary/15 border-b border-primary/20 dark:border-dark-primary/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary dark:text-dark-primary" />
                <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">Quick Add Card</h3>
              </div>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-md text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary hover:bg-primary/10 dark:hover:bg-dark-primary/20 transition-colors"
                aria-label="Close quick add"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {hasDecks ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary mb-1">
                      Deck
                    </label>
                    <select
                      value={selectedDeckId}
                      onChange={(e) => setSelectedDeckId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-text-secondary/25 dark:border-dark-text-secondary/25 bg-background/90 dark:bg-dark-background/90 text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                    >
                      {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>{deck.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary mb-1">
                      Front
                    </label>
                    <textarea
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      rows="2"
                      placeholder="Question or prompt"
                      className="w-full px-3 py-2 rounded-lg border border-text-secondary/25 dark:border-dark-text-secondary/25 bg-background/90 dark:bg-dark-background/90 text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary mb-1">
                      Back
                    </label>
                    <textarea
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      rows="2"
                      placeholder="Answer"
                      className="w-full px-3 py-2 rounded-lg border border-text-secondary/25 dark:border-dark-text-secondary/25 bg-background/90 dark:bg-dark-background/90 text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                    />
                  </div>

                  {feedback && (
                    <div className="text-sm text-text-secondary dark:text-dark-text-secondary">
                      {feedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-secondary dark:bg-dark-secondary text-white py-2.5 rounded-lg hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Card'}
                  </button>
                </form>
              ) : (
                <div className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  Create a deck first, then use quick add to capture cards from anywhere.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 sm:right-8 z-50 w-14 h-14 rounded-full bg-primary dark:bg-dark-primary text-white shadow-xl hover:scale-105 hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center justify-center"
        aria-label="Quick add card"
        title="Quick add card"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </>
  );
};

export default QuickAddCardFab;
