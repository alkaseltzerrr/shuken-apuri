import { useState } from 'react';
import { Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';

const Card = ({ card, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border-2 border-transparent hover:border-accent-blue transition-all duration-200 hover:shadow-lg animate-fade-in">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-gray-800 mb-1">
              {card.front}
            </div>
            {!isExpanded && (
              <div className="text-sm text-gray-500 truncate">
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
              className="p-1 text-gray-400 hover:text-accent-blue transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-1 font-medium">Answer:</div>
            <div className="text-gray-800 whitespace-pre-wrap">
              {card.back}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;