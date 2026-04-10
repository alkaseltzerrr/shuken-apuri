import { Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { Plus, Upload, BookOpen, CalendarDays, Play } from 'lucide-react';
import DeckCard from '../components/DeckCard';
import { exportDeck, importDeck } from '../utils/helpers';

const Home = () => {
  const { decks, deleteDeck, createDeck, progress } = useDeck();
  const now = new Date();

  const deckQueues = decks
    .map((deck) => {
      const deckProgress = progress[deck.id] || [];
      const progressByCardId = new Map(deckProgress.map((item) => [item.cardId, item]));

      // Cards with no progress are treated as due so users can start studying immediately.
      const dueCount = (deck.cards || []).reduce((count, card) => {
        const cardProgress = progressByCardId.get(card.id);
        if (!cardProgress || !cardProgress.nextReview) {
          return count + 1;
        }

        return new Date(cardProgress.nextReview) <= now ? count + 1 : count;
      }, 0);

      return {
        deckId: deck.id,
        title: deck.title,
        dueCount,
      };
    })
    .filter((item) => item.dueCount > 0)
    .sort((a, b) => b.dueCount - a.dueCount);

  const totalDueToday = deckQueues.reduce((sum, item) => sum + item.dueCount, 0);

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
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-dark-text-primary mb-4 font-japanese">
          集験アプリ
        </h1>
        <p className="text-xl text-text-secondary dark:text-dark-text-secondary mb-6">
          Your friendly flashcard companion for effective learning
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link
            to="/create"
            className="flex items-center space-x-2 bg-primary dark:bg-dark-primary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Deck</span>
          </Link>
          
          <label className="flex items-center space-x-2 bg-primary dark:bg-dark-primary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105 shadow-md cursor-pointer">
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

      {/* Daily Study Queue */}
      <div className="mb-8">
        <div className="bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-xl shadow-md p-6 border border-text-secondary/15 dark:border-dark-text-secondary/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <CalendarDays className="w-5 h-5 text-primary dark:text-dark-primary" />
                <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Today&apos;s Study Queue</h2>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                {totalDueToday > 0
                  ? `${totalDueToday} cards are due across ${deckQueues.length} deck${deckQueues.length > 1 ? 's' : ''}.`
                  : 'No cards are due right now. You can still study any deck anytime.'}
              </p>
            </div>

            {deckQueues.length > 0 && (
              <Link
                to={`/deck/${deckQueues[0].deckId}/study`}
                className="inline-flex items-center justify-center space-x-2 bg-secondary dark:bg-dark-secondary text-white px-5 py-2.5 rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105"
              >
                <Play className="w-4 h-4" />
                <span>Start Daily Queue</span>
              </Link>
            )}
          </div>

          {deckQueues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {deckQueues.map((item) => (
                <div
                  key={item.deckId}
                  className="flex items-center justify-between bg-background/70 dark:bg-dark-background/70 rounded-lg px-4 py-3 border border-text-secondary/10 dark:border-dark-text-secondary/10"
                >
                  <div>
                    <div className="font-medium text-text-primary dark:text-dark-text-primary">{item.title}</div>
                    <div className="text-sm text-accent dark:text-dark-accent">{item.dueCount} due today</div>
                  </div>
                  <Link
                    to={`/deck/${item.deckId}/study`}
                    className="text-sm bg-primary dark:bg-dark-primary text-white px-3 py-1.5 rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    Study
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-text-secondary dark:text-dark-text-secondary bg-background/60 dark:bg-dark-background/60 rounded-lg px-4 py-3 border border-dashed border-text-secondary/20 dark:border-dark-text-secondary/20">
              You are all caught up for now. Try a quick review session to stay sharp.
            </div>
          )}
        </div>
      </div>

      {/* Decks Grid */}
      {decks.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-text-secondary dark:text-dark-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
            No decks yet
          </h3>
          <p className="text-text-secondary dark:text-dark-text-secondary mb-6">
            Create your first deck to start learning!
          </p>
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 bg-secondary dark:bg-dark-secondary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105"
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
                className="absolute top-4 right-4 p-2 text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary transition-colors bg-card/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-full"
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
          <div className="bg-card/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-xl shadow-md p-6 inline-block">
            <h3 className="text-lg font-medium text-text-primary dark:text-dark-text-primary mb-2">
              Learning Progress
            </h3>
            <div className="flex items-center space-x-8 text-sm">
              <div>
                <div className="text-2xl font-bold text-primary dark:text-dark-primary">
                  {decks.length}
                </div>
                <div className="text-text-secondary dark:text-dark-text-secondary">Decks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary dark:text-dark-primary">
                  {decks.reduce((total, deck) => total + (deck.cards?.length || 0), 0)}
                </div>
                <div className="text-text-secondary dark:text-dark-text-secondary">Cards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary dark:text-dark-secondary">
                  {Object.keys(progress).length}
                </div>
                <div className="text-text-secondary dark:text-dark-text-secondary">In Progress</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;