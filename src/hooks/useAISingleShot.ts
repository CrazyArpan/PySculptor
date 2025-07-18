import { useState } from 'react';
import axios from 'axios';

export function useAISingleShot() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const getSuggestion = async (code: string) => {
    setLoading(true);
    setSuggestion(null);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.post(`${apiBase}/api/complete`, { code });
      setSuggestion(response.data.suggestion || null);
      return response.data.suggestion || '';
    } catch (e) {
      setSuggestion(null);
      return '';
    } finally {
      setLoading(false);
    }
  };

  return { loading, suggestion, getSuggestion };
} 
