import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// Get live auction for an artist
router.get('/artist/:artistId', async (req, res) => {
  const { artistId } = req.params;
  
  try {
    const { data, error } = await supabase
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
      .eq('artworks.artist_id', artistId)
      .eq('status', 'live')
      .single();

    if (error) {
      return res.status(404).json({ message: 'No live auction found', error });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start an auction
router.post('/', async (req, res) => {
  const { artworkId, startingPrice, endTime } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('auctions')
      .insert([
        { 
          artwork_id: artworkId, 
          starting_price: startingPrice, 
          current_bid: startingPrice,
          start_time: new Date().toISOString(),
          end_time: endTime,
          status: 'live' 
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to start auction', error: error.message });
  }
});

// Place a bid
router.post('/:id/bid', async (req, res) => {
  const { id } = req.params;
  const { bidderName, amount } = req.body;

  try {
    // Basic transaction concept: we'd ideally use a DB function to avoid race conditions.
    // For simplicity here, we read current bid, check if new bid is higher, then update.
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('current_bid')
      .eq('id', id)
      .single();

    if (fetchError || !auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (amount <= auction.current_bid) {
      return res.status(400).json({ message: 'Bid must be higher than current bid' });
    }

    const { error: bidError } = await supabase
      .from('bids')
      .insert([{ auction_id: id, bidder_name: bidderName, amount }]);

    if (bidError) throw bidError;

    // Update auction current_bid
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
