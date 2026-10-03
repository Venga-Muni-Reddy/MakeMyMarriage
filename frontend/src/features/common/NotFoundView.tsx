import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, Home, PlusCircle, ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  title?: string;
  message?: string;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  title = 'Wedding Website Not Found',
  message = 'The wedding website you are trying to view has not been inaugurated or published yet, or the link is incomplete.',
}) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0e0709] text-stone-100 flex items-center justify-center p-6 selection:bg-amber-700 selection:text-white">
      <div className="max-w-lg w-full bg-[#190d11] border border-amber-900/40 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        {/* Subtle royal ambient glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Crown emblem */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-5 shadow-lg">
          <Crown className="w-8 h-8" />
        </div>

        <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400 block mb-2">
          MakeMyMarriage Concierge
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-amber-50 mb-3 leading-tight">
          {title}
        </h1>

        <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4">
          {message}
        </p>

        {location.pathname && (
          <div className="inline-block px-3 py-1 rounded-lg bg-black/40 border border-amber-900/30 text-[11px] font-mono text-stone-400 mb-6">
            Attempted URL: <span className="text-amber-200">{location.pathname}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-amber-900/30">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>

          <Link
            to="/setup-wedding"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold text-xs border border-stone-700 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Inaugurate Wedding</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-stone-400 hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundView;
