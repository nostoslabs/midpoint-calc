<script lang="ts">
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import { onMount } from 'svelte';
	import AddressForm from '$lib/components/AddressForm.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import PoiList from '$lib/components/PoiList.svelte';
	import type {
		Coordinates,
		GeocodedAddress,
		MidpointMode,
		MidpointResult,
		PointOfInterest,
		RouteInfo
	} from '$lib/types';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let locationA = $state<GeocodedAddress | null>(null);
	let locationB = $state<GeocodedAddress | null>(null);
	let midpoint = $state<Coordinates | null>(null);
	let pois = $state<PointOfInterest[]>([]);
	let routeInfo = $state<RouteInfo | null>(null);
	let currentMode = $state<MidpointMode>('geometric');

	// URL param initial values
	let initialA = $state('');
	let initialB = $state('');
	let initialMode = $state<MidpointMode>('geometric');
	let initialRadius = $state(3000);

	interface MarkerData {
		coords: Coordinates;
		label: string;
		color: 'blue' | 'red' | 'gray';
	}

	let markers = $derived.by(() => {
		const m: MarkerData[] = [];
		if (locationA)
			m.push({ coords: locationA.coords, label: locationA.displayName, color: 'blue' });
		if (locationB)
			m.push({ coords: locationB.coords, label: locationB.displayName, color: 'blue' });
		if (midpoint) m.push({ coords: midpoint, label: 'Midpoint', color: 'red' });
		for (const poi of pois) {
			m.push({ coords: poi.coords, label: `${poi.name} (${poi.type})`, color: 'gray' });
		}
		return m;
	});

	let routeGeometry = $derived(routeInfo?.geometry ?? null);

	async function handleSubmit(
		addressA: string,
		addressB: string,
		mode: MidpointMode,
		radius: number
	) {
		loading = true;
		error = null;
		locationA = null;
		locationB = null;
		midpoint = null;
		pois = [];
		routeInfo = null;

		try {
			const params = new URLSearchParams({
				a: addressA,
				b: addressB,
				mode,
				radius: String(radius)
			});
			const res = await fetch(`/api/midpoint?${params}`);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || 'Something went wrong');
			}
			const result: MidpointResult = await res.json();
			locationA = result.addressA;
			locationB = result.addressB;
			midpoint = result.midpoint;
			pois = result.pois;
			routeInfo = result.route ?? null;
			currentMode = result.mode;

			// Update URL bar without navigation
			const newUrl = new URL($page.url);
			newUrl.searchParams.set('a', addressA);
			newUrl.searchParams.set('b', addressB);
			newUrl.searchParams.set('mode', mode);
			newUrl.searchParams.set('radius', String(radius));
			replaceState(newUrl, {});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	function handlePoiSelect(poi: PointOfInterest) {
		// Could pan map to POI
	}

	// Auto-run from URL params on page load
	onMount(() => {
		const params = $page.url.searchParams;
		const a = params.get('a');
		const b = params.get('b');
		if (a && b) {
			initialA = a;
			initialB = b;
			initialMode = (params.get('mode') as MidpointMode) || 'geometric';
			initialRadius = parseInt(params.get('radius') || '3000');
			handleSubmit(a, b, initialMode, initialRadius);
		}
	});
</script>

<svelte:head>
	<title>Midpoint Calculator</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-gray-50">
	<header class="bg-white border-b border-gray-200 px-6 py-4">
		<h1 class="text-xl font-semibold text-gray-900">Midpoint Calculator</h1>
		<p class="text-sm text-gray-500">Find the meeting point between two addresses</p>
	</header>

	<main class="flex-1 flex flex-col lg:flex-row">
		<aside class="w-full lg:w-96 p-6 flex flex-col gap-6 bg-white lg:border-r border-gray-200">
			<AddressForm
				{loading}
				onsubmit={handleSubmit}
				initialAddressA={initialA}
				initialAddressB={initialB}
				{initialMode}
				{initialRadius}
			/>

			{#if error}
				<div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			{/if}

			{#if midpoint}
				<div class="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
					<div class="text-sm font-medium text-green-800">Midpoint found</div>
					<div class="text-xs text-green-600 mt-1">
						{midpoint.lat.toFixed(4)}, {midpoint.lon.toFixed(4)}
					</div>
					{#if routeInfo}
						<div class="text-xs text-green-600 mt-1">
							Drive: {Math.round(routeInfo.totalDuration / 60)} min ({(routeInfo.totalDistance / 1609.34).toFixed(1)} mi)
						</div>
					{/if}
				</div>
			{/if}

			{#if midpoint}
				<div>
					<h2 class="text-sm font-medium text-gray-700 mb-2">Nearby Places</h2>
					<PoiList {pois} loading={false} onselect={handlePoiSelect} />
					{#if pois.length === 0}
						<p class="text-xs text-gray-400">No places found near the midpoint.</p>
					{/if}
				</div>
			{/if}
		</aside>

		<div class="flex-1 min-h-[400px] lg:min-h-0">
			<MapView {markers} {routeGeometry} />
		</div>
	</main>

	<footer class="bg-white border-t border-gray-200 px-6 py-3 text-xs text-gray-400">
		Geocoding by <a href="https://nominatim.openstreetmap.org/" class="underline">Nominatim</a> |
		Map data &copy;
		<a href="https://www.openstreetmap.org/copyright" class="underline">OpenStreetMap</a>
		contributors
		{#if routeInfo}
			| Routing by <a href="https://project-osrm.org/" class="underline">OSRM</a>
		{/if}
	</footer>
</div>
