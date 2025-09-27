import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Plus } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm shadow-lg border-b-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold text-text-primary hover:text-primary transition-colors duration-500"
          >
            <BookOpen className="w-8 h-8 text-primary" />
            <span className="font-japanese">集験アプリ</span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-400 ${
                isActive('/') 
                  ? 'bg-primary text-white shadow-md transform scale-105' 
                  : 'text-text-secondary hover:text-primary hover:bg-primary/20'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            
            <Link
              to="/create"
              className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-400 ${
                isActive('/create') 
                  ? 'bg-secondary text-white shadow-md transform scale-105' 
                  : 'text-text-secondary hover:text-secondary hover:bg-secondary/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;