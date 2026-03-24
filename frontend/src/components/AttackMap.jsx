import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "../App.jsx";

// Custom dark satellite icon with pulsed effect
const createMarkerIcon = (color) => new L.DivIcon({
  className: "custom-div-icon",
  html: `<div class="relative h-6 w-6 -left-1 -top-1">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-${color}-400 opacity-40"></span>
          <span class="relative inline-flex h-3 w-3 m-1.5 rounded-full bg-${color}-500 border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></span>
        </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const threatIcon = createMarkerIcon('red');
const infoIcon = createMarkerIcon('emerald');

function MapUpdater({ lastPoint }) {
  const map = useMap();
  React.useEffect(() => {
    if (lastPoint && lastPoint.lat && lastPoint.lng) {
      map.flyTo([lastPoint.lat, lastPoint.lng], 5, {
        duration: 2.5,
        easeLinearity: 0.25
      });
    }
  }, [lastPoint, map]);
  return null;
}

export function AttackMap({ points = [] }) {
  const [livePings, setLivePings] = React.useState([]);

  React.useEffect(() => {
    const handleAlert = (ping) => {
      setLivePings((prev) => [...prev.slice(-9), { ...ping, id: Math.random() }]);
    };
    socket.on("security_alert", handleAlert);
    return () => socket.off("security_alert", handleAlert);
  }, []);

  // Normalize historical points and live pings
  const normalizedPoints = [
    ...points.map((p, i) => ({
      lat: p.lat,
      lng: p.lng,
      city: p._id,
      country: p.country,
      count: p.count,
      riskLevel: p.riskLevel,
      isLive: false,
      id: `hist-${i}`
    })),
    ...livePings.map(lp => ({
      lat: lp.location?.coordinates?.lat,
      lng: lp.location?.coordinates?.lng,
      city: lp.location?.city,
      country: lp.location?.country,
      type: lp.action,
      riskLevel: lp.risk,
      isLive: true,
      id: lp.id,
      travelMetrics: lp.travelMetrics
    }))
  ];

  // Extract travel lines for visualization
  const travelLines = normalizedPoints
    .filter(pt => pt.travelMetrics?.isImpossible && pt.travelMetrics.prevLocation)
    .map(pt => {
      // Note: Historical seed might have prevLocation but we need coords.
      // For this demo, we'll try to find the prev location in the points array or fallback.
      const prev = points.find(p => p._id === pt.travelMetrics.prevLocation.city) || 
                   { lat: pt.lat - 5, lng: pt.lng - 10 }; // Fallback offset for demo
      return {
        from: [prev.lat, prev.lng],
        to: [pt.lat, pt.lng],
        metrics: pt.travelMetrics
      };
    });

  return (
    <div className="relative h-[540px] w-full overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Map Container - ONLY Leaflet components should be direct children! */}
      <MapContainer
        center={[20, 0]}
        zoom={2.5}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        {normalizedPoints.map((pt) => {
          if (!pt.lat || !pt.lng) return null;
          const isThreat = pt.riskLevel === 'CRITICAL' || pt.riskLevel === 'HIGH' || pt.riskLevel === 'MEDIUM';
          
          return (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              icon={isThreat ? threatIcon : infoIcon}
            >
              <Popup className="custom-popup border-none p-0">
                <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-700 shadow-2xl min-w-[150px]">
                  <p className="uppercase tracking-[0.2em] text-[8px] font-black text-emerald-500 mb-2">
                    {pt.isLive ? 'Live Intercept' : `${pt.count} Historical Events`}
                  </p>
                  <p className="text-xs font-bold">{pt.city}, {pt.country}</p>
                  {pt.type && <p className="mt-1 text-[10px] text-red-400 font-mono">{pt.type}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {travelLines.map((line, idx) => (
          <Polyline
            key={`line-${idx}`}
            positions={[line.from, line.to]}
            pathOptions={{
              color: '#ef4444',
              weight: 2,
              dashArray: '10, 10',
              className: 'animate-dash'
            }}
          >
            <Popup>
              <div className="p-2 text-[10px] font-bold text-red-600 bg-white rounded shadow">
                ⚠️ IMPOSSIBLE TRAVEL: {line.metrics.speedKmh} km/h
              </div>
            </Popup>
          </Polyline>
        ))}

        <MapUpdater lastPoint={livePings[livePings.length - 1]?.location?.coordinates} />
      </MapContainer>

      {/* Cyber HUD Elements - MOVED OUTSIDE MapContainer */}
      <div className="absolute inset-0 z-[1000] pointer-events-none">
        {/* Dark Overlay Layer */}
        <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay" />
        
        {/* HUD Elements */}
        <div className="absolute inset-x-8 top-8 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-xl border border-emerald-500/30 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">Live Surveillance Active</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <AnimatePresence>
              {livePings.slice(-3).reverse().map((ping) => (
                <motion.div
                  key={ping.id}
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  className={`flex gap-3 items-center rounded-2xl p-3 backdrop-blur-2xl border shadow-2xl min-w-[240px]
                    ${ping.risk === 'HIGH' || ping.risk === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}
                >
                  <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${ping.risk === 'HIGH' || ping.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    <span className="font-black text-xs">!</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-black text-white uppercase">{ping.action}</span>
                      <span className="text-[8px] font-mono text-slate-500">{new Date(ping.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{ping.location.city}, {ping.location.country}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex gap-4 rounded-2xl bg-slate-950/80 p-4 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-2xl border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-slate-500">Node Secure</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
               <span className="text-slate-500">Intrusion Point</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
