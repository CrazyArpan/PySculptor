import { useState, useEffect, useRef, useCallback } from 'react';
import { type PyodideInterface } from 'pyodide';

declare global {
  interface Window {
    loadPyodide: (config: { 
        indexURL: string,
        stdout: (text: string) => void,
        stderr: (text: string) => void,
    }) => Promise<PyodideInterface>;
  }
}

export function usePyodide() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [output, setOutput] = useState<string>("");

  const pyodideRef = useRef<PyodideInterface | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Setup stdout and stderr handlers
        const pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
          stdout: (text) => setOutput(prev => `${prev}${text}\n`),
          stderr: (text) => setOutput(prev => `${prev}[ERROR] ${text}\n`),
        });
        await pyodideInstance.loadPackage('micropip');
        pyodideRef.current = pyodideInstance;
        setPyodide(pyodideInstance);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!pyodideRef.current) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
      script.onload = () => load();
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const runPython = useCallback(async (code: string) => {
    if (!pyodide) {
      throw new Error('Pyodide is not loaded yet.');
    }
    try {
      await pyodide.loadPackagesFromImports(code);
      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined) {
          setOutput(prev => `${prev}${String(result)}\n`);
      }
    } catch (e) {
       setOutput(prev => `${prev}${String(e)}\n`);
    }
  }, [pyodide]);

  const clearOutput = useCallback(() => {
    setOutput("");
  }, []);

  return { pyodide, isLoading, error, runPython, output, clearOutput };
} 