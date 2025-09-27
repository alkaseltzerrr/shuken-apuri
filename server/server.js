const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DECKS_FILE = path.join(DATA_DIR, 'decks.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory and files exist
async function initializeData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize decks file if it doesn't exist
    try {
      await fs.access(DECKS_FILE);
    } catch {
      await fs.writeFile(DECKS_FILE, JSON.stringify([]));
    }
    
    // Initialize progress file if it doesn't exist
    try {
      await fs.access(PROGRESS_FILE);
    } catch {
      await fs.writeFile(PROGRESS_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Failed to initialize data:', error);
  }
}

// Helper functions
async function readDecks() {
  try {
    const data = await fs.readFile(DECKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading decks:', error);
    return [];
  }
}

async function writeDecks(decks) {
  try {
    await fs.writeFile(DECKS_FILE, JSON.stringify(decks, null, 2));
  } catch (error) {
    console.error('Error writing decks:', error);
    throw error;
  }
}

async function readProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading progress:', error);
    return {};
  }
}

async function writeProgress(progress) {
  try {
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.error('Error writing progress:', error);
    throw error;
  }
}

// Routes

// Get all decks
app.get('/api/decks', async (req, res) => {
  try {
    const decks = await readDecks();
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// Get single deck
app.get('/api/decks/:id', async (req, res) => {
  try {
    const decks = await readDecks();
    const deck = decks.find(d => d.id === req.params.id);
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

// Create deck
app.post('/api/decks', async (req, res) => {
  try {
    const { title, description, cards = [] } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const decks = await readDecks();
    const newDeck = {
      id: Date.now().toString(),
      title,
      description: description || '',
      cards: cards.map(card => ({
        ...card,
        id: card.id || Date.now().toString() + Math.random(),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    decks.push(newDeck);
    await writeDecks(decks);
    
    res.status(201).json(newDeck);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

// Update deck
app.put('/api/decks/:id', async (req, res) => {
  try {
    const decks = await readDecks();
    const deckIndex = decks.findIndex(d => d.id === req.params.id);
    
    if (deckIndex === -1) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    const updatedDeck = {
      ...decks[deckIndex],
      ...req.body,
      id: req.params.id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };
    
    decks[deckIndex] = updatedDeck;
    await writeDecks(decks);
    
    res.json(updatedDeck);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update deck' });
  }
});

// Delete deck
app.delete('/api/decks/:id', async (req, res) => {
  try {
    const decks = await readDecks();
    const deckIndex = decks.findIndex(d => d.id === req.params.id);
    
    if (deckIndex === -1) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    decks.splice(deckIndex, 1);
    await writeDecks(decks);
    
    // Also remove progress data for this deck
    const progress = await readProgress();
    delete progress[req.params.id];
    await writeProgress(progress);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

// Get progress for a deck
app.get('/api/progress/:deckId', async (req, res) => {
  try {
    const progress = await readProgress();
    res.json(progress[req.params.deckId] || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update progress for a deck
app.put('/api/progress/:deckId', async (req, res) => {
  try {
    const progress = await readProgress();
    progress[req.params.deckId] = req.body;
    await writeProgress(progress);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Shuken Apuri server running on port ${PORT}`);
    console.log(`📊 Data stored in: ${DATA_DIR}`);
  });
});