import { useState, useEffect, useCallback } from 'react';

// ==============================|| LOCAL STORAGE HOOKS ||============================== //

export function useLocalStorage<T>(key: string, defaultValue: T): {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
  setField: (field: keyof T, value: T[keyof T]) => void;
  resetState: () => void;
} {
  const readValue = (): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return defaultValue;
    }
  };

  const [state, setState] = useState<T>(readValue);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn(`Error setting localStorage key "${key}":`, err);
    }
  }, [key, state]);

  const setField = useCallback((field: keyof T, value: T[keyof T]) => {
    setState((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(defaultValue);
    localStorage.setItem(key, JSON.stringify(defaultValue));
  }, [defaultValue, key]);

  return { state, setState, setField, resetState };
}
