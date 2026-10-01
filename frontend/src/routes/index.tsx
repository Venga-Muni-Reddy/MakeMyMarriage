import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { WeddingView } from '../features/wedding/WeddingView';
import { WeddingSetupPage } from '../features/wedding/WeddingSetupPage';
import { HomePage } from '../features/home/HomePage';
import { EventsView } from '../features/events/EventsView';
import { GuestsView } from '../features/guests/GuestsView';
import { InvitationsView } from '../features/invitations/InvitationsView';
import { PublicInvitationView } from '../features/invitations/PublicInvitationView';
import { RsvpCommandView } from '../features/rsvp/RsvpCommandView';
import { SettingsView } from '../features/settings/SettingsView';
import {
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
    path: '/setup-wedding',
    element: <WeddingSetupPage />,
  },
  {
    path: '/weddings/new',
    element: <WeddingSetupPage />,
  },
  {
    path: '/dashboard/:weddingId?',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <WeddingView /> },
      { path: 'events', element: <EventsView /> },
      { path: 'guests', element: <GuestsView /> },
      { path: 'rsvps', element: <RsvpCommandView /> },
      { path: 'rsvp', element: <RsvpCommandView /> },
      { path: 'invitations', element: <InvitationsView /> },
      { path: 'invites', element: <InvitationsView /> },
      { path: 'tasks', element: <TasksView /> },
      { path: 'gallery', element: <GalleryView /> },
      { path: 'checkin', element: <CheckinView /> },
      { path: 'settings', element: <SettingsView /> },
      { path: 'roles', element: <SettingsView /> },
      { path: 'team', element: <SettingsView /> },
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
    element: <PublicInvitationView />,
  },
  {
    path: '/w/tok_:token',
    element: <PublicInvitationView />,
  },
]);
