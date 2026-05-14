import React, { useRef, useState } from 'react';
import ScratchCard from '../components/ScratchCard';
import { useStateContext } from '../context/StateContext';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const LandingPage = () => {
  const { currentDay, setCurrentDay } = useStateContext();
  // Target date for the event countdown (e.g., this weekend)
  // We'll set a placeholder date for now that is 3 days in the future
  const days = ['Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center overflow-x-hidden relative">
      {/* Dark overlay to ensure text readability against the grunge background */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto space-y-12">
        
        {/* Logo Section */}
        <div className="w-full max-w-[180px] md:max-w-[280px] mb-4 px-4 mt-6">
          <img 
            src="/assets/logo.png" 
            alt="ECHOES ON A CANVAS" 
            className="w-full h-auto drop-shadow-[0_0_15px_rgba(255,0,127,0.5)] animate-pulse"
          />
        </div>

        {/* Artist Slider Section */}
        <div className="w-full flex flex-col items-center space-y-4 relative z-10">
          <h2 className="text-xl md:text-3xl font-bold tracking-widest text-center uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-6 px-4">
            Guess who our first artist is?
          </h2>
          
          <div className="w-full max-w-6xl mx-auto px-0">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              initialSlide={0} // Default to Wednesday
              onSlideChange={(swiper) => setCurrentDay(days[swiper.activeIndex])}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2,
                slideShadows: false,
              }}
              breakpoints={{
                // Mobile devices: Show 1 main card, slightly peeking others
                320: {
                  slidesPerView: 1.3,
                  spaceBetween: 20
                },
                // Tablets and up: Show 3 cards comfortably
                768: {
                  slidesPerView: 3,
                  spaceBetween: 40
                }
              }}
              modules={[EffectCoverflow]}
              className="w-full py-8"
            >
              {days.map((day) => (
                <SwiperSlide key={day} className="transition-opacity duration-300 flex justify-center">
                  {({ isActive }) => (
                    <div className={`transition-all duration-300 flex flex-col items-center w-full ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-90 blur-[2px]'}`}>
                      {/* Enforce 45% viewport height and maintain aspect ratio */}
                      <div className="h-[45dvh] max-h-[500px] min-h-[300px] aspect-[3/4]">
                        <ScratchCard dayOverride={day} />
                      </div>
                      <p className="text-center mt-6 text-white/50 tracking-widest font-bold uppercase text-sm">
                        {day}
                      </p>
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LandingPage;
