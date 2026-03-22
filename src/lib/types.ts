export interface Coordinates {
	lat: number;
	lon: number;
}

export interface GeocodedAddress {
	query: string;
	displayName: string;
	coords: Coordinates;
}

export interface PointOfInterest {
	name: string;
	type: string;
	coords: Coordinates;
	address?: string;
}

export type MidpointMode = 'geometric' | 'drivetime';

export interface RouteInfo {
	totalDuration: number;
	totalDistance: number;
	geometry: GeoJSON.LineString;
}

export interface MidpointResult {
	addressA: GeocodedAddress;
	addressB: GeocodedAddress;
	midpoint: Coordinates;
	mode: MidpointMode;
	route?: RouteInfo;
	pois: PointOfInterest[];
	mapUrl: string;
}
