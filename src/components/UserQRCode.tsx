import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, Smartphone } from 'lucide-react';

interface UserQRCodeProps {
  npub: string;
  className?: string;
}

export function UserQRCode({ npub, className }: UserQRCodeProps) {
  const [isQROpen, setIsQROpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const qrCodeUrl = useMemo(() => {
    try {
      // Create a URL for sending zaps/messages to this user
      const url = `${window.location.origin}/${npub}`;
      return QRCode.toDataURL(url, {
        width: 300,
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
    <>
      <Card className={className}>
        <CardContent className="p-4">
          <Button
            onClick={() => setIsQROpen(true)}
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center space-y-3 hover:bg-accent/50 transition-all duration-300 group"
          >
            <div className="relative">
              <QrCode className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              <Smartphone className="w-5 h-5 absolute -bottom-1 -right-1 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Open in Mobile</p>
              <p className="text-xs text-muted-foreground">
                Click to show QR code
              </p>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Open in Mobile
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your mobile device to open this page and send zaps or messages
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="relative">
              <img 
                src={qrDataUrl} 
                alt={`QR Code for ${npub}`}
                className="w-64 h-64 rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-300"
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">How to scan:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Open your camera app</p>
                <p>• Point at the QR code</p>
                <p>• Tap the notification to open</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}