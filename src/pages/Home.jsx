import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { Plus, Upload, BookOpen, CalendarDays, Play, Flame, BellRing, Target, Filter, X, Activity } from 'lucide-react';
import DeckCard from '../components/DeckCard';
import { exportDeck, importDeck } from '../utils/helpers';

const SORT_ORDER = ['Beginner', 'Intermediate', 'Advanced'];
const HEATMAP_DAYS = 84;
const DAY_MS = 24 * 60 * 60 * 1000;

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getHeatmapCells = (history = {}) => {
  const today = new Date();
  const orderedCells = [];

  for (let offset = HEATMAP_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - (offset * DAY_MS));
    const dateKey = getDateKey(date);
    orderedCells.push({
      date,
      dateKey,
      count: Math.max(0, Number(history[dateKey]) || 0),
    });
  }

  return orderedCells;
};

const getHeatmapLevelClass = (count, maxCount) => {
  if (count <= 0) return 'bg-text-secondary/15 dark:bg-dark-text-secondary/20';

  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio < 0.25) return 'bg-secondary/30 dark:bg-dark-secondary/35';
  if (ratio < 0.5) return 'bg-secondary/50 dark:bg-dark-secondary/55';
  if (ratio < 0.75) return 'bg-secondary/70 dark:bg-dark-secondary/75';
  return 'bg-secondary dark:bg-dark-secondary';
};

const toWeekColumns = (cells) => {
  const columns = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }
  return columns;
};

const sortOptions = (values) => {
  return [...values].sort((left, right) => {
    const leftIndex = SORT_ORDER.indexOf(left);
    const rightIndex = SORT_ORDER.indexOf(right);

    if (leftIndex !== -1 || rightIndex !== -1) {
      const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const safeRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return safeLeft - safeRight;
    }

    return left.localeCompare(right);
  });
};

const normalizeDeckMetadata = (deck) => ({
  language: (deck.language || '').trim(),
  subject: (deck.subject || '').trim(),
  exam: (deck.exam || '').trim(),
  difficulty: (deck.difficulty || '').trim(),
  tags: Array.isArray(deck.tags)
    ? deck.tags.map((tag) => tag.trim()).filter(Boolean)
    : [],
});

