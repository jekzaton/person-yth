"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
  type Ref,
} from "react";

import {
  CheckCircle2,
  RotateCcw,
  UserRound,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type ProfileImageCropperRef = {
  getCroppedFile: () => Promise<File | null>;
};

type Props = {
  src: string;
  file: File | null;
  disabled?: boolean;
  ref?: Ref<ProfileImageCropperRef>;
};

type Position = {
  x: number;
  y: number;
};

const FRAME_WIDTH = 160;
const FRAME_HEIGHT = 192;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function ProfileImageCropper({
  src,
  file,
  disabled = false,
  ref,
}: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  const draggingRef = useRef<{
    x: number;
    y: number;
    position: Position;
  } | null>(null);

  const [position, setPosition] = useState<Position>({
    x: 0.5,
    y: 0.5,
  });

  const [zoom, setZoom] = useState(1);

  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  // เริ่มจากตำแหน่งกึ่งกลางเมื่อเปลี่ยนรูป
  useEffect(() => {
    setPosition({ x: 0.5, y: 0.5 });
    setZoom(1);
    setImageSize({ width: 0, height: 0 });
  }, [src]);

  const coverScale =
    imageSize.width && imageSize.height
      ? Math.max(FRAME_WIDTH / imageSize.width, FRAME_HEIGHT / imageSize.height)
      : 1;

  const scale = coverScale * zoom;
  const renderedWidth = imageSize.width * scale;
  const renderedHeight = imageSize.height * scale;

  const excessX = Math.max(0, renderedWidth - FRAME_WIDTH);
  const excessY = Math.max(0, renderedHeight - FRAME_HEIGHT);

  const offsetX = -excessX * position.x;
  const offsetY = -excessY * position.y;

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!src || disabled || !imageSize.width) return;

    event.preventDefault();

    event.currentTarget.setPointerCapture(event.pointerId);

    draggingRef.current = {
      x: event.clientX,
      y: event.clientY,
      position: { ...position },
    };

    setIsDragging(true);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const dragging = draggingRef.current;

    if (!dragging || disabled) return;

    const dx = event.clientX - dragging.x;
    const dy = event.clientY - dragging.y;

    setPosition({
      x: excessX ? clamp(dragging.position.x - dx / excessX) : 0.5,
      y: excessY ? clamp(dragging.position.y - dy / excessY) : 0.5,
    });
  };

  const stopDrag = () => {
    draggingRef.current = null;
    setIsDragging(false);
  };

  const reset = () => {
    setPosition({ x: 0.5, y: 0.5 });
    setZoom(1);
  };

  // สร้างไฟล์รูปตามตำแหน่งที่ผู้ใช้จัดไว้จริง
  useImperativeHandle(ref, () => ({
    async getCroppedFile() {
      const image = imageRef.current;

      if (!file || !image || !imageSize.width) {
        return null;
      }

      const canvas = document.createElement("canvas");

      canvas.width = 400;
      canvas.height = 480;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("ไม่สามารถประมวลผลรูปภาพได้");
      }

      const factor = canvas.width / FRAME_WIDTH;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.drawImage(
        image,
        offsetX * factor,
        offsetY * factor,
        renderedWidth * factor,
        renderedHeight * factor,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("ไม่สามารถสร้างไฟล์รูปภาพได้"));
            }
          },
          "image/jpeg",
          0.9,
        );
      });

      return new File([blob], `profile-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
    },
  }));

  return (
    <div className="flex flex-col items-center gap-3">
      {/* IMAGE FRAME */}
      <div className="relative">
        <div
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          className={`relative h-48 w-40 touch-none overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-blue-50 to-slate-200 shadow-xl shadow-blue-500/15 select-none dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 ${
            src && !disabled
              ? isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-default"
          } `}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imageRef}
              src={src}
              alt="ตัวอย่างรูปโปรไฟล์ ปรับตำแหน่งได้"
              draggable={false}
              onLoad={(event) => {
                setImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
              style={{
                position: "absolute",
                width: renderedWidth,
                height: renderedHeight,
                left: offsetX,
                top: offsetY,
                maxWidth: "none",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
              <UserRound size={48} />
              <span className="text-[10px]">No Profile Image</span>
            </div>
          )}

          {/* GUIDE LINES */}
          {src && isDragging && (
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="border border-white/40" />
              ))}
            </div>
          )}
        </div>

        {file && (
          <div className="absolute -right-2 -bottom-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-md dark:border-slate-900">
            <CheckCircle2 size={16} />
          </div>
        )}
      </div>

      {src && (
        <div className="flex w-full max-w-60 flex-col gap-2">
          <p className="text-center text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
            ลากรูปเพื่อจัดตำแหน่ง
          </p>

          {/* ZOOM CONTROLS */}
          <div className="flex items-center gap-2">
            <ZoomOut size={16} className="shrink-0 text-slate-400" />

            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={zoom}
              disabled={disabled}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="ซูมรูปโปรไฟล์"
              className="w-full accent-indigo-600"
            />

            <ZoomIn size={16} className="shrink-0 text-slate-400" />
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
          >
            <RotateCcw size={14} />
            จัดภาพไว้กึ่งกลาง
          </button>
        </div>
      )}
    </div>
  );
}
