import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Plus, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-card/80 dark:bg-dark-card/80 backdrop-blur-sm shadow-lg border-b-4 border-primary dark:border-dark-primary transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold text-text-primary dark:text-dark-text-primary hover:text-primary dark:hover:text-dark-primary transition-colors duration-500"
          >
            <BookOpen className="w-8 h-8 text-primary dark:text-dark-primary" />
            <span className="font-japanese">集験アプリ</span>
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-400 ${
                isActive('/') 
                  ? 'bg-primary dark:bg-dark-primary text-white shadow-md transform scale-105' 
                  : 'text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary hover:bg-primary/20 dark:hover:bg-dark-primary/20'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            
            <Link
              to="/create"
              className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-400 ${
                isActive('/create') 
                  ? 'bg-secondary dark:bg-dark-secondary text-white shadow-md transform scale-105' 
                  : 'text-text-secondary dark:text-dark-text-secondary hover:text-secondary dark:hover:text-dark-secondary hover:bg-secondary/20 dark:hover:bg-dark-secondary/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary hover:bg-primary/20 dark:hover:bg-dark-primary/20 transition-all duration-300"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;