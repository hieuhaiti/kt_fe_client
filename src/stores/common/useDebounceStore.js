import { create } from 'zustand';

/**
 * Debounce Store for managing debounced operations
 * @returns {Object} Store state and actions
 */
export const useDebounceStore = create((set, get) => ({
  debounceTimers: {},
  debouncingKeys: new Set(),

  /**
   * Check if a specific key is currently debouncing
   * @param {string} key - Debounce key identifier
   * @returns {boolean} Whether the key is debouncing
   */
  isDebouncing: (key) => {
    return get().debouncingKeys.has(key);
  },

  /**
   * Debounce a callback function
   * @param {string} key - Unique key for this debounce operation
   * @param {Function} callback - Function to debounce
   * @param {number} delay - Delay in milliseconds (default: 300ms)
   */
  debounce: (key, callback, delay = 300) => {
    const { debounceTimers } = get();

    // Clear existing timer
    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key]);
    }

    // Add to debouncing keys
    set((state) => ({
      debouncingKeys: new Set(state.debouncingKeys).add(key),
    }));

    // Set new timer
    const timerId = setTimeout(() => {
      callback();

      // Remove from debouncing keys
      set((state) => {
        const newSet = new Set(state.debouncingKeys);
        newSet.delete(key);
        return { debouncingKeys: newSet };
      });

      // Clean up timer
      set((state) => {
        const newTimers = { ...state.debounceTimers };
        delete newTimers[key];
        return { debounceTimers: newTimers };
      });
    }, delay);

    set((state) => ({
      debounceTimers: { ...state.debounceTimers, [key]: timerId },
    }));
  },

  /**
   * Clear a specific debounce timer
   * @param {string} key - Debounce key to clear
   */
  clearDebounce: (key) => {
    const { debounceTimers } = get();
    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key]);

      set((state) => {
        const newTimers = { ...state.debounceTimers };
        delete newTimers[key];

        const newSet = new Set(state.debouncingKeys);
        newSet.delete(key);

        return {
          debounceTimers: newTimers,
          debouncingKeys: newSet,
        };
      });
    }
  },

  /**
   * Clear all debounce timers
   */
  clearAllDebounce: () => {
    const { debounceTimers } = get();
    Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
    set({ debounceTimers: {}, debouncingKeys: new Set() });
  },
}));
