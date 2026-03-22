<script lang="ts">
	import type { MidpointMode } from '$lib/types';

	interface Props {
		onsubmit: (addressA: string, addressB: string, mode: MidpointMode, radius: number) => void;
		loading: boolean;
		initialAddressA?: string;
		initialAddressB?: string;
		initialMode?: MidpointMode;
		initialRadius?: number;
	}

	let {
		onsubmit,
		loading,
		initialAddressA = '',
		initialAddressB = '',
		initialMode = 'geometric',
		initialRadius = 3000
	}: Props = $props();

	let addressA = $state('');
	let addressB = $state('');
	let mode = $state<MidpointMode>('geometric');
	let radius = $state(3000);
	let initialized = $state(false);

	$effect(() => {
		if (!initialized && (initialAddressA || initialAddressB)) {
			addressA = initialAddressA;
			addressB = initialAddressB;
			mode = initialMode;
			radius = initialRadius;
			initialized = true;
		}
	});

	let radiusKm = $derived((radius / 1000).toFixed(1));

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (addressA.trim() && addressB.trim()) {
			onsubmit(addressA.trim(), addressB.trim(), mode, radius);
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<div>
		<label for="address-a" class="block text-sm font-medium text-gray-700 mb-1">Address A</label>
		<input
			id="address-a"
			type="text"
			bind:value={addressA}
			placeholder="e.g. New York, NY"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
			disabled={loading}
		/>
	</div>

	<div>
		<label for="address-b" class="block text-sm font-medium text-gray-700 mb-1">Address B</label>
		<input
			id="address-b"
			type="text"
			bind:value={addressB}
			placeholder="e.g. Los Angeles, CA"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
			disabled={loading}
		/>
	</div>

	<div class="flex gap-3">
		<div class="flex-1">
			<label for="mode" class="block text-sm font-medium text-gray-700 mb-1">Mode</label>
			<select
				id="mode"
				bind:value={mode}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
				disabled={loading}
			>
				<option value="geometric">Geometric</option>
				<option value="drivetime">Drive Time</option>
			</select>
		</div>
		<div class="flex-1">
			<label for="radius" class="block text-sm font-medium text-gray-700 mb-1">
				POI Radius: {radiusKm} km
			</label>
			<input
				id="radius"
				type="range"
				bind:value={radius}
				min="500"
				max="10000"
				step="500"
				class="w-full mt-1.5"
				disabled={loading}
			/>
		</div>
	</div>

	<button
		type="submit"
		disabled={loading || !addressA.trim() || !addressB.trim()}
		class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
	>
		{#if loading}
			<span class="inline-flex items-center gap-2">
				<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/>
				</svg>
				Finding midpoint...
			</span>
		{:else}
			Find Midpoint
		{/if}
	</button>
</form>
