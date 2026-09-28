import { Response } from 'express';

class SseService {
  private clients = new Map<string, Response>();

  registerClient(clientId: string, _weddingId: string, _userId: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    this.clients.set(clientId, res);
    res.write('event: CONNECTED\ndata: {"status":"connected"}\n\n');
    res.on('close', () => this.clients.delete(clientId));
  }

  broadcastToWedding(_weddingId: string, event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.clients.values()) {
      res.write(payload);
    }
  }
}

export const sseService = new SseService();
