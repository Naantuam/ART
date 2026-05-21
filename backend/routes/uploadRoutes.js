import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public: Get all active uploaded artworks for the landing page
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('is_live_uploaded', true);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve active artworks', error: error.message });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { artistId, title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // 1. Upload image to Supabase Storage
    const fileName = `${Date.now()}-${file.originalname}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('artworks')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (storageError) throw storageError;

    // 2. Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // 3. Save artwork record in DB with 30x40 specifications
    const { data: artworkData, error: dbError } = await supabase
      .from('artworks')
      .insert([
        {
          artist_id: artistId,
          title: title || 'Untitled',
          image_url: imageUrl,
          width: 30, // 30 inches
          height: 40, // 40 inches
          canvas_color: 'white',
          is_live_uploaded: true
        }
      ])
      .select();

    if (dbError) throw dbError;

    res.status(201).json({ message: 'Upload successful', artwork: artworkData[0] });
  } catch (error) {
    console.error('DEBUG: Upload failed with error:', error);
    if (error.cause) {
      console.error('DEBUG: Underlying cause of fetch failure:', error.cause);
    }
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Admin: Delete uploaded artwork, associated auctions, bids, and storage image by artistId
router.delete('/:artistId', async (req, res) => {
  const { artistId } = req.params;
  try {
    // 1. Fetch the artwork details to get DB id and storage image URL
    const { data: artwork, error: fetchError } = await supabase
      .from('artworks')
      .select('id, image_url')
      .eq('artist_id', artistId.toLowerCase())
      .limit(1);

    if (fetchError || !artwork || artwork.length === 0) {
      return res.status(404).json({ message: 'No artwork found for this artist' });
    }

    const artworkId = artwork[0].id;
    const imageUrl = artwork[0].image_url;

    // 2. Fetch the auction associated with this artwork
    const { data: auction } = await supabase
      .from('auctions')
      .select('id')
      .eq('artwork_id', artworkId)
      .limit(1);

    if (auction && auction.length > 0) {
      const auctionId = auction[0].id;
      // Delete any placed bids first
      await supabase.from('bids').delete().eq('auction_id', auctionId);
      // Delete the auction
      await supabase.from('auctions').delete().eq('id', auctionId);
    }

    // 3. Delete the artwork record from DB
    const { error: dbDeleteError } = await supabase
      .from('artworks')
      .delete()
      .eq('id', artworkId);

    if (dbDeleteError) throw dbDeleteError;

    // 4. Delete the image file from Supabase Storage bucket
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    const { error: storageDeleteError } = await supabase.storage
      .from('artworks')
      .remove([fileName]);

    if (storageDeleteError) {
      console.warn('Storage deletion warning (file may have been deleted manually):', storageDeleteError.message);
    }

    res.json({ success: true, message: `Successfully deleted artwork and reset ${artistId.toUpperCase()} slot.` });
  } catch (error) {
    console.error('Delete artwork failed:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

export default router;
