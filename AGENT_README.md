# Midpoint Calculator — Agent API

Find the geographic or drive-time midpoint between two addresses. Returns the midpoint coordinates, nearby places (restaurants, cafes, bars), and a shareable map URL.

## Base URL

```
https://midpointcalc.vercel.app
```

## Endpoint

```
GET /api/midpoint
```

## Parameters

| Param    | Required | Default      | Description                                        |
|----------|----------|--------------|----------------------------------------------------|
| `a`      | yes      | —            | First address (free text, e.g. `123 Main St, City, ST`) |
| `b`      | yes      | —            | Second address                                     |
| `mode`   | no       | `geometric`  | `geometric`, `drivetime` (road route), or `drivetime-traffic` (traffic-aware, requires Google API key) |
| `radius` | no       | `3000`       | POI search radius in meters (100–50000)            |

## Example Request

```
GET https://midpointcalc.vercel.app/api/midpoint?a=Huntsville+AL&b=Owens+Cross+Roads+AL&mode=drivetime&radius=3000
```

## Response (200)

```json
{
  "addressA": {
    "query": "Huntsville AL",
    "displayName": "Huntsville, Madison County, Alabama, United States",
    "coords": { "lat": 34.7303, "lon": -86.5861 }
  },
  "addressB": {
    "query": "Owens Cross Roads AL",
    "displayName": "Owens Cross Roads, Madison County, Alabama, United States",
    "coords": { "lat": 34.5884, "lon": -86.4558 }
  },
  "midpoint": { "lat": 34.6947, "lon": -86.5133 },
  "mode": "drivetime",
  "route": {
    "totalDuration": 1980,
    "totalDistance": 34760,
    "geometry": { "type": "LineString", "coordinates": [ ... ] }
  },
  "pois": [
    {
      "name": "Rosie's Cantina",
      "type": "restaurant",
      "coords": { "lat": 34.6812, "lon": -86.5391 },
      "address": "Memorial Parkway Southwest, Huntsville"
    }
  ],
  "mapUrl": "https://midpointcalc.vercel.app/?a=Huntsville+AL&b=Owens+Cross+Roads+AL&mode=drivetime&radius=3000"
}
```

### Field Reference

| Field                  | Type              | Description                                           |
|------------------------|-------------------|-------------------------------------------------------|
| `addressA`             | GeocodedAddress   | Resolved first address with coordinates               |
| `addressB`             | GeocodedAddress   | Resolved second address with coordinates              |
| `midpoint`             | Coordinates       | The calculated midpoint `{ lat, lon }`                |
| `mode`                 | string            | `"geometric"`, `"drivetime"`, or `"drivetime-traffic"` |
| `route`                | RouteInfo or null | Present only in `drivetime` mode                      |
| `route.totalDuration`  | number            | Total drive time in seconds                           |
| `route.totalDistance`   | number            | Total drive distance in meters                        |
| `route.geometry`       | GeoJSON LineString| Full route polyline (can be large — ignore if unneeded)|
| `pois`                 | PointOfInterest[] | Nearby restaurants, cafes, and bars                   |
| `pois[].name`          | string            | Place name                                            |
| `pois[].type`          | string            | `"restaurant"`, `"cafe"`, or `"bar"`                  |
| `pois[].coords`        | Coordinates       | Location `{ lat, lon }`                               |
| `pois[].address`       | string or null    | Street address if available                           |
| `mapUrl`               | string            | Shareable URL — opens the map UI with results preloaded|

## Error Responses

| Status | Cause                                    | Example                                              |
|--------|------------------------------------------|------------------------------------------------------|
| 400    | Missing or invalid parameter             | `{ "error": "Missing required parameter \"a\"" }`    |
| 400    | Invalid mode                             | `{ "error": "Invalid mode \"bicycle\". Must be \"geometric\", \"drivetime\", or \"drivetime-traffic\"" }` |
| 404    | Address could not be geocoded            | `{ "error": "Could not geocode address A: \"xyzzy\"" }` |
| 422    | No driving route (drivetime mode only)   | `{ "error": "No driving route found between these locations" }` |
| 501    | Traffic mode without Google API key      | `{ "error": "Traffic-aware routing requires GOOGLE_MAPS_API_KEY to be configured" }` |

## Agent Usage Notes

- **Prefer `drivetime` mode** for real-world meeting point suggestions. `geometric` is faster but puts the midpoint in a straight line which may be in the middle of nowhere.
- **Use `drivetime-traffic`** when traffic conditions matter (e.g. rush hour commutes). Requires `GOOGLE_MAPS_API_KEY` env var. Falls back gracefully with a 501 error if not configured.
- **Give the user the `mapUrl`** so they can see the result on a map. The URL auto-loads the calculation.
- **Use `pois` to suggest meeting places** near the midpoint. These are restaurants, cafes, and bars within the search radius.
- **Increase `radius`** if `pois` comes back empty. Rural areas may need 5000–10000m. Urban areas work fine at 1000–3000m.
- **`route.totalDuration` is in seconds.** Divide by 60 for minutes. Each person drives roughly half this time to reach the midpoint.
- **`route.totalDistance` is in meters.** Divide by 1609.34 for miles.
- **`route.geometry` is large** (thousands of coordinates). You can ignore it — it's for the map UI. Focus on `midpoint`, `pois`, and `mapUrl`.
- **Address format is flexible.** Full addresses, city/state, landmarks, and zip codes all work. Suite numbers and directional qualifiers are stripped automatically.

## Traffic-Aware Mode Setup

The `drivetime-traffic` mode uses the Google Directions API for real-time traffic data. To enable it:

1. Get a Google Maps API key with the Directions API enabled
2. Create a `.env` file in the project root:
   ```
   GOOGLE_MAPS_API_KEY=your_key_here
   ```
3. Restart the server

Without this key, `geometric` and `drivetime` modes work fine (no API key needed).

## Standalone Endpoints

These are also available for individual use:

```
GET /api/geocode?q=Huntsville+AL
GET /api/pois?lat=34.69&lon=-86.51&radius=3000
```
