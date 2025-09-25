import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
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

  return useInfiniteQuery({
    queryKey: ['user-zaps', pubkey],
    enabled: !!pubkey,
    queryFn: async ({ pageParam, signal: querySignal }) => {
      if (!pubkey) return [];

      const signal = AbortSignal.any([querySignal, AbortSignal.timeout(10000)]);
      
      // Query for zap receipts (kind 9735) for this user with pagination
      const filter: NostrFilter = {
        kinds: [9735],
        '#p': [pubkey],
        limit: 20, // Reasonable page size for pagination
      };
      
      // Add until parameter for pagination (timestamp-based)
      if (pageParam) {
        filter.until = pageParam;
      }
      
      const zapReceipts = await nostr.query([filter], { signal });

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
      console.log(`📥 Page loaded: ${zapsWithMessages.length} zaps`, { pageParam, pubkey });
      return zapsWithMessages.sort((a, b) => b.timestamp - a.timestamp);
    },
    getNextPageParam: (lastPage) => {
      // If no events in last page, no more pages
      if (!lastPage || lastPage.length === 0) return undefined;
      
      // Use the oldest event's timestamp minus 1 as the next page param
      const oldestEvent = lastPage[lastPage.length - 1];
      return oldestEvent.timestamp - 1;
    },
    initialPageParam: undefined,
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // 10 seconds - more frequent updates for real-time feel
    refetchIntervalInBackground: true, // Keep updating even when tab is not active
  });
}