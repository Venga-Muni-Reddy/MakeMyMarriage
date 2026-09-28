import React from 'react';
import { Card } from '../../components/ui/Card';

export const AuthView: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  return (
    <div className="max-w-md mx-auto my-16">
      <Card className="p-8">
        <h2 className="font-serif text-2xl font-bold text-center text-stone-900 mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Your Wedding'}
        </h2>
        <p className="text-sm text-stone-500 text-center mb-6">
          {mode === 'login' ? 'Sign in to access your wedding workspace' : 'Start your digital wedding journey'}
        </p>
        <p className="text-xs text-stone-400 text-center italic">[Auth Form Scaffolded]</p>
      </Card>
    </div>
  );
};
