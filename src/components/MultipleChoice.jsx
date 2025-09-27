import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { generateDistractors, shuffleArray } from '../utils/helpers';

const MultipleChoice = ({ 
  card, 
  allAnswers, 
  onAnswer, 
  onNext, 
  currentIndex, 
  totalCards 
}) => {
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Generate options when card changes (only when card.id changes)
    const distractors = generateDistractors(card.back, allAnswers, 3);
    const allOptions = [card.back, ...distractors];
    setOptions(shuffleArray(allOptions));
    setSelectedAnswer(null);
    setShowResult(false);
  }, [card.id]); // Only depend on card.id to prevent constant regeneration

  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    const correct = answer === card.back;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct);
  };

  const handleNext = () => {
    onNext();
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showResult && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleNext();
      } else if (!showResult && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (options[index]) {
          handleAnswerSelect(options[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showResult, options]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            Question {currentIndex + 1} of {totalCards}
          </span>
          <span className="text-sm font-medium text-text-primary">
            {Math.round(((currentIndex + 1) / totalCards) * 100)}%
          </span>
        </div>
        <div className="w-full bg-card/50 rounded-full h-2">
          <div 
            className="bg-secondary h-2 rounded-full transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-6 border-2 border-primary">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-medium text-text-primary mb-4">
            {card.front}
          </div>
          {!showResult && (
            <div className="text-sm text-text-secondary">
              Select your answer (or use keys 1-4)
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option, index) => {
          let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-500 ";
          
          if (!showResult) {
            buttonClass += "bg-card/90 border-text-secondary/20 hover:border-primary hover:bg-primary hover:text-white cursor-pointer";
          } else if (option === card.back) {
            buttonClass += "bg-secondary text-white border-secondary";
          } else if (option === selectedAnswer) {
            buttonClass += "bg-warning text-white border-warning";
          } else {
            buttonClass += "bg-text-secondary/10 text-text-secondary border-text-secondary/20";
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              className={buttonClass}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 text-lg">
                  {option}
                </div>
                {showResult && option === card.back && (
                  <Check className="w-5 h-5" />
                )}
                {showResult && option === selectedAnswer && option !== card.back && (
                  <X className="w-5 h-5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result and Next Button */}
      {showResult && (
        <div className="text-center">
          <div className={`text-lg font-medium mb-4 ${isCorrect ? 'text-secondary' : 'text-warning'}`}>
            {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
          </div>
          {!isCorrect && (
            <div className="text-text-secondary mb-4">
              The correct answer is: <span className="font-medium">{card.back}</span>
            </div>
          )}
          <button
            onClick={handleNext}
            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-400 hover:transform hover:scale-105"
          >
            {currentIndex === totalCards - 1 ? 'Finish' : 'Next Question'}
          </button>
        </div>
      )}

      {/* Keyboard shortcuts */}
      {!showResult && (
        <div className="mt-6 text-center text-sm text-text-secondary">
          Use keys 1-4 to select answers quickly
        </div>
      )}
    </div>
  );
};

export default MultipleChoice;