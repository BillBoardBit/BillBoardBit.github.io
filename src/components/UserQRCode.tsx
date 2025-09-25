import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, Smartphone, X } from 'lucide-react';

interface UserQRCodeProps {
  npub: string;
  className?: string;
}

export function UserQRCode({ npub, className }: UserQRCodeProps) {
  const [isQRVisible, setIsQRVisible] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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
    <Card className={className}>
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
  );
}