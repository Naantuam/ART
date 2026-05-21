import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScratchCard from '../components/ScratchCard';
import { useStateContext } from '../context/StateContext';
import { API_BASE_URL } from '../config';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// ─── Countdown target: May 27 2026, midnight WAT (UTC+1) ──────────────────────
const COUNTDOWN_TARGET = new Date('2026-05-27T00:00:00+01:00').getTime();

const ARTIST_DATA = {
  Wed: { name: 'Benoni Bewarang',        image: '/assets/Benoni Bewarang/artwork.jpg' },
  Thu: { name: 'Deborah Choji (shades15)', image: '/assets/Deborah Choji/artwork.jpg' },
  Fri: { name: 'Daspan Tedo',            image: '/assets/Daspan Tedo/artwork.jpg' },
};

// ─── Helper: compute time-left object ─────────────────────────────────────────
function getTimeLeft() {
  const diff = COUNTDOWN_TARGET - Date.now();
  if (diff <= 0) return null; // countdown finished
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// ─── NeonDigit: a single time unit block ──────────────────────────────────────
const NeonDigit = ({ value, label, color }) => {
  const display = String(value).padStart(2, '0');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          fontFamily: "'Outfit', 'Inter', monospace",
          fontSize: 'clamp(2rem, 8vw, 4.5rem)',
          fontWeight: 900,
          letterSpacing: '0.05em',
          color: '#fff',
          textShadow: `
            0 0 6px  ${color},
            0 0 14px ${color},
            0 0 32px ${color},
            0 0 60px ${color}
          `,
          lineHeight: 1,
          minWidth: '2.2ch',
          textAlign: 'center',
        }}
      >
        {display}
      </div>
      <span
        style={{
          fontFamily: "'Outfit', 'Inter', sans-serif",
          fontSize: 'clamp(0.55rem, 2vw, 0.75rem)',
          fontWeight: 700,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color,
          textShadow: `0 0 10px ${color}`,
          opacity: 0.85,
        }}
      >
        {label}
      </span>
    </div>
  );
};

