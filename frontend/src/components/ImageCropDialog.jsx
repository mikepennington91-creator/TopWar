import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ZoomIn, RotateCw, Check } from "lucide-react";

/**
 * Crops the source image to a square data URL using the cropper coordinates.
 * Output: 320x320 jpeg (smaller than 1.5MB cap, decent quality).
 */
async function getCroppedImage(imageSrc, cropAreaPixels, rotation = 0) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const outputSize = 320;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, outputSize, outputSize);

  if (rotation) {
    // For rotated crops, render through a temp canvas
    const tmp = document.createElement("canvas");
    const max = Math.max(image.width, image.height) * 2;
    tmp.width = max;
    tmp.height = max;
    const tctx = tmp.getContext("2d");
    tctx.translate(max / 2, max / 2);
    tctx.rotate((rotation * Math.PI) / 180);
    tctx.drawImage(image, -image.width / 2, -image.height / 2);
    const offsetX = (max - image.width) / 2;
    const offsetY = (max - image.height) / 2;
    ctx.drawImage(
      tmp,
      cropAreaPixels.x + offsetX,
      cropAreaPixels.y + offsetY,
      cropAreaPixels.width,
      cropAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize
    );
  } else {
    ctx.drawImage(
      image,
      cropAreaPixels.x,
      cropAreaPixels.y,
      cropAreaPixels.width,
      cropAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize
    );
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function ImageCropDialog({ open, imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropAreaPixels, setCropAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleCropComplete = useCallback((_area, areaPixels) => {
    setCropAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!cropAreaPixels) return;
    setSaving(true);
    try {
      const dataUrl = await getCroppedImage(imageSrc, cropAreaPixels, rotation);
      onConfirm(dataUrl);
      // reset for next open
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="image-crop-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-amber-400">Position your photo</DialogTitle>
          <DialogDescription className="text-slate-400">
            Drag to position. Pinch or use the slider to zoom. The visible circle is what will be saved.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-md overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <Label className="text-slate-300 flex items-center gap-2 text-xs">
              <ZoomIn className="h-3.5 w-3.5" /> Zoom
            </Label>
            <input
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
              data-testid="image-crop-zoom"
            />
          </div>
          <div className="flex justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-sm"
              data-testid="image-crop-rotate"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Rotate
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={saving || !cropAreaPixels}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-sm btn-glow"
                data-testid="image-crop-confirm"
              >
                <Check className="h-4 w-4 mr-2" />
                {saving ? "Saving…" : "Use Photo"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
