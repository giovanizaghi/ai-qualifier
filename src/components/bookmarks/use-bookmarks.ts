'use client';

import { useState, useEffect } from 'react';

interface BookmarkState {
  bookmarks: Set<string>;
  isLoading: boolean;
  error: string | null;
}

interface UseBookmarksOptions {
  userId?: string;
}

interface UseBookmarksReturn {
  bookmarks: Set<string>;
  isBookmarked: (qualificationId: string) => boolean;
  toggleBookmark: (qualificationId: string) => Promise<void>;
  addBookmark: (qualificationId: string) => Promise<void>;
  removeBookmark: (qualificationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshBookmarks: () => Promise<void>;
}

export function useBookmarks({ userId }: UseBookmarksOptions = {}): UseBookmarksReturn {
  const [state, setState] = useState<BookmarkState>({
    bookmarks: new Set(),
    isLoading: false,
    error: null
  });

  // Fetch user's bookmarks
  const fetchBookmarks = async () => {
    if (!userId) {return;}

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/bookmarks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      const data = await response.json();
      const bookmarkIds = new Set<string>(data.bookmarks?.map((b: any) => b.qualificationId) || []);

      setState(prev => ({
        ...prev,
        bookmarks: bookmarkIds,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookmarks'
      }));
    }
  };

  // Check if a qualification is bookmarked
  const isBookmarked = (qualificationId: string): boolean => {
    return state.bookmarks.has(qualificationId);
  };

  // Add a bookmark
  const addBookmark = async (qualificationId: string): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qualificationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add bookmark');
      }

      setState(prev => ({
        ...prev,
        bookmarks: new Set([...prev.bookmarks, qualificationId])
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add bookmark'
      }));
      throw error;
    }
  };

  // Remove a bookmark
  const removeBookmark = async (qualificationId: string): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));

    try {
      const response = await fetch(`/api/bookmarks/${qualificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove bookmark');
      }

      setState(prev => {
        const newBookmarks = new Set(prev.bookmarks);
        newBookmarks.delete(qualificationId);
        return {
          ...prev,
          bookmarks: newBookmarks
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove bookmark'
      }));
      throw error;
    }
  };

  // Toggle bookmark status
  const toggleBookmark = async (qualificationId: string): Promise<void> => {
    if (isBookmarked(qualificationId)) {
      await removeBookmark(qualificationId);
    } else {
      await addBookmark(qualificationId);
    }
  };

  // Refresh bookmarks
  const refreshBookmarks = async (): Promise<void> => {
    await fetchBookmarks();
  };

  // Load bookmarks on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchBookmarks();
    }
  }, [userId]);

  return {
    bookmarks: state.bookmarks,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    isLoading: state.isLoading,
    error: state.error,
    refreshBookmarks
  };
}

// Local storage fallback for client-side persistence
export function useLocalBookmarks(): UseBookmarksReturn {
  const [state, setState] = useState<BookmarkState>({
    bookmarks: new Set(),
    isLoading: false,
    error: null
  });

  const STORAGE_KEY = 'ai-qualifier-bookmarks';

  // Load bookmarks from localStorage
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const bookmarkIds = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          bookmarks: new Set(bookmarkIds)
        }));
      }
    } catch (error) {
      console.error('Failed to load bookmarks from storage:', error);
    }
  };

  // Save bookmarks to localStorage
  const saveToStorage = (bookmarks: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
    } catch (error) {
      console.error('Failed to save bookmarks to storage:', error);
    }
  };

  const isBookmarked = (qualificationId: string): boolean => {
    return state.bookmarks.has(qualificationId);
  };

  const addBookmark = async (qualificationId: string): Promise<void> => {
    const newBookmarks = new Set([...state.bookmarks, qualificationId]);
    setState(prev => ({ ...prev, bookmarks: newBookmarks }));
    saveToStorage(newBookmarks);
  };

  const removeBookmark = async (qualificationId: string): Promise<void> => {
    const newBookmarks = new Set(state.bookmarks);
    newBookmarks.delete(qualificationId);
    setState(prev => ({ ...prev, bookmarks: newBookmarks }));
    saveToStorage(newBookmarks);
  };

  const toggleBookmark = async (qualificationId: string): Promise<void> => {
    if (isBookmarked(qualificationId)) {
      await removeBookmark(qualificationId);
    } else {
      await addBookmark(qualificationId);
    }
  };

  const refreshBookmarks = async (): Promise<void> => {
    loadFromStorage();
  };

  // Load from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  return {
    bookmarks: state.bookmarks,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    isLoading: state.isLoading,
    error: state.error,
    refreshBookmarks
  };
}