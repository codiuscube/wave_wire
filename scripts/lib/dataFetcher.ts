/**
 * Data Fetcher for Alert Evaluation
 * Fetches surf conditions from NOAA buoys, Open-Meteo forecasts, and NOAA tide stations
 */

// Unit conversion constants
const METERS_TO_FEET = 3.28084;
const MS_TO_KNOTS = 1.94384;
const KMH_TO_KNOTS = 0.539957;

// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => (celsius * 9 / 5) + 32;

// Convert degrees to cardinal direction
const degreesToCardinal = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const round = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// ========== TYPES ==========

export interface BuoyData {
  waveHeight: number;
  wavePeriod: number;
  waterTemp: number;
  meanWaveDirection: string;
  meanWaveDegrees: number;
  windSpeed?: number;
  windGust?: number;
  windDirection?: string;
  windDegrees?: number;
  timestamp: Date;
}

export interface ForecastData {
  waveHeight: number;
  wavePeriod: number;
  swellDirection: string;
  swellDegrees: number;
  windSpeed: number;
  windDirection: string;
  windDegrees: number;
  airTemp: number;
  secondaryHeight?: number;
  secondaryPeriod?: number;
  secondaryDirection?: string;
  secondaryDegrees?: number;
}

export interface TideData {
  currentHeight: number;
  currentDirection: 'rising' | 'falling' | 'slack';
  stationId: string;
  stationName: string;
}

export interface SolarData {
  sunrise: Date;
  sunset: Date;
}

// ========== NOAA BUOY ==========

// NOAA column indices
const NOAA_COLUMNS = {
  YEAR: 0, MONTH: 1, DAY: 2, HOUR: 3, MINUTE: 4,
  WDIR: 5, WSPD: 6, GST: 7, WVHT: 8, DPD: 9,
  APD: 10, MWD: 11, PRES: 12, ATMP: 13, WTMP: 14,
} as const;

const parseValue = (value: string): number | null => {
  if (!value || value === 'MM' || value === 'N/A') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

export async function fetchBuoyData(stationId: string): Promise<BuoyData | null> {
  const normalizedId = stationId.toUpperCase();

  try {
    // Fetch directly from NOAA (no proxy needed for server-side)
    const response = await fetch(
      `https://www.ndbc.noaa.gov/data/realtime2/${normalizedId}.txt`,
      {
        headers: {
          'User-Agent': 'Homebreak/1.0 (surf alert application)',
        },
      }
    );

    if (!response.ok) {
      console.error(`Buoy ${normalizedId}: HTTP ${response.status}`);
      return null;
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    // Find first data line (skip headers starting with #)
    for (const line of lines) {
      if (line.startsWith('#')) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length < 15) continue;

      const waveHeight = parseValue(parts[NOAA_COLUMNS.WVHT]);
      if (waveHeight === null) continue;

      const year = parseInt(parts[NOAA_COLUMNS.YEAR], 10);
      const month = parseInt(parts[NOAA_COLUMNS.MONTH], 10) - 1;
      const day = parseInt(parts[NOAA_COLUMNS.DAY], 10);
      const hour = parseInt(parts[NOAA_COLUMNS.HOUR], 10);
      const minute = parseInt(parts[NOAA_COLUMNS.MINUTE], 10);
      const fullYear = year < 100 ? 2000 + year : year;
      const timestamp = new Date(Date.UTC(fullYear, month, day, hour, minute));

      // Check if data is too old (>48 hours)
      const ageMs = Date.now() - timestamp.getTime();
      if (ageMs > 48 * 60 * 60 * 1000) {
        console.log(`Buoy ${normalizedId}: Data too old (${Math.round(ageMs / 3600000)}h)`);
        return null;
      }

      const wavePeriod = parseValue(parts[NOAA_COLUMNS.DPD]);
      const meanWaveDegrees = parseValue(parts[NOAA_COLUMNS.MWD]);
      const waterTemp = parseValue(parts[NOAA_COLUMNS.WTMP]);
      const windSpeed = parseValue(parts[NOAA_COLUMNS.WSPD]);
      const windGust = parseValue(parts[NOAA_COLUMNS.GST]);
      const windDegrees = parseValue(parts[NOAA_COLUMNS.WDIR]);

      return {
        waveHeight: round(waveHeight * METERS_TO_FEET, 1),
        wavePeriod: wavePeriod ?? 0,
        waterTemp: waterTemp !== null ? round(celsiusToFahrenheit(waterTemp), 0) : 0,
        meanWaveDirection: meanWaveDegrees !== null ? degreesToCardinal(meanWaveDegrees) : 'N/A',
        meanWaveDegrees: meanWaveDegrees ?? 0,
        windSpeed: windSpeed !== null ? round(windSpeed * MS_TO_KNOTS, 0) : undefined,
        windGust: windGust !== null ? round(windGust * MS_TO_KNOTS, 0) : undefined,
        windDirection: windDegrees !== null ? degreesToCardinal(windDegrees) : undefined,
        windDegrees: windDegrees ?? undefined,
        timestamp,
      };
    }

    console.log(`Buoy ${normalizedId}: No valid data found`);
    return null;
  } catch (error) {
    console.error(`Buoy ${normalizedId} fetch error:`, error);
    return null;
  }
}

// ========== OPEN-METEO FORECAST ==========

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    swell_wave_height?: number[];
    swell_wave_period?: number[];
    swell_wave_direction?: number[];
    wind_wave_height?: number[];
    wind_wave_period?: number[];
    wind_wave_direction?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    temperature_2m?: number[];
  };
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
}

