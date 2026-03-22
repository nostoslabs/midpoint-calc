import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findNearbyPois } from '$lib/overpass';

export const GET: RequestHandler = async ({ url }) => {
	const lat = parseFloat(url.searchParams.get('lat') || '');
	const lon = parseFloat(url.searchParams.get('lon') || '');
	const radius = parseInt(url.searchParams.get('radius') || '1000');

	if (isNaN(lat) || isNaN(lon)) {
		return json({ error: 'Missing or invalid lat/lon parameters' }, { status: 400 });
	}

	const pois = await findNearbyPois({ lat, lon }, radius);
	return json(pois);
};
