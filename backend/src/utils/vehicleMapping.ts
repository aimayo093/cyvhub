/**
 * CYVhub Vehicle Mapping Utility
 * Normalizes vehicle type strings between Frontend (Display) and Backend (Database/Constants).
 */

export const VEHICLE_MAP: Record<string, string> = {
  // Frontend Display -> Backend Constant
  'Small Van': 'SMALL_VAN',
  'Medium Van': 'MEDIUM_VAN',
  'Large Van': 'LARGE_VAN',
  'Luton Van': 'LUTON_VAN',
  'Car': 'CAR',
  
  // URL/Slug variants
  'small_van': 'SMALL_VAN',
  'medium_van': 'MEDIUM_VAN',
  'large_van': 'LARGE_VAN',
  'luton_van': 'LUTON_VAN',
  'small-van': 'SMALL_VAN',
  'medium-van': 'MEDIUM_VAN',
  'large-van': 'LARGE_VAN',
  'luton-van': 'LUTON_VAN',

  // Self-mapping for safety
  'SMALL_VAN': 'SMALL_VAN',
  'MEDIUM_VAN': 'MEDIUM_VAN',
  'LARGE_VAN': 'LARGE_VAN',
  'LUTON_VAN': 'LUTON_VAN',
  'CAR': 'CAR',
};

/**
 * Normalizes a vehicle type string to its backend constant (e.g., 'SMALL_VAN').
 * Returns the input if no mapping is found.
 */
export function normalizeVehicleType(type: string): string {
  if (!type) return 'SMALL_VAN'; // Default fallback
  const normalized = VEHICLE_MAP[type] || VEHICLE_MAP[type.trim()];
  return normalized || type.toUpperCase().replace(/\s+/g, '_');
}

/**
 * Maps a backend constant to a human-readable display name.
 */
export function getVehicleDisplayName(type: string): string {
  const reverseMap: Record<string, string> = {
    'SMALL_VAN': 'Small Van',
    'MEDIUM_VAN': 'Medium Van',
    'LARGE_VAN': 'Large Van',
    'LUTON_VAN': 'Luton Van',
    'CAR': 'Car',
  };
  return reverseMap[type] || type;
}
