import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';
import { getQueue, removeFromQueue, incrementRetry, type QueuedAction } from './queue';

const MAX_RETRIES = 3;

export function useOfflineQueue(
  processor: (action: QueuedAction) => Promise<void>,
) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const processorRef = useRef(processor);
  processorRef.current = processor;

  async function refreshCount() {
    const queue = await getQueue();
    setPendingCount(queue.length);
  }

  async function processQueue() {
    const queue = await getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    for (const action of queue) {
      if (action.retries >= MAX_RETRIES) {
        await removeFromQueue(action.id);
        continue;
      }
      try {
        await processorRef.current(action);
        await removeFromQueue(action.id);
      } catch {
        await incrementRetry(action.id);
      }
    }
    await refreshCount();
    setSyncing(false);
  }

  useEffect(() => {
    void refreshCount();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void processQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  return { pendingCount, syncing, refreshCount };
}
