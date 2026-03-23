import type { Coordinates, RouteInfo } from './types';
import { decodePolyline, findTemporalMidpoint } from './route-utils';
import { env } from '$env/dynamic/private';

export function isGoogleRoutesAvailable(): boolean {
	return !!env.GOOGLE_MAPS_API_KEY;
}

export async function findDriveTimeMidpointWithTraffic(
	a: Coordinates,
	b: Coordinates
): Promise<{ midpoint: Coordinates; route: RouteInfo }> {
	const apiKey = env.GOOGLE_MAPS_API_KEY;
	if (!apiKey) {
		throw new Error('Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY in .env');
	}

	const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${a.lat},${a.lon}&destination=${b.lat},${b.lon}&departure_time=now&key=${apiKey}`;

	const res = await fetch(url);
	if (!res.ok) throw new Error('Google Directions API request failed');

	const data = await res.json();
	if (data.status !== 'OK' || !data.routes?.length) {
		throw new Error(
			data.status === 'ZERO_RESULTS'
				? 'No driving route found between these locations'
				: `Google Directions API error: ${data.status}`
		);
	}

	const route = data.routes[0];
	const leg = route.legs[0];

	// Use duration_in_traffic when available, fall back to duration
	const totalDuration = leg.duration_in_traffic?.value ?? leg.duration.value;
	const totalDistance = leg.distance.value;

	// Build steps with traffic-aware durations and decoded polylines
	const steps = leg.steps.map((s: any) => ({
		duration: s.duration.value,
		coordinates: decodePolyline(s.polyline.points)
	}));

	// Scale step durations proportionally to match traffic-adjusted total
	// Google only gives per-step durations without traffic, but gives
	// traffic-adjusted total via duration_in_traffic
	const baseDuration = leg.duration.value;
	if (baseDuration > 0 && totalDuration !== baseDuration) {
		const scale = totalDuration / baseDuration;
		for (const step of steps) {
			step.duration *= scale;
		}
	}

	const midpoint = findTemporalMidpoint(steps, totalDuration);

	// Build full route geometry from overview polyline
	const overviewCoords = decodePolyline(route.overview_polyline.points);
	const geometry: GeoJSON.LineString = {
		type: 'LineString',
		coordinates: overviewCoords
	};

	return {
		midpoint,
		route: {
			totalDuration,
			totalDistance,
			geometry
		}
	};
}
