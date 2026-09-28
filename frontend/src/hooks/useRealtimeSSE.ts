import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeSSE(weddingId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!weddingId) return;

    const eventSource = new EventSource(`/api/v1/weddings/${weddingId}/events/stream`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('SSE message received:', payload);
      } catch (err) {
        console.error('Failed to parse SSE payload', err);
      }
    };

    eventSource.addEventListener('GUEST_CHECKED_IN', () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['guests', weddingId] });
    });

    eventSource.addEventListener('RSVP_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: ['rsvps', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['guests', weddingId] });
    });

    return () => {
      eventSource.close();
    };
  }, [weddingId, queryClient]);
}
