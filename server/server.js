import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DECKS_FILE = path.join(DATA_DIR, 'decks.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IS_SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const supabase = IS_SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  : null;

const DECK_SELECT_COLUMNS = `
  id,
  title,
  description,
  language,
  subject,
  exam,
  difficulty,
  tags,
  created_at,
  updated_at,
  cards (
    id,
    deck_id,
    front,
    back,
    hint,
    example,
    position,
    created_at,
    updated_at
  )
`;

const allowedOrigins = FRONTEND_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser and same-origin requests with no Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0) {
        return callback(null, devOrigins.includes(origin));
      }

      return callback(null, allowedOrigins.includes(origin));
    },
  })
);
app.use(express.json());

const safeString = (value) => String(value ?? '').trim();

const normalizeTags = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter(Boolean);
};

const makeId = (prefix) => `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toIsoString = (value, fallback = new Date().toISOString()) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed.toISOString();
};

const normalizeCards = (cards = []) => {
  if (!Array.isArray(cards)) return [];

  return cards
    .map((card, index) => ({
      id: safeString(card?.id) || makeId('card-'),
      front: safeString(card?.front),
      back: safeString(card?.back),
      hint: safeString(card?.hint),
      example: safeString(card?.example),
      position: Number.isInteger(card?.position) ? card.position : index,
      createdAt: toIsoString(card?.createdAt || card?.created_at),
      updatedAt: toIsoString(card?.updatedAt || card?.updated_at),
    }))
    .filter((card) => card.front && card.back)
    .map((card, index) => ({ ...card, position: index }));
};

const normalizeDeckInput = (deck = {}, options = {}) => {
  const createdAt = toIsoString(
    options.createdAt || deck.createdAt || deck.created_at,
    new Date().toISOString()
  );

  return {
    id: safeString(options.id || deck.id) || makeId('deck-'),
    title: safeString(deck.title),
    description: safeString(deck.description),
    language: safeString(deck.language),
    subject: safeString(deck.subject),
    exam: safeString(deck.exam),
    difficulty: safeString(deck.difficulty) || 'Beginner',
    tags: normalizeTags(deck.tags),
    cards: normalizeCards(deck.cards || []),
    createdAt,
    updatedAt: toIsoString(new Date().toISOString()),
  };
};

const mapCardRowToApi = (row) => ({
  id: safeString(row.id),
  front: safeString(row.front),
  back: safeString(row.back),
  hint: safeString(row.hint),
  example: safeString(row.example),
});

const mapDeckRowToApi = (row) => ({
  id: safeString(row.id),
  title: safeString(row.title),
  description: safeString(row.description),
  language: safeString(row.language),
  subject: safeString(row.subject),
  exam: safeString(row.exam),
  difficulty: safeString(row.difficulty) || 'Beginner',
  tags: normalizeTags(row.tags),
  cards: Array.isArray(row.cards)
    ? [...row.cards]
      .sort((left, right) => (left.position || 0) - (right.position || 0))
      .map(mapCardRowToApi)
    : [],
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

const mapDeckToInsertRow = (deck) => ({
  id: deck.id,
  title: deck.title,
  description: deck.description,
  language: deck.language,
  subject: deck.subject,
  exam: deck.exam,
  difficulty: deck.difficulty,
  tags: deck.tags,
  created_at: deck.createdAt,
  updated_at: deck.updatedAt,
});

const mapDeckToUpdateRow = (deck) => ({
  title: deck.title,
  description: deck.description,
  language: deck.language,
  subject: deck.subject,
  exam: deck.exam,
  difficulty: deck.difficulty,
  tags: deck.tags,
  updated_at: deck.updatedAt,
});

const mapCardsToRows = (deckId, cards = []) => cards.map((card) => ({
  id: card.id,
  deck_id: deckId,
  front: card.front,
  back: card.back,
  hint: card.hint,
  example: card.example,
  position: card.position,
  created_at: card.createdAt,
  updated_at: card.updatedAt,
}));

const ensureTitle = (deck) => {
  if (!deck.title) {
    throw new Error('Title is required');
  }
};

const initializeFileData = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DECKS_FILE);
  } catch {
    await fs.writeFile(DECKS_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(PROGRESS_FILE);
  } catch {
    await fs.writeFile(PROGRESS_FILE, JSON.stringify({}, null, 2));
  }
};

const readDecksFile = async () => {
  try {
    const raw = await fs.readFile(DECKS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDecksFile = async (decks) => {
  await fs.writeFile(DECKS_FILE, JSON.stringify(decks, null, 2));
};

const readProgressFile = async () => {
  try {
    const raw = await fs.readFile(PROGRESS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeProgressFile = async (progress) => {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
};

const listDecksFile = async () => {
  const decks = await readDecksFile();
  return decks.map((deck) => normalizeDeckInput(deck, { id: deck.id, createdAt: deck.createdAt }));
};

const getDeckFile = async (deckId) => {
  const decks = await readDecksFile();
  const deck = decks.find((item) => item.id === deckId);
  return deck ? normalizeDeckInput(deck, { id: deck.id, createdAt: deck.createdAt }) : null;
};

const createDeckFile = async (payload) => {
  const decks = await readDecksFile();
  const deck = normalizeDeckInput(payload);
  ensureTitle(deck);

  decks.push(deck);
  await writeDecksFile(decks);
  return deck;
};

const updateDeckFile = async (deckId, updates) => {
  const decks = await readDecksFile();
  const deckIndex = decks.findIndex((item) => item.id === deckId);
  if (deckIndex === -1) {
    return null;
  }

  const previous = decks[deckIndex];
  const merged = normalizeDeckInput(
    {
      ...previous,
      ...updates,
      cards: Array.isArray(updates.cards) ? updates.cards : previous.cards,
    },
    { id: deckId, createdAt: previous.createdAt }
  );

  ensureTitle(merged);
  decks[deckIndex] = merged;
  await writeDecksFile(decks);
  return merged;
};

const deleteDeckFile = async (deckId) => {
  const decks = await readDecksFile();
  const nextDecks = decks.filter((item) => item.id !== deckId);
  if (nextDecks.length === decks.length) {
    return false;
  }

  await writeDecksFile(nextDecks);

  const progress = await readProgressFile();
  delete progress[deckId];
  await writeProgressFile(progress);

  return true;
};

const getProgressFile = async (deckId) => {
  const progress = await readProgressFile();
  return progress[deckId] || [];
};

const updateProgressFile = async (deckId, payload) => {
  const progress = await readProgressFile();
  progress[deckId] = payload;
  await writeProgressFile(progress);
  return payload;
};

const listDecksSupabase = async () => {
  const { data, error } = await supabase
    .from('decks')
    .select(DECK_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch decks from Supabase: ${error.message}`);
  }

  return (data || []).map(mapDeckRowToApi);
};

