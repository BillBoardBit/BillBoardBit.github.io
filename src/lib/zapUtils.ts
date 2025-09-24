/**
 * Utility functions for parsing Lightning Network invoices and zap amounts
 */

/**
 * Parse amount from a bolt11 Lightning invoice
 * @param bolt11 - The bolt11 invoice string
 * @returns amount in satoshis
 */
export function parseBolt11Amount(bolt11: string): number {
  try {
    const invoice = bolt11.toLowerCase();
    
    // Lightning invoices follow this format:
    // ln + [network] + [amount][multiplier] + [rest]
    // Example: lnbc2500u1p... (2500 microsatoshis)
    
    // Extract the amount part after network prefix
    let amountMatch = invoice.match(/^ln[a-z]*(\d+)([munp]?)/);
    
    if (!amountMatch) {
      // Try alternative pattern without network prefix
      amountMatch = invoice.match(/(\d+)([munp])/);
    }
    
    if (!amountMatch) {
      // Look for amount in different positions
      amountMatch = invoice.match(/bc(\d+)([munp]?)/);
    }
    
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]);
      const multiplier = amountMatch[2] || '';
      
      // Convert to satoshis based on Lightning Network spec
      switch (multiplier) {
        case 'm': // milli = 0.001 BTC = 100,000 sats
          return amount * 100000;
        case 'u': // micro = 0.000001 BTC = 100 sats
          return amount * 100;
        case 'n': // nano = 0.000000001 BTC = 0.1 sats
          return Math.round(amount * 0.1);
        case 'p': // pico = 0.000000000001 BTC = 0.0001 sats
          return Math.round(amount * 0.0001);
        default:
          // No multiplier usually means the base unit
          // In Lightning context, this is often millisatoshis
          return Math.round(amount / 1000);
      }
    }
    
    return 0;
  } catch (error) {
    console.error('Error parsing bolt11 amount:', error);
    return 0;
  }
}

/**
 * Extract zap amount from various sources in a zap receipt
 * @param receipt - The zap receipt event
 * @returns amount in satoshis
 */
export function extractZapAmount(receipt: {
  tags: string[][];
  id: string;
}): number {
  let amount = 0;
  
  try {
    // Method 1: Parse bolt11 invoice
    const bolt11Tag = receipt.tags?.find((tag: string[]) => tag[0] === 'bolt11');
    if (bolt11Tag && bolt11Tag[1]) {
      amount = parseBolt11Amount(bolt11Tag[1]);
      console.log('Bolt11 parse result:', { bolt11: bolt11Tag[1].substring(0, 50), amount });
    }
    
    // Method 2: Check for explicit amount tag (millisatoshis)
    if (amount === 0) {
      const amountTag = receipt.tags?.find((tag: string[]) => tag[0] === 'amount');
      if (amountTag && amountTag[1]) {
        amount = Math.round(parseInt(amountTag[1]) / 1000); // Convert msat to sat
        console.log('Amount tag result:', { amountMsat: amountTag[1], amountSat: amount });
      }
    }
    
    // Method 3: Parse zap request for amount
    if (amount === 0) {
      const descTag = receipt.tags?.find((tag: string[]) => tag[0] === 'description');
      if (descTag && descTag[1]) {
        try {
          const zapRequest = JSON.parse(descTag[1]);
          const zapAmountTag = zapRequest.tags?.find((tag: string[]) => tag[0] === 'amount');
          if (zapAmountTag && zapAmountTag[1]) {
            amount = Math.round(parseInt(zapAmountTag[1]) / 1000);
            console.log('Zap request amount:', { amountMsat: zapAmountTag[1], amountSat: amount });
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    
    return Math.max(amount, 1); // Ensure at least 1 sat
  } catch (error) {
    console.error('Error extracting zap amount:', error);
    return 1;
  }
}