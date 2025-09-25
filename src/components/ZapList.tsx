import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useUserZaps, type ZapWithMessage } from '@/hooks/useUserZaps';
import { useRealTimeZaps } from '@/hooks/useRealTimeZaps';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { genUserName } from '@/lib/genUserName';

interface ZapListProps {
  pubkey: string;
  className?: string;
}

function ZapItem({ zap }: { zap: ZapWithMessage }) {
  const author = useAuthor(zap.sender);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || genUserName(zap.sender);
  const profileImage = metadata?.picture;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(zap.timestamp * 1000).toLocaleString()}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Zap className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">
              {zap.amount > 0 ? zap.amount.toLocaleString() : '?'} sats
            </span>
          </Badge>
        </div>
      </CardHeader>
      {zap.message && (
        <CardContent className="pt-0">
          <p className="text-sm whitespace-pre-wrap break-words">{zap.message}</p>
        </CardContent>
      )}
    </Card>
  );
}

export function ZapList({ pubkey, className }: ZapListProps) {
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useUserZaps(pubkey);

  // Enable real-time zap updates
  const { lastUpdate } = useRealTimeZaps(pubkey);

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  // Flatten all pages into a single array
  const zaps = data?.pages.flat() || [];

  // Auto-fetch next page when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load zaps</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (zaps.length === 0) {
    return (
      <div className={className}>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No zaps received yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to send a zap with a message!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Zaps & Messages ({zaps.length})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates active" />
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </h2>
      <div className="space-y-4">
        {zaps.map((zap) => (
          <ZapItem key={zap.id} zap={zap} />
        ))}
        
        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div ref={ref} className="py-4">
            {isFetchingNextPage ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-muted-foreground">
                Scroll to load more zaps...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}