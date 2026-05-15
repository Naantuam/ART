import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScratchCard from '../components/ScratchCard';
import { useStateContext } from '../context/StateContext';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const ARTIST_DATA = {
  Wed: {
    name: 'Benoni Bewarang',
    image: '/assets/Benoni Bewarang/artwork.jpg'
  },
  Thu: {
    name: 'Deborah Choji (shades15)',
    image: '/assets/Deborah Choji/artwork.jpg'
  },
  Fri: {
    name: 'Daspan Tedo',
    image: '/assets/Daspan Tedo/artwork.jpg'
  }
};

const LandingPage = () => {
  const { currentDay, setCurrentDay } = useStateContext();
  const navigate = useNavigate();
  
  // We only show Wed, Thu, Fri in the carousel
  const days = ['Wed', 'Thu', 'Fri'];

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center overflow-x-hidden relative">
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto space-y-12">
        
        <div className="w-full max-w-[180px] md:max-w-[280px] mb-4 px-4 mt-6">
          <img 
            src="/assets/logo.png" 
            alt="ECHOES ON A CANVAS" 
            className="w-full h-auto drop-shadow-[0_0_15px_rgba(255,0,127,0.5)] animate-pulse"
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4 relative z-10">
          <h2 className="text-xl md:text-3xl font-bold tracking-widest text-center uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-6 px-4">
            Guess who our first artist is?
          </h2>
          
          <div className="w-full max-w-6xl mx-auto px-0">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              initialSlide={days.indexOf(currentDay) >= 0 ? days.indexOf(currentDay) : 0}
              onSlideChange={(swiper) => setCurrentDay(days[swiper.activeIndex])}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2,
                slideShadows: false,
              }}
              breakpoints={{
                320: { slidesPerView: 1.3, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 40 }
              }}
              modules={[EffectCoverflow]}
              className="w-full py-8"
            >
              {days.map((day) => {
                const isSaturday = currentDay === 'Sat';
                const canScratch = currentDay === day;

                return (
                  <SwiperSlide key={day} className="transition-opacity duration-300 flex justify-center">
                    {({ isActive }) => (
                      <div className={`transition-all duration-300 flex flex-col items-center w-full ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-90 blur-[2px]'}`}>
                        <div className="h-[45dvh] max-h-[500px] min-h-[300px] aspect-[3/4]">
                          <ScratchCard 
                            dayOverride={day} 
                            artistName={ARTIST_DATA[day].name}
                            artistImage={ARTIST_DATA[day].image}
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

      </div>
    </div>
  );
};

export default LandingPage;