const getDeckSupabase = async (deckId) => {
  const { data, error } = await supabase
    .from('decks')
    .select(DECK_SELECT_COLUMNS)
    .eq('id', deckId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch deck from Supabase: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return mapDeckRowToApi(data[0]);
};

const createDeckSupabase = async (payload) => {
  const deck = normalizeDeckInput(payload);
  ensureTitle(deck);

  const { error: deckError } = await supabase
    .from('decks')
    .insert(mapDeckToInsertRow(deck));

  if (deckError) {
    throw new Error(`Failed to create deck in Supabase: ${deckError.message}`);
  }

  if (deck.cards.length > 0) {
    const { error: cardsError } = await supabase
      .from('cards')
      .insert(mapCardsToRows(deck.id, deck.cards));

    if (cardsError) {
      await supabase.from('decks').delete().eq('id', deck.id);
      throw new Error(`Failed to create cards in Supabase: ${cardsError.message}`);
    }
  }

  return getDeckSupabase(deck.id);
};

const updateDeckSupabase = async (deckId, updates) => {
  const existing = await getDeckSupabase(deckId);
  if (!existing) {
    return null;
  }

  const merged = normalizeDeckInput(
    {
      ...existing,
      ...updates,
      cards: Array.isArray(updates.cards) ? updates.cards : existing.cards,
    },
    { id: deckId, createdAt: existing.createdAt }
  );

  ensureTitle(merged);

  const { error: deckError } = await supabase
    .from('decks')
    .update(mapDeckToUpdateRow(merged))
    .eq('id', deckId);

  if (deckError) {
    throw new Error(`Failed to update deck in Supabase: ${deckError.message}`);
  }

  if (Array.isArray(updates.cards)) {
    const { error: deleteCardsError } = await supabase
      .from('cards')
      .delete()
      .eq('deck_id', deckId);

    if (deleteCardsError) {
      throw new Error(`Failed to replace cards in Supabase: ${deleteCardsError.message}`);
    }

    if (merged.cards.length > 0) {
      const { error: insertCardsError } = await supabase
        .from('cards')
        .insert(mapCardsToRows(deckId, merged.cards));

      if (insertCardsError) {
        throw new Error(`Failed to insert replacement cards in Supabase: ${insertCardsError.message}`);
      }
    }
  }

  return getDeckSupabase(deckId);
};

const deleteDeckSupabase = async (deckId) => {
  await supabase.from('cards').delete().eq('deck_id', deckId);
  await supabase.from('deck_progress').delete().eq('deck_id', deckId);

  const { data, error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete deck from Supabase: ${error.message}`);
  }

  return Array.isArray(data) && data.length > 0;
};

const getProgressSupabase = async (deckId) => {
  const { data, error } = await supabase
    .from('deck_progress')
    .select('data')
    .eq('deck_id', deckId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch progress from Supabase: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data[0]?.data || [];
};

const updateProgressSupabase = async (deckId, payload) => {
  const { error } = await supabase
    .from('deck_progress')
    .upsert(
      {
        deck_id: deckId,
        data: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'deck_id' }
    );

  if (error) {
    throw new Error(`Failed to update progress in Supabase: ${error.message}`);
  }

  return payload;
};

const storage = {
  kind: IS_SUPABASE_ENABLED ? 'supabase' : 'file',
  initialize: async () => {
    if (IS_SUPABASE_ENABLED) {
      console.log('Storage backend: Supabase');
      return;
    }

    await initializeFileData();
    console.log(`Storage backend: local files (${DATA_DIR})`);
  },
  listDecks: async () => (IS_SUPABASE_ENABLED ? listDecksSupabase() : listDecksFile()),
  getDeck: async (deckId) => (IS_SUPABASE_ENABLED ? getDeckSupabase(deckId) : getDeckFile(deckId)),
  createDeck: async (payload) => (IS_SUPABASE_ENABLED ? createDeckSupabase(payload) : createDeckFile(payload)),
  updateDeck: async (deckId, payload) => (
    IS_SUPABASE_ENABLED ? updateDeckSupabase(deckId, payload) : updateDeckFile(deckId, payload)
  ),
  deleteDeck: async (deckId) => (IS_SUPABASE_ENABLED ? deleteDeckSupabase(deckId) : deleteDeckFile(deckId)),
  getProgress: async (deckId) => (IS_SUPABASE_ENABLED ? getProgressSupabase(deckId) : getProgressFile(deckId)),
  updateProgress: async (deckId, payload) => (
    IS_SUPABASE_ENABLED ? updateProgressSupabase(deckId, payload) : updateProgressFile(deckId, payload)
  ),
};

app.get('/api/decks', async (req, res) => {
  try {
    const decks = await storage.listDecks();
    res.json(decks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

app.get('/api/decks/:id', async (req, res) => {
  try {
    const deck = await storage.getDeck(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json(deck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

app.post('/api/decks', async (req, res) => {
  try {
    const deck = await storage.createDeck(req.body || {});
    res.status(201).json(deck);
  } catch (error) {
    if (error.message === 'Title is required') {
      return res.status(400).json({ error: error.message });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

app.put('/api/decks/:id', async (req, res) => {
  try {
    const deck = await storage.updateDeck(req.params.id, req.body || {});
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json(deck);
  } catch (error) {
    if (error.message === 'Title is required') {
      return res.status(400).json({ error: error.message });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to update deck' });
  }
});

app.delete('/api/decks/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteDeck(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

app.get('/api/progress/:deckId', async (req, res) => {
  try {
    const progress = await storage.getProgress(req.params.deckId);
    res.json(progress || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.put('/api/progress/:deckId', async (req, res) => {
  try {
    const payload = req.body;
    const progress = await storage.updateProgress(req.params.deckId, payload);
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storage: storage.kind,
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  await storage.initialize();

  app.listen(PORT, () => {
    console.log(`Shuken Apuri server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});