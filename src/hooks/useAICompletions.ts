import { useEffect } from 'react';
import * as monaco from 'monaco-editor';
import axios from 'axios';

// Debounce helper for async functions
function debounceAsync(fn: (...args: any[]) => Promise<any>, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: any[];
  let pendingPromise: Promise<any> | null = null;
  return (...args: any[]) => {
    lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    if (pendingPromise) return pendingPromise;
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        pendingPromise = null;
        const result = await fn(...lastArgs);
        resolve(result);
      }, delay);
    });
  };
}

export function useAICompletions() {
  useEffect(() => {
    // Debounced API call for completions
    const getSuggestion = debounceAsync(async (code: string) => {
      try {
        const response = await axios.post('http://localhost:3001/api/complete', { code });
        return response.data.suggestion || '';
      } catch {
        return '';
      }
    }, 350); // 350ms debounce

    // Register an inline completions provider for Python
    // @ts-ignore: Monaco's inline API may not be in all type defs
    const provider = monaco.languages.registerInlineCompletionsProvider('python', {
      async provideInlineCompletions(model, position, context, token) {
        // Only show suggestion if cursor is at end of line
        const lineContent = model.getLineContent(position.lineNumber);
        if (position.column - 1 !== lineContent.length) {
          return { items: [], dispose: () => {} };
        }
        // Only trigger if the line is not empty or whitespace
        if (!lineContent.trim()) {
          return { items: [], dispose: () => {} };
        }
        const code = model.getValue();
        const suggestionText = await getSuggestion(code);
        if (!suggestionText) {
          return { items: [], dispose: () => {} };
        }
        // Show up to 5 lines of suggestion
        const lines = suggestionText.split('\n').slice(0, 5);
        const insertText = lines.join('\n');
        if (!insertText.trim()) return { items: [], dispose: () => {} };
        return {
          items: [
            {
              insertText: insertText,
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              command: undefined,
            },
          ],
          dispose: () => {},
        };
      },
      handleItemDidShow() {},
      freeInlineCompletions() {},
    });
    return () => provider.dispose();
  }, []);
} 