import type { Coordinates, PointOfInterest } from './types';

export async function findNearbyPois(
	coords: Coordinates,
	radiusMeters: number = 1000
): Promise<PointOfInterest[]> {
	const query = `
		[out:json][timeout:10];
		(
			node["amenity"~"restaurant|cafe|bar"](around:${radiusMeters},${coords.lat},${coords.lon});
		);
		out body 20;
	`;

	const res = await fetch('https://overpass-api.de/api/interpreter', {
		method: 'POST',
		body: `data=${encodeURIComponent(query)}`,
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
	});

	if (!res.ok) return [];

	const data = await res.json();
	return (data.elements || [])
		.filter((el: any) => el.tags?.name)
		.map((el: any) => ({
			name: el.tags.name,
			type: el.tags.amenity || 'place',
			coords: { lat: el.lat, lon: el.lon },
			address: [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ') || undefined
		}));
}
