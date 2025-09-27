import { useState, useEffect } from 'react';
import { RotateCcw, ArrowLeft, ArrowRight, Space } from 'lucide-react';

const FlipCard = ({ card, onNext, onPrevious, currentIndex, totalCards }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      } else if (e.key === 'ArrowLeft') {
        onPrevious();
      } else if (e.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, onNext, onPrevious]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span className="text-sm font-medium text-text-primary">
            {Math.round(((currentIndex + 1) / totalCards) * 100)}%
          </span>
        </div>
        <div className="w-full bg-card/50 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Card */}
      <div 
        className="relative w-full h-80 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-out transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 w-full h-full bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border-2 border-primary backface-hidden flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-medium text-text-primary mb-4">
                {card.front}
              </div>
              <div className="text-sm text-text-secondary">
                Click or press Space to reveal answer
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 w-full h-full bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border-2 border-secondary backface-hidden rotate-y-180 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-xl md:text-2xl text-text-primary whitespace-pre-wrap">
                {card.back}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center space-x-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center space-x-2 px-6 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all duration-400"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Flip</span>
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex === totalCards - 1}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard shortcuts */}
      <div className="mt-6 text-center text-sm text-text-secondary space-y-1">
        <div>Keyboard shortcuts:</div>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-1">
            <Space className="w-3 h-3" />
            <span>Flip card</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Previous</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowRight className="w-3 h-3" />
            <span>Next</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;