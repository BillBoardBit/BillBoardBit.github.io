import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
// NostrEvent type import removed as it's not used directly

/**
 * Hook to manage the billboard list using kind 30078 events with tag "BillBoardBit"
 */
export function useBillboard() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  // Query to get all billboard entries
  const { data: billboardEntries = [], ...query } = useQuery({
    queryKey: ['billboard-entries'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([
        {
          kinds: [30078],
          '#t': ['BillBoardBit'],
          limit: 1000,
        }
      ], { signal });

      // Filter out events that don't have the required content
      return events.filter(event => {
        try {
          const content = JSON.parse(event.content || '{}');
          return content.npub && typeof content.npub === 'string';
        } catch {
          return false;
        }
      });
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  // Check if current user is in the billboard
  const isUserInBillboard = user ? billboardEntries.some(entry => entry.pubkey === user.pubkey) : false;

  // Mutation to add user to billboard
  const addToBillboard = useMutation({
    mutationFn: async ({ npub, displayName }: { npub: string; displayName?: string }) => {
      if (!user) throw new Error('User must be logged in');

      await publishEvent({
        kind: 30078,
        content: JSON.stringify({
          npub,
          displayName: displayName || '',
          addedAt: Math.floor(Date.now() / 1000),
        }),
        tags: [
          ['d', user.pubkey], // Use pubkey as identifier
          ['t', 'BillBoardBit'],
          ['alt', 'Billboard entry for collecting donations'],
        ],
      });
    },
    onSuccess: () => {
      // Invalidate and refetch billboard entries
      queryClient.invalidateQueries({ queryKey: ['billboard-entries'] });
    },
  });

  // Mutation to remove user from billboard
  const removeFromBillboard = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User must be logged in');

      // Publish an empty event to replace/delete the entry
      await publishEvent({
        kind: 30078,
        content: '',
        tags: [
          ['d', user.pubkey],
          ['t', 'BillBoardBit'],
          ['alt', 'Removed billboard entry'],
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billboard-entries'] });
    },
  });

  return {
    billboardEntries,
    isUserInBillboard,
    addToBillboard,
    removeFromBillboard,
    isLoading: query.isLoading,
    error: query.error,
  };
}