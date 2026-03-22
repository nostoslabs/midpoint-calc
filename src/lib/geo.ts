import type { Coordinates } from './types';

export function calculateMidpoint(a: Coordinates, b: Coordinates): Coordinates {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const toDeg = (r: number) => (r * 180) / Math.PI;

	const lat1 = toRad(a.lat),
		lon1 = toRad(a.lon);
	const lat2 = toRad(b.lat),
		lon2 = toRad(b.lon);

	const x = Math.cos(lat1) * Math.cos(lon1) + Math.cos(lat2) * Math.cos(lon2);
	const y = Math.cos(lat1) * Math.sin(lon1) + Math.cos(lat2) * Math.sin(lon2);
	const z = Math.sin(lat1) + Math.sin(lat2);

	return {
		lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
		lon: toDeg(Math.atan2(y, x))
	};
}
