import { useRef, useEffect, useState, useCallback } from 'react';
import { useStateContext } from '../context/StateContext';

// Day-based color mapping as per design decisions
const DAY_COLORS = {
  Wed: { hex: '#FF007F', name: 'neon-pink', glow: 'rgba(255, 0, 127, 0.6)' },
  Thu: { hex: '#00F0FF', name: 'neon-cyan', glow: 'rgba(0, 240, 255, 0.6)' },
  Fri: { hex: '#FFD700', name: 'gold', glow: 'rgba(255, 215, 0, 0.6)' },
  Sat: { hex: '#222222', name: 'grunge', glow: 'rgba(255,255,255, 0.2)' },
};

const SCRATCH_THRESHOLD = 0.50; // 50% revealed triggers auto-complete

const ScratchCard = ({ artistImage = null, artistName = 'Artist One', onReveal, onArtistClick, dayOverride, isScratchable = true, autoReveal = false }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [isRevealed, setIsRevealed] = useState(autoReveal);
  const [percentage, setPercentage] = useState(0);
  const { currentDay } = useStateContext();

  const activeDay = dayOverride || currentDay;
  const dayColor = DAY_COLORS[activeDay] || DAY_COLORS['Wed'];

  // Draw the scratchable top-layer onto the canvas
  const drawScratchLayer = useCallback((canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with the day's color
    ctx.fillStyle = dayColor.hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add grunge texture lines for visual richness
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#000000';
      ctx.lineWidth = Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Instructional text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `bold ${canvas.width * 0.055}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = dayColor.hex === '#111111' ? '#ffffff' : dayColor.hex;
    ctx.shadowBlur = 20;
    ctx.fillText('✦  SCRATCH TO REVEAL  ✦', canvas.width / 2, canvas.height / 2 - canvas.height * 0.06);
    ctx.shadowBlur = 0;
    ctx.font = `${canvas.width * 0.038}px 'Inter', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Drag your finger across', canvas.width / 2, canvas.height / 2 + canvas.height * 0.06);
  }, [dayColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawScratchLayer(canvas);
  }, [drawScratchLayer]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const scratch = (e) => {
    if (!isDrawing.current || isRevealed || !isScratchable) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    checkRevealThreshold(canvas);
  };

  const checkRevealThreshold = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }
    const total = pixels.length / 4;
    const pct = transparent / total;
    setPercentage(Math.round(pct * 100));

    if (pct >= SCRATCH_THRESHOLD) {
      completeReveal(canvas);
    }
  };

  const completeReveal = (canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsRevealed(true);
    if (onReveal) onReveal();
  };

  return (
    <div className="w-full h-full relative select-none">
      {/* Bottom layer: revealed content */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden flex flex-col items-center justify-end cursor-pointer"
        onClick={isRevealed ? onArtistClick : undefined}
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(10,10,10,0.95) 100%)',
          border: `2px solid ${dayColor.hex}44`,
          boxShadow: `0 0 25px ${dayColor.glow}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Artist Image */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
          {artistImage ? (
            <img
              src={artistImage}
              alt={artistName}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.85) contrast(1.1)' }}
            />
          ) : (
            // Placeholder when no image is provided yet
            <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-center px-4"
              style={{ background: 'radial-gradient(ellipse at center, #231223 0%, #0a0a0a 80%)' }}>
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 flex items-center justify-center text-4xl"
                style={{ borderColor: dayColor.hex, boxShadow: `0 0 20px ${dayColor.glow}` }}
              >
                🎨
              </div>
              <p className="text-white/40 text-xs tracking-widest uppercase font-bold">Awaiting Canvas Upload</p>
            </div>
          )}
        </div>

        {/* Artist Name Bar at the bottom */}
        <div
          className="relative z-10 w-full py-4 px-6 flex items-center justify-center"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          <p
            className="text-xl md:text-2xl font-bold tracking-wider text-center uppercase"
            style={{
              color: '#ffffff',
              textShadow: `0 0 15px ${dayColor.glow}`,
            }}
          >
            {artistName}
          </p>
        </div>
      </div>

      {/* Reveal progress ring (shows while scratching) */}
      {!isRevealed && percentage > 5 && (
        <div className="absolute top-3 right-3 z-30">
          <div
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{
              background: `${dayColor.hex}22`,
              border: `1px solid ${dayColor.hex}66`,
              color: dayColor.hex,
              textShadow: `0 0 8px ${dayColor.glow}`,
            }}
          >
            {percentage}%
          </div>
        </div>
      )}

      {/* Revealed badge */}
      {isRevealed && (
        <div className="absolute top-3 left-3 z-30">
          <div
            className="text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase"
            style={{
              background: `${dayColor.hex}`,
              color: '#000000',
              boxShadow: `0 0 15px ${dayColor.glow}`,
            }}
          >
            ✦ Tap to Explore
          </div>
        </div>
      )}

      {/* Top layer: the scratchable canvas */}
      {!isRevealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded-xl z-20 cursor-crosshair touch-none"
          onMouseDown={(e) => { isDrawing.current = true; scratch(e); }}
          onMouseMove={scratch}
          onMouseUp={() => { isDrawing.current = false; }}
          onMouseLeave={() => { isDrawing.current = false; }}
          onTouchStart={(e) => { isDrawing.current = true; scratch(e); }}
          onTouchMove={scratch}
          onTouchEnd={() => { isDrawing.current = false; }}
        />
      )}
    </div>
  );
};

export default ScratchCard;
