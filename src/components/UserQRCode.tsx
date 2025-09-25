import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, Smartphone, X, Zap as _Zap } from 'lucide-react';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { nip19 } from 'nostr-tools';

interface UserQRCodeProps {
  npub: string;
  className?: string;
  minimumZapAmount?: number;
}

export function UserQRCode({ npub, className, minimumZapAmount }: UserQRCodeProps) {
  const [isQRVisible, setIsQRVisible] = useState(false);
  const [_isPaymentQRVisible, _setIsPaymentQRVisible] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [_paymentQrDataUrl, _setPaymentQrDataUrl] = useState<string | null>(null);

  // Get current user and wallet info
  const { user: _user } = useCurrentUser();
  const { webln, activeNWC } = useWallet();

  // Decode npub to get pubkey for creating a dummy target event
  const pubkey = useMemo(() => {
    try {
      const decoded = nip19.decode(npub);
      return decoded.type === 'npub' ? decoded.data : '';
    } catch {
      return '';
    }
  }, [npub]);

  // Create a dummy target event for zapping
  const dummyTarget = useMemo(() => ({
    id: `dummy-${pubkey}`,
    pubkey,
    kind: 0,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    sig: ''
  }), [pubkey]);

  // Use zaps hook for payment QR generation
  const { zap, isZapping: _isZapping, invoice } = useZaps(dummyTarget, webln, activeNWC);

  // Generate payment QR when we have an invoice
  useEffect(() => {
    const generatePaymentQR = async () => {
      if (!invoice) {
        _setPaymentQrDataUrl(null);
        return;
      }

      try {
        const url = await QRCode.toDataURL(invoice.toUpperCase(), {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        _setPaymentQrDataUrl(url);
      } catch (error) {
        console.error('Failed to generate payment QR code:', error);
        _setPaymentQrDataUrl(null);
      }
    };

    generatePaymentQR();
  }, [invoice]);

  // Function to generate payment invoice
  const _handleGeneratePayment = () => {
    if (!minimumZapAmount || minimumZapAmount <= 0) return;
    
    _setIsPaymentQRVisible(true);
    zap(minimumZapAmount, 'Quick zap with BillboardBit!');
  };

  const qrCodeUrl = useMemo(() => {
    try {
      // Create a URL for sending zaps/messages to this user
      const url = `${window.location.origin}/${npub}`;
      return QRCode.toDataURL(url, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return null;
    }
  }, [npub]);

  useEffect(() => {
    if (qrCodeUrl) {
      qrCodeUrl.then(setQrDataUrl).catch(console.error);
    }
  }, [qrCodeUrl]);

  if (!qrDataUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-4 flex justify-center">
          <Skeleton className="w-full h-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Payment Card - DISABLED - Only show if user is logged in and minimum amount is set */}
      {/* 
      {user && minimumZapAmount && minimumZapAmount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="p-4">
            {!isPaymentQRVisible || !invoice ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Quick Zap - {minimumZapAmount.toLocaleString()} sats</span>
                </div>
                <Button
                  onClick={handleGeneratePayment}
                  disabled={isZapping}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
                  size="sm"
                >
                  {isZapping ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                      Generating Invoice...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate Payment QR
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Quick Zap</span>
                  </div>
                  <Button
                    onClick={() => {
                      setIsPaymentQRVisible(false);
                      setPaymentQrDataUrl(null);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {paymentQrDataUrl ? (
                  <div className="relative">
                    <img 
                      src={paymentQrDataUrl} 
                      alt="Payment QR Code"
                      className="w-full max-w-[200px] h-auto rounded-lg shadow-md"
                    />
                  </div>
                ) : (
                  <Skeleton className="w-[200px] h-[200px] rounded-lg" />
                )}
                
                <div className="text-center">
                  <span className="text-sm font-medium">{minimumZapAmount.toLocaleString()} sats</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      */}

      {/* Regular Profile QR Code */}
      <Card>
        <CardContent className="p-4">
          {!isQRVisible ? (
          <Button
            onClick={() => setIsQRVisible(true)}
            variant="outline"
            className="w-full h-auto p-6 md:p-6 p-4 flex flex-col items-center space-y-3 md:space-y-3 space-y-0 hover:bg-accent/50 transition-all duration-300 group"
          >
            <div className="relative">
              <QrCode className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              <Smartphone className="w-5 h-5 absolute -bottom-1 -right-1 text-muted-foreground" />
            </div>
            <div className="text-center hidden md:block">
              <p className="font-medium text-sm">Open in Mobile</p>
              <p className="text-xs text-muted-foreground">
                Click to show QR code
              </p>
            </div>
          </Button>
        ) : (
          <div className="flex flex-col items-center space-y-4 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 hidden md:flex">
                <Smartphone className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Open in Mobile</span>
              </div>
              <Button
                onClick={() => setIsQRVisible(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-accent md:ml-auto ml-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="relative">
              <img 
                src={qrDataUrl} 
                alt={`QR Code for ${npub}`}
                className="w-full max-w-[200px] h-auto rounded-lg shadow-md"
              />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground">How to scan:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Open your camera app</p>
                <p>• Point at the QR code</p>
                <p>• Tap the notification to open</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}