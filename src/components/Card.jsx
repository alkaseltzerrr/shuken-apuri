import { useState } from 'react';
import { Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';

const Card = ({ card, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-md border-2 border-transparent hover:border-primary transition-all duration-200 hover:shadow-lg animate-fade-in">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-text-primary mb-1">
              {card.front}
            </div>
            {!isExpanded && (
              <div className="text-sm text-text-secondary truncate">
                {card.back}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
              className="p-1 text-text-secondary hover:text-primary transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="p-1 text-text-secondary hover:text-warning transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-text-secondary/20">
            <div className="text-sm text-text-secondary mb-1 font-medium">Answer:</div>
            <div className="text-text-primary whitespace-pre-wrap">
              {card.back}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;