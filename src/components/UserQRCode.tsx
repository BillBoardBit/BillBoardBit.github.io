import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface UserQRCodeProps {
  npub: string;
  className?: string;
}

export function UserQRCode({ npub, className }: UserQRCodeProps) {
  const qrCodeUrl = useMemo(() => {
    try {
      // Create a URL for sending zaps/messages to this user
      const url = `${window.location.origin}/${npub}`;
      return QRCode.toDataURL(url, {
        width: 200,
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

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (qrCodeUrl) {
      qrCodeUrl.then(setQrDataUrl).catch(console.error);
    }
  }, [qrCodeUrl]);

  if (!qrDataUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-4 flex justify-center">
          <Skeleton className="w-48 h-48 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 flex flex-col items-center space-y-2">
        <img 
          src={qrDataUrl} 
          alt={`QR Code for ${npub}`}
          className="w-48 h-48 rounded-lg"
        />
        <p className="text-sm text-muted-foreground text-center">
          Scan to send zaps & messages
        </p>
      </CardContent>
    </Card>
  );
}