import { useSeoMeta } from '@unhead/react';
import { BillboardManager, BillboardList } from '@/components/BillboardManager';

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
              Support these creators by sending them zaps and messages
            </p>
          </div>

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
