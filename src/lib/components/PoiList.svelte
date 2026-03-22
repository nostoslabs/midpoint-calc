<script lang="ts">
	import type { PointOfInterest } from '$lib/types';

	interface Props {
		pois: PointOfInterest[];
		loading: boolean;
		onselect?: (poi: PointOfInterest) => void;
	}

	let { pois, loading, onselect }: Props = $props();

	const typeIcons: Record<string, string> = {
		restaurant: 'M',
		cafe: 'C',
		bar: 'B'
	};

	const typeColors: Record<string, string> = {
		restaurant: 'bg-orange-100 text-orange-700',
		cafe: 'bg-amber-100 text-amber-700',
		bar: 'bg-purple-100 text-purple-700'
	};
</script>

{#if loading}
	<div class="py-4 text-sm text-gray-500 text-center">Loading nearby places...</div>
{:else if pois.length > 0}
	<div class="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
		{#each pois as poi}
			<button
				type="button"
				class="flex items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer"
				onclick={() => onselect?.(poi)}
			>
				<span
					class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold {typeColors[poi.type] || 'bg-gray-100 text-gray-600'}"
				>
					{typeIcons[poi.type] || '?'}
				</span>
				<div class="min-w-0">
					<div class="text-sm font-medium text-gray-900 truncate">{poi.name}</div>
					{#if poi.address}
						<div class="text-xs text-gray-500 truncate">{poi.address}</div>
					{/if}
					<div class="text-xs text-gray-400 capitalize">{poi.type}</div>
				</div>
			</button>
		{/each}
	</div>
{/if}
