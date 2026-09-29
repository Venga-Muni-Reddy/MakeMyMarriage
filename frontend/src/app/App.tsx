import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '../routes';

import { AuthProvider } from '../context/AuthContext';
import { WeddingProvider } from '../context/WeddingContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WeddingProvider>
          <RouterProvider router={router} />
        </WeddingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
