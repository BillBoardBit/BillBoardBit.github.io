import { useSeoMeta } from '@unhead/react';
import { BillboardManager, BillboardList } from '@/components/BillboardManager';
import { Header } from '@/components/Header';

const Index = () => {
  useSeoMeta({
    title: 'BillboardBit - Nostr Billboard for Donations',
    description: 'A simple billboard where users can list themselves to receive zaps and messages on Nostr.',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              BillboardBit - Nostr Billboard for Donations
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Showcase yourself and receive zaps on Nostr.
            </p>
            <div className="pt-4 flex items-center justify-center gap-4">
              <a
                href="/npub1epkyuxg8y9zc85xgf2hw3e9gkh5kxdecl92v6ngxjjkjglv7498sjpc9nd"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Support the Developer
              </a>
              <a
                href="https://github.com/BillBoardBit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
 
           {/* Billboard Manager - Only for logged in users */}
          <BillboardManager />

          {/* Billboard List */}
          <BillboardList />
        </div>
      </div>
    </div>
  );
};

export default Index;
