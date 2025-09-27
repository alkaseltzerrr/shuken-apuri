import { Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { Plus, Upload, BookOpen } from 'lucide-react';
import DeckCard from '../components/DeckCard';
import { exportDeck, importDeck } from '../utils/helpers';

const Home = () => {
  const { decks, deleteDeck, createDeck, progress } = useDeck();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const importedDeck = await importDeck(file);
      await createDeck({
        title: importedDeck.title,
        description: importedDeck.description,
        cards: importedDeck.cards || [],
      });
      alert('Deck imported successfully!');
    } catch (error) {
      alert('Failed to import deck: ' + error.message);
    }
    e.target.value = '';
  };

  const handleExport = (deck) => {
    exportDeck(deck);
  };

  const handleDelete = async (deckId) => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      await deleteDeck(deckId);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 font-japanese">
          集験アプリ
        </h1>
        <p className="text-xl text-text-secondary mb-6">
          Your friendly flashcard companion for effective learning
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link
            to="/create"
            className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Deck</span>
          </Link>
          
          <label className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105 shadow-md cursor-pointer">
            <Upload className="w-5 h-5" />
            <span>Import Deck</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Decks Grid */}
      {decks.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-medium text-text-secondary mb-2">
            No decks yet
          </h3>
          <p className="text-text-secondary mb-6">
            Create your first deck to start learning!
          </p>
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 bg-secondary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Deck</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div key={deck.id} className="relative">
              <DeckCard
                deck={deck}
                progress={progress[deck.id] || []}
                onDelete={handleDelete}
              />
              
              {/* Export button */}
              <button
                onClick={() => handleExport(deck)}
                className="absolute top-4 right-12 p-2 text-text-secondary hover:text-primary transition-colors bg-card/80 rounded-full"
                title="Export deck"
              >
                <Upload className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {decks.length > 0 && (
        <div className="mt-12 text-center">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-md p-6 inline-block">
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Learning Progress
            </h3>
            <div className="flex items-center space-x-8 text-sm">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {decks.length}
                </div>
                <div className="text-text-secondary">Decks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {decks.reduce((total, deck) => total + (deck.cards?.length || 0), 0)}
                </div>
                <div className="text-text-secondary">Cards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">
                  {Object.keys(progress).length}
                </div>
                <div className="text-text-secondary">In Progress</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;