# Marine Weather API Integration

> **Source**: [Open-Meteo Marine Weather API](https://open-meteo.com/en/docs/marine-weather-api)  
> **Licence**: Attribution required (CC-BY 4.0)

## Overview

Wave_Wire uses the Open-Meteo Marine Weather API to power its core forecasting features. This API provides global wave forecasts with high resolution (~5km) by combining data from multiple numerical weather prediction models (DWD ICON, NOAA GFS, MeteoFrance, etc.).

## Base Configuration

- **Base URL**: `https://marine-api.open-meteo.com/v1/marine`
- **Method**: `GET`
- **Auth**: None (Free for non-commercial/limited commercial use)

## Key Endpoints & Parameters

### Hourly Forecasts

We primarily fetch hourly wave data. The key parameters for a standard spot request are:

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `latitude` | `float` | Decimal latitude. |
| `longitude` | `float` | Decimal longitude. |
| `hourly` | `string[]` | Comma-separated list of variables (see below). |
| `timezone` | `string` | Set to `auto` to resolve local time for the spot. |
| `forecast_days` | `int` | Default is 7. Can go up to 16. |

### Essential Variables (`hourly`)

To build the spot forecast cards, we require the following variables:

- `wave_height`: Significant wave height (combined wind waves + swell).
- `wave_direction`: Mean wave direction in degrees ($0^\circ=$ North, $90^\circ=$ East).
- `wave_period`: Mean wave period in seconds.
- `swell_wave_height`: Height of the swell component.
- `swell_wave_direction`: Direction of the swell component.
- `swell_wave_period`: Period of the swell component.
- `wind_wave_height`: Height of the wind-driven waves (chop).
- `wind_wave_direction`: Direction of the wind-driven waves.
- `wind_wave_period`: Period of the wind-driven waves.

*Note: For more advanced analysis, we can also request specific swell partitions (secondary, tertiary) if using the GFS model.*

## Data Models

When implementing features that consume this API, use the following TypeScript interfaces:

```typescript
export interface MarineWeatherResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    swell_wave_height: number[];
    swell_wave_direction: number[];
    swell_wave_period: number[];
    // ... maps to requested variables
  };
  hourly_units: {
    time: string;
    wave_height: string;
    // ... maps to units (e.g., "m", "°", "s")
  };
}
```

## Implementation Notes

### 1. Swell vs. Wind Waves
For surfers, the `swell_wave_height` and `swell_wave_period` are usually more significant than the total `wave_height`. Ensure the UI distinguishes between "Ground Swell" (swell components) and "Chop" (wind waves).

### 2. Direction Handling
Wave direction is incoming.
- $0^\circ$: Waves coming from North.
- $180^\circ$: Waves coming from South.
- $270^\circ$: Waves coming from West.

### 3. Resolution & Accuracy
The API uses a 0.05° (~5km) grid.
- **Coastal issues**: For spots effectively *on* the shore, the grid point might be slightly inland or shadowed by land features in the model.
- **Correction**: It is best practice to snap coordinates to the nearest valid ocean grid point if data is missing or anomalous.

### 4. Fetch Strategy
- **Caching**: Forecasts are updated hourly. Implement server-side caching (e.g., Redis or Supabase DB) to prevent rate-limit hits and reduce latency.
- **Rate Limits**: Free tier allows ~10,000 requests per day. Do not fetch on every page load client-side.

## Example Request

```bash
curl "https://marine-api.open-meteo.com/v1/marine?latitude=34.05&longitude=-118.25&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&timezone=auto"
```

## Useful Tools
- [WMO Grid Check](https://open-meteo.com/en/docs/marine-weather-api#location): Verify coverage for coordinates.
- [Variable Visualizer](https://open-meteo.com/en/docs/marine-weather-api): Test different model outputs visually.

## License & Attribution

API data are offered under **Attribution 4.0 International (CC BY 4.0)**.

> **You are free to:**
> - Share: copy and redistribute the material in any medium or format.
> - Adapt: remix, transform, and build upon the material.

**Attribution Requirements:**
You must give appropriate credit, provide a link to the licence, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

**Required Display Link:**
You must include a link next to any location Open-Meteo data are displayed, for example:
<a href="https://open-meteo.com/">
    Weather data by Open-Meteo.com
</a>

**Open Source:**
Open-Meteo is open-source. Source code is available on [GitHub](https://github.com/open-meteo/open-meteo) under the GNU Affero General Public Licence Version 3 (AGPLv3) or any later version.

**Citation & Acknowledgement:**
Generated using ICON Wave forecast from the German Weather Service DWD.
All users of Open-Meteo data must provide a clear attribution to DWD as well as a reference to Open-Meteo.

## Commercial Plans & Limits

Information about plans for upgrading purposes.

| Feature | Free / Open-Access | API Standard | API Professional | API Enterprise |
| :--- | :--- | :--- | :--- | :--- |
| **Commercial use** | ❌ | ✅ | ✅ | ✅ |
| **Minutely Limit** | ⚠️ 600 calls / min | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Hourly Limit** | ⚠️ 5,000 calls / hour | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Daily Limit** | ⚠️ 10,000 calls / day | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Monthly Limit** | ⚠️ 300,000 calls / month | ⚠️ 1M calls / month | ⚠️ 5M calls / month | ✅ >50M calls / month |
| **Marine API** | ✅ | ✅ | ✅ | ✅ |
| **Previous Model Runs API** | ✅ | ❌ | ✅ | ✅ |
| **Reserved Servers** | ❌ | ✅ | ✅ | ✅ |
| **Custom Solutions** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ❌ | ✅ |

### Commercial Use Licence

Commercial clients enjoy the advantages of dedicated API servers and personalized support.

- **Evaluation**: During the evaluation, prototyping, and development stages, utilize the free tier.
- **Production**: For production systems, an API key is provided to ensure reliable data delivery.
- **Contact**: info@open-meteo.com

### Reliable Performance
- **Uptime**: 99.9% uptime (monitor real-time at [status.open-meteo.com](https://status.open-meteo.com/)).
- **Infrastructure**: Strategic server locations in Europe and North America (Asia coming soon).
- **Scale**: If anticipating billions of calls, self-hosting is recommended.

### API Consumption
- **Definition**: 1 API call = 1 HTTP request (typically).
- **Complex Requests**:
  - \>10 variables or \>2 weeks data counts as multiple calls.
  - Calculation: Fractional counts (e.g., 2 weeks data + 15 variables = 1.5 calls).
  - *Example cost*: A request with 14 days, 1 model, 1 location, and 10 variables costs **1.0 API call**.

### Payment & Flexibility
- **Methods**: Credit cards, Apple Pay, Google Pay, SOFORT, SEPA.
- **Processor**: Securely processed via Stripe.
- **Invoicing**: PDF invoices provided.
- **Cancellation**: Cancel anytime via customer portal.
- **Predictable Cost**: Fixed subscription price; notifications sent at 80%, 90%, 100% of volume limit. No automatic overcharges.
