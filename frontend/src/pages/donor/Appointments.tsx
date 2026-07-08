import { useState, useEffect } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Card, EmptyState, Skeleton, StatusBadge, PageHeader } from "../../components/ui";
import InteractiveMap from "../../components/InteractiveMap";


// Known precise coordinates for Senegal blood centers
const CENTER_COORDS: Record<string, [number, number]> = {
  "Centre CNTS Dakar": [14.6850, -17.4580],
  "Antenne Thiès": [14.7928, -16.9255],
  "Antenne Saint-Louis": [16.0326, -16.4818],
  "Hôpital Principal": [14.6640, -17.4330],
  "Hôpital de Fann": [14.6912, -17.4645],
  "Antenne Ziguinchor": [12.5680, -16.2733],
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function NearbyCenters({ points, selectedPoint, onSelect }: { points: any[], selectedPoint: number | "", onSelect: (id: number) => void }) {
  if (!points || points.length === 0) return null;

  const [userPos, setUserPos] = useState<[number, number]>([14.6715, -17.4332]); // Dakar Plateau fallback

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPos([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation denied or failed, using fallback:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Calculate real distances and sort
  const displayPoints = points.map(p => {
    // Try to find exact match, otherwise create a mock coord based on city name or fallback
    let coords = CENTER_COORDS[p.nom];
    if (!coords) {
      if (p.localisation.includes("Thiès")) coords = [14.7928, -16.9255];
      else if (p.localisation.includes("Saint-Louis")) coords = [16.0326, -16.4818];
      else coords = [14.6850, -17.4580]; // Default to Dakar if unknown
    }
    
    const dist = getDistance(userPos[0], userPos[1], coords[0], coords[1]);
    
    return {
      ...p,
      distance: dist,
      coords: coords,
      // For UX: keep 'Ouvert' for close ones, logic can be tied to hours later
      status: "Ouvert",
      hours: p.horaires || "08:00 - 18:00"
    };
  })
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 3)
  .map((p, i) => ({
    ...p,
    letter: String.fromCharCode(65 + i)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="syne font-extrabold text-2xl tracking-tight" style={{ color: "var(--txt)" }}>Centres à proximité</h2>
        <p className="mono text-[11px] uppercase tracking-widest mt-1" style={{ color: "var(--txt-mute)" }}>Rayon calculé dynamiquement</p>
      </div>

      {/* Real Interactive Map */}
      <InteractiveMap 
        userPos={userPos} 
        points={displayPoints} 
        selectedPointId={selectedPoint} 
        onSelectPoint={onSelect} 
      />

      {/* List of Centers */}
      <div className="space-y-3">
        {displayPoints.map((p) => {
          const isSelected = selectedPoint === p.id;
          return (
            <div 
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer"
              style={{
                background: isSelected ? "color-mix(in srgb, var(--blood) 8%, var(--surface))" : "var(--surface)",
                border: `1px solid ${isSelected ? "var(--blood)" : "var(--line)"}`,
                boxShadow: isSelected ? "0 4px 15px rgba(230,57,70,0.15)" : "var(--shadow-sm)"
              }}
            >
              {/* Letter Badge */}
              <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                   style={{ background: "color-mix(in srgb, var(--blood) 12%, var(--surface))" }}>
                <span className="syne font-bold text-lg" style={{ color: "var(--txt)" }}>{p.letter}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="syne font-bold text-sm truncate mb-0.5" style={{ color: "var(--txt)" }}>{p.nom}</div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>{p.distance.toFixed(1)} km</span>
                  <span style={{ color: "var(--txt-mute)" }}>·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === "Ouvert" ? "var(--ok)" : "#f59e0b" }} />
                    <span className="mono text-[10px]" style={{ color: p.status === "Ouvert" ? "var(--ok)" : "#f59e0b" }}>{p.status}</span>
                  </div>
                </div>
                <div className="mono text-[10px]" style={{ color: "var(--txt-dim)" }}>{p.hours}</div>
              </div>

              {/* Action Button */}
              <button 
                className="px-4 py-2.5 rounded-xl syne font-bold text-[11px] tracking-wide transition-all uppercase shrink-0"
                style={{
                  background: isSelected ? "color-mix(in srgb, var(--blood) 80%, black)" : "var(--blood)",
                  color: "white",
                  border: "none",
                  boxShadow: isSelected ? "inset 0 0 0 2px rgba(255,255,255,0.3)" : "none",
                }}
              >
                {isSelected ? "Choisi" : "Y Aller"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Appointments() {
  const toast = useToast();
  const points = useApi(() => api.collectionPoints(), []);
  const appts  = useApi(() => api.myAppointments(), []);

  const [activeTab, setActiveTab] = useState<"book" | "list">("book");
  const [point, setPoint] = useState<number | "">("");
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (point === "" || !selectedDateStr || !selectedTime) return toast.error("Complétez tous les choix.");
    setSaving(true);
    try {
      const [year, month, day] = selectedDateStr.split("-").map(Number);
      const [hh, mm] = selectedTime.split(":").map(Number);
      const d = new Date(year, month - 1, day, hh, mm, 0);
      
      await api.createAppointment({ collection_point_id: point as number, date: d.toISOString() });
      toast.success("Rendez-vous planifié avec succès.");
      appts.reload();
      setActiveTab("list");
      setPoint("");
      setSelectedDateStr("");
      setSelectedTime("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally { setSaving(false); }
  }

  const pointName = (id: number) => points.data?.find((p) => p.id === id)?.nom ?? `#${id}`;
  const selectedPointName = point !== "" ? pointName(point as number) : "";

  let formattedDate = "";
  if (selectedDateStr) {
    const [year, month, day] = selectedDateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    formattedDate = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short'});
  }

  // Dynamic button text
  let buttonText = "Confirmer la réservation";
  let isComplete = false;
  if (point === "") buttonText = "Sélectionnez un centre";
  else if (!selectedDateStr) buttonText = "Choisissez une date";
  else if (selectedTime === "") buttonText = "Choisissez une heure";
  else isComplete = true;

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Rendez-vous"
        subtitle={activeTab === "book" ? "Nouveau don" : "Historique"}
        icon={CalendarDays}
      />

      {/* Tabs / Segmented Control */}
      <div className="bg-(--surface) p-1 rounded-2xl flex items-center shadow-sm border border-(--line)">
        <button
          onClick={() => setActiveTab("book")}
          className="flex-1 py-2.5 rounded-xl syne font-bold text-sm transition-all duration-300"
          style={{
            background: activeTab === "book" ? "var(--bg)" : "transparent",
            color: activeTab === "book" ? "var(--txt)" : "var(--txt-mute)",
            boxShadow: activeTab === "book" ? "var(--shadow-sm)" : "none",
          }}
        >
          Réserver
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className="flex-1 py-2.5 rounded-xl syne font-bold text-sm transition-all duration-300 relative"
          style={{
            background: activeTab === "list" ? "var(--bg)" : "transparent",
            color: activeTab === "list" ? "var(--txt)" : "var(--txt-mute)",
            boxShadow: activeTab === "list" ? "var(--shadow-sm)" : "none",
          }}
        >
          Mes planifications
          {appts.data && appts.data.length > 0 && (
            <span className="absolute top-2.5 right-4 w-2 h-2 rounded-full" style={{ background: "var(--blood)" }} />
          )}
        </button>
      </div>

      {activeTab === "book" && (
        <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
          {/* Step 1: Hospital Selection (Radar Map) */}
          <div>
            {points.loading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 rounded-[24px]" />
                <Skeleton className="h-24 rounded-[20px]" />
                <Skeleton className="h-24 rounded-[20px]" />
              </div>
            ) : (
              <NearbyCenters 
                points={points.data || []} 
                selectedPoint={point} 
                onSelect={setPoint} 
              />
            )}
          </div>

          {/* Date & Time Selection */}
          <div className={`transition-all duration-500 grid grid-cols-2 gap-4 ${point !== "" ? "opacity-100 translate-y-0" : "opacity-50 grayscale pointer-events-none"}`}>
            
            {/* Step 2: Date Picker */}
            <div>
              <div className="flex items-center gap-2 mb-3 ml-1">
                <CalendarDays size={14} style={{ color: "var(--blood)" }} />
                <div className="mono text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--txt-mute)" }}>Date du don</div>
              </div>
              <div className="relative">
                <input 
                  type="date" 
                  min={todayStr}
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="w-full h-14 rounded-[16px] px-4 syne font-bold text-sm transition-all outline-none cursor-pointer"
                  style={{
                    background: selectedDateStr ? "color-mix(in srgb, var(--blood) 8%, var(--surface))" : "var(--surface)",
                    border: `1px solid ${selectedDateStr ? "var(--blood)" : "transparent"}`,
                    color: selectedDateStr ? "var(--blood)" : "var(--txt)",
                    boxShadow: selectedDateStr ? "0 4px 15px rgba(230,57,70,0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                />
              </div>
            </div>

            {/* Step 3: Time Picker */}
            <div>
              <div className="flex items-center gap-2 mb-3 ml-1">
                <Clock size={14} style={{ color: "var(--blood)" }} />
                <div className="mono text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--txt-mute)" }}>Heure d'arrivée</div>
              </div>
              <div className="relative">
                <input 
                  type="time" 
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full h-14 rounded-[16px] px-4 syne font-bold text-sm transition-all outline-none cursor-pointer"
                  style={{
                    background: selectedTime ? "color-mix(in srgb, var(--blood) 8%, var(--surface))" : "var(--surface)",
                    border: `1px solid ${selectedTime ? "var(--blood)" : "transparent"}`,
                    color: selectedTime ? "var(--blood)" : "var(--txt)",
                    boxShadow: selectedTime ? "0 4px 15px rgba(230,57,70,0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary and Confirmation */}
          <div className="pt-2">
            {isComplete && (
              <div className="mb-5 flex flex-col items-center justify-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-(--blood) animate-pulse" />
                  <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--blood)" }}>Sélection confirmée</span>
                </div>
                <p className="syne text-[13px]" style={{ color: "var(--txt-mute)" }}>
                  <strong style={{ color: "var(--txt)", fontWeight: "800" }}>{selectedPointName}</strong> • {formattedDate} à {selectedTime}
                </p>
              </div>
            )}
            <button 
              onClick={() => isComplete && submit()} 
              disabled={saving || !isComplete}
              className="w-full h-14 flex items-center justify-center text-[12px] rounded-full transition-all duration-300 syne font-bold uppercase relative overflow-hidden"
              style={{
                background: isComplete ? "var(--blood)" : "var(--surface-2)",
                color: isComplete ? "white" : "var(--txt-mute)",
                border: isComplete ? "none" : "1px dashed var(--line)",
                boxShadow: isComplete ? "0 8px 25px rgba(230,57,70,0.35)" : "none",
                transform: saving ? "scale(0.98)" : "scale(1)",
                opacity: saving ? 0.7 : 1,
                cursor: isComplete ? "pointer" : "not-allowed",
                letterSpacing: "1px"
              }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : (
                <>
                  <CalendarDays size={16} className="mr-2" />
                  {buttonText}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mes Rendez-vous */}
      {activeTab === "list" && (
        <div className="pt-2 animate-in fade-in duration-500 slide-in-from-bottom-2 space-y-5">
          <div className="px-1">
            {appts.data && (
               <div className="mono uppercase text-[10px] tracking-[0.14em] mb-1" style={{ color: "var(--txt-mute)" }}>
                 {appts.data.length} PLANIFIÉ(S)
               </div>
            )}
            <h3 className="syne font-bold text-2xl tracking-tight" style={{ color: "var(--txt)" }}>Mes rendez-vous</h3>
          </div>

          {appts.loading ? (
            <div className="space-y-3">
               <Skeleton className="h-22 rounded-[20px]" />
               <Skeleton className="h-22 rounded-[20px]" />
            </div>
          ) : !appts.data?.length ? (
            <Card>
              <EmptyState message="Aucun rendez-vous planifié." />
            </Card>
          ) : (
            <ul className="space-y-3">
              {appts.data.map((a, idx) => {
                const dateObj = new Date(a.date);
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-4 rounded-[20px] p-3 pr-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                  >
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-[14px] shrink-0 transition-transform duration-300 group-hover:scale-105"
                         style={{ background: "color-mix(in srgb, var(--blood) 6%, var(--surface))", border: "1px solid color-mix(in srgb, var(--blood) 10%, var(--line))" }}>
                      <span className="mono text-[9px] uppercase font-bold tracking-wider" style={{ color: "var(--blood)" }}>
                        {dateObj.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="syne text-[22px] font-extrabold leading-none mt-0.5" style={{ color: "var(--txt)" }}>
                        {dateObj.getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="syne font-bold text-[14px] truncate" style={{ color: "var(--txt)" }}>
                        {pointName(a.collection_point_id)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={12} style={{ color: "var(--txt-mute)" }} />
                        <span className="mono text-[11px] font-medium" style={{ color: "var(--txt-mute)" }}>
                          {dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <StatusBadge statut={a.statut} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

