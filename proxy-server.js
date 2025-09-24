import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all origins (adjust as needed for production)
app.use(cors());
app.use(express.json());

// Google Places API proxy endpoint
app.get('/api/places/nearby', async (req, res) => {
  try {
    const { location, radius, keyword, key } = req.query;
    
    if (!location || !key) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${key}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google Places Details API proxy endpoint
app.get('/api/places/details', async (req, res) => {
  try {
    const { place_id, fields, key } = req.query;
    
    if (!place_id || !key) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${key}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching place details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});