import React from 'react';
import { Card } from '../components/ui/Card';

export const EventsView: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-serif font-bold text-stone-900">Wedding Events</h1>
    <Card className="p-8 text-center text-stone-500 text-sm">
      Events management module scaffolded (Haldi, Mehendi, Sangeet, Wedding Ceremony, Reception).
    </Card>
  </div>
);

export const GuestsView: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-serif font-bold text-stone-900">Guest Directory</h1>
    <Card className="p-8 text-center text-stone-500 text-sm">
      Guest management and categorization module scaffolded.
    </Card>
  </div>
);

export const InvitationsView: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-serif font-bold text-stone-900">Digital Invitations</h1>
    <Card className="p-8 text-center text-stone-500 text-sm">
      Digital invitation generation and token dispatch module scaffolded.
    </Card>
  </div>
);

export const TasksView: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-serif font-bold text-stone-900">Planning & Tasks</h1>
    <Card className="p-8 text-center text-stone-500 text-sm">
      Wedding checklist, assignments, and task management module scaffolded.
    </Card>
  </div>
);

export const GalleryView: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-serif font-bold text-stone-900">Photo Gallery</h1>
    <Card className="p-8 text-center text-stone-500 text-sm">
      Cloudinary photo management and guest upload moderation module scaffolded.
    </Card>
  </div>
);

export const CheckinView: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-serif font-bold text-stone-900">QR Check-in & Entry</h1>
    <Card className="p-8 text-center text-stone-500 text-sm">
      Event QR verification and realtime check-in desk module scaffolded.
    </Card>
  </div>
);
