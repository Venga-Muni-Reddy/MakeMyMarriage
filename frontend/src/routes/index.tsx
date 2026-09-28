import { createBrowserRouter } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AuthView } from '../features/auth/AuthView';
import { WeddingView } from '../features/wedding/WeddingView';
import {
  EventsView,
  GuestsView,
  InvitationsView,
  TasksView,
  GalleryView,
  CheckinView,
} from '../features/views';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-stone-900 mb-6">
            MakeMy<span className="text-gold-600">Marriage</span>
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
            The complete digital wedding ecosystem. Invitations, RSVPs, photo gallery, guest QR check-in, and real-time wedding coordination.
          </p>
          <div className="inline-block bg-gold-100 text-gold-800 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
            Scaffold Ready
          </div>
        </div>
      </div>
    ),
  },
  {
    path: '/login',
    element: (
      <div>
        <Navbar />
        <AuthView mode="login" />
      </div>
    ),
  },
  {
    path: '/signup',
    element: (
      <div>
        <Navbar />
        <AuthView mode="signup" />
      </div>
    ),
  },
  {
    path: '/dashboard/:weddingId?',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <WeddingView /> },
      { path: 'events', element: <EventsView /> },
      { path: 'guests', element: <GuestsView /> },
      { path: 'invitations', element: <InvitationsView /> },
      { path: 'tasks', element: <TasksView /> },
      { path: 'gallery', element: <GalleryView /> },
      { path: 'checkin', element: <CheckinView /> },
      {
        path: 'website',
        element: (
          <div className="space-y-4">
            <h1 className="text-2xl font-serif font-bold text-stone-900">Wedding Website Configuration</h1>
            <p className="text-sm text-stone-500">Public slug: /w/:slug</p>
          </div>
        ),
      },
    ],
  },
  {
    path: '/w/:slug',
    element: (
      <div className="p-12 text-center">
        <h1 className="font-serif text-3xl font-bold">Public Wedding Website</h1>
        <p className="text-stone-500 mt-2">[Public Wedding Website View Scaffolded]</p>
      </div>
    ),
  },
  {
    path: '/invite/:token',
    element: (
      <div className="p-12 text-center">
        <h1 className="font-serif text-3xl font-bold">Guest Digital Invitation</h1>
        <p className="text-stone-500 mt-2">[Token-Based Guest Experience Scaffolded]</p>
      </div>
    ),
  },
]);
