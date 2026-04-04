import { useState, useEffect, useCallback } from "react";
import type { Category } from "../types";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (name: string, weight?: number) => {
    try {
      const cat = await createCategory(name, weight);
      setCategories((prev) => [...prev, cat]);
      return cat;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add category");
      return null;
    }
  }, []);

  const editCategory = useCallback(
    async (
      id: string,
      data: Partial<Pick<Category, "name" | "weight" | "is_active">>
    ) => {
      try {
        const updated = await updateCategory(id, data);
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        );
        return updated;
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to update category"
        );
        return null;
      }
    },
    []
  );

  const removeCategory = useCallback(async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to delete category"
      );
      return false;
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
  };
}
