import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { weddingService, Wedding, CreateWeddingPayload } from '../services/wedding.service';
import { useAuth } from './AuthContext';

interface WeddingContextType {
  currentWedding: Wedding | null;
  weddings: Wedding[];
  isLoading: boolean;
  createWedding: (payload: CreateWeddingPayload) => Promise<Wedding>;
  selectWedding: (weddingId: string) => void;
  refreshWeddings: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export const WeddingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeddings = async () => {
    if (!isAuthenticated) {
      setWeddings([]);
      setCurrentWedding(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await weddingService.getWeddings();
      setWeddings(data);
      if (data.length > 0 && !currentWedding) {
        // Automatically select the most recently created or active wedding
        setCurrentWedding(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch weddings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeddings();
  }, [isAuthenticated]);

  const createWedding = async (payload: CreateWeddingPayload): Promise<Wedding> => {
    const created = await weddingService.createWedding(payload);
    setWeddings((prev) => [created, ...prev]);
    setCurrentWedding(created);
    return created;
  };

  const selectWedding = (weddingId: string) => {
    const found = weddings.find((w) => w.id === weddingId);
    if (found) setCurrentWedding(found);
  };

  return (
    <WeddingContext.Provider
      value={{
        currentWedding,
        weddings,
        isLoading,
        createWedding,
        selectWedding,
        refreshWeddings: fetchWeddings,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
};
