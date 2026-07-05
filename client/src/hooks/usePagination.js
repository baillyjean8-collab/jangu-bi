import { useState, useCallback, useRef } from 'react';

/**
 * usePagination — hook générique pour les listes paginées.
 *
 * Usage :
 *   const { data, loading, page, total, goTo, reload } = usePagination(
 *     (page, limit) => parishesApi.list({ page, limit }),
 *     { limit: 12 }
 *   );
 */
export function usePagination(fetcher, options = {}) {
  const { limit = 20, initialPage = 1 } = options;

  const [data, setData]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  // Ref pour éviter les race conditions si l'utilisateur change de page rapidement
  const requestId = useRef(0);

  const fetch = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    const id = ++requestId.current;

    try {
      const res = await fetcher(targetPage, limit);
      // Ignorer les réponses périmées
      if (id !== requestId.current) return;

      const resData = res.data;
      // Supporte les deux formats : { data: [...] } et { data: { items: [...], total: N } }
      const items = Array.isArray(resData.data)
        ? resData.data
        : resData.data?.items || resData.data?.data || [];
      const totalCount = resData.meta?.pagination?.total
        ?? resData.data?.total
        ?? resData.total
        ?? items.length;

      setData(items);
      setTotal(totalCount);
      setPage(targetPage);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err?.response?.data?.message || 'Erreur de chargement');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetcher, limit]);

  const goTo    = useCallback((p) => fetch(p),      [fetch]);
  const next    = useCallback(() => fetch(page + 1), [fetch, page]);
  const prev    = useCallback(() => fetch(page - 1), [fetch, page]);
  const reload  = useCallback(() => fetch(page),     [fetch, page]);

  const totalPages = Math.ceil(total / limit) || 1;
  const hasNext    = page < totalPages;
  const hasPrev    = page > 1;

  return {
    data, total, page, loading, error,
    totalPages, hasNext, hasPrev,
    goTo, next, prev, reload, fetch,
  };
}
