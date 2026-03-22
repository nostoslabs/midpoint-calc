import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geocode } from '$lib/nominatim';
import { calculateMidpoint } from '$lib/geo';
import { findDriveTimeMidpoint } from '$lib/osrm';
import { findNearbyPois } from '$lib/overpass';
import type { MidpointMode, MidpointResult } from '$lib/types';

const VALID_MODES: MidpointMode[] = ['geometric', 'drivetime'];

export const GET: RequestHandler = async ({ url }) => {
	const aQuery = url.searchParams.get('a')?.trim();
	const bQuery = url.searchParams.get('b')?.trim();
	const modeParam = url.searchParams.get('mode') || 'geometric';
	const radius = parseInt(url.searchParams.get('radius') || '3000');

	if (!aQuery) return json({ error: 'Missing required parameter "a"' }, { status: 400 });
	if (!bQuery) return json({ error: 'Missing required parameter "b"' }, { status: 400 });
	if (!VALID_MODES.includes(modeParam as MidpointMode)) {
		return json(
			{ error: `Invalid mode "${modeParam}". Must be "geometric" or "drivetime"` },
			{ status: 400 }
		);
	}
	if (isNaN(radius) || radius < 100 || radius > 50000) {
		return json({ error: 'Radius must be between 100 and 50000 meters' }, { status: 400 });
	}

	const mode = modeParam as MidpointMode;

	// Geocode both addresses
	const [addressA, addressB] = await Promise.all([geocode(aQuery), geocode(bQuery)]);

	if (!addressA) {
		return json({ error: `Could not geocode address A: "${aQuery}"` }, { status: 404 });
	}
	if (!addressB) {
		return json({ error: `Could not geocode address B: "${bQuery}"` }, { status: 404 });
	}

	// Calculate midpoint
	let midpoint;
	let route;

	if (mode === 'drivetime') {
		try {
			const result = await findDriveTimeMidpoint(addressA.coords, addressB.coords);
			midpoint = result.midpoint;
			route = result.route;
		} catch (e) {
			return json(
				{ error: e instanceof Error ? e.message : 'No driving route found' },
				{ status: 422 }
			);
		}
	} else {
		midpoint = calculateMidpoint(addressA.coords, addressB.coords);
	}

	// Fetch POIs
	const pois = await findNearbyPois(midpoint, radius);

	// Build map URL
	const mapUrl = new URL('/', url.origin);
	mapUrl.searchParams.set('a', aQuery);
	mapUrl.searchParams.set('b', bQuery);
	mapUrl.searchParams.set('mode', mode);
	mapUrl.searchParams.set('radius', String(radius));

	const result: MidpointResult = {
		addressA,
		addressB,
		midpoint,
		mode,
		...(route ? { route } : {}),
		pois,
		mapUrl: mapUrl.toString()
	};

	return json(result);
};
