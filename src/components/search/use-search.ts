'use client';

import { useMemo } from 'react';

import { QualificationCategory, DifficultyLevel, Qualification } from '@/types';

import { SearchFilters } from './search-filters';

interface UseSearchOptions {
  searchTerm: string;
  filters: SearchFilters;
  data: Qualification[];
  sortBy?: 'title' | 'difficulty' | 'duration' | 'category' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
  filteredData: Qualification[];
  totalCount: number;
  appliedFiltersCount: number;
  availableTags: string[];
}

export function useSearch({
  searchTerm,
  filters,
  data,
  sortBy = 'title',
  sortOrder = 'asc'
}: UseSearchOptions): SearchResult {
  return useMemo(() => {
    let filtered = [...data];

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.shortDescription?.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term)) ||
        item.learningObjectives.some(obj => obj.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(item => item.difficulty === filters.difficulty);
    }

    // Apply duration filter
    if (filters.duration) {
      filtered = filtered.filter(item => {
        switch (filters.duration) {
          case 'short':
            return item.estimatedDuration < 30;
          case 'medium':
            return item.estimatedDuration >= 30 && item.estimatedDuration <= 60;
          case 'long':
            return item.estimatedDuration > 60;
          default:
            return true;
        }
      });
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        filters.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // Apply retakes filter
    if (filters.allowRetakes !== undefined) {
      filtered = filtered.filter(item => item.allowRetakes === filters.allowRetakes);
    }

    // Apply published filter (default to published only unless explicitly set)
    const isPublishedFilter = filters.isPublished !== undefined ? filters.isPublished : true;
    filtered = filtered.filter(item => item.isPublished === isPublishedFilter && item.isActive);

    // Sort the results
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'difficulty':
          const difficultyOrder = {
            [DifficultyLevel.BEGINNER]: 1,
            [DifficultyLevel.INTERMEDIATE]: 2,
            [DifficultyLevel.ADVANCED]: 3,
            [DifficultyLevel.EXPERT]: 4
          };
          aValue = difficultyOrder[a.difficulty];
          bValue = difficultyOrder[b.difficulty];
          break;
        case 'duration':
          aValue = a.estimatedDuration;
          bValue = b.estimatedDuration;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'popularity':
          // TODO: Implement popularity metric based on enrollment/completion rates
          aValue = a.totalQuestions; // Temporary fallback
          bValue = b.totalQuestions;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (aValue < bValue) {return sortOrder === 'asc' ? -1 : 1;}
      if (aValue > bValue) {return sortOrder === 'asc' ? 1 : -1;}
      return 0;
    });

    // Get available tags from all data (not just filtered)
    const availableTags = Array.from(
      new Set(data.flatMap(item => item.tags))
    ).sort();

    // Count applied filters
    const appliedFiltersCount = Object.values(filters).filter(value => 
      value !== undefined && 
      value !== null && 
      !(Array.isArray(value) && value.length === 0)
    ).length;

    return {
      filteredData: filtered,
      totalCount: filtered.length,
      appliedFiltersCount,
      availableTags
    };
  }, [searchTerm, filters, data, sortBy, sortOrder]);
}

// Helper function to get filter summary text
export function getFilterSummary(filters: SearchFilters, searchTerm: string): string {
  const parts: string[] = [];

  if (searchTerm.trim()) {
    parts.push(`"${searchTerm}"`);
  }

  if (filters.category) {
    parts.push(`Category: ${filters.category.replace(/_/g, ' ').toLowerCase()}`);
  }

  if (filters.difficulty) {
    parts.push(`Difficulty: ${filters.difficulty.toLowerCase()}`);
  }

  if (filters.duration) {
    const durationLabels = {
      short: 'Quick (< 30 min)',
      medium: 'Standard (30-60 min)',
      long: 'Extended (> 60 min)'
    };
    parts.push(`Duration: ${durationLabels[filters.duration]}`);
  }

  if (filters.tags && filters.tags.length > 0) {
    parts.push(`Tags: ${filters.tags.join(', ')}`);
  }

  if (filters.allowRetakes !== undefined) {
    parts.push(filters.allowRetakes ? 'Retakes allowed' : 'Single attempt');
  }

  return parts.length > 0 ? parts.join(' • ') : 'All qualifications';
}