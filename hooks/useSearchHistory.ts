import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'frugal_finder_search_history';
const MAX_HISTORY_ITEMS = 5;

export const useSearchHistory = (): [string[], (term: string) => void] => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Failed to load search history from localStorage', error);
    }
  }, []);

  const addHistoryItem = useCallback((term: string) => {
    if (!term) return;

    setHistory(prevHistory => {
      // Remove the term if it already exists to move it to the front
      const filteredHistory = prevHistory.filter(item => item.toLowerCase() !== term.toLowerCase());
      
      // Add the new term to the beginning
      const newHistory = [term, ...filteredHistory];
      
      // Limit the history to the max number of items
      const limitedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
      
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
      } catch (error) {
        console.error('Failed to save search history to localStorage', error);
      }
      
      return limitedHistory;
    });
  }, []);

  return [history, addHistoryItem];
};
