import type { VercelRequest, VercelResponse } from '@vercel/node';

const NOAA_BASE_URL = 'https://www.ndbc.noaa.gov/data/realtime2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const { station } = req.query;

  // Validate station ID (5 alphanumeric characters, e.g., "42035" or "46025")
  if (!station || typeof station !== 'string' || !/^[A-Za-z0-9]{5}$/.test(station)) {
    return res.status(400).json({
      error: 'Invalid station ID',
      message: 'Station ID must be 5 alphanumeric characters (e.g., 42035)'
    });
  }

  const stationId = station.toUpperCase();

  try {
    const response = await fetch(`${NOAA_BASE_URL}/${stationId}.txt`, {
      headers: {
        'User-Agent': 'ITSPUMPING.AI/1.0 (Surf Alert Service)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          error: 'Buoy not found',
          message: `No data available for station ${stationId}. The buoy may be offline or the ID may be incorrect.`
        });
      }
      return res.status(response.status).json({
        error: 'NOAA API error',
        message: `Failed to fetch buoy data: ${response.statusText}`
      });
    }

    const text = await response.text();

    // Set response headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 min cache
    res.setHeader('X-Station-ID', stationId);

    return res.send(text);
  } catch (error) {
    console.error(`Error fetching buoy ${stationId}:`, error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch buoy data from NOAA'
    });
  }
}
