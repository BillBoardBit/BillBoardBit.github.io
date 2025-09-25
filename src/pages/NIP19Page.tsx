import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserBillboard } from '@/hooks/useBillboard';
import { useSeoMeta } from '@unhead/react';
import { UserQRCode } from '@/components/UserQRCode';
import { ZapList } from '@/components/ZapList';
import { ZapButton } from '@/components/ZapButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { Header } from '@/components/Header';
import NotFound from './NotFound';

function ProfileView({ pubkey, npub }: { pubkey: string; npub: string }) {
  const { user } = useCurrentUser();
  const author = useAuthor(pubkey);
  const { data: billboardInfo } = useUserBillboard(pubkey);
  const metadata = author.data?.metadata;
  
  const displayName = metadata?.name || genUserName(pubkey);
  const about = metadata?.about;
  const profileImage = metadata?.picture;

  // Create a simple event for zapping if no author event exists
  const zapTarget = author.data?.event || {
    id: `dummy-${pubkey}`,
    pubkey,
    kind: 0,
    content: JSON.stringify(metadata || {}),
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    sig: ''
  };

  useSeoMeta({
    title: `${displayName} - BillboardBit`,
    description: about || `Support ${displayName} with zaps and messages on Nostr`,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" asChild>
              <a href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Billboard
              </a>
            </Button>
            
            {user && (
              <ZapButton 
                target={zapTarget} 
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg"
                showCount={false}
                minimumAmount={billboardInfo?.minimumZapAmount}
              />
            )}
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader className="p-4">
              <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-center space-y-3 md:space-y-0 md:space-x-4">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 shrink-0">
                  <AvatarImage src={profileImage} alt={displayName} />
                  <AvatarFallback className="text-lg md:text-xl font-semibold">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl md:text-2xl font-bold truncate">{displayName}</CardTitle>
                  {about && (
                    <p className="text-muted-foreground text-sm md:text-base mt-1 line-clamp-2">{about}</p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* QR Code - Hidden on mobile */}
            <div className="lg:col-span-1 hidden lg:block">
              <UserQRCode npub={npub} minimumZapAmount={billboardInfo?.minimumZapAmount} />
            </div>

            {/* Zap List - Full width on mobile, 2/3 on desktop */}
            <div className="col-span-1 lg:col-span-2">
              <ZapList pubkey={pubkey} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  switch (type) {
    case 'npub':
      return <ProfileView pubkey={data} npub={identifier} />;

    case 'nprofile':
      return <ProfileView pubkey={data.pubkey} npub={nip19.npubEncode(data.pubkey)} />;

    case 'note':
      // AI agent should implement note view here
      return <div>Note placeholder</div>;

    case 'nevent':
      // AI agent should implement event view here
      return <div>Event placeholder</div>;

    case 'naddr':
      // AI agent should implement addressable event view here
      return <div>Addressable event placeholder</div>;

    default:
      return <NotFound />;
  }
} 