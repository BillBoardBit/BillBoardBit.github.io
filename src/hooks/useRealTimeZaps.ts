import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { extractZapAmount } from '@/lib/zapUtils';
import type { ZapWithMessage } from './useUserZaps';

/**
 * Hook to poll for real-time zap updates for a specific user
 * This hook periodically checks for new zap receipts and updates the cache automatically
 */
export function useRealTimeZaps(pubkey: string | undefined) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const lastCheckRef = useRef<number>(Math.floor(Date.now() / 1000));
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!pubkey) return;

    console.log('🔥 Starting real-time zap polling for:', pubkey);

    const checkForNewZaps = async () => {
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Query for zap receipts since last check
        const newZapReceipts = await nostr.query([{
          kinds: [9735],
          '#p': [pubkey],
          since: lastCheckRef.current,
          limit: 50,
        }], { signal: AbortSignal.timeout(5000) });

        if (newZapReceipts.length > 0) {
          console.log(`⚡ Found ${newZapReceipts.length} new zaps`);

          const newZaps: ZapWithMessage[] = [];

          for (const receipt of newZapReceipts) {
            try {
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

              const amount = extractZapAmount(receipt);

              newZaps.push({
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

          if (newZaps.length > 0) {
            // Update the query cache by adding new zaps to the first page
            queryClient.setQueryData(
              ['user-zaps', pubkey],
              (oldData: { pages: ZapWithMessage[][]; pageParams: (number | undefined)[] } | undefined) => {
                if (!oldData?.pages) return oldData;

                // Filter out any duplicates
                const existingIds = new Set(
                  oldData.pages.flat().map(zap => zap.id)
                );
                const uniqueNewZaps = newZaps.filter(zap => !existingIds.has(zap.id));

                if (uniqueNewZaps.length === 0) return oldData;

                // Add new zaps to the beginning of the first page
                const newPages = [...oldData.pages];
                if (newPages[0]) {
                  newPages[0] = [...uniqueNewZaps, ...newPages[0]].sort((a, b) => b.timestamp - a.timestamp);
                } else {
                  newPages[0] = uniqueNewZaps.sort((a, b) => b.timestamp - a.timestamp);
                }

                console.log(`💰 Added ${uniqueNewZaps.length} new zaps to cache`);
                setLastUpdate(new Date());
                return {
                  ...oldData,
                  pages: newPages,
                };
              }
            );
          }
        }

        lastCheckRef.current = currentTime;
      } catch (error) {
        console.warn('Failed to check for new zaps:', error);
      }
    };

    // Initial check
    checkForNewZaps();

    // Set up polling interval
    const interval = setInterval(checkForNewZaps, 5000); // Check every 5 seconds

    return () => {
      console.log('🔌 Stopping real-time zap polling');
      clearInterval(interval);
    };
  }, [pubkey, nostr, queryClient]);

  return { lastUpdate };
}