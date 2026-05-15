import React, { useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (dayString, file) => {
    if (!file) return;
    setLoading(true);
    setMessage(`Uploading canvas for ${dayString.toUpperCase()}...`);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('artistId', dayString); // Using the day as the artistId
    formData.append('title', `${dayString.toUpperCase()} Artist Canvas`);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Auto-start auction at $1000 placeholder (can be adjusted later if needed)
      await axios.post('http://localhost:5000/api/auctions', {
        artworkId: res.data.artwork.id,
        startingPrice: 1000,
        endTime: new Date(Date.now() + 86400000).toISOString()
      });
      
      setMessage(`SUCCESS! ${dayString.toUpperCase()} canvas is live.`);
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const UploadSection = ({ day, color }) => (
    <div className={`p-6 rounded-2xl border-2 mb-6 shadow-sm`} style={{ borderColor: color }}>
      <h3 className="text-xl font-bold mb-4 capitalize">{day} Artist Canvas</h3>
      <label className="block w-full">
        <div 
          className="w-full py-6 rounded-xl text-white text-center font-bold text-lg cursor-pointer flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: color }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Open Camera & Upload
        </div>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          onChange={(e) => handleUpload(day, e.target.files[0])}
          disabled={loading}
        />
      </label>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto bg-gray-50 min-h-screen font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-800 text-center">Admin Portal</h1>
      
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-center font-medium ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {loading && (
        <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-xl text-center animate-pulse font-bold">
          Processing Upload... Please wait.
        </div>
      )}

      <UploadSection day="wed" color="#FF007F" />
      <UploadSection day="thu" color="#00F0FF" />
      <UploadSection day="fri" color="#FFD700" />
      
    </div>
  );
};

export default AdminDashboard;
