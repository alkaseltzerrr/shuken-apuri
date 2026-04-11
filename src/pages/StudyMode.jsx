import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { ArrowLeft, RotateCcw, Target, Type, Trophy, Home, BookOpen } from 'lucide-react';
import FlipCard from '../components/FlipCard';
import MultipleChoice from '../components/MultipleChoice';
import IdentificationMode from '../components/IdentificationMode';
import ConfirmModal from '../components/ConfirmModal';
import { BOXES, createCardProgress, updateCardProgress } from '../utils/spacedRepetition';

const STUDY_MODES = {
  FLIP: 'flip',
  MULTIPLE_CHOICE: 'multiple_choice',
  IDENTIFICATION: 'identification',
};

const SESSION_PRESETS = {
  SMART: 'smart',
  QUICK_5: 'quick_5',
  TEN_CARDS: 'ten_cards',
  DUE_ONLY: 'due_only',
  NEW_ONLY: 'new_only',
};

const PRESET_OPTIONS = [
  { id: SESSION_PRESETS.SMART, label: 'Smart Mix' },
  { id: SESSION_PRESETS.QUICK_5, label: 'Quick 5 Min' },
  { id: SESSION_PRESETS.TEN_CARDS, label: '10 Cards' },
  { id: SESSION_PRESETS.DUE_ONLY, label: 'Due Only' },
  { id: SESSION_PRESETS.NEW_ONLY, label: 'New Only' },
];

const QUICK_PRESET_CARD_TARGET = 12;
const TEN_CARD_TARGET = 10;
const SMART_MIN_CARD_TARGET = 5;

const DEFAULT_CONFIDENCE = 'medium';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'what', 'when', 'where', 'which',
  'how', 'are', 'was', 'were', 'you', 'your', 'into', 'about', 'have', 'has', 'had',
  'why', 'who', 'can', 'could', 'would', 'should', 'answer', 'question', 'card', 'deck',
]);

const shuffleCards = (cards) => [...cards].sort(() => Math.random() - 0.5);

const getPresetLabel = (preset) => {
  return PRESET_OPTIONS.find((item) => item.id === preset)?.label || 'Smart Mix';
};

const getPresetEmptyMessage = (preset) => {
  if (preset === SESSION_PRESETS.DUE_ONLY) {
    return 'No cards are due right now for this deck.';
  }

  if (preset === SESSION_PRESETS.NEW_ONLY) {
    return 'No new cards left in this deck.';
  }

  return 'No cards available for this preset.';
};

const capitalizeWord = (word) => {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : '';
};

const extractTokens = (text) => {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !STOP_WORDS.has(item));
};

const getResponsePhases = (answerLog) => {
  if (!answerLog.length) return [];

  const phaseSize = Math.max(1, Math.ceil(answerLog.length / 3));
  const phases = [
    { label: 'Early', items: answerLog.slice(0, phaseSize) },
    { label: 'Middle', items: answerLog.slice(phaseSize, phaseSize * 2) },
    { label: 'Late', items: answerLog.slice(phaseSize * 2) },
  ].filter((phase) => phase.items.length > 0);

  return phases.map((phase) => {
    const correct = phase.items.filter((item) => item.isCorrect).length;
    return {
      label: phase.label,
      total: phase.items.length,
      accuracy: Math.round((correct / phase.items.length) * 100),
    };
  });
};

const getSessionAnalytics = (answerLog, cardsById, fallbackTopic) => {
  if (!answerLog.length) {
    return {
      weakTopics: [],
      hardestCards: [],
      responseTrend: [],
    };
  }

  const topicScores = new Map();
  const cardScores = new Map();

  answerLog.forEach((answer) => {
    const card = cardsById.get(answer.cardId);
    const difficultyPoints = (!answer.isCorrect ? 2 : 0) + (answer.confidence === 'hard' ? 2 : answer.confidence === 'medium' ? 1 : 0);

    if (difficultyPoints > 0) {
      const tokenSource = [card?.front, card?.subject, card?.topic, fallbackTopic]
        .filter(Boolean)
        .join(' ');

      extractTokens(tokenSource).forEach((token) => {
        topicScores.set(token, (topicScores.get(token) || 0) + difficultyPoints);
      });
    }

    if (card) {
      const cardSummary = cardScores.get(answer.cardId) || {
        cardId: answer.cardId,
        front: card.front,
        score: 0,
      };
      cardSummary.score += difficultyPoints;
      cardScores.set(answer.cardId, cardSummary);
    }
  });

  const weakTopics = [...topicScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([topic]) => capitalizeWord(topic));

  const hardestCards = [...cardScores.values()]
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return {
    weakTopics,
    hardestCards,
    responseTrend: getResponsePhases(answerLog),
  };
};

