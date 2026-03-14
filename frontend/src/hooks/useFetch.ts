import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

function useFetch<T>(fetcher: () => Promise<T>): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const execute = useCallback(() => {
        setLoading(true);
        setError(null);
        fetcherRef.current()
            .then((result) => {
                setData(result);
                setLoading(false);
            })
            .catch((err: Error) => {
                setError(err.message || 'Unknown error');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        execute();
    }, [execute]);

    return { data, loading, error, refetch: execute };
}

export default useFetch;
