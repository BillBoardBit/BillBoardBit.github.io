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
