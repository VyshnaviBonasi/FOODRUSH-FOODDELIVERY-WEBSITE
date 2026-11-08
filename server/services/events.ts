import type { Response } from 'express';
import type { Order } from '../../src/types/index.js';

interface Client {
  id: string;
  res: Response;
  role?: string;
  userId?: string;
}

let clients: Client[] = [];

export function addEventClient(id: string, res: Response, role?: string, userId?: string) {
  clients.push({ id, res, role, userId });

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  res.on('close', () => {
    clients = clients.filter(c => c.id !== id);
  });
}

export function broadcastOrderEvent(order: Order, action: string = 'ORDER_UPDATED') {
  const payload = JSON.stringify({
    type: action,
    order,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch (err) {
      // Client disconnected
    }
  }
}