const Home = () => {
  const {
    decks,
    deleteDeck,
    duplicateDeck,
    createDeck,
    progress,
    studyStreak,
    setDailyGoal,
  } = useDeck();

  const streak = studyStreak || {
    currentStreak: 0,
    longestStreak: 0,
    dailyGoal: 20,
    cardsStudiedToday: 0,
    goalCompletedToday: false,
    lastStudyDate: null,
  };

  const [filters, setFilters] = useState({
    language: 'all',
    subject: 'all',
    exam: 'all',
    difficulty: 'all',
    tag: 'all',
  });

  const filterOptions = useMemo(() => {
    const sets = {
      language: new Set(),
      subject: new Set(),
      exam: new Set(),
      difficulty: new Set(),
      tag: new Set(),
    };

    decks.forEach((deck) => {
      const metadata = normalizeDeckMetadata(deck);
      if (metadata.language) sets.language.add(metadata.language);
      if (metadata.subject) sets.subject.add(metadata.subject);
      if (metadata.exam) sets.exam.add(metadata.exam);
      if (metadata.difficulty) sets.difficulty.add(metadata.difficulty);
      metadata.tags.forEach((tag) => sets.tag.add(tag));
    });

    return {
      language: sortOptions(sets.language),
      subject: sortOptions(sets.subject),
      exam: sortOptions(sets.exam),
      difficulty: sortOptions(sets.difficulty),
      tag: sortOptions(sets.tag),
    };
  }, [decks]);

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const metadata = normalizeDeckMetadata(deck);

      if (filters.language !== 'all' && metadata.language !== filters.language) {
        return false;
      }
      if (filters.subject !== 'all' && metadata.subject !== filters.subject) {
        return false;
      }
      if (filters.exam !== 'all' && metadata.exam !== filters.exam) {
        return false;
      }
      if (filters.difficulty !== 'all' && metadata.difficulty !== filters.difficulty) {
        return false;
      }
      if (filters.tag !== 'all' && !metadata.tags.includes(filters.tag)) {
        return false;
      }

      return true;
    });
  }, [decks, filters]);

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all');

  const goalProgress = streak.dailyGoal > 0
    ? Math.min(100, Math.round((streak.cardsStudiedToday / streak.dailyGoal) * 100))
    : 0;
  const cardsRemaining = Math.max(streak.dailyGoal - streak.cardsStudiedToday, 0);
  const heatmapCells = useMemo(() => getHeatmapCells(streak.activityHistory), [streak.activityHistory]);
  const maxHeatmapCount = Math.max(0, ...heatmapCells.map((cell) => cell.count));
  const heatmapColumns = useMemo(() => toWeekColumns(heatmapCells), [heatmapCells]);
  const activeHeatmapDays = heatmapCells.filter((cell) => cell.count > 0).length;
  const bestHeatmapDay = heatmapCells.reduce((best, cell) => {
    if (!best || cell.count > best.count) {
      return cell;
    }
    return best;
  }, null);

  let reminderMessage = 'A short review today keeps your learning rhythm steady.';
  if (streak.goalCompletedToday) {
    reminderMessage = 'Daily goal complete. Great work, keep the momentum going.';
  } else if (streak.cardsStudiedToday > 0) {
    reminderMessage = `${cardsRemaining} more card${cardsRemaining === 1 ? '' : 's'} to hit your daily goal.`;
  } else if (streak.currentStreak === 0 && streak.lastStudyDate) {
    reminderMessage = 'No pressure. One quick session today will restart your streak.';
  }

  const now = new Date();

  const deckQueues = filteredDecks
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

  const setFilterValue = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      language: 'all',
      subject: 'all',
      exam: 'all',
      difficulty: 'all',
      tag: 'all',
    });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const importedDeck = await importDeck(file);
      await createDeck({
        title: importedDeck.title,
        description: importedDeck.description,
        language: importedDeck.language || '',
        subject: importedDeck.subject || '',
        exam: importedDeck.exam || '',
        difficulty: importedDeck.difficulty || 'Beginner',
        tags: Array.isArray(importedDeck.tags) ? importedDeck.tags : [],
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

  const handleDuplicate = async (deckId) => {
    await duplicateDeck(deckId);
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
            <span>Import Deck (JSON/CSV)</span>
            <input
              type="file"
              accept=".json,.csv,text/csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Study Streak + Daily Goal */}
      <div className="mb-8">
        <div className="bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-xl shadow-md p-6 border border-primary/20 dark:border-dark-primary/20">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-5">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Flame className="w-5 h-5 text-warning dark:text-dark-warning" />
                <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Study Streak</h2>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                Stay consistent with a daily target and keep your streak alive.
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {[10, 20, 30].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setDailyGoal(goal)}
                  className={`px-3 py-1.5 rounded-md border transition-colors ${
                    streak.dailyGoal === goal
                      ? 'bg-primary dark:bg-dark-primary text-white border-primary dark:border-dark-primary'
                      : 'bg-background/70 dark:bg-dark-background/70 text-text-primary dark:text-dark-text-primary border-text-secondary/20 dark:border-dark-text-secondary/20 hover:border-primary dark:hover:border-dark-primary'
                  }`}
                >
                  {goal}/day
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-background/70 dark:bg-dark-background/70 p-4 border border-text-secondary/10 dark:border-dark-text-secondary/10">
              <div className="text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">Current Streak</div>
              <div className="text-2xl font-bold text-warning dark:text-dark-warning">{streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}</div>
            </div>
            <div className="rounded-lg bg-background/70 dark:bg-dark-background/70 p-4 border border-text-secondary/10 dark:border-dark-text-secondary/10">
              <div className="text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">Longest Streak</div>
              <div className="text-2xl font-bold text-primary dark:text-dark-primary">{streak.longestStreak} day{streak.longestStreak === 1 ? '' : 's'}</div>
            </div>
            <div className="rounded-lg bg-background/70 dark:bg-dark-background/70 p-4 border border-text-secondary/10 dark:border-dark-text-secondary/10">
              <div className="text-xs uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">Today</div>
              <div className="text-2xl font-bold text-secondary dark:text-dark-secondary">{streak.cardsStudiedToday}/{streak.dailyGoal}</div>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2 text-sm">
              <div className="flex items-center space-x-2 text-text-secondary dark:text-dark-text-secondary">
                <Target className="w-4 h-4" />
                <span>Daily goal progress</span>
              </div>
              <span className="font-medium text-text-primary dark:text-dark-text-primary">{goalProgress}%</span>
            </div>
            <div className="w-full bg-text-secondary/15 dark:bg-dark-text-secondary/15 rounded-full h-2.5">
              <div
                className="bg-secondary dark:bg-dark-secondary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-sm text-text-secondary dark:text-dark-text-secondary bg-background/60 dark:bg-dark-background/60 rounded-lg px-3 py-2 border border-text-secondary/10 dark:border-dark-text-secondary/10">
            <BellRing className="w-4 h-4 mt-0.5 text-accent dark:text-dark-accent" />
            <span>{reminderMessage}</span>
          </div>

          <div className="mt-5 pt-4 border-t border-text-secondary/15 dark:border-dark-text-secondary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-secondary dark:text-dark-secondary" />
                <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Consistency Heatmap</div>
              </div>
              <div className="text-xs text-text-secondary dark:text-dark-text-secondary">Last 12 weeks</div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="inline-flex gap-1 min-w-max">
                {heatmapColumns.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((cell) => (
                      <div
                        key={cell.dateKey}
                        className={`w-3.5 h-3.5 rounded-[3px] border border-black/5 dark:border-white/5 ${getHeatmapLevelClass(cell.count, maxHeatmapCount)}`}
                        title={`${cell.date.toLocaleDateString()} - ${cell.count} card${cell.count === 1 ? '' : 's'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-text-secondary dark:text-dark-text-secondary">
              <div>
                Active days: <span className="font-medium text-text-primary dark:text-dark-text-primary">{activeHeatmapDays}</span>
              </div>
              <div>
                Best day: <span className="font-medium text-text-primary dark:text-dark-text-primary">{bestHeatmapDay?.count || 0} cards</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Filters */}
      {decks.length > 0 && (
        <div className="mb-8">
          <div className="bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-xl shadow-md p-6 border border-secondary/20 dark:border-dark-secondary/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Filter className="w-5 h-5 text-secondary dark:text-dark-secondary" />
                  <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">Smart Filters</h2>
                </div>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  Filter decks by language, subject, exam, difficulty, and tags.
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-background/70 dark:bg-dark-background/70 border border-text-secondary/20 dark:border-dark-text-secondary/20 hover:border-secondary dark:hover:border-dark-secondary text-text-primary dark:text-dark-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={filters.language}
                onChange={(e) => setFilterValue('language', e.target.value)}
                className="px-3 py-2 rounded-lg border border-text-secondary/20 dark:border-dark-text-secondary/20 bg-background/80 dark:bg-dark-background/80 text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary"
              >
                <option value="all">All Languages</option>
                {filterOptions.language.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select
                value={filters.subject}
                onChange={(e) => setFilterValue('subject', e.target.value)}
                className="px-3 py-2 rounded-lg border border-text-secondary/20 dark:border-dark-text-secondary/20 bg-background/80 dark:bg-dark-background/80 text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary"
              >
                <option value="all">All Subjects</option>
                {filterOptions.subject.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select
                value={filters.exam}
                onChange={(e) => setFilterValue('exam', e.target.value)}
                className="px-3 py-2 rounded-lg border border-text-secondary/20 dark:border-dark-text-secondary/20 bg-background/80 dark:bg-dark-background/80 text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary"
              >
                <option value="all">All Exams</option>
                {filterOptions.exam.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select
                value={filters.difficulty}
                onChange={(e) => setFilterValue('difficulty', e.target.value)}
                className="px-3 py-2 rounded-lg border border-text-secondary/20 dark:border-dark-text-secondary/20 bg-background/80 dark:bg-dark-background/80 text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary"
              >
                <option value="all">All Difficulties</option>
                {filterOptions.difficulty.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select
                value={filters.tag}
                onChange={(e) => setFilterValue('tag', e.target.value)}
                className="px-3 py-2 rounded-lg border border-text-secondary/20 dark:border-dark-text-secondary/20 bg-background/80 dark:bg-dark-background/80 text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-dark-secondary"
              >
                <option value="all">All Tags</option>
                {filterOptions.tag.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 text-sm text-text-secondary dark:text-dark-text-secondary">
              Showing {filteredDecks.length} of {decks.length} deck{decks.length === 1 ? '' : 's'}.
            </div>
          </div>
        </div>
      )}

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
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-12 bg-card/50 dark:bg-dark-card/50 backdrop-blur-sm rounded-xl">
          <h3 className="text-xl font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
            No decks match your filters
          </h3>
          <p className="text-text-secondary dark:text-dark-text-secondary mb-6">
            Try clearing or relaxing your filter selections.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center space-x-2 bg-secondary dark:bg-dark-secondary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all duration-200 hover:transform hover:scale-105"
          >
            <X className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <div key={deck.id} className="relative">
              <DeckCard
                deck={deck}
                progress={progress[deck.id] || []}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
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
                  {filteredDecks.length}
                </div>
                <div className="text-text-secondary dark:text-dark-text-secondary">
                  {hasActiveFilters ? 'Filtered Decks' : 'Decks'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary dark:text-dark-primary">
                  {filteredDecks.reduce((total, deck) => total + (deck.cards?.length || 0), 0)}
                </div>
                <div className="text-text-secondary dark:text-dark-text-secondary">
                  {hasActiveFilters ? 'Filtered Cards' : 'Cards'}
                </div>
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