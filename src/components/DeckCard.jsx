import { Link } from 'react-router-dom';
import { BookOpen, Play, Edit, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { getDeckStats } from '../utils/spacedRepetition';

const DeckCard = ({ deck, progress = [], onDelete }) => {
  const stats = getDeckStats(progress);

  return (
    <div className="bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-500 border-2 border-transparent hover:border-primary dark:hover:border-dark-primary animate-slide-up relative">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-8">
            <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
              {deck.title}
            </h3>
            <p className="text-text-secondary dark:text-dark-text-secondary text-sm mb-3">
              {deck.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-text-secondary dark:text-dark-text-secondary">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>{deck.cards?.length || 0} cards</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(deck.updatedAt)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(deck.id);
            }}
            className="absolute top-4 right-12 p-2 text-text-secondary dark:text-dark-text-secondary hover:text-warning dark:hover:text-dark-warning transition-colors bg-card/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Stats */}
        {stats.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Progress</span>
              <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{stats.progress}%</span>
            </div>
            <div className="w-full bg-text-secondary/20 dark:bg-dark-text-secondary/20 rounded-full h-2">
              <div 
                className="bg-secondary dark:bg-dark-secondary h-2 rounded-full transition-all duration-700"
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
              <span>{stats.reviewed}/{stats.total} reviewed</span>
              {stats.dueForReview > 0 && (
                <span className="text-accent dark:text-dark-accent font-medium">
                  {stats.dueForReview} due
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Link
            to={`/deck/${deck.id}/study`}
            className="flex-1 bg-primary dark:bg-dark-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-400 flex items-center justify-center space-x-2 hover:transform hover:scale-105"
          >
            <Play className="w-4 h-4" />
            <span>Study</span>
          </Link>
          <Link
            to={`/deck/${deck.id}`}
            className="flex-1 bg-primary dark:bg-dark-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-400 flex items-center justify-center space-x-2 hover:transform hover:scale-105"
          >
            <BookOpen className="w-4 h-4" />
            <span>View</span>
          </Link>
          <Link
            to={`/deck/${deck.id}/edit`}
            className="bg-accent dark:bg-dark-accent text-white px-3 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-400 hover:transform hover:scale-105"
          >
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DeckCard;