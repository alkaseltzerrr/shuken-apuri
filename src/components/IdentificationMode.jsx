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
  const inputRef = useRef(null);

  useEffect(() => {
    // Reset for new card
    setUserAnswer('');
    setShowResult(false);
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
    onAnswer(correct);
  };

  const handleNext = () => {
    onNext();
  };

  const handleKeyPress = (e) => {
    if (showResult && (e.key === 'Enter' || e.code === 'Space')) {
      e.preventDefault();
      handleNext();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showResult]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Question {currentIndex + 1} of {totalCards}
          </span>
          <span className="text-sm font-medium text-gray-800">
            {Math.round(((currentIndex + 1) / totalCards) * 100)}%
          </span>
        </div>
        <div className="w-full bg-white/50 rounded-full h-2">
          <div 
            className="bg-accent-yellow h-2 rounded-full transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-6 border-2 border-accent-yellow">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-medium text-gray-800 mb-4">
            {card.front}
          </div>
          {!showResult && (
            <div className="text-sm text-gray-500">
              Type your answer below
            </div>
          )}
        </div>
      </div>

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
              className="flex-1 px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-accent-yellow focus:outline-none bg-white/90 backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className="px-6 py-3 bg-accent-yellow text-white rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400 hover:transform hover:scale-105"
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {/* Result */}
      {showResult && (
        <div className="text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {isCorrect ? (
                <Check className="w-6 h-6 text-accent-green" />
              ) : (
                <X className="w-6 h-6 text-red-500" />
              )}
              <span className={`text-lg font-medium ${isCorrect ? 'text-accent-green' : 'text-red-500'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            
            <div className="space-y-2 text-left">
              <div>
                <span className="text-sm text-gray-500">Your answer:</span>
                <div className={`font-medium ${isCorrect ? 'text-accent-green' : 'text-red-500'}`}>
                  {userAnswer}
                </div>
              </div>
              
              {!isCorrect && (
                <div>
                  <span className="text-sm text-gray-500">Correct answer:</span>
                  <div className="font-medium text-accent-green">
                    {card.back}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="bg-accent-pink text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-400 hover:transform hover:scale-105"
          >
            {currentIndex === totalCards - 1 ? 'Finish' : 'Next Question'}
          </button>
        </div>
      )}

      {/* Instructions */}
      {!showResult && (
        <div className="text-center text-sm text-gray-500">
          Press Enter to submit your answer
        </div>
      )}
    </div>
  );
};

export default IdentificationMode;