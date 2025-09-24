import { useSeoMeta } from '@unhead/react';
import { BillboardManager, BillboardList } from '@/components/BillboardManager';
// No unused imports needed for this page
import { Separator } from '@/components/ui/separator';

const Index = () => {
  useSeoMeta({
    title: 'BillBoardBit - Nostr Billboard for Donations',
    description: 'A simple billboard where users can list themselves to receive zaps and messages on Nostr.',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              BillBoardBit
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple billboard where you can list yourself to receive zaps and messages from the Nostr community
            </p>
          </div>

          {/* Billboard Manager */}
          <BillboardManager />

          <Separator />

          {/* Billboard List */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">Billboard</h2>
              <p className="text-muted-foreground">
                Support these creators by sending them zaps and messages
              </p>
            </div>
            <BillboardList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
