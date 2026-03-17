import { BabyService } from './api';

const QUEUE_KEY = 'kindle_offline_queue';
const MAX_QUEUE_SIZE = 50;

interface QueuedRecord {
  id: string;
  payload: any;
  queuedAt: number;
}

function generateId(): string {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function readQueue(): QueuedRecord[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedRecord[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueLength(): number {
  return readQueue().length;
}

export function enqueueRecord(payload: any): void {
  const queue = readQueue();
  if (queue.length >= MAX_QUEUE_SIZE) return;
  queue.push({ id: generateId(), payload, queuedAt: Date.now() });
  writeQueue(queue);
}

export async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedRecord[] = [];
  for (const item of queue) {
    try {
      await BabyService.createRecord(item.payload);
    } catch {
      remaining.push(item);
      break; // stop on first failure, keep rest in order
    }
  }
  // Keep unprocessed items
  const processed = queue.length - remaining.length;
  const rest = queue.slice(processed);
  writeQueue(rest.length > 0 ? rest : []);
  return rest.length;
}

export async function createRecordOfflineAware(payload: any): Promise<{ offline: boolean; recordId?: string }> {
  // Try to flush any pending queue first
  if (navigator.onLine) {
    try { await flushQueue(); } catch { /* ignore */ }
  }

  if (!navigator.onLine) {
    enqueueRecord(payload);
    return { offline: true };
  }

  try {
    const result = await BabyService.createRecord(payload);
    return { offline: false, recordId: result?.id };
  } catch {
    enqueueRecord(payload);
    return { offline: true };
  }
}
