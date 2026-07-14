import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { useTheme } from "../lib/theme";
import { Layers, LocateFixed, Map as MapIcon } from "lucide-react";

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const userIcon = new L.DivIcon({
  html: `<div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 60px; height: 60px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
         </div>`,
  className: "custom-user-icon",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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
  const theme = useTheme();

  useEffect(() => {
    if (!destination) return;

    // Use L.Routing.control to calculate and draw the real street route
    const routingControl = L.Routing.control({
      plan: L.Routing.plan([
        L.latLng(source[0], source[1]),
        L.latLng(destination[0], destination[1])
      ], {
        createMarker: function() { return false; }
      }),
      router: new L.Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
        routingOptions: {
          overview: 'full'
        }
      }),
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: false, // We will handle fitting manually
      showAlternatives: false,
      lineOptions: {
        styles: [
          // Glowing outline
          { color: 'rgba(59, 130, 246, 0.4)', opacity: 1, weight: 12 },
          // Border
          { color: theme.mode === 'dark' ? '#000' : '#fff', opacity: 0.8, weight: 8 },
          // Inner glowing line (GPS style)
          { color: '#3b82f6', opacity: 1, weight: 5 }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      show: false,
    } as any).addTo(map);

    routingControl.on('routesfound', function(e: any) {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        // Instead of fitting the whole bounds (which zooms out and hides small streets),
        // we zoom closely to the user's position to show the street-level GPS view!
        map.flyTo([source[0], source[1]], 16, {
          animate: true,
          duration: 1.5
        });
      }
    });

    const container = routingControl.getContainer();
    if (container) {
      container.style.display = 'none';
    }

    return () => {
      try {
        map.removeControl(routingControl);
      } catch (e) {
        // Ignore error
      }
    };
  }, [map, source, destination, theme.mode]);

  return null;
}

interface MapProps {
  userPos: [number, number];
  points: Array<{ id: number; nom: string; coords: [number, number]; letter: string; status: string; hours: string; distance: number }>;
  selectedPointId: number | "";
  onSelectPoint: (id: number) => void;
}

export default function InteractiveMap({ userPos, points, selectedPointId, onSelectPoint }: MapProps) {
  const { mode } = useTheme();
  const [mapCenter, setMapCenter] = useState<[number, number]>(userPos);
  const [mapZoom, setMapZoom] = useState(13);
  const [isSatellite, setIsSatellite] = useState(false);
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
  
  // Using Google Maps tiles to get rich Points of Interest (POIs) and landmarks
  // lyrs=m is roadmap, lyrs=s is satellite
  const tileUrl = isSatellite 
    ? "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    : "https://mt1.google.com/vt/lyrs=m&hl=fr&x={x}&y={y}&z={z}";

  const mapBg = mode === "dark" ? "#222" : "#f8fafc";
  const vignetteShadow = mode === "dark" 
    ? "inset 0 0 100px rgba(0,0,0,0.9)" 
    : "inset 0 0 60px rgba(255,255,255,0.4)";

  return (
    <div className={`w-full h-full relative map-wrapper rounded-[24px] overflow-hidden`}>
      {/* Vignette Overlay for premium blended look */}
      <div className="absolute inset-0 z-1000 pointer-events-none rounded-[24px]" style={{ boxShadow: vignetteShadow }} />

      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        zoomControl={false} 
        style={{ width: "100%", height: "100%", background: mapBg }}
        ref={mapRef}
      >
        
        <TileLayer
          url={tileUrl}
          attribution='&copy; CARTO'
          maxZoom={20}
          className={!isSatellite && mode === "dark" ? "premium-dark-tiles" : !isSatellite ? "premium-light-tiles" : ""}
        />

        <MapController center={mapCenter} zoom={mapZoom} />

        {/* User Location */}
        <Marker position={userPos} icon={userIcon}>
          <Popup className="custom-popup" closeButton={false} offset={[0, -15]}>
            <div className="mono text-[10px] uppercase tracking-widest font-bold text-center" style={{ color: "var(--txt)" }}>
              Votre position
            </div>
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
              <div className="font-bold text-[15px] text-black mb-1.5">{p.nom}</div>
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

      {/* Satellite Toggle Button */}
      <button 
        onClick={() => setIsSatellite(!isSatellite)}
        className="absolute bottom-6 left-4 z-1001 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border"
        style={{ 
          background: "var(--surface)", 
          backdropFilter: "blur(12px)", 
          borderColor: "var(--line)",
          color: isSatellite ? "var(--blood)" : "var(--txt)" 
        }}
        title="Changer le type de vue"
      >
        {isSatellite ? <MapIcon size={22} /> : <Layers size={22} />}
      </button>

      {/* Button to center on user */}
      <button 
        onClick={() => mapRef.current?.flyTo(userPos, 14, { duration: 1.5 })}
        className="absolute bottom-6 right-6 z-1001 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line)",
          color: "var(--blood)",
          backdropFilter: "blur(12px)"
        }}
        title="Centrer sur ma position"
      >
        <LocateFixed size={22} />
      </button>

      {/* Embedded CSS for custom styling */}
      <style>{`
        .leaflet-container { font-family: inherit; z-index: 1; }
        
        /* Premium Filter for Dark Tiles (Inverts Google Maps into a beautiful Dark Mode) */
        .premium-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%);
        }
        .premium-light-tiles {
          filter: contrast(1.02) saturate(1.05);
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
          background: var(--surface);
          backdrop-filter: blur(16px);
          border-radius: 16px; 
          box-shadow: var(--shadow-lg); 
          border: 1px solid var(--line);
        }
        .custom-popup .leaflet-popup-tip { display: none; }
        .custom-popup .leaflet-popup-content { margin: 12px 16px; }
        
        /* Hide the default routing instructions box */
        .leaflet-routing-container { display: none !important; }
        
      `}</style>
    </div>
  );
}
