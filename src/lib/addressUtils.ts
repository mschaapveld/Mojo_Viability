/**
 * Extract suburb/town from a formatted Australian address
 * Handles Google Places formatted addresses like "123 Main Street, Sydney NSW 2000, Australia"
 */
export function extractSuburbFromAddress(address: string): string | null {
  if (!address) return null;

  const parts = address.split(',').map(part => part.trim());

  if (parts.length >= 2) {
    const secondLastPart = parts[parts.length - 2];
    const suburbStatePart = secondLastPart.split(/\s+/);

    if (suburbStatePart.length > 0) {
      const possibleStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
      const lastWord = suburbStatePart[suburbStatePart.length - 1];

      if (possibleStates.includes(lastWord)) {
        return suburbStatePart.slice(0, -1).join(' ') || null;
      }

      if (/^\d{4}$/.test(lastWord) && suburbStatePart.length >= 2) {
        const secondLastWord = suburbStatePart[suburbStatePart.length - 2];
        if (possibleStates.includes(secondLastWord)) {
          return suburbStatePart.slice(0, -2).join(' ') || null;
        }
        return suburbStatePart.slice(0, -1).join(' ') || null;
      }

      return secondLastPart;
    }
  }

  return null;
}

/**
 * Extract suburb and state from a formatted Australian address
 * Returns "Suburb State" format (e.g., "Port Macquarie NSW")
 * Handles Google Places formatted addresses like "123 Main Street, Sydney NSW 2000, Australia"
 */
export function extractSuburbAndState(address: string): string {
  if (!address) return 'Location not specified';

  const parts = address.split(',').map(part => part.trim());

  if (parts.length >= 2) {
    const secondLastPart = parts[parts.length - 2];
    const suburbStatePart = secondLastPart.split(/\s+/);

    if (suburbStatePart.length > 0) {
      const possibleStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
      const lastWord = suburbStatePart[suburbStatePart.length - 1];

      if (possibleStates.includes(lastWord)) {
        const suburb = suburbStatePart.slice(0, -1).join(' ');
        return suburb ? `${suburb} ${lastWord}` : 'Location not specified';
      }

      if (/^\d{4}$/.test(lastWord) && suburbStatePart.length >= 2) {
        const secondLastWord = suburbStatePart[suburbStatePart.length - 2];
        if (possibleStates.includes(secondLastWord)) {
          const suburb = suburbStatePart.slice(0, -2).join(' ');
          return suburb ? `${suburb} ${secondLastWord}` : 'Location not specified';
        }
      }
    }
  }

  return 'Location not specified';
}

/**
 * Get town/suburb from Google Places Autocomplete result
 * Extracts locality (suburb) from place details
 */
export async function getTownFromPlace(place: google.maps.places.PlaceResult): Promise<string | null> {
  if (!place.address_components) {
    return extractSuburbFromAddress(place.formatted_address || '');
  }

  const localityComponent = place.address_components.find(component =>
    component.types.includes('locality')
  );

  if (localityComponent) {
    return localityComponent.long_name;
  }

  const suburbComponent = place.address_components.find(component =>
    component.types.includes('sublocality') ||
    component.types.includes('sublocality_level_1')
  );

  if (suburbComponent) {
    return suburbComponent.long_name;
  }

  return extractSuburbFromAddress(place.formatted_address || '');
}

/**
 * Fetch place details using Google Places API to get detailed address components
 */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<string | null> {
  if (!placeId || !apiKey) return null;

  try {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    );

    return new Promise((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: ['address_components', 'formatted_address']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            getTownFromPlace(place).then(resolve);
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}
