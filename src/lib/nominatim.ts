import type { GeocodedAddress } from './types';

let lastRequestTime = 0;

function normalizeAddress(query: string): string[] {
	const seen = new Set<string>();
	const variants: string[] = [];

	function add(v: string) {
		const trimmed = v.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
		if (trimmed && !seen.has(trimmed)) {
			seen.add(trimmed);
			variants.push(trimmed);
		}
	}

	// 1. Original
	add(query);

	// 2. Strip suite/unit/apt numbers (e.g., "4901-I" → "4901", "Suite 200" → "")
	let simplified = query
		.replace(/\b(suite|ste|unit|apt|#)\s*\S+/gi, '')
		.replace(/(\d+)-[A-Za-z]+\b/g, '$1');
	add(simplified);

	// 3. Also strip zip code
	let noZip = simplified.replace(/\b\d{5}(-\d{4})?\b/, '');
	add(noZip);

	// 4. Strip directional qualifiers after street type (e.g., "Hwy South" → "Hwy")
	let noDir = noZip.replace(
		/\b(hwy|highway|dr|drive|st|street|ave|avenue|blvd|boulevard|rd|road|ln|lane|ct|court|pl|place|way|pkwy|parkway)\s+(north|south|east|west|n|s|e|w|ne|nw|se|sw)\b/gi,
		'$1'
	);
	add(noDir);

	// 5. Commas removed entirely (space-separated) as a last resort
	add(noDir.replace(/,/g, ' '));

	return variants;
}

async function throttledFetch(url: string): Promise<Response> {
	const now = Date.now();
	const elapsed = now - lastRequestTime;
	if (elapsed < 1100) {
		await new Promise((r) => setTimeout(r, 1100 - elapsed));
	}
	lastRequestTime = Date.now();
	return fetch(url, { headers: { 'User-Agent': 'MidpointCalc/1.0' } });
}

export async function geocode(query: string): Promise<GeocodedAddress | null> {
	const variants = normalizeAddress(query);

	for (const q of variants) {
		const url = new URL('https://nominatim.openstreetmap.org/search');
		url.searchParams.set('q', q);
		url.searchParams.set('format', 'jsonv2');
		url.searchParams.set('limit', '1');
		url.searchParams.set('countrycodes', 'us');

		const res = await throttledFetch(url.toString());
		if (!res.ok) continue;

		const data = await res.json();
		if (!data.length) continue;

		const result = data[0];
		return {
			query,
			displayName: result.display_name,
			coords: {
				lat: parseFloat(result.lat),
				lon: parseFloat(result.lon)
			}
		};
	}

	return null;
}
