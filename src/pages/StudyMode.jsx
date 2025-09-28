import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { ArrowLeft, RotateCcw, Target, Type, Trophy, Home, BookOpen } from 'lucide-react';
import FlipCard from '../components/FlipCard';
import MultipleChoice from '../components/MultipleChoice';
import IdentificationMode from '../components/IdentificationMode';
import ConfirmModal from '../components/ConfirmModal';
import { createCardProgress, updateCardProgress, getCardsToReview } from '../utils/spacedRepetition';

const STUDY_MODES = {
  FLIP: 'flip',
  MULTIPLE_CHOICE: 'multiple_choice',
  IDENTIFICATION: 'identification',
};

const StudyMode = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { decks, progress, updateProgress } = useDeck();
  const [deck, setDeck] = useState(null);
  const [currentMode, setCurrentMode] = useState(STUDY_MODES.FLIP);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyCards, setStudyCards] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
  });
  const [showResults, setShowResults] = useState(false);
  const [deckProgress, setDeckProgress] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const returnRef = useRef(null);

  useEffect(() => {
    const foundDeck = decks.find(d => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
      
      // Initialize progress data if not exists
      const currentProgress = progress[deckId] || [];
      const progressMap = new Map(currentProgress.map(p => [p.cardId, p]));
      
      // Create progress entries for cards that don't have them
      const updatedProgress = foundDeck.cards.map(card => {
        return progressMap.get(card.id) || createCardProgress(card.id);
      });
      
      setDeckProgress(updatedProgress);
      
      // Determine which cards to study (due for review + some random cards)
      const dueCards = getCardsToReview(updatedProgress);
      const dueCardIds = new Set(dueCards.map(p => p.cardId));
      
      // Add due cards first
      let cardsToStudy = foundDeck.cards.filter(card => dueCardIds.has(card.id));
      
      // Add additional cards if needed (minimum 5 cards per session)
      if (cardsToStudy.length < 5) {
        const additionalCards = foundDeck.cards
          .filter(card => !dueCardIds.has(card.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 5 - cardsToStudy.length);
        cardsToStudy = [...cardsToStudy, ...additionalCards];
      }
      
      // Shuffle the study cards
      setStudyCards(cardsToStudy.sort(() => Math.random() - 0.5));
    } else {
      navigate('/');
    }
  }, [deckId, decks, progress, navigate]);

  // click outside handler for return popover
  useEffect(() => {
    const onClick = (e) => {
      if (showReturnModal && returnRef.current && !returnRef.current.contains(e.target)) {
        setShowReturnModal(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [showReturnModal]);

  const handleAnswer = (isCorrect) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1,
      total: prev.total + 1,
    }));

    // Update spaced repetition progress
    const currentCardProgress = deckProgress.find(p => p.cardId === currentCard.id);
    if (currentCardProgress) {
      const updatedProgress = updateCardProgress(currentCardProgress, isCorrect);
      const newDeckProgress = deckProgress.map(p => 
        p.cardId === currentCard.id ? updatedProgress : p
      );
      setDeckProgress(newDeckProgress);
    }
  };

  const handleNext = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Session finished
      setShowResults(true);
      // Save progress
      updateProgress(deckId, deckProgress);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const restartSession = () => {
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setShowResults(false);
    // Shuffle cards again
    setStudyCards(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const switchMode = (mode) => {
    // Prevent switching if user has already started answering
    if (sessionStats.total > 0) {
      return;
    }
    setCurrentMode(mode);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setShowResults(false);
  };

  const cancelSession = () => {
    setShowCancelModal(true);
  };

  const confirmCancelSession = () => {
    setShowCancelModal(false);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setShowResults(false);
    // Shuffle cards again
    setStudyCards(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const closeCancelModal = () => setShowCancelModal(false);

  if (!deck || studyCards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600 mb-4">
          {!deck ? 'Loading...' : 'No cards to study in this deck.'}
        </div>
        {!deck && (
          <Link
            to="/"
            className="text-primary hover:underline"
          >
            Go back to home
          </Link>
        )}
      </div>
    );
  }

  const currentCard = studyCards[currentCardIndex];
  const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        <div className="bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border-2 border-secondary dark:border-dark-secondary">
          <Trophy className="w-16 h-16 text-accent dark:text-dark-accent mx-auto mb-6" />
          
          <h2 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary mb-4">
            Session Complete! 🎉
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary dark:text-dark-secondary">
                {sessionStats.correct}
              </div>
              <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning dark:text-dark-warning">
                {sessionStats.incorrect}
              </div>
              <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary dark:text-dark-primary">
                {accuracy}%
              </div>
              <div className="text-sm text-text-secondary dark:text-dark-text-secondary">Accuracy</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <button
              onClick={restartSession}
              className="flex items-center space-x-2 bg-primary dark:bg-dark-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-400 hover:transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Study Again</span>
            </button>
            
            <Link
              to={`/deck/${deckId}`}
              className="flex items-center space-x-2 bg-primary dark:bg-dark-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-400 hover:transform hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Deck</span>
            </Link>
            
            <Link
              to="/"
              className="flex items-center space-x-2 bg-secondary dark:bg-dark-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-400 hover:transform hover:scale-105"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative" ref={returnRef}>
            <button
              onClick={() => setShowReturnModal(prev => !prev)}
              className="p-2 text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary transition-colors"
              aria-haspopup="true"
              aria-expanded={showReturnModal}
              id="return-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {/* Compact popover anchored to the arrow button */}
            {showReturnModal && (
              <div className="absolute right-full top-[54%] transform -translate-y-1/2 mr-0 z-50">
                {/* caret on right edge */}
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rotate-45 bg-card/95 dark:bg-dark-card/95 border border-gray-200/20 dark:border-dark-card/30" />

                <div className="bg-card/95 dark:bg-dark-card/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-200/20 dark:border-dark-card/30 p-1 w-36 animate-slide-down transform origin-right">
                  <div className="text-xs text-text-primary dark:text-dark-text-primary font-medium mb-1 text-center">Return to</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setShowReturnModal(false); navigate('/'); }}
                      className="flex flex-col items-center justify-center p-2 rounded-md bg-secondary dark:bg-dark-secondary text-white hover:opacity-95"
                    >
                      <Home className="w-5 h-5 mb-1" />
                      <span className="text-xs">Home</span>
                    </button>
                    <button
                      onClick={() => { setShowReturnModal(false); navigate(`/deck/${deckId}`); }}
                      className="flex flex-col items-center justify-center p-2 rounded-md bg-primary dark:bg-dark-primary text-white hover:opacity-95"
                    >
                      <BookOpen className="w-5 h-5 mb-1" />
                      <span className="text-xs">Deck</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{deck.title}</h1>
            <div className="text-sm text-text-secondary dark:text-dark-text-secondary">
              {currentMode === STUDY_MODES.FLIP 
                ? 'Study Session • Flashcards'
                : `Study Session • ${sessionStats.correct}/${sessionStats.total} correct (${accuracy}% accuracy)`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center relative">
        {sessionStats.total > 0 && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
            <div className="relative group animate-slide-down">
              <div className="absolute inset-0 -m-4 rounded-lg transition-opacity duration-700 ease-out opacity-0 group-hover:opacity-100"></div>
              <div className="relative transition-all duration-700 ease-out opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-95">
                <div className="bg-card/95 dark:bg-dark-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-warning/20 dark:border-dark-warning/20 px-4 py-3">
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-2 transition-all duration-700 ease-out">
                    You have started answering. Cancel the session to switch modes.
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={cancelSession}
                      className="text-sm bg-warning dark:bg-dark-warning text-white px-3 py-1 rounded-md hover:bg-opacity-90 transition-all duration-300 hover:transform hover:scale-105 animate-pulse-subtle"
                    >
                      Cancel Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => switchMode(STUDY_MODES.FLIP)}
          disabled={sessionStats.total > 0 && currentMode !== STUDY_MODES.FLIP}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-400 ${
            currentMode === STUDY_MODES.FLIP
              ? 'bg-primary dark:bg-dark-primary text-white'
              : sessionStats.total > 0
              ? 'bg-card/50 dark:bg-dark-card/50 text-text-secondary dark:text-dark-text-secondary cursor-not-allowed opacity-50'
              : 'bg-card/80 dark:bg-dark-card/80 text-text-primary dark:text-dark-text-primary hover:bg-primary dark:hover:bg-dark-primary hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Flip Cards</span>
        </button>
        
        <button
          onClick={() => switchMode(STUDY_MODES.MULTIPLE_CHOICE)}
          disabled={sessionStats.total > 0 && currentMode !== STUDY_MODES.MULTIPLE_CHOICE}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-400 ${
            currentMode === STUDY_MODES.MULTIPLE_CHOICE
              ? 'bg-secondary dark:bg-dark-secondary text-white'
              : sessionStats.total > 0
              ? 'bg-card/50 dark:bg-dark-card/50 text-text-secondary dark:text-dark-text-secondary cursor-not-allowed opacity-50'
              : 'bg-card/80 dark:bg-dark-card/80 text-text-primary dark:text-dark-text-primary hover:bg-secondary dark:hover:bg-dark-secondary hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Multiple Choice</span>
        </button>
        
        <button
          onClick={() => switchMode(STUDY_MODES.IDENTIFICATION)}
          disabled={sessionStats.total > 0 && currentMode !== STUDY_MODES.IDENTIFICATION}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-400 ${
            currentMode === STUDY_MODES.IDENTIFICATION
              ? 'bg-accent dark:bg-dark-accent text-white'
              : sessionStats.total > 0
              ? 'bg-card/50 dark:bg-dark-card/50 text-text-secondary dark:text-dark-text-secondary cursor-not-allowed opacity-50'
              : 'bg-card/80 dark:bg-dark-card/80 text-text-primary dark:text-dark-text-primary hover:bg-accent dark:hover:bg-dark-accent hover:text-white'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Type Answer</span>
        </button>
      </div>

      {/* Study Component */}
      {currentMode === STUDY_MODES.FLIP && (
        <FlipCard
          card={currentCard}
          onNext={handleNext}
          onPrevious={handlePrevious}
          currentIndex={currentCardIndex}
          totalCards={studyCards.length}
        />
      )}

      {currentMode === STUDY_MODES.MULTIPLE_CHOICE && (
        <MultipleChoice
          card={currentCard}
          allAnswers={studyCards.map(card => card.back)}
          onAnswer={handleAnswer}
          onNext={handleNext}
          currentIndex={currentCardIndex}
          totalCards={studyCards.length}
        />
      )}

      {currentMode === STUDY_MODES.IDENTIFICATION && (
        <IdentificationMode
          card={currentCard}
          onAnswer={handleAnswer}
          onNext={handleNext}
          currentIndex={currentCardIndex}
          totalCards={studyCards.length}
        />
      )}
      {showCancelModal && (
        <ConfirmModal
          title="Cancel Session"
          description="Are you sure you want to cancel the current session? Your progress will be lost."
          confirmText="OK"
          cancelText="Keep"
          onConfirm={confirmCancelSession}
          onCancel={closeCancelModal}
        />
      )}
      {/* small anchored popover is used instead of a full-screen modal */}
    </div>
  );
};

export default StudyMode;