const initializeDeckProgress = (cards, currentProgress) => {
  const progressMap = new Map(currentProgress.map((item) => [item.cardId, item]));
  return cards.map((card) => progressMap.get(card.id) || createCardProgress(card.id));
};

const getCardsForPreset = (cards, progressEntries, preset) => {
  const now = new Date();
  const progressByCardId = new Map(progressEntries.map((item) => [item.cardId, item]));
  const dueCards = cards
    .filter((card) => {
      const cardProgress = progressByCardId.get(card.id);
      return cardProgress && new Date(cardProgress.nextReview) <= now;
    })
    .sort((left, right) => {
      const leftDue = new Date(progressByCardId.get(left.id)?.nextReview || now).getTime();
      const rightDue = new Date(progressByCardId.get(right.id)?.nextReview || now).getTime();
      return leftDue - rightDue;
    });

  const newCards = cards.filter((card) => {
    const cardProgress = progressByCardId.get(card.id);
    if (!cardProgress) return true;

    return cardProgress.box === BOXES.NEW || Number(cardProgress.totalReviews) === 0;
  });

  const notDueCards = cards.filter((card) => !dueCards.some((dueCard) => dueCard.id === card.id));

  if (preset === SESSION_PRESETS.DUE_ONLY) {
    return dueCards;
  }

  if (preset === SESSION_PRESETS.NEW_ONLY) {
    return shuffleCards(newCards);
  }

  if (preset === SESSION_PRESETS.TEN_CARDS) {
    return shuffleCards(cards).slice(0, TEN_CARD_TARGET);
  }

  if (preset === SESSION_PRESETS.QUICK_5) {
    let quickCards = dueCards.slice(0, QUICK_PRESET_CARD_TARGET);
    if (quickCards.length < QUICK_PRESET_CARD_TARGET) {
      const needed = QUICK_PRESET_CARD_TARGET - quickCards.length;
      quickCards = [...quickCards, ...shuffleCards(notDueCards).slice(0, needed)];
    }
    return shuffleCards(quickCards);
  }

  let smartCards = [...dueCards];
  if (smartCards.length < SMART_MIN_CARD_TARGET) {
    const needed = SMART_MIN_CARD_TARGET - smartCards.length;
    smartCards = [...smartCards, ...shuffleCards(notDueCards).slice(0, needed)];
  }

  return shuffleCards(smartCards);
};

