import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { ArrowLeft, Plus, Save } from 'lucide-react';

const CreateDeck = () => {
  const navigate = useNavigate();
  const { createDeck } = useDeck();
  const [deckData, setDeckData] = useState({
    title: '',
    description: '',
  });
  const [cards, setCards] = useState([
    { id: '1', front: '', back: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeckChange = (field, value) => {
    setDeckData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (cardId, field, value) => {
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, [field]: value } : card
    ));
  };

  const addCard = () => {
    const newCard = {
      id: Date.now().toString(),
      front: '',
      back: '',
    };
    setCards(prev => [...prev, newCard]);
  };

  const removeCard = (cardId) => {
    if (cards.length > 1) {
      setCards(prev => prev.filter(card => card.id !== cardId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate form
    if (!deckData.title.trim()) {
      alert('Please enter a deck title.');
      return;
    }

    const validCards = cards.filter(card => card.front.trim() && card.back.trim());
    if (validCards.length === 0) {
      alert('Please add at least one card with both front and back content.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createDeck({
        ...deckData,
        cards: validCards.map(card => ({
          ...card,
          front: card.front.trim(),
          back: card.back.trim(),
        })),
      });

      navigate('/');
    } catch (error) {
      alert('Failed to create deck: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/"
          className="p-2 text-gray-400 hover:text-accent-blue transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Create New Deck</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Deck Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-accent-pink">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Deck Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={deckData.title}
                onChange={(e) => handleDeckChange('title', e.target.value)}
                placeholder="Enter deck title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-pink"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={deckData.description}
                onChange={(e) => handleDeckChange('description', e.target.value)}
                placeholder="Describe what this deck is about..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-pink"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-accent-blue">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-gray-800">Cards</h2>
            <button
              type="button"
              onClick={addCard}
              className="flex items-center space-x-2 bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-400 hover:transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          </div>

          <div className="space-y-6">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="border border-gray-200 rounded-lg p-4 bg-white/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">Card {index + 1}</h3>
                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCard(card.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Front (Question)
                    </label>
                    <textarea
                      value={card.front}
                      onChange={(e) => handleCardChange(card.id, 'front', e.target.value)}
                      placeholder="Enter the question or prompt..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Back (Answer)
                    </label>
                    <textarea
                      value={card.back}
                      onChange={(e) => handleCardChange(card.id, 'back', e.target.value)}
                      placeholder="Enter the answer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-accent-pink text-white px-8 py-4 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400 hover:transform hover:scale-105"
          >
            <Save className="w-5 h-5" />
            <span>{isSubmitting ? 'Creating...' : 'Create Deck'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDeck;