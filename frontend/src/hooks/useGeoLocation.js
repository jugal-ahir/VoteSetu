import { useEffect } from "react";

export function useGeoLocation() {
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          // Store in session storage so it persists per session
          sessionStorage.setItem("user-gps", JSON.stringify(coords));
          console.log("📍 Accurate GPS Lock secured.");
        },
        (error) => {
          console.warn("📍 GPS access denied/failed:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);
}
