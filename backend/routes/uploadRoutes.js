import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

export default router;
