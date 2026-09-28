import React from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';
import { Heart, Calendar, Users, Mail, CheckSquare, Image, QrCode, Globe } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const base = weddingId ? `/dashboard/${weddingId}` : '/dashboard';

  const navItems = [
    { label: 'Overview', path: `${base}`, icon: Heart },
    { label: 'Events', path: `${base}/events`, icon: Calendar },
    { label: 'Guests', path: `${base}/guests`, icon: Users },
    { label: 'Invitations', path: `${base}/invitations`, icon: Mail },
    { label: 'Tasks', path: `${base}/tasks`, icon: CheckSquare },
    { label: 'Gallery', path: `${base}/gallery`, icon: Image },
    { label: 'Check-in', path: `${base}/checkin`, icon: QrCode },
    { label: 'Website', path: `${base}/website`, icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col shrink-0">
        <div className="h-16 px-6 flex items-center border-b border-stone-200">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-gold-600 fill-gold-500" />
            <span className="font-serif font-bold text-lg text-stone-900">MakeMyMarriage</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                <Icon className="w-4 h-4 text-stone-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-stone-200 px-8 flex items-center justify-between">
          <h2 className="text-sm font-medium text-stone-500">Wedding Dashboard</h2>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
