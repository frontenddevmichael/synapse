import { useState, memo } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface ShareRoomDialogProps {
  roomName: string;
  roomCode: string;
}

function ShareRoomDialogImpl({ roomName, roomCode }: ShareRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/join/${roomCode}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-xs sm:text-sm text-primary font-medium min-h-[36px]">
          <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Share
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Share this room</DialogTitle>
          <DialogDescription>Anyone with the link or QR code can join</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="flex justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`}
              alt="Room QR code"
              className="w-48 h-48 rounded-xl border border-border p-2 bg-white"
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Room code</p>
            <p className="text-2xl font-mono font-bold tracking-[0.3em]">{roomCode}</p>
          </div>
          <Button
            variant="outline"
            className="w-full h-11 font-semibold gap-2"
            onClick={() => {
              navigator.clipboard.writeText(inviteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy invite link'}
          </Button>
          {typeof navigator.share === 'function' && (
            <Button
              className="w-full h-11 font-semibold gap-2"
              onClick={() => {
                navigator.share({
                  title: `Join ${roomName} on Synapse`,
                  text: `Use code ${roomCode} or click the link to join:`,
                  url: inviteUrl,
                }).catch(() => {});
              }}
            >
              <Share2 className="h-4 w-4" />
              Share via…
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ShareRoomDialog = memo(ShareRoomDialogImpl);
