import type { Coordinates, RouteInfo } from './types';

function haversineDistance(a: [number, number], b: [number, number]): number {
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

function interpolateAlongCoords(
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

export async function findDriveTimeMidpoint(
	a: Coordinates,
	b: Coordinates
): Promise<{ midpoint: Coordinates; route: RouteInfo }> {
	// OSRM uses lon,lat order
	const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?steps=true&geometries=geojson&overview=full`;

	const res = await fetch(url);
	if (!res.ok) throw new Error('OSRM routing request failed');

	const data = await res.json();
	if (data.code !== 'Ok' || !data.routes?.length) {
		throw new Error('No driving route found between these locations');
	}

	const route = data.routes[0];
	const steps = route.legs[0].steps;
	const targetTime = route.duration / 2;

	let accumulated = 0;
	let midpoint: Coordinates | null = null;

	for (const step of steps) {
		if (accumulated + step.duration >= targetTime) {
			const remaining = targetTime - accumulated;
			const fraction = step.duration > 0 ? remaining / step.duration : 0;
			midpoint = interpolateAlongCoords(step.geometry.coordinates, fraction);
			break;
		}
		accumulated += step.duration;
	}

	if (!midpoint) {
		// Fallback: use last coordinate of route
		const coords = route.geometry.coordinates;
		const last = coords[coords.length - 1];
		midpoint = { lat: last[1], lon: last[0] };
	}

	return {
		midpoint,
		route: {
			totalDuration: route.duration,
			totalDistance: route.distance,
			geometry: route.geometry
		}
	};
}
