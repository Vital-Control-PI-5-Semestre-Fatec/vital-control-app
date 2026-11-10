import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'vital-control.offline-queue';

export interface QueuedAction {
  id: string;
  type: 'REGISTER_DOSE' | 'CREATE_VISIT' | 'ADJUST_STOCK';
  payload: unknown;
  createdAt: string;
  retries: number;
}

export async function getQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

export async function addToQueue(action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries'>): Promise<void> {
  const queue = await getQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `${action.type}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  queue.push(newAction);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function incrementRetry(id: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((item) =>
    item.id === id ? { ...item, retries: item.retries + 1 } : item,
  );
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