export async function fetchForecastData(lat: number, lon: number): Promise<ForecastData | null> {
  try {
    const [marineResponse, weatherResponse] = await Promise.all([
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction&` +
        `forecast_days=1&timezone=auto`
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wind_speed_10m,wind_direction_10m,temperature_2m&` +
        `forecast_days=1&timezone=auto`
      ),
    ]);

    if (!marineResponse.ok || !weatherResponse.ok) {
      console.error(`Open-Meteo error: marine=${marineResponse.status}, weather=${weatherResponse.status}`);
      return null;
    }

    const marineData: OpenMeteoResponse = await marineResponse.json();
    const weatherData: OpenMeteoResponse = await weatherResponse.json();

    const times = marineData.hourly.time;
    if (!times || times.length === 0) return null;

    // Find current hour index
    const now = new Date();
    const nowHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    let currentIndex = 0;
    for (let i = 0; i < times.length; i++) {
      if (new Date(times[i]) >= nowHour) {
        currentIndex = i;
        break;
      }
    }

    const waveHeight = marineData.hourly.swell_wave_height?.[currentIndex] ?? 0;
    const wavePeriod = marineData.hourly.swell_wave_period?.[currentIndex] ?? 0;
    const swellDegrees = marineData.hourly.swell_wave_direction?.[currentIndex] ?? 0;

    const secondaryHeight = marineData.hourly.wind_wave_height?.[currentIndex];
    const secondaryPeriod = marineData.hourly.wind_wave_period?.[currentIndex];
    const secondaryDegrees = marineData.hourly.wind_wave_direction?.[currentIndex];

    const windSpeedKmh = weatherData.hourly.wind_speed_10m?.[currentIndex] ?? 0;
    const windDegrees = weatherData.hourly.wind_direction_10m?.[currentIndex] ?? 0;
    const airTempC = weatherData.hourly.temperature_2m?.[currentIndex] ?? 0;

    return {
      waveHeight: round(waveHeight * METERS_TO_FEET, 1),
      wavePeriod: round(wavePeriod, 0),
      swellDirection: degreesToCardinal(swellDegrees),
      swellDegrees: round(swellDegrees, 0),
      windSpeed: round(windSpeedKmh * KMH_TO_KNOTS, 0),
      windDirection: degreesToCardinal(windDegrees),
      windDegrees: round(windDegrees, 0),
      airTemp: round(celsiusToFahrenheit(airTempC), 0),
      secondaryHeight: secondaryHeight ? round(secondaryHeight * METERS_TO_FEET, 1) : undefined,
      secondaryPeriod: secondaryPeriod ? round(secondaryPeriod, 0) : undefined,
      secondaryDirection: secondaryDegrees ? degreesToCardinal(secondaryDegrees) : undefined,
      secondaryDegrees: secondaryDegrees ? round(secondaryDegrees, 0) : undefined,
    };
  } catch (error) {
    console.error(`Forecast fetch error for ${lat},${lon}:`, error);
    return null;
  }
}

