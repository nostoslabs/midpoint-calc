<script lang="ts">
	import { browser } from '$app/environment';
	import type { Coordinates } from '$lib/types';
	import type L from 'leaflet';

	interface MarkerData {
		coords: Coordinates;
		label: string;
		color: 'blue' | 'red' | 'gray';
	}

	interface Props {
		markers?: MarkerData[];
		routeGeometry?: GeoJSON.LineString | null;
	}

	let { markers = [], routeGeometry = null }: Props = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	let mapInstance = $state<L.Map | undefined>();
	let leaflet = $state<typeof import('leaflet') | undefined>();
	let markerLayer = $state<L.LayerGroup | undefined>();
	let routeLayer: L.GeoJSON | undefined;

	function createIcon(Lib: typeof import('leaflet'), color: string) {
		const colors: Record<string, string> = {
			blue: '#3b82f6',
			red: '#ef4444',
			gray: '#6b7280'
		};
		const fill = colors[color] || colors.blue;

		return Lib.divIcon({
			className: '',
			iconSize: [28, 40],
			iconAnchor: [14, 40],
			popupAnchor: [0, -42],
			html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${fill}"/>
				<circle cx="14" cy="14" r="6" fill="white"/>
			</svg>`
		});
	}

	$effect(() => {
		if (!browser || !mapContainer) return;

		let destroyed = false;

		import('leaflet').then((L) => {
			if (destroyed) return;
			leaflet = L;

			mapInstance = L.map(mapContainer!, { zoomControl: true }).setView([39.8283, -98.5795], 4);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(mapInstance);

			markerLayer = L.layerGroup().addTo(mapInstance);
		});

		return () => {
			destroyed = true;
			mapInstance?.remove();
			mapInstance = undefined;
			leaflet = undefined;
			markerLayer = undefined;
		};
	});

	$effect(() => {
		if (!leaflet || !mapInstance || !markerLayer) return;

		const L = leaflet;
		markerLayer.clearLayers();

		if (markers.length === 0) return;

		for (const m of markers) {
			const icon = createIcon(L, m.color);
			L.marker([m.coords.lat, m.coords.lon], { icon })
				.bindPopup(`<strong>${m.label}</strong>`)
				.addTo(markerLayer);
		}

		const bounds = L.latLngBounds(
			markers.map((m) => [m.coords.lat, m.coords.lon] as [number, number])
		);
		mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
	});

	// Route polyline
	$effect(() => {
		if (!leaflet || !mapInstance) return;

		if (routeLayer) {
			mapInstance.removeLayer(routeLayer);
			routeLayer = undefined;
		}

		if (routeGeometry) {
			routeLayer = leaflet
				.geoJSON(routeGeometry, {
					style: { color: '#3b82f6', weight: 4, opacity: 0.7 }
				})
				.addTo(mapInstance);
		}
	});
</script>

<div bind:this={mapContainer} class="w-full h-full min-h-[400px] rounded-lg z-0"></div>
