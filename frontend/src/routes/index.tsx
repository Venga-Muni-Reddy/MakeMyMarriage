import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { WeddingView } from '../features/wedding/WeddingView';
import { HomePage } from '../features/home/HomePage';
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
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
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
