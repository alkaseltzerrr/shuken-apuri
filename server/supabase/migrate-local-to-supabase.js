import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DECKS_FILE = path.join(DATA_DIR, 'decks.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

const args = new Set(process.argv.slice(2));
const isReset = args.has('--reset');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const nowIso = () => new Date().toISOString();

const safeString = (value) => String(value ?? '').trim();

const normalizeTags = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((tag) => safeString(tag)).filter(Boolean);
};

const toIsoString = (value, fallback = nowIso()) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed.toISOString();
};

const readJsonFile = async (filePath, fallback) => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const normalizeCards = (cards = []) => {
  if (!Array.isArray(cards)) return [];

  return cards
    .map((card, index) => ({
      id: safeString(card?.id) || `card-${Date.now()}-${index}`,
      front: safeString(card?.front),
      back: safeString(card?.back),
      hint: safeString(card?.hint),
      example: safeString(card?.example),
      position: index,
      createdAt: toIsoString(card?.createdAt || card?.created_at),
      updatedAt: toIsoString(card?.updatedAt || card?.updated_at),
    }))
    .filter((card) => card.front && card.back)
    .map((card, index) => ({ ...card, position: index }));
};

const normalizeDeck = (deck) => ({
  id: safeString(deck?.id),
  title: safeString(deck?.title),
  description: safeString(deck?.description),
  language: safeString(deck?.language),
  subject: safeString(deck?.subject),
  exam: safeString(deck?.exam),
  difficulty: safeString(deck?.difficulty) || 'Beginner',
  tags: normalizeTags(deck?.tags),
  cards: normalizeCards(deck?.cards || []),
  createdAt: toIsoString(deck?.createdAt || deck?.created_at),
  updatedAt: toIsoString(deck?.updatedAt || deck?.updated_at),
});

const mapDeckToRow = (deck) => ({
  id: deck.id,
  title: deck.title,
  description: deck.description,
  language: deck.language,
  subject: deck.subject,
  exam: deck.exam,
  difficulty: deck.difficulty,
  tags: deck.tags,
  created_at: deck.createdAt,
  updated_at: nowIso(),
});

const mapCardsToRows = (deckId, cards) => cards.map((card) => ({
  id: card.id,
  deck_id: deckId,
  front: card.front,
  back: card.back,
  hint: card.hint,
  example: card.example,
  position: card.position,
  created_at: card.createdAt,
  updated_at: nowIso(),
}));

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  fail('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set env vars first.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const run = async () => {
  const sourceDecks = await readJsonFile(DECKS_FILE, []);
  const sourceProgress = await readJsonFile(PROGRESS_FILE, {});

  if (!Array.isArray(sourceDecks)) {
    fail('Invalid decks.json format. Expected array.');
  }

  if (sourceProgress === null || typeof sourceProgress !== 'object' || Array.isArray(sourceProgress)) {
    fail('Invalid progress.json format. Expected object map.');
  }

  const decks = sourceDecks
    .map(normalizeDeck)
    .filter((deck) => deck.id && deck.title);

  const deckIds = new Set(decks.map((deck) => deck.id));
  const progressRows = Object.entries(sourceProgress)
    .filter(([deckId]) => deckIds.has(deckId))
    .map(([deckId, data]) => ({
      deck_id: deckId,
      data,
      updated_at: nowIso(),
    }));

  console.log(`Found ${decks.length} deck(s) and ${progressRows.length} progress row(s) to import.`);

  if (isReset) {
    console.log('Reset flag detected. Clearing Supabase tables before import.');
    const clearProgress = await supabase.from('deck_progress').delete().not('deck_id', 'is', null);
    if (clearProgress.error) fail(`Failed clearing deck_progress: ${clearProgress.error.message}`);

    const clearCards = await supabase.from('cards').delete().not('deck_id', 'is', null);
    if (clearCards.error) fail(`Failed clearing cards: ${clearCards.error.message}`);

    const clearDecks = await supabase.from('decks').delete().not('id', 'is', null);
    if (clearDecks.error) fail(`Failed clearing decks: ${clearDecks.error.message}`);
  }

  if (decks.length > 0) {
    const deckRows = decks.map(mapDeckToRow);
    const upsertDecks = await supabase.from('decks').upsert(deckRows, { onConflict: 'id' });
    if (upsertDecks.error) {
      fail(`Failed upserting decks: ${upsertDecks.error.message}`);
    }

    for (const deck of decks) {
      const deleteCards = await supabase.from('cards').delete().eq('deck_id', deck.id);
      if (deleteCards.error) {
        fail(`Failed deleting old cards for deck ${deck.id}: ${deleteCards.error.message}`);
      }

      if (deck.cards.length === 0) continue;

      const insertCards = await supabase.from('cards').insert(mapCardsToRows(deck.id, deck.cards));
      if (insertCards.error) {
        fail(`Failed inserting cards for deck ${deck.id}: ${insertCards.error.message}`);
      }
    }
  }

  if (progressRows.length > 0) {
    const upsertProgress = await supabase
      .from('deck_progress')
      .upsert(progressRows, { onConflict: 'deck_id' });

    if (upsertProgress.error) {
      fail(`Failed upserting progress: ${upsertProgress.error.message}`);
    }
  }

  const cardCount = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  console.log('Migration complete.');
  console.log(`Decks migrated: ${decks.length}`);
  console.log(`Cards migrated: ${cardCount}`);
  console.log(`Progress rows migrated: ${progressRows.length}`);
};

run().catch((error) => {
  fail(`Migration failed: ${error.message}`);
});
