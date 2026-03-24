---
name: midpoint
description: Find the geographic or drive-time midpoint between two addresses. Returns coordinates, nearby restaurants/cafes/bars, and a shareable map link.
argument-hint: <address A> and <address B>
---

# Midpoint Calculator

Find the midpoint between two addresses using the Midpoint Calculator API.

## How to use

Make a GET request to the API:

```
https://midpointcalc.vercel.app/api/midpoint?a=ADDRESS_A&b=ADDRESS_B&mode=MODE&radius=RADIUS
```

### Parameters

| Param    | Required | Default      | Description                                        |
|----------|----------|--------------|----------------------------------------------------|
| `a`      | yes      | —            | First address (free text)                          |
| `b`      | yes      | —            | Second address (free text)                         |
| `mode`   | no       | `geometric`  | `geometric`, `drivetime`, or `drivetime-traffic`   |
| `radius` | no       | `3000`       | POI search radius in meters (100–50000)            |

### Modes

- `geometric` — straight-line midpoint (fast, no routing)
- `drivetime` — midpoint along the driving route at half the total drive time (recommended)
- `drivetime-traffic` — same as drivetime but accounts for real-time traffic (requires server-side Google API key)

## Responding to the user

1. **Always use `drivetime` mode** unless the user specifically asks for geometric or traffic-aware routing.
2. **Always include the `mapUrl`** from the response so the user can see the result on a map.
3. **Summarize the drive info** when available: total drive time in minutes, distance in miles (divide meters by 1609.34), and note that each person drives roughly half.
4. **List nearby places** from the `pois` array. Group by type (restaurants, cafes, bars) and include the address if available.
5. If `pois` is empty, **retry with a larger radius** (try 5000, then 10000). Rural midpoints often need a wider search.
6. **Ignore `route.geometry`** — it's only for the map UI and is very large.

## Example

User: "Find the midpoint between Huntsville AL and Owens Cross Roads AL"

Request:
```
GET https://midpointcalc.vercel.app/api/midpoint?a=Huntsville+AL&b=Owens+Cross+Roads+AL&mode=drivetime&radius=3000
```

Response summary to user:
> The drive-time midpoint between Huntsville and Owens Cross Roads is at 34.6947, -86.5133 — about 33 minutes total drive (21.6 miles), so each of you would drive roughly 16-17 minutes.
>
> [View on map](https://midpointcalc.vercel.app/?a=Huntsville+AL&b=Owens+Cross+Roads+AL&mode=drivetime&radius=3000)
>
> Nearby places: ...

## Error handling

- **404** — Address not found. Ask the user to try a more specific address (add city/state).
- **422** — No driving route. The locations may be separated by water. Suggest `geometric` mode as fallback.
- **501** — Traffic mode not configured on the server. Fall back to `drivetime`.
