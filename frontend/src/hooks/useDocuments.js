import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteDocument,
  fetchDocuments,
  uploadDocument,
} from "../api/documents";

const DEFAULT_FILTERS = {
  search: "",
  type_document: "",
  type_support: "",
};

const DEFAULT_PAGINATION = {
  page: 1,
  page_size: 8,
  total_pages: 1,
  total_items: 0,
};

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search
  const debounceRef = useRef(null);

  const load = useCallback(
    async (currentFilters, page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDocuments({
          ...currentFilters,
          page,
          page_size: DEFAULT_PAGINATION.page_size,
        });
        setDocuments(data.results);
        setPagination({ ...data.pagination });
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Erreur lors du chargement des documents."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Chargement initial
  useEffect(() => {
    load(DEFAULT_FILTERS, 1);
  }, [load]);

  /**
   * Applique des filtres (avec debounce sur la recherche texte).
   */
  const applyFilters = useCallback(
    (partial) => {
      const next = { ...filters, ...partial };
      setFilters(next);

      clearTimeout(debounceRef.current);
      const delay = "search" in partial ? 350 : 0;
      debounceRef.current = setTimeout(() => load(next, 1), delay);
    },
    [filters, load]
  );

  /**
   * Navigation entre pages.
   */
  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > pagination.total_pages) return;
      load(filters, page);
    },
    [filters, load, pagination.total_pages]
  );

  /**
   * Upload d'un nouveau document (CAQ only — vérifié côté serveur).
   * @param {FormData} formData
   */
  const upload = useCallback(
    async (formData) => {
      const doc = await uploadDocument(formData);
      // Recharge la première page pour afficher le nouveau document
      await load(filters, 1);
      return doc;
    },
    [filters, load]
  );

  /**
   * Supprime un document par son id.
   */
  const remove = useCallback(
    async (id) => {
      await deleteDocument(id);
      await load(filters, pagination.page);
    },
    [filters, load, pagination.page]
  );

  return {
    documents,
    pagination,
    loading,
    error,
    filters,
    applyFilters,
    goToPage,
    upload,
    remove,
  };
}