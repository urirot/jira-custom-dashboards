import { useState } from 'react';
import axios from 'axios';

export type LinkingState = 'idle' | 'selecting' | 'loading';

export function useLinkIssue({ onSuccess }: { onSuccess?: () => void }) {
  const [linkingState, setLinkingState] = useState<LinkingState>('idle');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start linking from a source ticket
  function selectSource(ticketKey: string) {
    setSelectedSource(ticketKey);
    setLinkingState('selecting');
  }

  // Finish linking to a target ticket
  async function selectTarget(targetKey: string) {
    if (!selectedSource || selectedSource === targetKey) return;
    setLinkingState('loading');
    setIsLoading(true);
    try {
      await axios.post('http://localhost:4000/api/link-issue', {
        from: selectedSource,
        to: targetKey,
        type: 'blocks'
      });
      
      setLinkingState('idle');
      setSelectedSource(null);
      setIsLoading(false);
      if (onSuccess) onSuccess();
    } catch (e) {
      setLinkingState('idle');
      setSelectedSource(null);
      setIsLoading(false);
      // Optionally handle error (toast, etc)
    }
  }

  function resetLinking() {
    setLinkingState('idle');
    setSelectedSource(null);
    setIsLoading(false);
  }

  return {
    linkingState,
    selectedSource,
    isLoading,
    selectSource,
    selectTarget,
    resetLinking,
  };
} 