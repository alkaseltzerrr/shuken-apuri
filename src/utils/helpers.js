import Fuse from 'fuse.js';

// Generate sample decks for first run
export const generateSampleDecks = () => [
  {
    id: '1',
    title: 'Japanese Hiragana',
    description: 'Basic hiragana characters',
    language: 'Japanese',
    subject: 'Language',
    exam: 'JLPT N5',
    difficulty: 'Beginner',
    tags: ['kana', 'reading', 'pronunciation'],
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
    language: 'English',
    subject: 'Mathematics',
    exam: 'SAT Prep',
    difficulty: 'Intermediate',
    tags: ['arithmetic', 'numbers', 'foundations'],
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

const HEADER_ALIASES = {
  front: ['front', 'question', 'prompt', 'term', 'q'],
  back: ['back', 'answer', 'definition', 'a'],
  title: ['title', 'deck', 'decktitle', 'deck_title'],
  description: ['description', 'desc', 'notes'],
  language: ['language', 'lang'],
  subject: ['subject', 'topic', 'category'],
  exam: ['exam', 'test'],
  difficulty: ['difficulty', 'level'],
  tags: ['tags', 'tag'],
};

const normalizeHeader = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
};

const getHeaderIndex = (headers, key) => {
  const aliases = HEADER_ALIASES[key] || [];
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
};

const parseCsvRows = (text) => {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  const cleanText = String(text || '').replace(/^\uFEFF/, '');

  for (let i = 0; i < cleanText.length; i += 1) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      row.push(value);
      value = '';

      if (row.some((cell) => String(cell || '').trim() !== '')) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => String(cell || '').trim() !== '')) {
    rows.push(row);
  }

  return rows;
};

const getFirstNonEmptyValue = (rows, index) => {
  if (index < 0) return '';

  const foundRow = rows.find((row) => String(row[index] || '').trim() !== '');
  return foundRow ? String(foundRow[index] || '').trim() : '';
};

const deriveDeckTitleFromFileName = (fileName) => {
  const withoutExt = String(fileName || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  return withoutExt || 'Imported Deck';
};

const normalizeDeckFromJson = (deck) => {
  if (!deck.title || !deck.cards || !Array.isArray(deck.cards)) {
    throw new Error('Invalid JSON deck format');
  }

  const cards = deck.cards
    .map((card, index) => ({
      id: card.id || `${Date.now()}-${index}`,
      front: String(card.front || '').trim(),
      back: String(card.back || '').trim(),
    }))
    .filter((card) => card.front && card.back);

  if (cards.length === 0) {
    throw new Error('No valid cards found in JSON deck');
  }

  return {
    ...deck,
    title: String(deck.title).trim(),
    description: String(deck.description || '').trim(),
    language: String(deck.language || '').trim(),
    subject: String(deck.subject || '').trim(),
    exam: String(deck.exam || '').trim(),
    difficulty: String(deck.difficulty || 'Beginner').trim() || 'Beginner',
    tags: Array.isArray(deck.tags)
      ? deck.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    cards,
  };
};

const parseCsvDeck = (text, fileName) => {
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    throw new Error('CSV file is empty');
  }

  const firstRow = rows[0];
  const firstRowHasNamedColumns = firstRow.some((cell) => {
    const normalized = normalizeHeader(cell);
    return HEADER_ALIASES.front.includes(normalized) || HEADER_ALIASES.back.includes(normalized);
  });

  const headers = firstRowHasNamedColumns ? firstRow : ['front', 'back'];
  const dataRows = firstRowHasNamedColumns ? rows.slice(1) : rows;

  const frontIndex = getHeaderIndex(headers, 'front');
  const backIndex = getHeaderIndex(headers, 'back');

  if (frontIndex === -1 || backIndex === -1) {
    throw new Error('CSV must include front and back columns');
  }

  const cards = dataRows
    .map((row, index) => ({
      id: `${Date.now()}-${index}`,
      front: String(row[frontIndex] || '').trim(),
      back: String(row[backIndex] || '').trim(),
    }))
    .filter((card) => card.front && card.back);

  if (cards.length === 0) {
    throw new Error('No valid cards found in CSV');
  }

  const titleIndex = getHeaderIndex(headers, 'title');
  const descriptionIndex = getHeaderIndex(headers, 'description');
  const languageIndex = getHeaderIndex(headers, 'language');
  const subjectIndex = getHeaderIndex(headers, 'subject');
  const examIndex = getHeaderIndex(headers, 'exam');
  const difficultyIndex = getHeaderIndex(headers, 'difficulty');
  const tagsIndex = getHeaderIndex(headers, 'tags');

  const tagsValue = getFirstNonEmptyValue(dataRows, tagsIndex);

  return {
    title: getFirstNonEmptyValue(dataRows, titleIndex) || deriveDeckTitleFromFileName(fileName),
    description: getFirstNonEmptyValue(dataRows, descriptionIndex),
    language: getFirstNonEmptyValue(dataRows, languageIndex),
    subject: getFirstNonEmptyValue(dataRows, subjectIndex),
    exam: getFirstNonEmptyValue(dataRows, examIndex),
    difficulty: getFirstNonEmptyValue(dataRows, difficultyIndex) || 'Beginner',
    tags: tagsValue
      ? tagsValue.split(/[|;,]/).map((tag) => tag.trim()).filter(Boolean)
      : [],
    cards,
  };
};

export const importDeck = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawContent = String(e.target.result || '');
        const isCsvFile = /\.csv$/i.test(file.name) || String(file.type || '').includes('csv');

        if (isCsvFile) {
          resolve(parseCsvDeck(rawContent, file.name));
          return;
        }

        const deck = JSON.parse(rawContent);
        resolve(normalizeDeckFromJson(deck));
      } catch (error) {
        reject(new Error(error.message || 'Failed to import deck'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};