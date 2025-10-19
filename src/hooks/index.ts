// Custom React hooks for the AI Qualifier application

import { useState, useEffect, useCallback } from 'react';
import type { User, Assessment, UserProgress } from '@/types';

// Hook for managing local storage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Hook for managing assessment timer
export function useAssessmentTimer(initialTime: number = 0) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining]);

  const start = () => setIsActive(true);
  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);
  const reset = (newTime?: number) => {
    setTimeRemaining(newTime || initialTime);
    setIsActive(false);
    setIsPaused(false);
  };

  return {
    timeRemaining,
    isActive,
    isPaused,
    start,
    pause,
    resume,
    reset,
  };
}

// Hook for managing user authentication state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This would typically fetch user data from your auth provider
    // For now, we'll just set loading to false
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Implementation would go here
    setLoading(true);
    try {
      // API call to login
      // setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    // Clear any stored tokens/data
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}

// Hook for managing assessment state
export function useAssessment(qualificationId: string) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const startAssessment = async () => {
    setLoading(true);
    try {
      // API call to start assessment
      // setAssessment(newAssessment);
    } catch (error) {
      console.error('Failed to start assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const previousQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      // API call to submit assessment
      // return result;
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    assessment,
    currentQuestionIndex,
    answers,
    loading,
    startAssessment,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    submitAssessment,
  };
}

// Hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}