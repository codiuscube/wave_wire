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

// NOAA Tide data service
export {
  fetchTideData,
  fetchTideDataForLocation,
  getTidePredictionsForDay,
  formatTideHeight,
  formatNextTideEvent,
  clearTideCache,
  type TideData,
  type TidePrediction,
  type HourlyTide,
  type TideFetchResult,
} from './noaaTide';

// AI trigger parsing service
export {
  parseTriggerCommand,
  parseTriggerKeywords,
  type ParseResult,
} from './aiService';

// Address autocomplete service (Photon/OpenStreetMap)
export {
  searchAddresses,
  type AddressSuggestion,
  type AddressSearchResult,
} from './addressService';