// ─── Separator dot ────────────────────────────────────────────────────────────
const Sep = ({ color }) => (
  <div
    style={{
      color,
      fontSize: 'clamp(1.5rem, 5vw, 3rem)',
      fontWeight: 900,
      lineHeight: 1,
      alignSelf: 'flex-start',
      paddingTop: '0.1em',
      textShadow: `0 0 12px ${color}, 0 0 28px ${color}`,
    }}
  >
    :
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const { currentDay, setCurrentDay } = useStateContext();
  const navigate = useNavigate();
  const days = ['Wed', 'Thu', 'Fri'];

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const tickRef = useRef(null);

  const [artists, setArtists] = useState(ARTIST_DATA);
  const [isTimerActiveByAdmin, setIsTimerActiveByAdmin] = useState(true);

  // Fetch active artworks and timer settings from backend
  useEffect(() => {
    const fetchActiveArtworksAndSettings = async () => {
      try {
        // Fetch active artworks
        const artRes = await axios.get(`${API_BASE_URL}/api/upload`);
        if (artRes.data && Array.isArray(artRes.data)) {
          setArtists(prev => {
            const updated = { ...prev };
            artRes.data.forEach(artwork => {
              const dayKey = artwork.artist_id.charAt(0).toUpperCase() + artwork.artist_id.slice(1).toLowerCase();
              if (updated[dayKey]) {
                updated[dayKey] = {
                  ...updated[dayKey],
                  image: artwork.image_url,
                  uploaded: true
                };
              }
            });
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to fetch active artworks:', err);
      }

      try {
        // Fetch timer settings
        const settingsRes = await axios.get(`${API_BASE_URL}/api/settings`);
        if (settingsRes.data && typeof settingsRes.data.timerActive === 'boolean') {
          setIsTimerActiveByAdmin(settingsRes.data.timerActive);
        }
      } catch (err) {
        console.error('Failed to fetch timer settings:', err);
      }
    };
    fetchActiveArtworksAndSettings();
  }, []);

  // Tick every second
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const countdownActive = isTimerActiveByAdmin && timeLeft !== null; // Dynamically active if enabled by admin and target not reached

  // Neon pink to match logo / ScratchCard Wed colour
  const NEON = '#FF007F';
  const NEON_CYAN = '#00F0FF';

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center overflow-x-hidden relative">
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto" style={{ paddingBottom: '2rem' }}>

        {/* ── Logo ── */}
        <div className="w-full max-w-[180px] md:max-w-[280px] mb-4 px-4 mt-6">
          <img
            src="/assets/logo.png"
            alt="ECHOES ON A CANVAS"
            className="w-full h-auto drop-shadow-[0_0_15px_rgba(255,0,127,0.5)] animate-pulse"
          />
        </div>


        {/* ── Cards (blurred when countdown is active) ── */}
        <div
          className="w-full flex flex-col items-center relative"
          style={{
            transition: 'filter 0.6s ease',
            filter: countdownActive ? 'blur(6px) brightness(0.45)' : 'none',
            pointerEvents: countdownActive ? 'none' : 'auto',
          }}
        >
          <div className="w-full max-w-6xl mx-auto px-0">
            <Swiper
              effect={'coverflow'}
              grabCursor={!countdownActive}
              centeredSlides={true}
              initialSlide={days.indexOf(currentDay) >= 0 ? days.indexOf(currentDay) : 0}
              onSlideChange={(swiper) => setCurrentDay(days[swiper.activeIndex])}
              coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2, slideShadows: false }}
              breakpoints={{
                320: { slidesPerView: 1.3, spaceBetween: 20 },
                768: { slidesPerView: 3,   spaceBetween: 40 },
              }}
              modules={[EffectCoverflow]}
              className="w-full py-8"
            >
              {days.map((day) => {
                const isSaturday = currentDay === 'Sat';
                const canScratch  = !countdownActive && currentDay === day && !!artists[day]?.uploaded;

                return (
                  <SwiperSlide key={day} className="transition-opacity duration-300 flex justify-center">
                    {({ isActive }) => (
                      <div className={`transition-all duration-300 flex flex-col items-center w-full ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-90 blur-[2px]'}`}>
                        <div className="h-[45dvh] max-h-[500px] min-h-[300px] aspect-[3/4]">
                          <ScratchCard
                            dayOverride={day}
                            artistName={artists[day].name}
                            artistImage={artists[day].uploaded ? artists[day].image : null}
                            isScratchable={canScratch}
                            autoReveal={isSaturday}
                            onArtistClick={() => navigate(`/artist/${day.toLowerCase()}`)}
                          />
                        </div>
                        <p className="text-center mt-6 text-white/50 tracking-widest font-bold uppercase text-sm">
                          {day}
                        </p>
                      </div>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>

        {/* ── Countdown overlay (sits on top of blurred cards) ── */}
        {countdownActive && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
              width: '100%',
              maxWidth: 640,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              padding: '0 1rem',
            }}
          >
            {/* Glass card backing */}
            <div
              style={{
                background: 'rgba(0,0,0,0.55)',
                border: `1.5px solid ${NEON}44`,
                borderRadius: 24,
                boxShadow: `
                  0 0 30px  ${NEON}33,
                  0 0 80px  ${NEON}18,
                  inset 0 0 40px rgba(0,0,0,0.4)
                `,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1.2rem, 6vw, 3rem)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              {/* Label */}
              <p
                style={{
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(0.65rem, 2.5vw, 0.9rem)',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: NEON_CYAN,
                  textShadow: `0 0 12px ${NEON_CYAN}, 0 0 28px ${NEON_CYAN}`,
                  margin: 0,
                }}
              >
                ✦ &nbsp; Reveal begins in &nbsp; ✦
              </p>

              {/* Digits row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(6px, 2vw, 18px)' }}>
                <NeonDigit value={timeLeft.days}    label="Days"    color={NEON} />
                <Sep color={NEON} />
                <NeonDigit value={timeLeft.hours}   label="Hours"   color={NEON} />
                <Sep color={NEON} />
                <NeonDigit value={timeLeft.minutes} label="Minutes" color={NEON} />
                <Sep color={NEON} />
                <NeonDigit value={timeLeft.seconds} label="Seconds" color={NEON} />
              </div>

              {/* Subtitle */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(0.6rem, 2vw, 0.78rem)',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.12em',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                May 27, 2026 — The artists will be revealed
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LandingPage;
