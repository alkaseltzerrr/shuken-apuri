import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

const EditDeck = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { decks, updateDeck, deleteDeck } = useDeck();
  const [deck, setDeck] = useState(null);
  const [deckData, setDeckData] = useState({
    title: '',
    description: '',
    language: '',
    subject: '',
    exam: '',
    difficulty: 'Beginner',
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const foundDeck = decks.find(d => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
      setDeckData({
        title: foundDeck.title,
        description: foundDeck.description || '',
        language: foundDeck.language || '',
        subject: foundDeck.subject || '',
        exam: foundDeck.exam || '',
        difficulty: foundDeck.difficulty || 'Beginner',
        tags: Array.isArray(foundDeck.tags) ? foundDeck.tags.join(', ') : '',
      });
    } else {
      navigate('/');
    }
  }, [deckId, decks, navigate]);

  const handleDeckChange = (field, value) => {
    setDeckData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!deckData.title.trim()) {
      alert('Please enter a deck title.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateDeck(deckId, {
        title: deckData.title.trim(),
        description: deckData.description.trim(),
        language: deckData.language.trim(),
        subject: deckData.subject.trim(),
        exam: deckData.exam.trim(),
        difficulty: deckData.difficulty,
        tags: deckData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
      });

  navigate('/');
    } catch (error) {
      alert('Failed to update deck: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${deck.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deleteDeck(deckId);
        navigate('/');
      } catch (error) {
        alert('Failed to delete deck: ' + error.message);
      }
    }
  };

  if (!deck) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-text-secondary dark:text-dark-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/"
          className="p-2 text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Edit Deck</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deck Info */}
        <div className="bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-accent dark:border-dark-accent">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                Title *
              </label>
              <input
                type="text"
                value={deckData.title}
                onChange={(e) => handleDeckChange('title', e.target.value)}
                placeholder="Enter deck title..."
                className="w-full px-4 py-3 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                Description
              </label>
              <textarea
                value={deckData.description}
                onChange={(e) => handleDeckChange('description', e.target.value)}
                placeholder="Describe what this deck is about..."
                className="w-full px-4 py-3 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                  Language
                </label>
                <input
                  type="text"
                  value={deckData.language}
                  onChange={(e) => handleDeckChange('language', e.target.value)}
                  placeholder="Japanese, English, Spanish..."
                  className="w-full px-4 py-3 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={deckData.subject}
                  onChange={(e) => handleDeckChange('subject', e.target.value)}
                  placeholder="Language, Biology, History..."
                  className="w-full px-4 py-3 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                  Exam
                </label>
                <input
                  type="text"
                  value={deckData.exam}
                  onChange={(e) => handleDeckChange('exam', e.target.value)}
                  placeholder="JLPT N5, SAT, Midterm..."
                  className="w-full px-4 py-3 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                  Difficulty
                </label>
                <select
                  value={deckData.difficulty}
                  onChange={(e) => handleDeckChange('difficulty', e.target.value)}
                  className="w-full px-4 py-3 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={deckData.tags}
                onChange={(e) => handleDeckChange('tags', e.target.value)}
                placeholder="kanji, grammar, verbs"
                className="w-full px-4 py-3 border border-text-secondary/30 dark:border-dark-text-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary dark:bg-dark-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:transform hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center space-x-2 bg-warning dark:bg-dark-warning text-white px-6 py-3 rounded-lg hover:bg-warning dark:hover:bg-dark-warning transition-all duration-200 hover:transform hover:scale-105"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Deck</span>
          </button>
        </div>

        {/* Deck Stats */}
        <div className="bg-card/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-medium text-text-primary dark:text-dark-text-primary mb-2">Deck Statistics</h3>
          <div className="text-sm text-text-secondary dark:text-dark-text-secondary space-y-1">
            <div>Cards: {deck.cards?.length || 0}</div>
            <div>Created: {new Date(deck.createdAt).toLocaleDateString()}</div>
            <div>Last updated: {new Date(deck.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Note */}
        <div className="text-sm text-text-secondary dark:text-dark-text-secondary text-center">
          To edit individual cards, go back to the deck view and use the card management tools.
        </div>
      </form>
    </div>
  );
};

export default EditDeck;