// ========== SOLAR DATA ==========

export async function fetchSolarData(lat: number, lon: number): Promise<SolarData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}&` +
      `daily=sunrise,sunset&` +
      `forecast_days=1&timezone=auto`
    );

    if (!response.ok) return null;

    const data: OpenMeteoResponse = await response.json();

    if (!data.daily?.sunrise?.[0] || !data.daily?.sunset?.[0]) return null;

    return {
      sunrise: new Date(data.daily.sunrise[0]),
      sunset: new Date(data.daily.sunset[0]),
    };
  } catch (error) {
    console.error(`Solar data fetch error:`, error);
    return null;
  }
}

// ========== NOAA TIDE ==========

const NOAA_TIDE_API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

interface TidePrediction {
  time: Date;
  height: number;
  type: 'H' | 'L';
}

export async function fetchTideData(
  stationId: string,
  stationName: string
): Promise<TideData | null> {
  try {
    const now = new Date();
    const beginDate = formatDate(now);

    const url = new URL(NOAA_TIDE_API);
    url.searchParams.set('station', stationId);
    url.searchParams.set('product', 'predictions');
    url.searchParams.set('datum', 'MLLW');
    url.searchParams.set('units', 'english');
    url.searchParams.set('time_zone', 'lst_ldt');
    url.searchParams.set('format', 'json');
    url.searchParams.set('interval', 'hilo');
    url.searchParams.set('begin_date', beginDate);
    url.searchParams.set('range', '24');
    url.searchParams.set('application', 'homebreak');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`Tide station ${stationId}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.error || !data.predictions || !Array.isArray(data.predictions)) {
      console.error(`Tide station ${stationId}: No predictions`);
      return null;
    }

    const predictions: TidePrediction[] = data.predictions.map(
      (p: { t: string; v: string; type: 'H' | 'L' }) => ({
        time: parseNOAADate(p.t),
        height: parseFloat(p.v),
        type: p.type,
      })
    );

    if (predictions.length < 2) return null;

    // Interpolate current height and direction
    const { height, direction } = interpolateTide(predictions, now);

    return {
      currentHeight: height,
      currentDirection: direction,
      stationId,
      stationName,
    };
  } catch (error) {
    console.error(`Tide fetch error for ${stationId}:`, error);
    return null;
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function parseNOAADate(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function interpolateTide(
  predictions: TidePrediction[],
  now: Date
): { height: number; direction: 'rising' | 'falling' | 'slack' } {
  let before: TidePrediction | null = null;
  let after: TidePrediction | null = null;

  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i].time <= now) {
      before = predictions[i];
    }
    if (predictions[i].time > now && !after) {
      after = predictions[i];
      break;
    }
  }

  if (!before || !after) {
    return { height: predictions[0]?.height ?? 0, direction: 'slack' };
  }

  const totalDuration = after.time.getTime() - before.time.getTime();
  const elapsed = now.getTime() - before.time.getTime();
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration));

  const height = before.height + (after.height - before.height) * progress;
  const direction = after.height > before.height ? 'rising' : 'falling';

  // Check for slack tide (within 15 minutes of high/low)
  const minutesToNext = (after.time.getTime() - now.getTime()) / (1000 * 60);
  const minutesFromPrev = (now.getTime() - before.time.getTime()) / (1000 * 60);
  const isSlack = minutesToNext < 15 || minutesFromPrev < 15;

  return {
    height: Math.round(height * 10) / 10,
    direction: isSlack ? 'slack' : direction,
  };
}

// ========== COMBINED SPOT DATA ==========

export interface SpotConditions {
  buoy: BuoyData | null;
  forecast: ForecastData | null;
  tide: TideData | null;
  solar: SolarData | null;
}

export async function fetchSpotConditions(
  lat: number,
  lon: number,
  buoyId?: string,
  tideStationId?: string,
  tideStationName?: string
): Promise<SpotConditions> {
  const [buoy, forecast, tide, solar] = await Promise.all([
    buoyId ? fetchBuoyData(buoyId) : Promise.resolve(null),
    fetchForecastData(lat, lon),
    tideStationId && tideStationName
      ? fetchTideData(tideStationId, tideStationName)
      : Promise.resolve(null),
    fetchSolarData(lat, lon),
  ]);

  return { buoy, forecast, tide, solar };
}
