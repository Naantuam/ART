import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// Public: Get latest auction (live, scheduled, or ended) for an artist
router.get('/artist/:artistId', async (req, res) => {
  const { artistId } = req.params;
  
  try {
    // 1. Fetch the latest artwork for this artist day (wed, thu, fri)
    const { data: artworkData, error: artworkError } = await supabase
      .from('artworks')
      .select('id')
      .eq('artist_id', artistId.toLowerCase())
      .order('id', { ascending: false })
      .limit(1);

    if (artworkError || !artworkData || artworkData.length === 0) {
      return res.status(404).json({ message: 'No artwork found for this artist' });
    }

    const artworkId = artworkData[0].id;

    // 2. Fetch the latest auction for this artwork
    const { data: auctionData, error: auctionError } = await supabase
      .from('auctions')
      .select(`
        id, 
        starting_price, 
        current_bid, 
        start_time, 
        end_time, 
        status,
        artworks ( id, title, image_url, width, height, canvas_color )
      `)
      .eq('artwork_id', artworkId)
      .order('start_time', { ascending: false })
      .limit(1);

    if (auctionError || !auctionData || auctionData.length === 0) {
      return res.status(404).json({ message: 'No auction found for this artwork' });
    }

    res.json(auctionData[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all artworks, auctions, and bids history
router.get('/admin/summary', async (req, res) => {
  try {
    // 1. Fetch all active uploaded artworks
    const { data: artworks, error: artworksError } = await supabase
      .from('artworks')
      .select('*')
      .eq('is_live_uploaded', true);
      
    if (artworksError) throw artworksError;

    // 2. Fetch all auctions with their bids
    const { data: auctions, error: auctionsError } = await supabase
      .from('auctions')
      .select(`
        id,
        artwork_id,
        starting_price,
        current_bid,
        start_time,
        end_time,
        status,
        bids (
          id,
          bidder_name,
          amount,
          created_at
        )
      `);

    if (auctionsError) throw auctionsError;

    // Sort bids for each auction by amount descending
    auctions.forEach(auc => {
      if (auc.bids) {
        auc.bids.sort((a, b) => b.amount - a.amount);
      }
    });

    res.json({ artworks, auctions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin summary data', error: error.message });
  }
});

// Admin: Start a new auction (defaults to 'scheduled' for Saturday)
router.post('/', async (req, res) => {
  const { artworkId, startingPrice, endTime } = req.body;
  const initialPrice = startingPrice ? Number(startingPrice) : 1000000; // Default to ₦1,000,000 Naira
  
  try {
    const { data, error } = await supabase
      .from('auctions')
      .insert([
        { 
          artwork_id: artworkId, 
          starting_price: initialPrice, 
          current_bid: initialPrice,
          start_time: new Date().toISOString(),
          end_time: endTime || new Date(Date.now() + 86400000 * 7).toISOString(), // Default to 1 week
          status: 'scheduled' 
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to start auction', error: error.message });
  }
});

// Admin: Update auction status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('auctions')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update auction status', error: error.message });
  }
});

// Admin: Clear bids for an auction and reset current_bid to starting_price
router.delete('/:id/bids', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete all bids in bids table for this auction
    const { error: deleteBidsError } = await supabase
      .from('bids')
      .delete()
      .eq('auction_id', id);
    
    if (deleteBidsError) throw deleteBidsError;

    // 2. Fetch the starting price to reset current_bid
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('starting_price')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    // 3. Reset the current bid to the starting price
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auctions')
      .update({ current_bid: auction.starting_price })
      .eq('id', id)
      .select();
    
    if (updateError) throw updateError;

    res.json({ message: 'Bids cleared and current bid reset successfully', auction: updatedAuction[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear bids', error: error.message });
  }
});

// Public: Place a bid (open to public during live phase)
router.post('/:id/bid', async (req, res) => {
  const { id } = req.params;
  const { bidderName, amount } = req.body;

  try {
    // 1. Read current bid and status
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('current_bid, status')
      .eq('id', id)
      .single();

    if (fetchError || !auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status !== 'live') {
      return res.status(400).json({ message: 'Bidding is only open when the auction is live' });
    }

    if (amount <= auction.current_bid) {
      return res.status(400).json({ message: 'Bid must be higher than current bid' });
    }

    // 2. Insert bid record
    const { error: bidError } = await supabase
      .from('bids')
      .insert([{ auction_id: id, bidder_name: bidderName, amount }]);

    if (bidError) throw bidError;

    // 3. Update auction current_bid
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auctions')
      .update({ current_bid: amount })
      .eq('id', id)
      .select();

    if (updateError) throw updateError;

    res.json(updatedAuction[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to place bid', error: error.message });
  }
});

export default router;
