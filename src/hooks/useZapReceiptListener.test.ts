import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZapReceiptListener } from '@/hooks/useZapReceiptListener';
import { TestApp } from '@/test/TestApp';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock the nostr hook
const mockReq = vi.fn();
const mockNostr = {
  req: mockReq,
};

vi.mock('@nostrify/react', () => ({
  useNostr: () => ({ nostr: mockNostr }),
}));

describe('useZapReceiptListener', () => {
  const mockOnReceiptReceived = vi.fn();
  const testZapRequest = {
    pubkey: '5f432a9f39b58ff132fc0a4c8af10d42efd917d8076f68bb7f2f91ed7d4f6a41',
    amount: 10000, // 10k sats
    profile: '5f432a9f39b58ff132fc0a4c8af10d42efd917d8076f68bb7f2f91ed7d4f6a41',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should not start listening when disabled', () => {
    renderHook(
      () => useZapReceiptListener(testZapRequest, mockOnReceiptReceived, false),
      { wrapper: TestApp }
    );

    expect(mockReq).not.toHaveBeenCalled();
  });

  it('should not start listening when zapRequest is null', () => {
    renderHook(
      () => useZapReceiptListener(null, mockOnReceiptReceived, true),
      { wrapper: TestApp }
    );

    expect(mockReq).not.toHaveBeenCalled();
  });

  it('should start listening when enabled with valid zapRequest', () => {
    const mockAsyncIterable = {
      [Symbol.asyncIterator]: async function* () {
        yield ['EOSE', 'test-sub-id'];
      },
    };
    mockReq.mockReturnValue(mockAsyncIterable);

    renderHook(
      () => useZapReceiptListener(testZapRequest, mockOnReceiptReceived, true),
      { wrapper: TestApp }
    );

    expect(mockReq).toHaveBeenCalledWith(
      [
        {
          kinds: [9735],
          '#p': [testZapRequest.pubkey],
          since: expect.any(Number),
          limit: 10,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );
  });

  it('should call onReceiptReceived when matching zap receipt is found', async () => {
    const mockZapRequest: NostrEvent = {
      id: 'zap-request-id',
      pubkey: testZapRequest.pubkey,
      kind: 9734,
      content: 'Quick zap with BillboardBit!',
      created_at: Math.floor(Date.now() / 1000) - 30,
      tags: [
        ['p', testZapRequest.pubkey],
        ['amount', '10000000'], // 10k sats in millisats
      ],
      sig: 'test-sig',
    };

    const mockZapReceipt: NostrEvent = {
      id: 'zap-receipt-id',
      pubkey: 'ln-service-pubkey',
      kind: 9735,
      content: '',
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', testZapRequest.pubkey],
        ['description', JSON.stringify(mockZapRequest)],
        ['bolt11', 'lnbc100u1...'],
      ],
      sig: 'receipt-sig',
    };

    const mockAsyncIterable = {
      [Symbol.asyncIterator]: async function* () {
        yield ['EVENT', 'test-sub-id', mockZapReceipt];
        yield ['EOSE', 'test-sub-id'];
      },
    };
    mockReq.mockReturnValue(mockAsyncIterable);

    renderHook(
      () => useZapReceiptListener(testZapRequest, mockOnReceiptReceived, true),
      { wrapper: TestApp }
    );

    // Wait for async processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockOnReceiptReceived).toHaveBeenCalledWith(mockZapReceipt);
  });

  it('should not call onReceiptReceived for non-matching zap receipts', async () => {
    const mockZapRequest: NostrEvent = {
      id: 'zap-request-id',
      pubkey: 'different-pubkey',
      kind: 9734,
      content: 'Different zap',
      created_at: Math.floor(Date.now() / 1000) - 30,
      tags: [
        ['p', 'different-pubkey'],
        ['amount', '5000000'], // Different amount
      ],
      sig: 'test-sig',
    };

    const mockZapReceipt: NostrEvent = {
      id: 'zap-receipt-id',
      pubkey: 'ln-service-pubkey',
      kind: 9735,
      content: '',
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', testZapRequest.pubkey],
        ['description', JSON.stringify(mockZapRequest)],
        ['bolt11', 'lnbc100u1...'],
      ],
      sig: 'receipt-sig',
    };

    const mockAsyncIterable = {
      [Symbol.asyncIterator]: async function* () {
        yield ['EVENT', 'test-sub-id', mockZapReceipt];
        yield ['EOSE', 'test-sub-id'];
      },
    };
    mockReq.mockReturnValue(mockAsyncIterable);

    renderHook(
      () => useZapReceiptListener(testZapRequest, mockOnReceiptReceived, true),
      { wrapper: TestApp }
    );

    // Wait for async processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockOnReceiptReceived).not.toHaveBeenCalled();
  });
});