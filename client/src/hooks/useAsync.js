import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for handling async operations with consistent loading, error, and data states.
 * 
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Whether to execute immediately on mount (default: false)
 * @param {*} options.initialData - Initial data value (default: null)
 * @param {Function} options.onSuccess - Callback on successful execution
 * @param {Function} options.onError - Callback on error
 * @returns {Object} - { execute, loading, error, data, reset, setData }
 * 
 * @example
 * const { execute, loading, error, data } = useAsync(
 *   () => api.get('/users'),
 *   { immediate: true }
 * );
 * 
 * // Or execute manually
 * const { execute, loading, data } = useAsync(fetchUserById);
 * await execute(userId);
 */
export function useAsync(asyncFunction, options = {}) {
  const {
    immediate = false,
    initialData = null,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState({
    loading: immediate,
    error: null,
    data: initialData,
  });

  // Use ref to track if component is mounted
  const mountedRef = useRef(true);
  // Store the latest async function to avoid stale closures
  const asyncFunctionRef = useRef(asyncFunction);
  asyncFunctionRef.current = asyncFunction;

  // Store callbacks in refs to avoid dependency issues
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunctionRef.current(...args);
      
      if (mountedRef.current) {
        setState({ loading: false, error: null, data: result });
        onSuccessRef.current?.(result);
      }
      
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false, error }));
        onErrorRef.current?.(error);
      }
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: initialData });
  }, [initialData]);

  const setData = useCallback((data) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  // Handle immediate execution
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    execute,
    loading: state.loading,
    error: state.error,
    data: state.data,
    reset,
    setData,
    setError,
    isIdle: !state.loading && !state.error && state.data === initialData,
    isSuccess: !state.loading && !state.error && state.data !== initialData,
    isError: !state.loading && state.error !== null,
  };
}

/**
 * Custom hook for handling multiple async operations
 * Useful for pages that need to fetch multiple resources
 * 
 * @example
 * const { executeAll, loading, errors, data, allLoaded } = useAsyncMultiple({
 *   user: () => fetchUser(userId),
 *   posts: () => fetchPosts(userId),
 *   comments: () => fetchComments(userId),
 * });
 */
export function useAsyncMultiple(asyncFunctions, options = {}) {
  const { immediate = false } = options;
  
  const [state, setState] = useState(() => {
    const keys = Object.keys(asyncFunctions);
    return {
      loading: keys.reduce((acc, key) => ({ ...acc, [key]: immediate }), {}),
      errors: keys.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
      data: keys.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
    };
  });

  const mountedRef = useRef(true);

  const executeOne = useCallback(async (key) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: true },
      errors: { ...prev.errors, [key]: null },
    }));

    try {
      const result = await asyncFunctions[key]();
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, [key]: false },
          data: { ...prev.data, [key]: result },
        }));
      }
      
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, [key]: false },
          errors: { ...prev.errors, [key]: error },
        }));
      }
      throw error;
    }
  }, [asyncFunctions]);

  const executeAll = useCallback(async () => {
    const keys = Object.keys(asyncFunctions);
    const results = await Promise.allSettled(
      keys.map(key => executeOne(key))
    );
    
    return keys.reduce((acc, key, index) => {
      acc[key] = results[index].status === 'fulfilled' 
        ? results[index].value 
        : null;
      return acc;
    }, {});
  }, [asyncFunctions, executeOne]);

  useEffect(() => {
    if (immediate) {
      executeAll();
    }
  }, [immediate, executeAll]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const allLoading = Object.values(state.loading).some(Boolean);
  const allLoaded = Object.values(state.loading).every(v => !v);
  const hasErrors = Object.values(state.errors).some(Boolean);

  return {
    executeOne,
    executeAll,
    loading: state.loading,
    errors: state.errors,
    data: state.data,
    allLoading,
    allLoaded,
    hasErrors,
  };
}

export default useAsync;
