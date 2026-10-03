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
import { PublicWeddingWebsiteView } from '../features/website/PublicWeddingWebsiteView';
import { RsvpCommandView } from '../features/rsvp/RsvpCommandView';
import { SettingsView } from '../features/settings/SettingsView';
import { TasksView } from '../features/tasks/TasksView';
import { CollaboratorsView } from '../features/collaborators/CollaboratorsView';
import { NotificationHubView } from '../features/notifications/NotificationHubView';
import { PhotoVaultView } from '../features/gallery/PhotoVaultView';
import { GuestPhotoUploadView } from '../features/gallery/GuestPhotoUploadView';
import { CheckinDeskView } from '../features/checkin/CheckinDeskView';

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
      { path: 'team', element: <CollaboratorsView /> },
      { path: 'roles', element: <CollaboratorsView /> },
      { path: 'council', element: <CollaboratorsView /> },
      { path: 'collaborators', element: <CollaboratorsView /> },
      { path: 'notifications', element: <NotificationHubView /> },
      { path: 'dispatches', element: <NotificationHubView /> },
      { path: 'alerts', element: <NotificationHubView /> },
      { path: 'gallery', element: <PhotoVaultView /> },
      { path: 'photos', element: <PhotoVaultView /> },
      { path: 'media', element: <PhotoVaultView /> },
      { path: 'checkin', element: <CheckinDeskView /> },
      { path: 'checkins', element: <CheckinDeskView /> },
      { path: 'gate', element: <CheckinDeskView /> },
      { path: 'access', element: <CheckinDeskView /> },
      { path: 'settings', element: <SettingsView /> },
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
    element: <PublicWeddingWebsiteView />,
  },
  {
    path: '/w/:slug/upload-photos',
    element: <GuestPhotoUploadView />,
  },
  {
    path: '/gallery/upload',
    element: <GuestPhotoUploadView />,
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
