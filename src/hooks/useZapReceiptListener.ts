import { useEffect, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

interface ZapRequestData {
  pubkey: string;
  amount: number;
  eventId?: string;
  profile?: string;
}

/**
 * Hook to listen for zap receipts (kind 9735) that match a specific zap request
 * Useful for closing modals when a payment is confirmed on the network
 */
export function useZapReceiptListener(
  zapRequest: ZapRequestData | null,
  onReceiptReceived: (receipt: NostrEvent) => void,
  enabled: boolean = true
) {
  const { nostr } = useNostr();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !zapRequest) {
      // Clean up any existing subscription
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    console.log('🎯 Starting zap receipt listener for:', zapRequest);

    // Create a new AbortController for this subscription
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Listen for zap receipts using async iterator
    const processSubscription = async () => {
      try {
        const subscription = nostr.req([{
          kinds: [9735], // Zap receipts
          '#p': [zapRequest.pubkey], // To the target pubkey
          since: Math.floor(Date.now() / 1000) - 60, // Start from 1 minute ago to catch recent payments
          limit: 10,
        }], { signal });

        for await (const msg of subscription) {
          if (signal.aborted) break;

          if (msg[0] === 'EVENT') {
            const receipt = msg[2] as NostrEvent;
            
            try {
              console.log('📨 Received zap receipt:', receipt);

              // Extract the description tag which contains the original zap request
              const descriptionTag = receipt.tags.find(tag => tag[0] === 'description');
              if (!descriptionTag || !descriptionTag[1]) {
                console.log('❌ No description tag found in receipt');
                continue;
              }

              let originalZapRequest: NostrEvent;
              try {
                originalZapRequest = JSON.parse(descriptionTag[1]);
              } catch (error) {
                console.warn('❌ Failed to parse zap request from description:', error);
                continue;
              }

              // Verify this receipt matches our zap request
              const isMatch = verifyZapReceiptMatch(originalZapRequest, zapRequest, receipt);
              
              if (isMatch) {
                console.log('✅ Zap receipt matches our request!');
                onReceiptReceived(receipt);
              } else {
                console.log('❌ Zap receipt does not match our request');
              }
            } catch (error) {
              console.warn('Failed to process zap receipt:', error);
            }
          } else if (msg[0] === 'EOSE') {
            console.log('🔚 End of stored events for zap receipts');
          }
        }
      } catch (error) {
        if (!signal.aborted) {
          console.warn('Subscription error:', error);
        }
      }
    };

    // Start the subscription processing
    processSubscription();

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up zap receipt listener');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [enabled, zapRequest, onReceiptReceived, nostr]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
}

/**
 * Verify that a zap receipt matches our original zap request
 */
function verifyZapReceiptMatch(
  originalZapRequest: NostrEvent,
  expectedRequest: ZapRequestData,
  receipt: NostrEvent
): boolean {
  // Check if the pubkey matches
  if (originalZapRequest.pubkey !== expectedRequest.pubkey) {
    console.log('❌ Pubkey mismatch:', {
      original: originalZapRequest.pubkey,
      expected: expectedRequest.pubkey
    });
    return false;
  }

  // Check if the amount matches (convert from millisats to sats)
  const amountTag = originalZapRequest.tags?.find(tag => tag[0] === 'amount');
  if (amountTag && amountTag[1]) {
    const requestAmountSats = Math.floor(parseInt(amountTag[1]) / 1000);
    if (requestAmountSats !== expectedRequest.amount) {
      console.log('❌ Amount mismatch:', {
        original: requestAmountSats,
        expected: expectedRequest.amount
      });
      return false;
    }
  }

  // If we have an event ID, check if it matches
  if (expectedRequest.eventId) {
    const eventTag = originalZapRequest.tags?.find(tag => tag[0] === 'e');
    if (eventTag && eventTag[1] !== expectedRequest.eventId) {
      console.log('❌ Event ID mismatch:', {
        original: eventTag[1],
        expected: expectedRequest.eventId
      });
      return false;
    }
  }

  // If we have a profile, check if it matches
  if (expectedRequest.profile) {
    const profileTag = originalZapRequest.tags?.find(tag => tag[0] === 'p');
    if (profileTag && profileTag[1] !== expectedRequest.profile) {
      console.log('❌ Profile mismatch:', {
        original: profileTag[1],
        expected: expectedRequest.profile
      });
      return false;
    }
  }

  // Check timing - receipt should be created after the request
  if (receipt.created_at <= originalZapRequest.created_at) {
    console.log('❌ Timing mismatch - receipt older than request:', {
      receiptTime: receipt.created_at,
      requestTime: originalZapRequest.created_at
    });
    return false;
  }

  return true;
}