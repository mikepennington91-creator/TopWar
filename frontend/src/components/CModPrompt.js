import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/**
 * CModPrompt - Dialog asking Sian to enable CMod mode
 */
export default function CModPrompt({ open, onClose, onEnable }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="bg-slate-900 border-lime-500 border-2 text-slate-200 sm:max-w-md"
        data-testid="cmod-prompt-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-lime-400 flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 animate-pulse" />
            Special Mode Detected!
            <Sparkles className="h-6 w-6 animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-base pt-2">
            Hey Sian! Would you like to enable <span className="text-lime-400 font-bold">CMod Mode</span>?
            <br />
            <span className="text-slate-400 text-sm mt-2 block">
              This will transform the site with a festive lime green theme and falling top hats! 🎩
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
            data-testid="cmod-decline-btn"
          >
            Maybe Later
          </Button>
          <Button
            type="button"
            onClick={onEnable}
            className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold"
            data-testid="cmod-enable-btn"
          >
            Enable CMod Mode! 🎩
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
