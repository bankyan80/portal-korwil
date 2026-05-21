'use client';

import { useEffect, useRef, useCallback } from 'react';
import { saveDraft, loadDraft, removeDraft } from '@/lib/local/draftStorage';
import type { DraftKey } from '@/lib/local/draftStorage';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSaveForm<T extends Record<string, unknown>>(
  draftKey: DraftKey,
  onStatusChange?: (status: AutoSaveStatus) => void,
  debounceMs = 800,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  const save = useCallback(async (formData: T) => {
    const serialized = JSON.stringify(formData);
    if (serialized === lastSavedRef.current) return 'saved' as AutoSaveStatus;
    try {
      onStatusChange?.('saving');
      await saveDraft(draftKey, formData);
      lastSavedRef.current = serialized;
      onStatusChange?.('saved');
      return 'saved' as AutoSaveStatus;
    } catch {
      onStatusChange?.('error');
      return 'error' as AutoSaveStatus;
    }
  }, [draftKey, onStatusChange]);

  const debouncedSave = useCallback((formData: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(formData), debounceMs);
  }, [save, debounceMs]);

  const load = useCallback(async (): Promise<T | null> => {
    return loadDraft<T>(draftKey);
  }, [draftKey]);

  const clear = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    lastSavedRef.current = '';
    await removeDraft(draftKey);
  }, [draftKey]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { debouncedSave, save, load, clear };
}
