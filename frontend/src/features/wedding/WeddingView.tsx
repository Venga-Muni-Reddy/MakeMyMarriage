import React from 'react';
import { Card } from '../../components/ui/Card';

export const WeddingView: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-serif font-bold text-stone-900">Wedding Overview</h1>
      <p className="text-sm text-stone-500">Manage and monitor wedding activities and telemetry</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-sm font-medium text-stone-500">Total Guests</h3>
        <p className="text-3xl font-bold text-stone-900 mt-2">--</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-medium text-stone-500">RSVPs Received</h3>
        <p className="text-3xl font-bold text-gold-600 mt-2">--</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-medium text-stone-500">Pending Tasks</h3>
        <p className="text-3xl font-bold text-stone-900 mt-2">--</p>
      </Card>
    </div>
  </div>
);
