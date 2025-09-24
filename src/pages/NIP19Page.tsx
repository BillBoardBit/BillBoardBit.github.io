import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { useAuthor } from '@/hooks/useAuthor';
import { useSeoMeta } from '@unhead/react';
import { UserQRCode } from '@/components/UserQRCode';
import { ZapList } from '@/components/ZapList';
import { ZapButton } from '@/components/ZapButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import NotFound from './NotFound';

function ProfileView({ pubkey, npub }: { pubkey: string; npub: string }) {
  const author = useAuthor(pubkey);
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
    title: `${displayName} - BillBoardBit`,
    description: about || `Support ${displayName} with zaps and messages on Nostr`,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center">
            <Button variant="outline" size="sm" asChild>
              <a href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Billboard
              </a>
            </Button>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profileImage} alt={displayName} />
                  <AvatarFallback className="text-xl">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{displayName}</CardTitle>
                  {about && (
                    <p className="text-muted-foreground mt-2">{about}</p>
                  )}
                </div>
                <div className="flex flex-col items-center space-y-3">
                 </div>
              </div>
            </CardHeader>
          </Card>

          {/* Call to Action - Send Zap */}
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Support {displayName}</h3>
              <p className="text-muted-foreground mb-4">
                Send a Lightning zap with a message to show your support
              </p>
              <ZapButton 
                target={zapTarget} 
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 text-lg mx-auto w-fit min-w-64"
                showCount={false}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* QR Code */}
            <div className="lg:col-span-1">
              <UserQRCode npub={npub} />
            </div>

            {/* Zap List */}
            <div className="lg:col-span-2">
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