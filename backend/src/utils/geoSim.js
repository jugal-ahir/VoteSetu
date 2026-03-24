/**
 * Utility to get real or simulated geographic data from IP addresses.
 * Uses ipapi.co for real-world lookups.
 */
export async function getGeolocation(ip) {
  // Handle localhost/private IPs for demo
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    // Return a default "Base of Operations" (e.g., Delhi, India)
    return {
      city: "New Delhi",
      country: "India",
      coordinates: {
        lat: 28.6139,
        lng: 77.2090
      },
      region: "Delhi"
    };
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error: ${response.status} - ${text.substring(0, 50)}`);
    }

    const data = await response.json();

    if (data.error) throw new Error(data.reason);

    return {
      city: data.city || "Unknown",
      country: data.country_name || "Unknown",
      coordinates: {
        lat: data.latitude || 0,
        lng: data.longitude || 0
      },
      region: data.region || "Unknown"
    };
  } catch (err) {
    console.error(`Geolocation lookup failed for ${ip}:`, err.message);
    // Fallback to a static point if API fails
    return {
      city: "CyberSpace",
      country: "Ether",
      coordinates: {
        lat: 0,
        lng: 0
      },
      region: "None"
    };
  }
}

// Keep the old name as an alias for compatibility for now, but mark as async
export const getSimulatedLocation = getGeolocation;
