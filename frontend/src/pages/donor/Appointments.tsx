import { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin, Navigation, ArrowRight, X } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Card, EmptyState, Skeleton, StatusBadge, PageHeader } from "../../components/ui";
import InteractiveMap from "../../components/InteractiveMap";

const CENTER_COORDS: Record<string, [number, number]> = {
  "Centre CNTS Dakar": [14.6850, -17.4580],
  "Antenne Thiès": [14.7928, -16.9255],
  "Antenne Saint-Louis": [16.0326, -16.4818],
  "Hôpital Principal": [14.6640, -17.4330],
  "Hôpital de Fann": [14.6912, -17.4645],
  "Antenne Ziguinchor": [12.5680, -16.2733],
};

const HOSPITAL_IMAGES = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=400&auto=format&fit=crop"
];

const getImageForPoint = (id: number) => HOSPITAL_IMAGES[id % HOSPITAL_IMAGES.length];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Appointments() {
  const toast = useToast();
  const pointsApi = useApi(() => api.collectionPoints(), []);
  const apptsApi  = useApi(() => api.myAppointments(), []);

  const [activeTab, setActiveTab] = useState<"book" | "list">("book");
  const [pointId, setPointId] = useState<number | "">("");
  const [dateStr, setDateStr] = useState<string>("");
  const [timeStr, setTimeStr] = useState<string>("");
  const [saving, setSaving] = useState(false);
  // Default position: Rufisque (Fallback if GPS is blocked)
  const [userPos, setUserPos] = useState<[number, number]>([14.7126, -17.2721]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      // 1. First attempt: High accuracy (GPS) with longer timeout
      navigator.geolocation.getCurrentPosition(
        (position) => setUserPos([position.coords.latitude, position.coords.longitude]),
        (error) => {
          console.warn("GPS lock failed, falling back to network location:", error);
          // 2. Fallback: Network location (Wi-Fi/Cellular), much faster and more reliable indoors
          navigator.geolocation.getCurrentPosition(
            (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
            (err) => {
              console.error("Total geolocation failure:", err);
              toast.error("Impossible d'obtenir votre position exacte. Utilisation de la ville par défaut.");
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const displayPoints = (pointsApi.data || []).map(p => {
    let coords = CENTER_COORDS[p.nom];
    if (!coords) {
      if (p.localisation.includes("Thiès")) coords = [14.7928, -16.9255];
      else if (p.localisation.includes("Saint-Louis")) coords = [16.0326, -16.4818];
      else coords = [14.6850, -17.4580];
    }
    const dist = getDistance(userPos[0], userPos[1], coords[0], coords[1]);
    return {
      ...p,
      distance: dist,
      coords: coords,
      status: "Ouvert",
      hours: p.horaires || "08:00 - 18:00",
      letter: ""
    };
  }).sort((a, b) => a.distance - b.distance).map((p, i) => ({ ...p, letter: String.fromCharCode(65 + i) }));

  const selectedPoint = displayPoints.find(p => p.id === pointId);
  const pointName = (id: number) => pointsApi.data?.find((p) => p.id === id)?.nom ?? `#${id}`;

  const todayStr = new Date().toISOString().split("T")[0];
  const isComplete = pointId !== "" && dateStr !== "" && timeStr !== "";

  const handleOpenMaps = () => {
    if (!selectedPoint) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userPos[0]},${userPos[1]}&destination=${selectedPoint.coords[0]},${selectedPoint.coords[1]}`;
    window.open(url, "_blank");
  };

  async function submit() {
    if (!isComplete) return toast.error("Complétez tous les choix.");
    setSaving(true);
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hh, mm] = timeStr.split(":").map(Number);
      const d = new Date(year, month - 1, day, hh, mm, 0);
      
      await api.createAppointment({ collection_point_id: pointId as number, date: d.toISOString() });
      toast.success("Rendez-vous planifié avec succès.");
      apptsApi.reload();
      setActiveTab("list");
      setPointId("");
      setDateStr("");
      setTimeStr("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally { setSaving(false); }
  }

  return (
    <div className="pb-10 relative">
      
      {/* TABS (Segmented Control) - ALWAYS AT THE TOP */}
      <div 
        className="relative z-10 flex items-center p-1 rounded-2xl mx-auto border transition-all duration-500 w-full shadow-sm mb-6"
        style={{ 
          background: "var(--surface)", 
          borderColor: "var(--line)"
        }}
      >
        <button
          onClick={() => setActiveTab("book")}
          className="flex-1 py-2.5 rounded-xl font-bold text-[13px] tracking-wide transition-all flex justify-center items-center gap-2"
          style={{
            background: activeTab === "book" ? "var(--bg)" : "transparent",
            color: activeTab === "book" ? "var(--txt)" : "var(--txt-mute)",
            boxShadow: activeTab === "book" ? "var(--shadow-sm)" : "none",
          }}
        >
          <MapPin size={16} /> Carte
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className="flex-1 py-2.5 rounded-xl font-bold text-[13px] tracking-wide transition-all flex justify-center items-center gap-2 relative"
          style={{
            background: activeTab === "list" ? "var(--bg)" : "transparent",
            color: activeTab === "list" ? "var(--txt)" : "var(--txt-mute)",
            boxShadow: activeTab === "list" ? "var(--shadow-sm)" : "none",
          }}
        >
          <CalendarDays size={16} /> Mes Dons
          {apptsApi.data && apptsApi.data.length > 0 && (
            <span className="absolute top-2.5 right-4 w-2 h-2 rounded-full" style={{ background: "var(--crit)" }} />
          )}
        </button>
      </div>

      {/* MAP HEADER (Modern Rounded Card) */}
      {activeTab === "book" && (
        <div className="w-full h-[40vh] relative overflow-hidden rounded-[32px] shadow-sm mb-6 border transition-all duration-500" style={{ borderColor: "var(--line)" }}>
          <InteractiveMap 
            userPos={userPos} 
            points={displayPoints} 
            selectedPointId={pointId} 
            onSelectPoint={setPointId} 
          />
        </div>
      )}

      {/* HEADER FOR LIST VIEW */}
      {activeTab === "list" && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4">
          <PageHeader title="Mes Rendez-vous" subtitle="Historique et planifications" icon={CalendarDays} />
        </div>
      )}

      {/* ── MAP VIEW CONTENT ── */}
      {activeTab === "book" && (
        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          {!selectedPoint ? (
            // CAROUSEL
            <div className="w-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-bold text-xl" style={{ color: "var(--txt)" }}>Centres à proximité</h2>
                <span className="mono text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--txt-mute)" }}>Swipez &rarr;</span>
              </div>
              
              {pointsApi.loading ? (
                <Skeleton className="h-48 w-full rounded-[24px]" />
              ) : (
                <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory no-scrollbar pb-6 -mx-4 px-4">
                  {displayPoints.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPointId(p.id)}
                      className="snap-center shrink-0 w-[260px] rounded-[24px] p-3 cursor-pointer text-left transition-transform hover:scale-95 shadow-lg group border"
                      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
                    >
                      <div className="h-28 rounded-[16px] mb-3 overflow-hidden relative border" style={{ borderColor: "var(--line)" }}>
                        <img src={getImageForPoint(p.id)} alt={p.nom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
                          <Navigation size={10} style={{ color: "var(--blood)" }} />
                          <span className="mono text-[10px] font-bold" style={{ color: "var(--txt)" }}>{p.distance.toFixed(1)} km</span>
                        </div>
                      </div>
                      
                      <h3 className="font-extrabold text-[15px] leading-tight mb-1 truncate px-1" style={{ color: "var(--txt)" }}>{p.nom}</h3>
                      <p className="mono text-[10px] mb-4 flex items-center gap-2 px-1" style={{ color: "var(--txt-mute)" }}>
                        <Clock size={10} /> {p.hours} <span style={{ color: "var(--ok)", fontWeight: "bold" }}>• {p.status}</span>
                      </p>
                      
                      <span className="w-full py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                              style={{ background: "var(--bg)", color: "var(--txt)", border: "1px solid var(--line)" }}>
                        Y aller <ArrowRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // BOTTOM SHEET STYLE FORM
            <div className="animate-in zoom-in-95 duration-500 rounded-[32px] p-5 shadow-2xl border relative overflow-hidden"
                 style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
              
              {/* Close Button */}
              <button onClick={() => setPointId("")} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center border transition-transform hover:scale-110"
                      style={{ background: "var(--bg)", borderColor: "var(--line)", color: "var(--txt)" }}>
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-3 pr-10">
                <button 
                  onClick={handleOpenMaps}
                  className="mono text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm border"
                  style={{ background: "color-mix(in srgb, var(--blood) 15%, transparent)", borderColor: "color-mix(in srgb, var(--blood) 30%, transparent)", color: "var(--blood)" }}
                  title="Démarrer l'itinéraire dans Maps"
                >
                  <Navigation size={12} fill="currentColor" /> {selectedPoint.distance.toFixed(1)} km
                </button>
                <span className="mono text-[10px] font-bold px-2 py-1.5 rounded-lg border"
                      style={{ background: "color-mix(in srgb, var(--ok) 10%, transparent)", borderColor: "color-mix(in srgb, var(--ok) 20%, transparent)", color: "var(--ok)" }}>
                  {selectedPoint.status}
                </span>
              </div>
              
              <h2 className="font-extrabold text-2xl leading-tight mb-6" style={{ color: "var(--txt)" }}>{selectedPoint.nom}</h2>

              {/* Form Grid */}
              <div className="rounded-[20px] p-1.5 flex gap-1.5 mb-6 border shadow-inner" style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
                 <div className="flex-1 rounded-[16px] p-3 border" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
                   <label htmlFor="appt-date" className="flex items-center gap-1.5 mb-1.5">
                     <CalendarDays size={12} style={{ color: "var(--blood)" }} />
                     <span className="mono text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--txt-mute)" }}>Date</span>
                   </label>
                   <input
                      id="appt-date"
                      type="date" min={todayStr} value={dateStr} onChange={e => setDateStr(e.target.value)}
                      className="bg-transparent font-bold text-sm outline-none w-full appearance-none cursor-pointer"
                      style={{ color: "var(--txt)" }}
                   />
                 </div>
                 <div className="w-px my-2" style={{ background: "var(--line)" }} />
                 <div className="flex-1 rounded-[16px] p-3 border" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
                   <label htmlFor="appt-time" className="flex items-center gap-1.5 mb-1.5">
                     <Clock size={12} style={{ color: "var(--blood)" }} />
                     <span className="mono text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--txt-mute)" }}>Heure</span>
                   </label>
                   <input
                      id="appt-time"
                      type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)}
                      className="bg-transparent font-bold text-sm outline-none w-full appearance-none cursor-pointer"
                      style={{ color: "var(--txt)" }}
                   />
                 </div>
              </div>

              <button 
                onClick={submit} 
                disabled={saving || !isComplete}
                className="w-full h-14 rounded-[16px] font-extrabold uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2"
                style={{
                  background: isComplete ? "var(--blood)" : "var(--bg)",
                  color: isComplete ? "white" : "var(--txt-mute)",
                  border: isComplete ? "none" : `1px dashed var(--line)`,
                  boxShadow: isComplete ? "0 8px 25px rgba(206,51,65,0.3)" : "none",
                  opacity: saving ? 0.7 : 1,
                  transform: saving ? "scale(0.98)" : "scale(1)"
                }}
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirmation...</>
                ) : isComplete ? (
                  <><CalendarDays size={16}/> Confirmer mon don</>
                ) : (
                  "Choisissez date & heure"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW CONTENT ── */}
      {activeTab === "list" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 mt-2">
          {apptsApi.loading ? (
            <>
               <Skeleton className="h-24 rounded-[24px]" />
               <Skeleton className="h-24 rounded-[24px]" />
            </>
          ) : !apptsApi.data?.length ? (
            <Card>
              <EmptyState message="Aucun rendez-vous planifié." />
            </Card>
          ) : (
            apptsApi.data.map((a, idx) => {
              const dateObj = new Date(a.date);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-[24px] p-3 pr-5 transition-all duration-300 hover:shadow-lg group border shadow-sm"
                  style={{ 
                    background: "var(--surface)", 
                    borderColor: "var(--line)",
                    animationDelay: `${Math.min(idx * 40, 400)}ms` 
                  }}
                >
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-[18px] shrink-0 transition-transform duration-300 group-hover:scale-105 border"
                       style={{ background: "color-mix(in srgb, var(--blood) 10%, var(--surface))", borderColor: "color-mix(in srgb, var(--blood) 20%, var(--surface))" }}>
                    <span className="mono text-[9px] uppercase font-bold tracking-widest" style={{ color: "var(--blood)" }}>
                      {dateObj.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-[22px] font-extrabold leading-none mt-1" style={{ color: "var(--txt)" }}>
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] truncate mb-1" style={{ color: "var(--txt)" }}>
                      {pointName(a.collection_point_id)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: "var(--txt-mute)" }} />
                      <span className="mono text-[11px] font-bold" style={{ color: "var(--txt-mute)" }}>
                        {dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <StatusBadge statut={a.statut} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
