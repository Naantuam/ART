import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// Hardcoded artist data based on the day
const ARTIST_DATA = {
  wed: {
    name: 'Benoni Bewarang',
    image: '/assets/Benoni Bewarang/ProfileIm.jpg',
    bio: 'Opening the Echoes on a Canvas exhibition.',
    socials: { phone: '07030555320', instagram: 'https://www.instagram.com/ben_dimka?igsh=MW84enE5eG53azN6YQ==' }
  },
  thu: {
    name: 'Deborah Choji (shades15)',
    image: '/assets/Deborah Choji/Profileimg.jpg',
    bio: 'Continuing the visual journey.',
    socials: { phone: '07064721793', facebook: 'https://www.facebook.com/share/1B782v3C59/', instagram: 'https://www.instagram.com/deborah.choji?igsh=c2U0ZTRzcTQ5bjg0' }
  },
  fri: {
    name: 'Daspan Tedo',
    image: '/assets/Daspan Tedo/ProfileImg.jpg',
    bio: 'Closing the solo showcases before the grand Saturday auction.',
    socials: { phone: '07062231523', instagram: 'https://www.instagram.com/convertmode?igsh=MWxiYTN3eHI2ODg0Mw==' }
  }
};

const ArtistProfile = () => {
  const { day } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  const artistInfo = ARTIST_DATA[day?.toLowerCase()] || ARTIST_DATA.wed;

  const fetchAuction = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/auctions/artist/${day}`);
      setAuction(res.data);
    } catch (error) {
      console.log("No active auction or error fetching");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuction();
    const interval = setInterval(fetchAuction, 5000); 
    return () => clearInterval(interval);
  }, [day]);

  const handleBid = async (e) => {
    e.preventDefault();
    if (!auction) return;
    
    try {
      await axios.post(`http://localhost:5000/api/auctions/${auction.id}/bid`, {
        bidderName: 'Anonymous Bidder', 
        amount: Number(bidAmount)
      });
      setBidMessage('Bid placed successfully!');
      setBidAmount('');
      fetchAuction(); 
    } catch (error) {
      setBidMessage('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">Loading Artist Profile...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Back button */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
          ← Back to Showcase
        </Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Canvas Area (30x40 aspect ratio) */}
        <div className="lg:col-span-7 w-full flex justify-center items-center p-4 sm:p-8 bg-neutral-800/50 rounded-3xl shadow-2xl border border-neutral-800">
          <div 
            className="relative bg-white flex items-center justify-center overflow-hidden"
            style={{ 
              width: '100%', 
              maxWidth: '600px', 
              aspectRatio: '30 / 40',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1), 0 20px 40px -10px rgba(0,0,0,0.5)'
            }}
          >
            {auction && auction.artworks ? (
              <img 
                src={auction.artworks.image_url} 
                alt={auction.artworks.title} 
                className="w-full h-full object-cover shadow-inner"
              />
            ) : (
              <div className="text-gray-300 text-center p-8 flex flex-col items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xl font-light text-gray-400 tracking-widest uppercase">30" × 40"</p>
                <p className="text-sm text-gray-500">Awaiting Live Canvas Upload</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Artist Details & Auction */}
        <div className="lg:col-span-5 space-y-10">
          
          {/* Artist Info Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-neutral-800 pb-8">
            <img 
              src={artistInfo.image} 
              alt={artistInfo.name} 
              className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700 shadow-lg"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                {artistInfo.name}
              </h1>
              <p className="text-gray-400 leading-relaxed mb-4 text-sm sm:text-base">
                {artistInfo.bio}
              </p>
              <div className="flex gap-4 justify-center sm:justify-start">
                {Object.entries(artistInfo.socials).map(([platform, link]) => (
                  <a 
                    key={platform} 
                    href={link.startsWith('http') ? link : `tel:${link}`}
                    target={link.startsWith('http') ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors cursor-pointer border border-neutral-700 rounded-full px-4 py-2 flex items-center"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Auction Details Section */}
          {auction ? (
            <div className="bg-neutral-800/80 p-6 sm:p-8 rounded-2xl border border-neutral-700 shadow-xl">
              <div className="flex justify-between items-end mb-8 border-b border-neutral-700/50 pb-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest font-bold">Current Bid</p>
                  <p className="text-4xl sm:text-5xl font-light text-white">${auction.current_bid.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-xs text-green-400 font-bold tracking-widest">LIVE</span>
                  </div>
                </div>
              </div>

              {bidMessage && (
                <div className="mb-6 p-4 rounded-xl bg-neutral-900 text-blue-400 text-sm border border-neutral-700 font-medium text-center">
                  {bidMessage}
                </div>
              )}

              <form onSubmit={handleBid} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input 
                    type="number" 
                    min={auction.current_bid + 1}
                    required
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-4 pl-8 pr-4 focus:ring-2 focus:ring-white focus:border-white transition-all text-lg font-medium text-white placeholder-gray-600 outline-none"
                    placeholder={`Min. ${(auction.current_bid + 1).toLocaleString()}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition-transform active:scale-95 whitespace-nowrap text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Place Bid
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-neutral-800/30 border border-neutral-800 rounded-2xl p-8 text-center">
              <p className="text-neutral-500 font-medium tracking-wide">Auction has not started yet.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ArtistProfile;
