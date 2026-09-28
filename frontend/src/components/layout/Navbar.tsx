import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center text-gold-600">
            <Heart className="w-5 h-5 fill-gold-500 text-gold-600" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
            MakeMy<span className="text-gold-600">Marriage</span>
          </span>
        </Link>

        <nav className="flex items-center space-x-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
