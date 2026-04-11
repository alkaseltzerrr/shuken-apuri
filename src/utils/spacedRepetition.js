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
  totalReviews: 0,
  correctReviews: 0,
  lastConfidence: null,
});

export const updateCardProgress = (progress, isCorrect, confidence = CONFIDENCE_LEVELS.MEDIUM) => {
  const now = new Date();
  const newProgress = { ...progress };
  const normalizedConfidence = normalizeConfidence(confidence);
  
  newProgress.lastReviewed = now;
  newProgress.totalReviews += 1;
  newProgress.lastConfidence = normalizedConfidence;
  
  if (isCorrect) {
    newProgress.correctReviews += 1;
    newProgress.correctStreak += 1;

    const { boxStep, intervalMultiplier } = getCorrectConfidenceConfig(normalizedConfidence);
    newProgress.box = Math.min(newProgress.box + boxStep, BOXES.BOX_5);

    const baseIntervalDays = REVIEW_INTERVALS[newProgress.box];
    const nextIntervalDays = Math.max(1, Math.round(baseIntervalDays * intervalMultiplier));
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + nextIntervalDays);
    newProgress.nextReview = nextReview;
  } else {
    newProgress.correctStreak = 0;
    // Move back to BOX_1 if incorrect
    newProgress.box = BOXES.BOX_1;

    const intervalDays = getIncorrectConfidenceInterval(normalizedConfidence);
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + intervalDays);
    newProgress.nextReview = nextReview;
  }
  
  return newProgress;
};

export const getCardsToReview = (progressData) => {
  const now = new Date();
  return progressData.filter(progress => 
    new Date(progress.nextReview) <= now
  );
};

export const getDeckStats = (progressData) => {
  const total = progressData.length;
  const reviewed = progressData.filter(p => p.totalReviews > 0).length;
  const mastered = progressData.filter(p => p.box === BOXES.BOX_5).length;
  const dueForReview = getCardsToReview(progressData).length;
  
  const accuracy = progressData.reduce((acc, p) => {
    if (p.totalReviews === 0) return acc;
    return acc + (p.correctReviews / p.totalReviews);
  }, 0) / Math.max(reviewed, 1);
  
  return {
    total,
    reviewed,
    mastered,
    dueForReview,
    accuracy: Math.round(accuracy * 100),
    progress: Math.round((reviewed / total) * 100),
  };
};