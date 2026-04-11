// Leitner System Implementation for Spaced Repetition

export const BOXES = {
  NEW: 0,
  BOX_1: 1,
  BOX_2: 2,
  BOX_3: 3,
  BOX_4: 4,
  BOX_5: 5,
};

export const REVIEW_INTERVALS = {
  [BOXES.NEW]: 0, // Review immediately
  [BOXES.BOX_1]: 1, // 1 day
  [BOXES.BOX_2]: 3, // 3 days
  [BOXES.BOX_3]: 7, // 1 week
  [BOXES.BOX_4]: 14, // 2 weeks
  [BOXES.BOX_5]: 30, // 1 month
};

export const CONFIDENCE_LEVELS = {
  HARD: 'hard',
  MEDIUM: 'medium',
  EASY: 'easy',
};

const CONFIDENCE_ORDER = [
  CONFIDENCE_LEVELS.HARD,
  CONFIDENCE_LEVELS.MEDIUM,
  CONFIDENCE_LEVELS.EASY,
];

const normalizeConfidence = (confidence) => {
  const normalized = String(confidence || '').toLowerCase();
  return CONFIDENCE_ORDER.includes(normalized)
    ? normalized
    : CONFIDENCE_LEVELS.MEDIUM;
};

const getCorrectConfidenceConfig = (confidence) => {
  if (confidence === CONFIDENCE_LEVELS.EASY) {
    return { boxStep: 2, intervalMultiplier: 1.4 };
  }

  if (confidence === CONFIDENCE_LEVELS.HARD) {
    return { boxStep: 1, intervalMultiplier: 0.6 };
  }

  return { boxStep: 1, intervalMultiplier: 1 };
};

const getIncorrectConfidenceInterval = (confidence) => {
  if (confidence === CONFIDENCE_LEVELS.HARD) {
    return 0;
  }
  return REVIEW_INTERVALS[BOXES.BOX_1];
};

export const createCardProgress = (cardId) => ({
  cardId,
  box: BOXES.NEW,
  lastReviewed: null,
  nextReview: new Date(),
  correctStreak: 0,
  incorrectStreak: 0,
  totalReviews: 0,
  correctReviews: 0,
  leechCount: 0,
  isLeech: false,
  lastConfidence: null,
});

const getSafeProgress = (progress) => ({
  ...progress,
  correctStreak: Number(progress.correctStreak) || 0,
  incorrectStreak: Number(progress.incorrectStreak) || 0,
  totalReviews: Number(progress.totalReviews) || 0,
  correctReviews: Number(progress.correctReviews) || 0,
  leechCount: Number(progress.leechCount) || 0,
  isLeech: Boolean(progress.isLeech),
});

const shouldMarkLeech = (progress) => {
  const attempts = progress.totalReviews;
  const accuracy = attempts > 0 ? progress.correctReviews / attempts : 0;

  return progress.incorrectStreak >= 3 ||
    (attempts >= 6 && accuracy < 0.45 && progress.leechCount >= 4);
};

export const updateCardProgress = (progress, isCorrect, confidence = CONFIDENCE_LEVELS.MEDIUM) => {
  const now = new Date();
  const newProgress = getSafeProgress({ ...progress });
  const normalizedConfidence = normalizeConfidence(confidence);
  
  newProgress.lastReviewed = now;
  newProgress.totalReviews += 1;
  newProgress.lastConfidence = normalizedConfidence;
  
  if (isCorrect) {
    newProgress.correctReviews += 1;
    newProgress.correctStreak += 1;
    newProgress.incorrectStreak = 0;

    const { boxStep, intervalMultiplier } = getCorrectConfidenceConfig(normalizedConfidence);
    newProgress.box = Math.min(newProgress.box + boxStep, BOXES.BOX_5);

    const baseIntervalDays = REVIEW_INTERVALS[newProgress.box];
    const nextIntervalDays = Math.max(1, Math.round(baseIntervalDays * intervalMultiplier));
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + nextIntervalDays);
    newProgress.nextReview = nextReview;
  } else {
    newProgress.correctStreak = 0;
    newProgress.incorrectStreak += 1;
    newProgress.leechCount += normalizedConfidence === CONFIDENCE_LEVELS.HARD ? 2 : 1;
    // Move back to BOX_1 if incorrect
    newProgress.box = BOXES.BOX_1;

    const intervalDays = getIncorrectConfidenceInterval(normalizedConfidence);
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + intervalDays);
    newProgress.nextReview = nextReview;
  }

  newProgress.isLeech = shouldMarkLeech(newProgress);
  
  return newProgress;
};

export const getCardsToReview = (progressData) => {
  const now = new Date();
  return progressData.filter(progress => 
    new Date(progress.nextReview) <= now
  );
};

export const getLeechCards = (progressData) => {
  return progressData
    .map((progress) => getSafeProgress(progress))
    .filter((progress) => progress.isLeech || shouldMarkLeech(progress))
    .sort((left, right) => {
      if (right.leechCount !== left.leechCount) {
        return right.leechCount - left.leechCount;
      }

      return right.incorrectStreak - left.incorrectStreak;
    });
};

export const getDeckStats = (progressData) => {
  const total = progressData.length;
  const safeProgress = progressData.map((progress) => getSafeProgress(progress));
  const reviewed = safeProgress.filter(p => p.totalReviews > 0).length;
  const mastered = safeProgress.filter(p => p.box === BOXES.BOX_5).length;
  const dueForReview = getCardsToReview(safeProgress).length;
  const leechCards = getLeechCards(safeProgress).length;
  
  const accuracy = safeProgress.reduce((acc, p) => {
    if (p.totalReviews === 0) return acc;
    return acc + (p.correctReviews / p.totalReviews);
  }, 0) / Math.max(reviewed, 1);
  
  return {
    total,
    reviewed,
    mastered,
    dueForReview,
    leechCards,
    accuracy: Math.round(accuracy * 100),
    progress: Math.round((reviewed / total) * 100),
  };
};