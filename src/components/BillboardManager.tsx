import { useBillboard } from '@/hooks/useBillboard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Badge import removed as it's not used
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoginArea } from '@/components/auth/LoginArea';
import { Plus, Minus, ExternalLink } from 'lucide-react';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddToBillboard = async () => {
    if (!user) return;
    
    try {
      await addToBillboard.mutateAsync({
        npub: nip19.npubEncode(user.pubkey),
        displayName,
      });
      setIsDialogOpen(false);
      setDisplayName('');
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium">{displayName}</h3>
            <p className="text-sm text-muted-foreground font-mono">
              {npub.slice(0, 16)}...{npub.slice(-8)}
            </p>
            {content.addedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Added {new Date(content.addedAt * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex items-center space-x-2"
          >
            <a href={`/${npub}`}>
              <ExternalLink className="w-4 h-4" />
              <span>View</span>
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BillboardList() {
  const { billboardEntries, isLoading } = useBillboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {billboardEntries.map((entry) => (
        <BillboardItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}