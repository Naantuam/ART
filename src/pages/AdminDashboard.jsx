import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const DAY_DATA = {
  wed: { artist: 'Benoni Bewarang', color: '#FF007F', glow: 'rgba(255, 0, 127, 0.6)' },
  thu: { artist: 'Deborah Choji (shades15)', color: '#00F0FF', glow: 'rgba(0, 240, 255, 0.6)' },
  fri: { artist: 'Daspan Tedo', color: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' }
};

const AdminDashboard = () => {
  // Dashboard data states
  const [summary, setSummary] = useState({ artworks: [], auctions: [] });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [message, setMessage] = useState('');
  const [uploadingSlots, setUploadingSlots] = useState({ wed: false, thu: false, fri: false });

  // Custom metadata fields for uploads
  const [customTitles, setCustomTitles] = useState({ wed: '', thu: '', fri: '' });
  const [customPrices, setCustomPrices] = useState({ wed: '', thu: '', fri: '' });

  // Fetch all artworks, auctions, and bids
  const fetchSummaryData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auctions/admin/summary`);
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
    // Auto-refresh summary data every 5 seconds for real-time monitoring
    const interval = setInterval(fetchSummaryData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Upload Canvas Flow
  const handleUpload = async (dayString, file) => {
    if (!file) return;

    setUploadingSlots(prev => ({ ...prev, [dayString]: true }));
    setMessage(`Uploading canvas for ${dayString.toUpperCase()}...`);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('artistId', dayString);
    formData.append('title', customTitles[dayString] || `${dayString.toUpperCase()} Artist Canvas`);

    const headersConfig = {
      headers: { 
        'Content-Type': 'multipart/form-data'
      }
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/upload`, formData, headersConfig);
      
      const parsedPrice = customPrices[dayString] ? Number(customPrices[dayString]) : 1000000;

      // Start auction at dynamic starting price, defaults to ₦1,000,000
      await axios.post(`${API_BASE_URL}/api/auctions`, {
        artworkId: res.data.artwork.id,
        startingPrice: parsedPrice,
        endTime: new Date(Date.now() + 86400000 * 7).toISOString() // 7-day default
      });
      
      setMessage(`SUCCESS! ${dayString.toUpperCase()} artwork uploaded and auction scheduled.`);
      // Clear custom fields
      setCustomTitles(prev => ({ ...prev, [dayString]: '' }));
      setCustomPrices(prev => ({ ...prev, [dayString]: '' }));
      fetchSummaryData();
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingSlots(prev => ({ ...prev, [dayString]: false }));
    }
  };

  // Update Auction Status
  const handleStatusChange = async (auctionId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/auctions/${auctionId}/status`, { status: newStatus });
      setMessage(`Auction status updated to ${newStatus.toUpperCase()}.`);
      fetchSummaryData();
    } catch (err) {
      setMessage('Status change failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Clear Bids Flow
  const handleClearBids = async (auctionId) => {
    if (!window.confirm('Are you sure you want to clear all bids for this artwork? This resets the current price back to the starting price.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/auctions/${auctionId}/bids`);
      setMessage('Bids cleared and current price reset successfully!');
      fetchSummaryData();
    } catch (err) {
      setMessage('Failed to clear bids: ' + (err.response?.data?.message || err.message));
    }
  };

  // Format Helper
  const formatNaira = (num) => `₦${Number(num).toLocaleString()}`;

  return (
    <div className="bg-black min-h-screen text-white font-sans p-4 sm:p-8 relative">
      <div className="absolute inset-0 bg-radial-gradient from-[#08020a] to-black opacity-80 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header command center */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-neutral-900 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img src="/assets/logo.png" alt="ECHOES ON A CANVAS" className="h-12 md:h-16 drop-shadow-[0_0_15px_rgba(255,0,127,0.3)]" />
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold uppercase tracking-widest bg-gradient-to-r from-white via-neutral-300 to-gray-500 bg-clip-text text-transparent">Command Center</h1>
              <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest font-bold">Local Live Event Control & Bidding Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Event Console</p>
              <p className="text-[10px] text-green-400 font-mono tracking-wider font-semibold">Subdomain Managed Access</p>
            </div>
          </div>
        </header>

        {/* Console logs banner */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl text-center border font-semibold flex items-center justify-center gap-3 shadow-lg ${
            message.includes('Error') 
              ? 'bg-red-950/40 border-red-800/60 text-red-400' 
              : 'bg-green-950/40 border-green-800/60 text-green-400 animate-pulse'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {message}
          </div>
        )}

        {/* Live Slot Columns Grid */}
        {isInitialLoad ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-500 text-sm font-bold tracking-widest uppercase animate-pulse">Syncing Event Databases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {Object.entries(DAY_DATA).map(([dayKey, dayConfig]) => {
              // Find matching uploaded artwork
              const artwork = summary.artworks.find(art => art.artist_id === dayKey);
              // Find associated auction
              const auction = artwork ? summary.auctions.find(auc => auc.artwork_id === artwork.id) : null;
              
              const isUploading = uploadingSlots[dayKey];
              const themeColor = dayConfig.color;

              return (
                <div 
                  key={dayKey} 
                  className="bg-neutral-950/70 border rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
                  style={{ 
                    borderColor: `${themeColor}22`,
                    boxShadow: `0 10px 40px -15px ${themeColor}12`
                  }}
                >
                  {/* Slot Title Bar */}
                  <div className="p-6 border-b border-neutral-900 bg-neutral-900/30 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>
                        {dayKey.toUpperCase()}DAY EXHIBIT
                      </span>
                      <h2 className="text-xl font-bold uppercase text-white tracking-wide mt-1">
                        {dayConfig.artist.split(' ')[0]}
                      </h2>
                    </div>
                    {/* Uploaded state indicator */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      artwork 
                        ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                        : 'bg-red-950/20 border-red-800/40 text-red-400'
                    }`}>
                      {artwork ? 'Uploaded' : 'Offline'}
                    </span>
                  </div>

                  {/* Slot Core Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                    
                    {artwork ? (
                      /* CASE A: Artwork is UPLOADED */
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        
                        {/* Artwork Frame and Metadata */}
                        <div>
                          <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto bg-white rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.2),0_15px_30px_rgba(0,0,0,0.6)] border-4 border-neutral-900 mb-4 flex items-center justify-center">
                            <img src={artwork.image_url} alt={artwork.title} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="text-center">
                            <h3 className="font-bold text-white tracking-wide text-lg mb-1">{artwork.title}</h3>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                              Canvas Dimensions: {artwork.width}" x {artwork.height}"
                            </p>
                          </div>
                        </div>

                        {/* Auction Live Management Panel */}
                        {auction ? (
                          <div className="bg-neutral-900/40 border border-neutral-900 p-5 rounded-2xl space-y-4">
                            
                            {/* Auction Status and Bid Tracker */}
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-extrabold mb-1">
                                  {auction.status === 'scheduled' ? 'Starting Bid' : 'Current Highest Bid'}
                                </p>
                                <p className="text-2xl font-light text-white font-mono tracking-tight">
                                  {formatNaira(auction.status === 'scheduled' ? auction.starting_price : auction.current_bid)}
                                </p>
                              </div>

                              {/* Glowing Status badge */}
                              <div>
                                {auction.status === 'live' ? (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/25 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    <span className="text-[9px] text-green-400 font-extrabold tracking-widest uppercase">Live</span>
                                  </div>
                                ) : auction.status === 'ended' ? (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full">
                                    <span className="text-[9px] text-neutral-400 font-extrabold tracking-widest uppercase">Closed</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/25 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                    <span className="text-[9px] text-yellow-400 font-extrabold tracking-widest uppercase">Scheduled</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bids Log Monitor */}
                            <div className="space-y-2">
                              <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-extrabold">Bids History ledger</span>
                              <div className="bg-neutral-950/90 border border-neutral-950 rounded-xl p-3 h-32 overflow-y-auto custom-scrollbar text-xs font-mono">
                                {auction.bids && auction.bids.length > 0 ? (
                                  <ul className="space-y-2.5">
                                    {auction.bids.map((bid, index) => (
                                      <li key={bid.id} className="flex justify-between items-center border-b border-neutral-900/60 pb-1.5 last:border-b-0 last:pb-0">
                                        <span className="text-neutral-300 font-medium truncate max-w-[120px]" title={bid.bidder_name}>
                                          {index === 0 && '👑 '}{bid.bidder_name}
                                        </span>
                                        <span className={`font-bold ${index === 0 ? 'text-yellow-400 font-extrabold' : 'text-neutral-400'}`}>
                                          {formatNaira(bid.amount)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-neutral-600 text-[10px] uppercase tracking-wider font-bold">
                                    No active bids placed
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Controls Row */}
                            <div className="grid grid-cols-2 gap-2.5 pt-2">
                              {auction.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStatusChange(auction.id, 'live')}
                                  className="col-span-2 bg-white text-black py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-neutral-200 transition-colors active:scale-95 text-center cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                >
                                  ⚡ Force Open Bidding
                                </button>
                              )}
                              
                              {auction.status === 'live' && (
                                <button
                                  onClick={() => handleStatusChange(auction.id, 'ended')}
                                  className="col-span-2 bg-red-600 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-red-700 transition-colors active:scale-95 text-center cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                                >
                                  🛑 Close Bidding
                                </button>
                              )}

                              {auction.status === 'ended' && (
                                <button
                                  onClick={() => handleStatusChange(auction.id, 'live')}
                                  className="col-span-2 bg-neutral-900 border border-neutral-800 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors active:scale-95 text-center cursor-pointer"
                                >
                                  🔓 Reopen Bidding
                                </button>
                              )}

                              <button
                                onClick={() => handleClearBids(auction.id)}
                                className="col-span-2 border border-neutral-800 text-neutral-500 hover:text-red-400 hover:border-red-950 py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all text-center cursor-pointer"
                              >
                                ♻️ Clear & Reset Bids
                              </button>
                            </div>

                          </div>
                        ) : (
                          <div className="bg-neutral-900 border border-neutral-900 p-5 rounded-2xl text-center text-xs text-neutral-500">
                            Awaiting Database Sync...
                          </div>
                        )}

                      </div>
                    ) : (
                      /* CASE B: Artwork is OFFLINE / AWAITING UPLOAD */
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        
                        {/* Inputs details */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Artwork Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Echoes of Midnight"
                              value={customTitles[dayKey]}
                              onChange={(e) => setCustomTitles(prev => ({ ...prev, [dayKey]: e.target.value }))}
                              className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 px-3.5 text-white placeholder-neutral-800 text-sm focus:ring-1 focus:ring-neutral-700 outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Starting Bid Price (Naira)</label>
                            <input
                              type="number"
                              placeholder="Optional (defaults to ₦1,000,000)"
                              value={customPrices[dayKey]}
                              onChange={(e) => setCustomPrices(prev => ({ ...prev, [dayKey]: e.target.value }))}
                              className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 px-3.5 text-white placeholder-neutral-800 text-sm focus:ring-1 focus:ring-neutral-700 outline-none transition-all"
                            />
                          </div>
                        </div>

                        {/* Interactive Upload Zone */}
                        <div className="flex-1 flex flex-col justify-center">
                          {isUploading ? (
                            <div className="border border-dashed border-neutral-800 bg-neutral-950/30 rounded-2xl py-12 flex flex-col items-center justify-center gap-3">
                              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeColor, borderTopColor: 'transparent' }}></div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 animate-pulse">Uploading canvas...</span>
                            </div>
                          ) : (
                            <label className="block w-full cursor-pointer">
                              <div 
                                className="border border-dashed rounded-2xl py-10 px-4 text-center flex flex-col items-center justify-center gap-3 group hover:bg-neutral-900/10 transition-colors"
                                style={{ borderColor: `${themeColor}33` }}
                              >
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                                  style={{ backgroundColor: `${themeColor}12`, border: `1px solid ${themeColor}33` }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={themeColor}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-white group-hover:text-white/80 transition-colors">Select Artwork Canvas</span>
                                  <span className="block text-[10px] text-neutral-600 mt-1 uppercase tracking-widest">30" x 40" Specifications</span>
                                </div>
                              </div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                className="hidden" 
                                onChange={(e) => handleUpload(dayKey, e.target.files[0])}
                                disabled={isUploading}
                              />
                            </label>
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <footer className="mt-16 border-t border-neutral-900 pt-6 text-center text-xs text-neutral-600 font-mono">
          ECHOES ON A CANVAS &copy; 2026. LOCAL SUBDOMAIN DIRECT PROTOCOL.
        </footer>

      </div>
    </div>
  );
};

export default AdminDashboard;
