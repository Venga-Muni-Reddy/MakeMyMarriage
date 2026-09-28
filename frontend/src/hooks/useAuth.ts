import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { User, ApiResponseEnvelope } from '../types';

export function useAuth() {
  const { data, isLoading, error } = useQuery<ApiResponseEnvelope<User>>({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me'),
    retry: false,
  });

  return {
    user: data?.data || null,
    isAuthenticated: !!data?.data,
    isLoading,
    error,
  };
}
