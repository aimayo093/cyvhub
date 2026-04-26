# CYVhub Google Maps Integration

CYVhub uses two separate Google Maps API keys in production. Do not reuse one key for both browser and backend work.

## Environment Variables

In Vercel, open:

`Project -> Settings -> Environment Variables`

Add these variables for Production, Preview, and Development, then redeploy:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=website_browser_key
GOOGLE_MAPS_SERVER_KEY=backend_server_key
```

For Expo web/native builds, also set the same browser key as:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=website_browser_key
```

Never create `NEXT_PUBLIC_GOOGLE_MAPS_SERVER_KEY` or `VITE_GOOGLE_MAPS_SERVER_KEY`. Anything prefixed with `NEXT_PUBLIC_`, `EXPO_PUBLIC_`, or `VITE_` is bundled into client code.

## Key 1: CYVhub Website Map Key

Use this key only for browser/client features:

- Website map display
- Address autocomplete
- Postcode lookup UI
- Booking form maps
- Business, admin, driver, and carrier map display

Google Cloud settings:

- Application restriction: Websites
- Allowed websites:
  - `https://cyvhub.com/*`
  - `https://www.cyvhub.com/*`
  - `http://localhost:3000/*`
  - `http://localhost:5173/*`
- Allowed APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API

## Key 2: CYVhub Backend Route Pricing Key

Use this key only in backend routes and server utilities:

- `POST /api/maps/geocode`
- `POST /api/maps/distance`
- `POST /api/maps/route-pricing`
- Delivery pricing calculations
- ETA and route distance calculations
- Dispatch proximity calculations
- Postcode-to-coordinate conversion

Google Cloud settings:

- Application restriction: None for now, because Vercel serverless does not provide a fixed outbound IP unless Vercel Static IP/Secure Compute is enabled.
- API restrictions:
  - Routes API
  - Distance Matrix API
  - Geocoding API
  - Directions API

Keep this key private in Vercel environment variables. It must never be imported into frontend code.

## Backend Endpoints

### `POST /api/maps/geocode`

```json
{ "address": "SA11 2AY" }
```

Returns formatted address, postcode, latitude, longitude, and `success`.

### `POST /api/maps/distance`

```json
{
  "origin": "SA11 2AY",
  "destination": "CF5 4TF",
  "waypoints": []
}
```

Returns miles, kilometres, duration, encoded polyline, and `success`.

### `POST /api/maps/route-pricing`

```json
{
  "origin": "SA11 2AY",
  "destination": "CF5 4TF",
  "vehicleType": "small_van",
  "urgency": "same_day",
  "parcelCount": 1,
  "weightKg": 10,
  "dimensions": [
    {
      "lengthCm": 40,
      "widthCm": 30,
      "heightCm": 30,
      "weightKg": 10
    }
  ]
}
```

Returns server-calculated route distance, ETA, price breakdown, total price, currency, and `success`.

## Security Policy

- Public browser key is allowed only in client map/autocomplete display code.
- Server key is allowed only in backend files under `backend/src`.
- Pricing, payment, route validation, ETA, and dispatch logic must call backend endpoints or server utilities.
- Client-submitted prices are never trusted. Backend delivery/admin job creation recalculates pricing before saving.
- Raw Google API errors are logged server-side and are not returned to users.
- Missing keys produce developer warnings in development and deployment/runtime errors in production where required.

## Validation Checklist

- Website map renders with the browser key.
- Address autocomplete returns UK suggestions.
- `POST /api/maps/geocode` returns coordinates.
- `POST /api/maps/distance` returns miles and duration.
- `POST /api/maps/route-pricing` returns a GBP price.
- Booking and admin job creation use backend-calculated route/pricing.
- Driver/carrier job offers expose payout, route, pickup/dropoff, parcel details, and instructions only.
- Frontend bundle contains no `GOOGLE_MAPS_SERVER_KEY`.
- Vercel has both environment variables in Production, Preview, and Development.
- Google Cloud API restrictions match the two-key setup above.