const StudyMode = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { decks, progress, updateProgress, recordStudyActivity } = useDeck();
  const [deck, setDeck] = useState(null);
  const [currentMode, setCurrentMode] = useState(STUDY_MODES.FLIP);
  const [sessionPreset, setSessionPreset] = useState(SESSION_PRESETS.SMART);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyCards, setStudyCards] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
  });
  const [sessionAnswerLog, setSessionAnswerLog] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [deckProgress, setDeckProgress] = useState([]);
  const [emptyPresetMessage, setEmptyPresetMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const returnRef = useRef(null);
  const popoverFirstButtonRef = useRef(null);
  const popoverSecondButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const deckProgressRef = useRef([]);

  useEffect(() => {
    const foundDeck = decks.find(d => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
      const currentProgress = progress[deckId] || [];
      const updatedProgress = initializeDeckProgress(foundDeck.cards, currentProgress);
      
      setDeckProgress(updatedProgress);
      deckProgressRef.current = updatedProgress;

      const cardsToStudy = getCardsForPreset(foundDeck.cards, updatedProgress, sessionPreset);
      setStudyCards(cardsToStudy);
      setEmptyPresetMessage(cardsToStudy.length === 0 ? getPresetEmptyMessage(sessionPreset) : '');
    } else {
      navigate('/');
    }
  }, [deckId, decks, progress, navigate, sessionPreset]);

  useEffect(() => {
    deckProgressRef.current = deckProgress;
  }, [deckProgress]);

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

  // focus management & keyboard navigation for popover
  useEffect(() => {
    if (showReturnModal) {
      previousFocusRef.current = document.activeElement;
      setTimeout(() => popoverFirstButtonRef.current?.focus(), 0);

      const onKey = (e) => {
        if (e.key === 'Escape') {
          setShowReturnModal(false);
          previousFocusRef.current?.focus?.();
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          popoverSecondButtonRef.current?.focus();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          popoverFirstButtonRef.current?.focus();
        }
      };

      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
      };
    } else {
      // when popover closes, restore focus
      previousFocusRef.current?.focus?.();
    }
  }, [showReturnModal]);

  const handleAnswer = (isCorrect, confidence = DEFAULT_CONFIDENCE) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    setSessionAnswerLog(prev => ([
      ...prev,
      {
        cardId: currentCard.id,
        isCorrect,
        confidence,
      },
    ]));

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1,
      total: prev.total + 1,
    }));

    // Update spaced repetition progress
    const currentCardProgress = deckProgress.find(p => p.cardId === currentCard.id);
    if (currentCardProgress) {
      const updatedProgress = updateCardProgress(currentCardProgress, isCorrect, confidence);
      const newDeckProgress = deckProgress.map(p => 
        p.cardId === currentCard.id ? updatedProgress : p
      );
      setDeckProgress(newDeckProgress);
      deckProgressRef.current = newDeckProgress;
    }
  };

  const handleNext = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Session finished
      const cardsReviewed = currentMode === STUDY_MODES.FLIP
        ? studyCards.length
        : Math.max(sessionStats.total, currentCardIndex + 1);

      recordStudyActivity(cardsReviewed);
      setShowResults(true);
      // Save progress
      updateProgress(deckId, deckProgressRef.current);
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
    setSessionAnswerLog([]);
    setShowResults(false);
    // Shuffle cards again
    setStudyCards(prev => shuffleCards(prev));
  };

  const switchMode = (mode) => {
    // Prevent switching if user has already started answering
    if (sessionStats.total > 0) {
      return;
    }
    setCurrentMode(mode);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setSessionAnswerLog([]);
    setShowResults(false);
  };

  const cancelSession = () => {
    setShowCancelModal(true);
  };

  const switchPreset = (preset) => {
    if (sessionStats.total > 0) {
      return;
    }

    setSessionPreset(preset);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setSessionAnswerLog([]);
    setShowResults(false);
  };

  const confirmCancelSession = () => {
    setShowCancelModal(false);
    setCurrentCardIndex(0);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setSessionAnswerLog([]);
    setShowResults(false);

    if (!deck) return;

    const currentProgress = progress[deckId] || [];
    const refreshedProgress = initializeDeckProgress(deck.cards, currentProgress);
    setDeckProgress(refreshedProgress);
    deckProgressRef.current = refreshedProgress;

    const cardsToStudy = getCardsForPreset(deck.cards, refreshedProgress, sessionPreset);
    setStudyCards(cardsToStudy);
    setEmptyPresetMessage(cardsToStudy.length === 0 ? getPresetEmptyMessage(sessionPreset) : '');
  };

  const closeCancelModal = () => setShowCancelModal(false);

  if (!deck || studyCards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600 mb-4">
          {!deck ? 'Loading...' : emptyPresetMessage || 'No cards to study in this deck.'}
        </div>
        {deck && sessionPreset !== SESSION_PRESETS.SMART && (
          <button
            onClick={() => switchPreset(SESSION_PRESETS.SMART)}
            className="bg-primary dark:bg-dark-primary text-white px-5 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Use Smart Mix Instead
          </button>
        )}
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
  const currentCardProgress = deckProgress.find((item) => item.cardId === currentCard?.id);
  const isCurrentCardLeech = Boolean(currentCardProgress?.isLeech);
  const cardsById = new Map(studyCards.map((card) => [card.id, card]));
  const analytics = getSessionAnalytics(sessionAnswerLog, cardsById, deck?.subject || '');

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

          <div className="text-left mb-8 bg-background/50 dark:bg-dark-background/50 rounded-xl p-5 border border-text-secondary/15 dark:border-dark-text-secondary/15">
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
              Session Insights
            </h3>

            {sessionAnswerLog.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                No scored responses were captured in this session. Try Multiple Choice or Type Answer for deeper analytics.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Weak Topics</div>
                  {analytics.weakTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analytics.weakTopics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2.5 py-1 text-xs rounded-full bg-warning/15 dark:bg-dark-warning/20 text-warning dark:text-dark-warning border border-warning/30 dark:border-dark-warning/30"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-text-secondary dark:text-dark-text-secondary">No weak topic pattern detected yet.</div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Hardest Cards</div>
                  {analytics.hardestCards.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.hardestCards.map((item) => (
                        <div
                          key={item.cardId}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-card/70 dark:bg-dark-card/70"
                        >
                          <div className="text-sm text-text-primary dark:text-dark-text-primary truncate">
                            {item.front}
                          </div>
                          <div className="text-xs text-text-secondary dark:text-dark-text-secondary shrink-0">
                            score {item.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-text-secondary dark:text-dark-text-secondary">All cards looked stable this session.</div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Response Trend</div>
                  <div className="space-y-2">
                    {analytics.responseTrend.map((phase) => (
                      <div key={phase.label}>
                        <div className="flex items-center justify-between text-xs text-text-secondary dark:text-dark-text-secondary mb-1">
                          <span>{phase.label}</span>
                          <span>{phase.accuracy}% ({phase.total} answered)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-text-secondary/20 dark:bg-dark-text-secondary/20 overflow-hidden">
                          <div
                            className="h-full bg-secondary dark:bg-dark-secondary transition-all duration-500"
                            style={{ width: `${phase.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
              onDoubleClick={() => navigate('/')}
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

                <div className="bg-card/95 dark:bg-dark-card/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-200/20 dark:border-dark-card/30 p-1 w-24 animate-slide-down transform origin-right">
                  <div className="flex flex-col gap-2">
                    <button
                      ref={popoverFirstButtonRef}
                      role="menuitem"
                      onClick={() => { setShowReturnModal(false); navigate('/'); }}
                      aria-label="Home"
                      className="w-full flex items-center justify-center p-1.5 rounded-md bg-primary dark:bg-dark-primary text-white hover:opacity-95"
                    >
                      <Home className="w-5 h-5" />
                    </button>
                    <button
                      ref={popoverSecondButtonRef}
                      role="menuitem"
                      onClick={() => { setShowReturnModal(false); navigate(`/deck/${deckId}`); }}
                      aria-label="Deck"
                      className="w-full flex items-center justify-center p-1.5 rounded-md bg-secondary dark:bg-dark-secondary text-white hover:opacity-95"
                    >
                      <BookOpen className="w-5 h-5" />
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
                ? `Study Session • ${getPresetLabel(sessionPreset)} • Flashcards`
                : `Study Session • ${sessionStats.correct}/${sessionStats.total} correct (${accuracy}% accuracy)`
              }
            </div>
            {isCurrentCardLeech && (
              <div className="inline-flex items-center mt-2 text-xs font-medium px-2 py-1 rounded-full bg-warning/15 dark:bg-dark-warning/20 text-warning dark:text-dark-warning border border-warning/30 dark:border-dark-warning/30">
                Leech Card: needs extra repetition
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Presets */}
      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        {PRESET_OPTIONS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => switchPreset(preset.id)}
            disabled={sessionStats.total > 0 && sessionPreset !== preset.id}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
              sessionPreset === preset.id
                ? 'bg-primary dark:bg-dark-primary text-white'
                : sessionStats.total > 0
                  ? 'bg-card/50 dark:bg-dark-card/50 text-text-secondary dark:text-dark-text-secondary cursor-not-allowed opacity-50'
                  : 'bg-card/80 dark:bg-dark-card/80 text-text-primary dark:text-dark-text-primary hover:bg-primary dark:hover:bg-dark-primary hover:text-white'
            }`}
          >
            {preset.label}
          </button>
        ))}
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
                    You have started answering. Cancel the session to switch modes or presets.
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