// NOAA Buoy data service
export {
  fetchBuoyData,
  fetchMultipleBuoyData,
  clearBuoyCache,
  getCachedBuoyData,
  type BuoyFetchResult,
} from './noaaBuoy';

// Open-Meteo forecast service
export {
  fetchForecastData,
  fetchForecastDataForTime,
  fetchMultipleForecastData,
  clearForecastCache,
  type ForecastFetchResult,
  type ForecastTime,
} from './openMeteo';
