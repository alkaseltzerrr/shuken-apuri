import Fuse from 'fuse.js';

// Generate sample decks for first run
export const generateSampleDecks = () => [
  {
    id: '1',
    title: 'Japanese Hiragana',
    description: 'Basic hiragana characters',
    cards: [
      { id: '1', front: 'あ', back: 'a' },
      { id: '2', front: 'か', back: 'ka' },
      { id: '3', front: 'さ', back: 'sa' },
      { id: '4', front: 'た', back: 'ta' },
      { id: '5', front: 'な', back: 'na' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Math Basics',
    description: 'Elementary mathematics',
    cards: [
      { id: '1', front: 'What is 7 × 8?', back: '56' },
      { id: '2', front: 'What is 144 ÷ 12?', back: '12' },
      { id: '3', front: 'What is the square root of 64?', back: '8' },
      { id: '4', front: 'What is 15% of 200?', back: '30' },
      { id: '5', front: 'What is 2³?', back: '8' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Normalize text for fuzzy matching
export const normalizeText = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

// Fuzzy match with Fuse.js
export const fuzzyMatch = (input, target, threshold = 0.6) => {
  const fuse = new Fuse([target], {
    includeScore: true,
    threshold: threshold,
  });
  
  const result = fuse.search(input);
  return result.length > 0 && result[0].score <= threshold;
};

// Generate distractors for multiple choice
export const generateDistractors = (correctAnswer, allAnswers, count = 3) => {
  const distractors = [];
  const availableAnswers = allAnswers.filter(answer => answer !== correctAnswer);
  
  while (distractors.length < count && distractors.length < availableAnswers.length) {
    const randomIndex = Math.floor(Math.random() * availableAnswers.length);
    const distractor = availableAnswers[randomIndex];
    
    if (!distractors.includes(distractor)) {
      distractors.push(distractor);
    }
    availableAnswers.splice(randomIndex, 1);
  }
  
  return distractors;
};

// Shuffle array
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Export/Import utilities
export const exportDeck = (deck) => {
  const dataStr = JSON.stringify(deck, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importDeck = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const deck = JSON.parse(e.target.result);
        // Validate deck structure
        if (!deck.title || !deck.cards || !Array.isArray(deck.cards)) {
          throw new Error('Invalid deck format');
        }
        resolve(deck);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};