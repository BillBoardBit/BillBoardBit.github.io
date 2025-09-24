import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { extractZapAmount } from '@/lib/zapUtils';

export interface ZapWithMessage {
  id: string;
  amount: number;
  message: string;
  sender: string;
  timestamp: number;
  zapRequest?: NostrEvent;
  zapReceipt: NostrEvent;
}

/**
 * Hook to get zaps with messages for a specific user
 */
export function useUserZaps(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['user-zaps', pubkey],
    enabled: !!pubkey,
    queryFn: async (c) => {
      if (!pubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      
      // Query for zap receipts (kind 9735) for this user
      const zapReceipts = await nostr.query([
        {
          kinds: [9735],
          '#p': [pubkey],
          limit: 100,
        }
      ], { signal });

      const zapsWithMessages: ZapWithMessage[] = [];

      for (const receipt of zapReceipts) {
        try {
          // Find the description tag which contains the zap request
          const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');
          if (!descriptionTag) continue;

          let zapRequest: NostrEvent | undefined;
          let message = '';
          let sender = '';

          try {
            zapRequest = JSON.parse(descriptionTag[1]);
            if (zapRequest) {
              message = zapRequest.content || '';
              sender = zapRequest.pubkey || '';
            }
          } catch {
            // If parsing fails, just use empty values
          }

          // Extract amount using the new utility function
          const amount = extractZapAmount(receipt);

          zapsWithMessages.push({
            id: receipt.id,
            amount,
            message,
            sender,
            timestamp: receipt.created_at,
            zapRequest,
            zapReceipt: receipt,
          });
        } catch (error) {
          console.warn('Failed to parse zap receipt:', error);
        }
      }

      // Sort by timestamp (newest first)
      return zapsWithMessages.sort((a, b) => b.timestamp - a.timestamp);
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}