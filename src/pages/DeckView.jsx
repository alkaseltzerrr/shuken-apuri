import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { Plus, Play, Edit, ArrowLeft, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import { getDeckStats, getLeechCards } from '../utils/spacedRepetition';

const DeckView = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { decks, updateDeck, progress } = useDeck();
  const [deck, setDeck] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ front: '', back: '', hint: '', example: '' });

  useEffect(() => {
    const foundDeck = decks.find(d => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
    } else {
      navigate('/');
    }
  }, [deckId, decks, navigate]);

  const stats = deck ? getDeckStats(progress[deckId] || []) : null;
  const leechCards = deck
    ? getLeechCards(progress[deckId] || [])
      .map((item) => ({
        ...item,
        card: deck.cards?.find((card) => card.id === item.cardId),
      }))
      .filter((item) => item.card)
    : [];

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;

    const newCard = {
      id: Date.now().toString(),
      front: cardForm.front.trim(),
      back: cardForm.back.trim(),
      hint: cardForm.hint.trim(),
      example: cardForm.example.trim(),
    };

    const updatedCards = [...(deck.cards || []), newCard];
    await updateDeck(deckId, { cards: updatedCards });
    
    setCardForm({ front: '', back: '', hint: '', example: '' });
    setShowAddCard(false);
  };

  const handleEditCard = async (card) => {
    setEditingCard(card);
    setCardForm({
      front: card.front,
      back: card.back,
      hint: card.hint || '',
      example: card.example || '',
    });
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;

    const updatedCards = deck.cards.map(card =>
      card.id === editingCard.id
        ? {
          ...card,
          front: cardForm.front.trim(),
          back: cardForm.back.trim(),
          hint: cardForm.hint.trim(),
          example: cardForm.example.trim(),
        }
        : card
    );

    await updateDeck(deckId, { cards: updatedCards });
    
    setEditingCard(null);
    setCardForm({ front: '', back: '', hint: '', example: '' });
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      const updatedCards = deck.cards.filter(card => card.id !== cardId);
      await updateDeck(deckId, { cards: updatedCards });
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setCardForm({ front: '', back: '', hint: '', example: '' });
    setShowAddCard(false);
  };

  if (!deck) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-text-secondary dark:text-dark-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/"
              className="p-2 text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{deck.title}</h1>
          </div>
          
          {deck.description && (
            <p className="text-text-secondary dark:text-dark-text-secondary mb-4">{deck.description}</p>
          )}

          {/* Stats */}
          {stats && stats.total > 0 && (
            <div className="bg-card/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary dark:text-dark-primary">{stats.total}</div>
                  <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Total Cards</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary dark:text-dark-secondary">{stats.reviewed}</div>
                  <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Reviewed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent dark:text-dark-accent">{stats.dueForReview}</div>
                  <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Due Today</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary dark:text-dark-primary">{stats.accuracy}%</div>
                  <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning dark:text-dark-warning">{stats.leechCards}</div>
                  <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Leeches</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/deck/${deckId}/study`}
            className="flex items-center space-x-2 bg-primary dark:bg-dark-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105"
          >
            <Play className="w-4 h-4" />
            <span>Study</span>
          </Link>
          
          <Link
            to={`/deck/${deckId}/edit`}
            className="flex items-center space-x-2 bg-primary dark:bg-dark-primary text-white px-4 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105"
          >
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Add/Edit Card Form */}
      {(showAddCard || editingCard) && (
        <div className="bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border-2 border-secondary dark:border-dark-secondary">
          <h3 className="text-lg font-medium text-text-primary dark:text-dark-text-primary mb-4">
            {editingCard ? 'Edit Card' : 'Add New Card'}
          </h3>
          
          <form onSubmit={editingCard ? handleUpdateCard : handleAddCard}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                  Front (Question)
                </label>
                <textarea
                  value={cardForm.front}
                  onChange={(e) => setCardForm(prev => ({ ...prev, front: e.target.value }))}
                  placeholder="Enter the question or prompt..."
                  className="w-full px-3 py-2 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                  rows="3"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                  Back (Answer)
                </label>
                <textarea
                  value={cardForm.back}
                  onChange={(e) => setCardForm(prev => ({ ...prev, back: e.target.value }))}
                  placeholder="Enter the answer..."
                  className="w-full px-3 py-2 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                    Hint (Optional)
                  </label>
                  <input
                    type="text"
                    value={cardForm.hint}
                    onChange={(e) => setCardForm(prev => ({ ...prev, hint: e.target.value }))}
                    placeholder="Clue shown before answering"
                    className="w-full px-3 py-2 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                    Example (Optional)
                  </label>
                  <input
                    type="text"
                    value={cardForm.example}
                    onChange={(e) => setCardForm(prev => ({ ...prev, example: e.target.value }))}
                    placeholder="Extra context shown on reveal"
                    className="w-full px-3 py-2 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="bg-secondary dark:bg-dark-secondary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                {editingCard ? 'Update Card' : 'Add Card'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-text-secondary/50 dark:bg-dark-text-secondary/50 text-text-primary dark:text-dark-text-primary px-6 py-2 rounded-lg hover:bg-text-secondary/70 dark:hover:bg-dark-text-secondary/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Card Button */}
      {!showAddCard && !editingCard && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddCard(true)}
            className="flex items-center space-x-2 bg-secondary dark:bg-dark-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>
      )}

      {leechCards.length > 0 && (
        <div className="mb-6 bg-warning/10 dark:bg-dark-warning/10 border border-warning/25 dark:border-dark-warning/25 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-warning dark:text-dark-warning mb-2">
            Leech Cards Needing Attention
          </h3>
          <div className="space-y-2">
            {leechCards.slice(0, 3).map((item) => (
              <div
                key={item.cardId}
                className="flex items-start justify-between gap-4 bg-card/70 dark:bg-dark-card/70 rounded-lg px-3 py-2"
              >
                <div className="text-text-primary dark:text-dark-text-primary">
                  {item.card.front}
                </div>
                <div className="text-xs text-text-secondary dark:text-dark-text-secondary text-right shrink-0">
                  <div>{item.incorrectStreak} wrong in a row</div>
                  <div>Leech score {item.leechCount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-4">
        {deck.cards && deck.cards.length > 0 ? (
          deck.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onEdit={handleEditCard}
              onDelete={handleDeleteCard}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-card/50 dark:bg-dark-card/50 backdrop-blur-sm rounded-xl">
            <div className="text-text-secondary dark:text-dark-text-secondary mb-4">No cards in this deck yet.</div>
            <button
              onClick={() => setShowAddCard(true)}
              className="bg-secondary dark:bg-dark-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              Add Your First Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckView;