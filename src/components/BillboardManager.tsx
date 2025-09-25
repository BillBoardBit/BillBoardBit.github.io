import { useBillboard } from '@/hooks/useBillboard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoginArea } from '@/components/auth/LoginArea';
import { Plus, Minus, Zap } from 'lucide-react';
import { useState } from 'react';
import { genUserName } from '@/lib/genUserName';
import { nip19 } from 'nostr-tools';

export function BillboardManager() {
  const { user } = useCurrentUser();
  const { 
    isUserInBillboard, 
    addToBillboard, 
    removeFromBillboard 
  } = useBillboard();
  
  const [displayName, setDisplayName] = useState('');
  const [minimumZapAmount, setMinimumZapAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddToBillboard = async () => {
    if (!user) return;
    
    try {
      await addToBillboard.mutateAsync({
        npub: nip19.npubEncode(user.pubkey),
        displayName,
        minimumZapAmount: minimumZapAmount ? parseInt(minimumZapAmount) : undefined,
      });
      setIsDialogOpen(false);
      setDisplayName('');
      setMinimumZapAmount('');
    } catch (error) {
      console.error('Failed to add to billboard:', error);
    }
  };

  const handleRemoveFromBillboard = async () => {
    try {
      await removeFromBillboard.mutateAsync();
    } catch (error) {
      console.error('Failed to remove from billboard:', error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="mb-4 text-muted-foreground">
            Login to add yourself to the billboard
          </p>
          <LoginArea className="max-w-60 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Billboard Status</h3>
            <p className="text-sm text-muted-foreground">
              {isUserInBillboard ? 'You are listed on the billboard' : 'Add yourself to the billboard'}
            </p>
          </div>
          
          {isUserInBillboard ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFromBillboard}
              disabled={removeFromBillboard.isPending}
              className="flex items-center space-x-2"
            >
              <Minus className="w-4 h-4" />
              <span>Remove</span>
            </Button>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to List</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Billboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name (Optional)</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter a display name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumZapAmount">Minimum Zap Amount (sats)</Label>
                    <Input
                      id="minimumZapAmount"
                      type="number"
                      min="1"
                      value={minimumZapAmount}
                      onChange={(e) => setMinimumZapAmount(e.target.value)}
                      placeholder="e.g. 21, 100, 1000 (optional)"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set a minimum amount for zaps. Supporters can still send any amount, but this shows your preferred minimum.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddToBillboard}
                      disabled={addToBillboard.isPending}
                    >
                      {addToBillboard.isPending ? 'Adding...' : 'Add to Billboard'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BillboardItemProps {
  entry: {
    id: string;
    pubkey: string;
    content: string;
    created_at: number;
    tags: string[][];
  };
}

function BillboardItem({ entry }: BillboardItemProps) {
  const author = useAuthor(entry.pubkey);
  const metadata = author.data?.metadata;
  
  let content;
  try {
    content = JSON.parse(entry.content);
  } catch {
    return null;
  }

  const displayName = content.displayName || metadata?.name || genUserName(entry.pubkey);
  const npub = content.npub;
  const profileImage = metadata?.picture;
  const minimumZapAmount = content.minimumZapAmount;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
      <a href={`/${npub}`} className="block">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="text-lg">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              {content.addedAt && (
                <p className="text-sm text-muted-foreground">
                  Added {new Date(content.addedAt * 1000).toLocaleDateString()}
                </p>
              )}
              {minimumZapAmount && minimumZapAmount > 0 && (
                <div className="flex items-center justify-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <Zap className="h-3 w-3" />
                  <span>Min: {minimumZapAmount.toLocaleString()} sats</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </a>
    </Card>
  );
}

export function BillboardList() {
  const { billboardEntries, isLoading } = useBillboard();

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2 w-full">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (billboardEntries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No entries in the billboard yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to add yourself!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {billboardEntries.map((entry) => (
        <BillboardItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}