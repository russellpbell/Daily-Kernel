'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  weight: number;
  is_active: boolean;
  source_type: 'news' | 'biomedical' | 'stem' | 'academic';
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories();
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (name: string, source_type?: string) => {
    try {
      const data = await api.addCategory(name, source_type);
      setCategories(prev => [...prev, data.category]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: { weight?: number; is_active?: boolean; source_type?: string }) => {
    try {
      const data = await api.updateCategory(id, updates);
      setCategories(prev => prev.map(c => (c.id === id ? data.category : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }, []);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: fetchCategories,
  };
}
