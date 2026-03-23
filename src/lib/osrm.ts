import type { Coordinates, RouteInfo } from './types';
import { findTemporalMidpoint } from './route-utils';

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
	const steps = route.legs[0].steps.map((s: any) => ({
		duration: s.duration,
		coordinates: s.geometry.coordinates
	}));

	const midpoint = findTemporalMidpoint(steps, route.duration);

	return {
		midpoint,
		route: {
			totalDuration: route.duration,
			totalDistance: route.distance,
			geometry: route.geometry
		}
	};
}
