import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const userIcon = new L.DivIcon({
  html: `<div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
          <div style="width: 14px; height: 14px; background: #3b82f6; border: 3px solid white; border-radius: 50%; z-index: 10; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
         </div>`,
  className: "custom-user-icon",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const createCenterIcon = (letter: string, isSelected: boolean) => new L.DivIcon({
  html: `<div style="
            width: 36px; height: 36px; 
            background: ${isSelected ? "#e63946" : "rgba(255, 255, 255, 0.85)"}; 
            border: 2px solid ${isSelected ? "white" : "transparent"}; 
            backdrop-filter: blur(8px);
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            color: ${isSelected ? "white" : "#111827"};
            font-family: 'Syne', sans-serif;
            font-weight: 800;
            font-size: 15px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.5);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform: scale(${isSelected ? 1.15 : 1});
         ">${letter}</div>`,
  className: "custom-center-icon",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Helper component to handle map animations
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
  }, [center, zoom, map]);
  return null;
}

// Routing Component
function Routing({ source, destination }: { source: [number, number], destination: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!destination) return;

    // Use L.Routing.control to calculate and draw the real street route
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(source[0], source[1]),
        L.latLng(destination[0], destination[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#e63946', opacity: 0.9, weight: 6, className: 'animate-dash-route' }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      // Hide the default routing instructions UI and markers
      createMarker: function() { return null; },
      show: false,
    } as any).addTo(map);

    // Hide the textual itinerary container manually just in case
    const container = routingControl.getContainer();
    if (container) {
      container.style.display = 'none';
    }

    return () => {
      try {
        map.removeControl(routingControl);
      } catch (e) {
        // Ignore error on unmount
      }
    };
  }, [map, source, destination]);

  return null;
}

interface MapProps {
  userPos: [number, number];
  points: Array<{ id: number; nom: string; coords: [number, number]; letter: string; status: string; hours: string; distance: number }>;
  selectedPointId: number | "";
  onSelectPoint: (id: number) => void;
}

export default function InteractiveMap({ userPos, points, selectedPointId, onSelectPoint }: MapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(userPos);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef<L.Map | null>(null);

  // When a point is selected, zoom out a bit to show the route
  useEffect(() => {
    if (selectedPointId !== "") {
      // route control handles zooming
    } else {
      setMapCenter(userPos);
      setMapZoom(13);
      if (mapRef.current) {
        mapRef.current.flyTo(userPos, 14, { duration: 1.5 });
      }
    }
  }, [selectedPointId, userPos, points]);

  const selectedPoint = points.find(p => p.id === selectedPointId);
  
  // Vue satellite hybride (Satellite + Labels) pour tous les modes
  const tileUrl = "http://mt0.google.com/vt/lyrs=y&hl=fr&x={x}&y={y}&z={z}";

  return (
    <div className={`w-full h-[400px] rounded-[24px] overflow-hidden relative map-wrapper`} style={{ border: "1px solid var(--line)", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
      {/* Vignette Overlay for premium blended look */}
      <div className="absolute inset-0 z-1000 pointer-events-none rounded-[24px]" style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.5)" }} />

      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        zoomControl={true} 
        style={{ width: "100%", height: "100%", background: "#1f2937" }}
        ref={mapRef}
      >
        
        <TileLayer
          url={tileUrl}
          attribution='&copy; Google Maps'
          maxZoom={20}
          className="premium-satellite-tiles"
        />

        <MapController center={mapCenter} zoom={mapZoom} />

        {/* User Location */}
        <Marker position={userPos} icon={userIcon}>
          <Popup className="custom-popup">
            <div className="mono text-[10px] uppercase tracking-widest font-bold">Votre position</div>
          </Popup>
        </Marker>

        {/* Centers */}
        {points.map((p) => (
          <Marker 
            key={p.id} 
            position={p.coords} 
            icon={createCenterIcon(p.letter, p.id === selectedPointId)}
            eventHandlers={{ click: () => onSelectPoint(p.id) }}
          >
            <Popup className="custom-popup" closeButton={false} offset={[0, -12]}>
              <div className="syne font-bold text-[15px] text-black mb-1.5">{p.nom}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="mono text-[10px] font-bold" style={{ color: "var(--txt-dim)" }}>{p.distance.toFixed(1)} km</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === "Ouvert" ? "#10b981" : "#f59e0b", boxShadow: p.status === "Ouvert" ? "0 0 8px #10b981" : "none" }} />
                <span className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: p.status === "Ouvert" ? "#10b981" : "#f59e0b" }}>{p.status}</span>
              </div>
              <div className="mono text-[10px] font-medium" style={{ color: "var(--txt-mute)" }}>{p.hours}</div>
            </Popup>
          </Marker>
        ))}

        {/* Real Street Route */}
        <Routing source={userPos} destination={selectedPoint ? selectedPoint.coords : null} />

      </MapContainer>

      {/* Button to center on user */}
      <button 
        onClick={() => mapRef.current?.flyTo(userPos, 14, { duration: 1.5 })}
        className="absolute bottom-6 right-6 z-1001 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-110"
        style={{
          background: "rgba(30,30,30,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          color: "white"
        }}
        title="Centrer sur ma position"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>

      {/* Embedded CSS for custom styling */}
      <style>{`
        .leaflet-container { font-family: inherit; z-index: 1; }
        
        /* Premium Filter for Satellite Tiles */
        .premium-satellite-tiles {
          filter: contrast(1.15) saturate(1.2) brightness(0.95);
        }
        
        /* Modern Map Controls (Glassmorphic) */
        .leaflet-control-zoom { border: none !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; margin-top: 20px !important; margin-left: 20px !important; }
        .leaflet-control-zoom a { 
          background: rgba(30,30,30,0.6) !important; 
          backdrop-filter: blur(12px) !important;
          color: white !important; 
          border-radius: 12px !important; 
          width: 40px !important; 
          height: 40px !important; 
          line-height: 40px !important; 
          font-size: 18px !important; 
          font-weight: bold !important; 
          border: 1px solid rgba(255,255,255,0.15) !important; 
          margin-bottom: 6px !important; 
          transition: all 0.3s ease !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(50,50,50,0.8) !important;
        }
        
        .custom-popup .leaflet-popup-content-wrapper { 
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          border-radius: 20px; 
          box-shadow: 0 15px 35px rgba(0,0,0,0.25); 
          border: 1px solid rgba(255,255,255,0.4);
        }
        .custom-popup .leaflet-popup-tip { display: none; }
        .custom-popup .leaflet-popup-content { margin: 16px 20px; }
        
        /* Hide the default routing instructions box */
        .leaflet-routing-container { display: none !important; }
        
        /* Animate the route dashed line */
        .animate-dash-route {
          stroke-dasharray: 10, 15;
          animation: dash 1.5s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -25; }
        }
      `}</style>
    </div>
  );
}
