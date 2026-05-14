import { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = new Date(targetDate) - new Date();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HRS', value: timeLeft.hours },
    { label: 'MINS', value: timeLeft.minutes },
    { label: 'SECS', value: timeLeft.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs tracking-[0.3em] uppercase text-white/50 font-light">Event Begins In</p>
      <div className="flex items-center gap-2 md:gap-4">
        {units.map(({ label, value }, i) => (
          <div key={label} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center">
              <div
                className="relative flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-xl border border-white/10"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 0 20px rgba(255, 0, 127, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                <span
                  className="text-3xl md:text-5xl font-bold tabular-nums"
                  style={{
                    color: '#FF007F',
                    textShadow: '0 0 20px rgba(255, 0, 127, 0.8), 0 0 40px rgba(255, 0, 127, 0.4)',
                    fontFamily: "'Outfit', monospace",
                  }}
                >
                  {String(value).padStart(2, '0')}
                </span>
              </div>
              <span className="mt-2 text-[9px] md:text-[11px] tracking-[0.25em] text-white/40 font-medium">
                {label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span
                className="text-2xl md:text-4xl font-bold mb-5"
                style={{ color: '#FF007F', textShadow: '0 0 10px rgba(255, 0, 127, 0.6)' }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
