import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geocode } from '$lib/nominatim';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim();
	if (!q) {
		return json({ error: 'Missing query parameter "q"' }, { status: 400 });
	}

	const result = await geocode(q);
	if (!result) {
		return json({ error: 'Address not found' }, { status: 404 });
	}

	return json(result);
};
