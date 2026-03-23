import type { Coordinates } from './types';

export function haversineDistance(a: [number, number], b: [number, number]): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const [lon1, lat1] = a;
	const [lon2, lat2] = b;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const sinLat = Math.sin(dLat / 2);
	const sinLon = Math.sin(dLon / 2);
	const h = sinLat * sinLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon;
	return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Interpolate along an array of [lon, lat] coordinates by distance fraction (0–1).
 */
export function interpolateAlongCoords(
	coords: [number, number][],
	fraction: number
): Coordinates {
	if (coords.length === 0) throw new Error('Empty coordinates');
	if (coords.length === 1) return { lat: coords[0][1], lon: coords[0][0] };

	const distances: number[] = [0];
	for (let i = 1; i < coords.length; i++) {
		distances.push(distances[i - 1] + haversineDistance(coords[i - 1], coords[i]));
	}
	const totalDist = distances[distances.length - 1];
	if (totalDist === 0) return { lat: coords[0][1], lon: coords[0][0] };

	const targetDist = totalDist * fraction;

	for (let i = 1; i < distances.length; i++) {
		if (distances[i] >= targetDist) {
			const segLen = distances[i] - distances[i - 1];
			const segFraction = segLen > 0 ? (targetDist - distances[i - 1]) / segLen : 0;
			const [lonA, latA] = coords[i - 1];
			const [lonB, latB] = coords[i];
			return {
				lat: latA + (latB - latA) * segFraction,
				lon: lonA + (lonB - lonA) * segFraction
			};
		}
	}

	const last = coords[coords.length - 1];
	return { lat: last[1], lon: last[0] };
}

/**
 * Walk through route steps with durations, find the midpoint at totalDuration/2.
 * Each step must have `duration` (seconds) and `coordinates` ([lon, lat][]).
 */
export function findTemporalMidpoint(
	steps: { duration: number; coordinates: [number, number][] }[],
	totalDuration: number
): Coordinates {
	const targetTime = totalDuration / 2;
	let accumulated = 0;

	for (const step of steps) {
		if (accumulated + step.duration >= targetTime) {
			const remaining = targetTime - accumulated;
			const fraction = step.duration > 0 ? remaining / step.duration : 0;
			return interpolateAlongCoords(step.coordinates, fraction);
		}
		accumulated += step.duration;
	}

	// Fallback: last coordinate of last step
	const lastStep = steps[steps.length - 1];
	const last = lastStep.coordinates[lastStep.coordinates.length - 1];
	return { lat: last[1], lon: last[0] };
}

/**
 * Decode a Google encoded polyline string into [lon, lat] coordinate pairs.
 */
export function decodePolyline(encoded: string): [number, number][] {
	const coords: [number, number][] = [];
	let index = 0;
	let lat = 0;
	let lng = 0;

	while (index < encoded.length) {
		let shift = 0;
		let result = 0;
		let byte: number;
		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);
		lat += result & 1 ? ~(result >> 1) : result >> 1;

		shift = 0;
		result = 0;
		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);
		lng += result & 1 ? ~(result >> 1) : result >> 1;

		coords.push([lng / 1e5, lat / 1e5]); // [lon, lat]
	}

	return coords;
}
