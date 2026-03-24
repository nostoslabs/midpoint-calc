---
name: midpoint
description: Find the geographic or drive-time midpoint between two addresses. Returns coordinates, nearby restaurants/cafes/bars, and a shareable map link. Use when the user asks about meeting points, halfway points, or midpoints between locations.
argument-hint: <address A> and <address B>
allowed-tools:
  - WebFetch
---

# Midpoint Calculator

Find the midpoint between two addresses using the Midpoint Calculator API.

## API

```
GET https://midpointcalc.vercel.app/api/midpoint?a=ADDRESS_A&b=ADDRESS_B&mode=MODE&radius=RADIUS
```

Use `WebFetch` to call this endpoint. URL-encode the address parameters.

### Parameters

| Param    | Required | Default      | Description                                        |
|----------|----------|--------------|----------------------------------------------------|
| `a`      | yes      | —            | First address (free text)                          |
| `b`      | yes      | —            | Second address (free text)                         |
| `mode`   | no       | `geometric`  | `geometric`, `drivetime`, or `drivetime-traffic`   |
| `radius` | no       | `3000`       | POI search radius in meters (100–50000)            |

### Modes

- `geometric` — straight-line midpoint (fast, no routing)
- `drivetime` — midpoint along the driving route at half the total drive time (recommended for most requests)
- `drivetime-traffic` — accounts for real-time traffic (requires server-side Google API key; falls back with 501 if unavailable)

## Instructions

1. Default to `drivetime` mode unless the user asks for something else.
2. Parse the two addresses from the user's message. If ambiguous, ask for clarification.
3. Call the API with `WebFetch`.
4. Present the results:
   - Midpoint coordinates
   - Drive time in minutes and distance in miles (`totalDistance / 1609.34`)
   - Note each person drives roughly half the total time
   - The `mapUrl` as a clickable link
   - Nearby places from `pois`, grouped by type
5. If `pois` is empty, retry with `radius=5000` or `radius=10000`.
6. Do NOT include `route.geometry` in your response — it's thousands of coordinates meant for the map UI.

## Error handling

- **404**: Address not found. Ask the user for a more specific address.
- **422**: No driving route (e.g. ocean between locations). Suggest `geometric` mode.
- **501**: Traffic mode unavailable. Silently fall back to `drivetime`.

## Example

User: "What's the midpoint between Nashville TN and Atlanta GA?"

Fetch: `https://midpointcalc.vercel.app/api/midpoint?a=Nashville+TN&b=Atlanta+GA&mode=drivetime&radius=3000`

Then present the midpoint, drive info, map link, and nearby places.
