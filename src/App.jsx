import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DeckProvider } from './context/DeckContext';
import Header from './components/Header';
import Home from './pages/Home';
import DeckView from './pages/DeckView';
import StudyMode from './pages/StudyMode';
import CreateDeck from './pages/CreateDeck';
import EditDeck from './pages/EditDeck';

function App() {
  return (
    <DeckProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/deck/:deckId" element={<DeckView />} />
              <Route path="/deck/:deckId/study" element={<StudyMode />} />
              <Route path="/create" element={<CreateDeck />} />
              <Route path="/deck/:deckId/edit" element={<EditDeck />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DeckProvider>
  );
}

export default App;