import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { normalizeText, fuzzyMatch } from '../utils/helpers';

const IdentificationMode = ({ 
  card, 
  onAnswer, 
  onNext, 
  currentIndex, 
  totalCards 
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(null);
  const [showSupport, setShowSupport] = useState(false);
  const hasSupport = Boolean(card?.hint || card?.example);
  const inputRef = useRef(null);

  useEffect(() => {
    // Reset for new card
    setUserAnswer('');
    setShowResult(false);
    setConfidenceLevel(null);
    setShowSupport(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [card]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || showResult) return;
    
    const normalizedAnswer = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(card.back);
    
    // Check exact match first, then fuzzy match
    const correct = normalizedAnswer === normalizedCorrect || 
                   fuzzyMatch(normalizedAnswer, normalizedCorrect, 0.8);
    
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleConfidenceSelect = (level) => {
    if (!showResult || confidenceLevel) return;

    setConfidenceLevel(level);
    onAnswer(isCorrect, level);
  };

  const handleNext = () => {
    onNext();
  };

  const handleKeyPress = (e) => {
    if (showResult && (e.key === 'Enter' || e.code === 'Space')) {
      if (confidenceLevel) {
        e.preventDefault();
        handleNext();
      }
    } else if (showResult && !confidenceLevel && ['1', '2', '3'].includes(e.key)) {
      const map = { 1: 'hard', 2: 'medium', 3: 'easy' };
      handleConfidenceSelect(map[e.key]);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showResult, confidenceLevel]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Question {currentIndex + 1} of {totalCards}
          </span>
          <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
            {(() => {
              if (totalCards <= 1) return 100;
              return Math.round((currentIndex / (totalCards - 1)) * 100);
            })()}%
          </span>
        </div>
        <div className="w-full bg-card/50 dark:bg-dark-card/50 rounded-full h-2">
          <div 
            className="bg-accent dark:bg-dark-accent h-2 rounded-full transition-all duration-700"
            style={{ width: `${totalCards <= 1 ? 100 : (currentIndex / (totalCards - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-card/95 dark:bg-dark-card/95 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-6 border-2 border-accent dark:border-dark-accent">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-medium text-text-primary dark:text-dark-text-primary mb-4">
            {card.front}
          </div>
          {!showResult && (
            <div className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Type your answer below
            </div>
          )}
        </div>
      </div>

      {hasSupport && !showResult && (
        <div className="mb-4">
          <button
            onClick={() => setShowSupport(prev => !prev)}
            className="text-sm px-4 py-2 rounded-lg bg-accent/15 dark:bg-dark-accent/20 text-accent dark:text-dark-accent hover:bg-accent/25 dark:hover:bg-dark-accent/30 transition-colors"
          >
            {showSupport ? 'Hide Hint & Example' : 'Show Hint & Example'}
          </button>

          {showSupport && (
            <div className="mt-3 bg-card/85 dark:bg-dark-card/85 rounded-xl border border-accent/20 dark:border-dark-accent/25 p-4 text-left space-y-2">
              {card.hint && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">Hint</div>
                  <div className="text-text-primary dark:text-dark-text-primary">{card.hint}</div>
                </div>
              )}
              {card.example && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">Example</div>
                  <div className="text-text-primary dark:text-dark-text-primary whitespace-pre-wrap">{card.example}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Answer Input */}
      {!showResult && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter your answer..."
              className="flex-1 px-4 py-3 text-lg border-2 border-text-secondary/20 dark:border-dark-text-secondary/20 rounded-xl focus:border-accent dark:focus:border-dark-accent focus:outline-none bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary"
            />
            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className="px-6 py-3 bg-accent dark:bg-dark-accent text-white rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400 hover:transform hover:scale-105"
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {/* Result */}
      {showResult && (
        <div className="text-center">
          <div className="bg-card/95 dark:bg-dark-card/95 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border-2 border-text-secondary/20 dark:border-dark-text-secondary/20">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {isCorrect ? (
                <Check className="w-6 h-6 text-secondary dark:text-dark-secondary" />
              ) : (
                <X className="w-6 h-6 text-warning dark:text-dark-warning" />
              )}
              <span className={`text-lg font-medium ${isCorrect ? 'text-secondary dark:text-dark-secondary' : 'text-warning dark:text-dark-warning'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            
            <div className="space-y-2 text-left">
              <div>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Your answer:</span>
                <div className={`font-medium ${isCorrect ? 'text-secondary dark:text-dark-secondary' : 'text-warning dark:text-dark-warning'}`}>
                  {userAnswer}
                </div>
              </div>
              
              {!isCorrect && (
                <div>
                  <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Correct answer:</span>
                  <div className="font-medium text-secondary dark:text-dark-secondary">
                    {card.back}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-sm text-text-secondary dark:text-dark-text-secondary mb-2">
              Rate your confidence for scheduling
            </div>
            <div className="flex items-center justify-center gap-2">
              {[{ id: 'hard', label: 'Hard' }, { id: 'medium', label: 'Medium' }, { id: 'easy', label: 'Easy' }].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleConfidenceSelect(item.id)}
                  disabled={Boolean(confidenceLevel)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    confidenceLevel === item.id
                      ? 'bg-secondary dark:bg-dark-secondary text-white border-secondary dark:border-dark-secondary'
                      : 'bg-card/80 dark:bg-dark-card/80 border-text-secondary/25 dark:border-dark-text-secondary/25 text-text-primary dark:text-dark-text-primary hover:border-secondary dark:hover:border-dark-secondary'
                  } ${confidenceLevel ? 'opacity-80' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {!confidenceLevel && (
              <div className="text-xs text-text-secondary dark:text-dark-text-secondary mt-2">
                Quick keys: 1 Hard, 2 Medium, 3 Easy
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={!confidenceLevel}
            className="bg-primary dark:bg-dark-primary text-white px-8 py-3 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400 hover:transform hover:scale-105"
          >
            {!confidenceLevel
              ? 'Choose Confidence First'
              : currentIndex === totalCards - 1
                ? 'Finish'
                : 'Next Question'}
          </button>
        </div>
      )}

      {/* Instructions */}
      {!showResult && (
        <div className="text-center text-sm text-text-secondary dark:text-dark-text-secondary">
          Press Enter to submit your answer
        </div>
      )}
    </div>
  );
};

export default IdentificationMode;