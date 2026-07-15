// SenegalMap.tsx — XÉÉTALI · Carte fidèle 100% (react-simple-maps + GADM officiel)
// Données 100 % dérivées de la BD (GET /api/admin/stock-by-region) — aucune valeur mockée.
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import {
  AlertTriangle, Building2, ChevronRight,
  Droplet, Filter, Users, X, Zap, Clock
} from "lucide-react";
import { api, type RegionStock } from "../lib/api";
import { useApi } from "../lib/hooks";
import { Skeleton } from "./ui";

const GEO_URL = "/senegal-regions.json";

const STATUS_CFG = {
  optimal:     { color: "#2f9e63", label: "Optimal",     bg: "rgba(47,158,99,0.12)",  border: "rgba(47,158,99,0.35)" },
  tension:     { color: "#d68a1a", label: "Tension",     bg: "rgba(214,138,26,0.12)", border: "rgba(214,138,26,0.35)" },
  critique:    { color: "#ce3341", label: "Critique",    bg: "rgba(206,51,65,0.12)",  border: "rgba(206,51,65,0.35)" },
  hors_reseau: { color: "#3a4560", label: "Hors réseau", bg: "rgba(58,69,96,0.16)",   border: "rgba(58,69,96,0.4)" },
} as const;
type Status = keyof typeof STATUS_CFG;

const VIEW_MODES = [
  { id: "stock",   label: "Stock" },
  { id: "alertes", label: "Urgences" },
] as const;
type ViewMode = typeof VIEW_MODES[number]["id"];

const BLOOD_GROUPS = ["O+","O-","A+","A-","B+","B-","AB+","AB-"];

interface BG { group: string; qty: number; max: number; }
interface RegionData {
  name: string; capital: string; status: Status;
  stockPct: number; totalPoches: number; bloodGroups: BG[];
  hospitals: number; demandesUrgentes: number; population: number;
  coords: [number, number];
}

function toRegionData(r: RegionStock): RegionData {
  return {
    name: r.nom,
    capital: r.capitale,
    status: r.statut as Status,
    stockPct: r.stock_pct,
    totalPoches: r.total_poches,
    bloodGroups: r.groupes.map((g) => ({ group: g.groupe_sanguin, qty: g.quantite, max: g.cible })),
    hospitals: r.nb_hopitaux,
    demandesUrgentes: r.demandes_urgentes,
    population: r.population,
    coords: r.coords,
  };
}

function pctOf(bg: BG): number {
  return bg.max > 0 ? Math.round((bg.qty / bg.max) * 100) : 0;
}

function getRegionColor(r: RegionData | undefined, filterGroup: string | null, viewMode: ViewMode): string {
  if (!r) return "#1e293b";
  if (r.hospitals === 0) return STATUS_CFG.hors_reseau.color;
  if (filterGroup) {
    const bg = r.bloodGroups.find(b => b.group === filterGroup);
    if (!bg || bg.max === 0) return STATUS_CFG.hors_reseau.color;
    const p = bg.qty / bg.max;
    return p>0.5?"#2f9e63":p>0.2?"#d68a1a":"#ce3341";
  }
  if (viewMode==="alertes") return r.demandesUrgentes===0?"#2f9e63":r.demandesUrgentes<=2?"#d68a1a":"#ce3341";
  return STATUS_CFG[r.status].color;
}

function fmtPop(n:number){return n>=1e6?`${(n/1e6).toFixed(2)}M`:`${Math.round(n/1000)}k`;}

function MapTooltip({region,filterGroup,viewMode,pos,containerW}:{region:RegionData;filterGroup:string|null;viewMode:ViewMode;pos:{x:number;y:number};containerW:number}) {
  const color=getRegionColor(region,filterGroup,viewMode);
  const flip=pos.x>containerW*0.65;
  const shown=filterGroup?region.bloodGroups.filter(b=>b.group===filterGroup):region.bloodGroups.slice(0,5);
  return (
    <div className="dropdown-pop backdrop-blur-xl" style={{position:"absolute",left:flip?pos.x-210:pos.x+14,top:Math.max(8,pos.y-20),width:196,background:"color-mix(in srgb, var(--surface) 80%, transparent)",border:`1px solid ${color}50`,borderRadius:12,padding:"10px 12px",boxShadow:`0 12px 40px rgba(0,0,0,0.5),inset 0 0 0 1px rgba(255,255,255,0.2)`,zIndex:100,pointerEvents:"none"}}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-bold text-sm" style={{color:"var(--txt)"}}>{region.name}</div>
          <div className="mono text-[10px] uppercase tracking-wider" style={{color:"var(--txt-mute)"}}>{region.capital}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="mono text-[10px] px-2 py-0.5 rounded-md" style={{background:STATUS_CFG[region.status].bg,color,border:`1px solid ${color}40`}}>{STATUS_CFG[region.status].label}</span>
          <span className="font-extrabold text-lg tabular-nums" style={{color}}>{region.stockPct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{background:"var(--line)"}}>
        <div className="h-full rounded-full scale-x-in" style={{width:`${region.stockPct}%`,background:color,boxShadow:`0 0 8px ${color}80`}}/>
      </div>
      <div className="space-y-1">
        <div className="mono text-[9px] uppercase tracking-wider mb-1" style={{color:"var(--txt-mute)"}}>{filterGroup?`Groupe ${filterGroup}`:"Groupes sanguins"}</div>
        {shown.map((bg, i)=>{const p=pctOf(bg);const bc=p>50?"#2f9e63":p>20?"#d68a1a":"#ce3341";return(
          <div key={bg.group} className="flex items-center gap-2">
            <span className="mono text-[10px] w-7 shrink-0 font-semibold" style={{color:"var(--txt-dim)"}}>{bg.group}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:"var(--line)"}}>
              <div className="h-full rounded-full scale-x-in" style={{width:`${p}%`,background:bc, animationDelay: `${i * 60 + 100}ms`}}/>
            </div>
            <span className="mono text-[9px] w-9 text-right tabular-nums" style={{color:"var(--txt-mute)"}}>{bg.qty}/{bg.max}</span>
          </div>
        );})}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-2" style={{borderTop:"1px solid var(--line)"}}>
        <span className="flex items-center gap-1 mono text-[10px]" style={{color:"var(--txt-mute)"}}><Building2 size={10}/> {region.hospitals}</span>
        <span className="flex items-center gap-1 mono text-[10px]" style={{color:"var(--txt-mute)"}}><Droplet size={10}/> {region.totalPoches}</span>
        {region.demandesUrgentes>0&&<span className="flex items-center gap-1 mono text-[10px]" style={{color:"#ce3341"}}><AlertTriangle size={10}/> {region.demandesUrgentes}</span>}
      </div>
      <div className="mono text-[9px] mt-1" style={{color:"var(--txt-mute)"}}>Cliquez pour les détails →</div>
    </div>
  );
}

function DetailPanel({region,onClose}:{region:RegionData;onClose:()=>void}) {
  const navigate = useNavigate();
  const color=STATUS_CFG[region.status].color;
  return(
    <div className="flex flex-col h-full" style={{background:"var(--surface)",animation:"cardIn 0.22s ease both",overflowY:"auto"}}>
      <div className="flex items-start justify-between px-5 py-4 shrink-0" style={{borderBottom:"1px solid var(--line)",background:`linear-gradient(135deg, ${color}10, transparent)`}}>
        <div>
          <div className="mono text-[9px] uppercase tracking-[0.16em] mb-0.5" style={{color:"var(--txt-mute)"}}>Région sélectionnée</div>
          <div className="font-extrabold text-lg" style={{color:"var(--txt)"}}>{region.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="mono text-[10px] px-2 py-0.5 rounded-md" style={{background:STATUS_CFG[region.status].bg,color,border:`1px solid ${color}40`}}>{STATUS_CFG[region.status].label}</span>
          </div>
        </div>
        <button onClick={onClose} aria-label="Fermer le détail de la région" className="tap-target rounded-lg" style={{background:"var(--surface-2)",color:"var(--txt-mute)"}}><X size={14} aria-hidden="true"/></button>
      </div>
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto no-scrollbar">
        {region.hospitals===0 && (
          <div className="rounded-lg px-3 py-2 mono text-[10px]" style={{background:STATUS_CFG.hors_reseau.bg,color:"var(--txt-mute)"}}>
            Aucun établissement recensé dans cette région pour l'instant.
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="mono text-[10px] uppercase tracking-wider" style={{color:"var(--txt-mute)"}}>Stock total</span>
            <span className="font-extrabold text-2xl tabular-nums" style={{color}}>{region.stockPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--line)"}}>
            <div className="h-full rounded-full" style={{width:`${region.stockPct}%`,background:color,boxShadow:`0 0 10px ${color}80`}}/>
          </div>
          <div className="flex justify-between mt-1.5 mono text-[10px]" style={{color:"var(--txt-mute)"}}>
            <span>{region.totalPoches} poches</span><span>Capitale: {region.capital}</span>
          </div>
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{color:"var(--txt-mute)"}}>Groupes sanguins</div>
          <div className="space-y-2">
            {region.bloodGroups.map(bg=>{const p=pctOf(bg);const bc=p>50?"#2f9e63":p>20?"#d68a1a":"#ce3341";return(
              <div key={bg.group}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2"><span className="mono text-[11px] font-bold w-8" style={{color:"var(--txt)"}}>{bg.group}</span>{p<20&&bg.max>0&&<AlertTriangle size={10} style={{color:"#ce3341"}}/>}</div>
                  <span className="mono text-[10px] tabular-nums" style={{color:bc}}>{bg.qty}/{bg.max}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:"var(--line)"}}><div className="h-full rounded-full" style={{width:`${p}%`,background:bc,boxShadow:p<20?`0 0 6px ${bc}`:undefined}}/></div>
              </div>
            );})}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            {icon:Building2,label:"Établissements",value:region.hospitals,warn:false},
            {icon:Users,label:"Population",value:fmtPop(region.population),warn:false},
            {icon:AlertTriangle,label:"Demandes urgentes",value:region.demandesUrgentes,warn:region.demandesUrgentes>0},
            {icon:Droplet,label:"Poches/100k",value:Math.round(region.totalPoches/region.population*100000),warn:false},
          ].map(({icon:Icon,label,value,warn})=>(
            <div key={label} className="rounded-lg px-3 py-2" style={{background:"var(--surface-2)",border:"1px solid var(--line)"}}>
              <Icon size={12} style={{color:warn?"#ce3341":"var(--txt-mute)"}}/>
              <div className="font-bold mt-1" style={{color:warn?"#ce3341":"var(--txt)"}}>{value}</div>
              <div className="mono text-[9px]" style={{color:"var(--txt-mute)"}}>{label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-1">
          <button onClick={() => navigate("/admin/campaign")} className="btn-blood w-full py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90" style={{opacity:region.demandesUrgentes>0||region.stockPct<40?1:0.5}}><Zap size={14}/> Lancer alerte urgence</button>
          <button onClick={() => navigate("/admin/transfer")} className="w-full py-2.5 text-sm flex items-center justify-center gap-2 rounded-xl border mono text-[11px] uppercase tracking-wider cursor-pointer transition-all hover:shadow-sm" style={{borderColor:"var(--line)",color:"var(--txt-dim)",background:"var(--surface-2)"}} onMouseEnter={(e) => { e.currentTarget.style.borderColor="var(--txt-mute)"; e.currentTarget.style.color="var(--txt)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor="var(--line)"; e.currentTarget.style.color="var(--txt-dim)"; }}><ChevronRight size={14}/> Commander approvisionnement</button>
        </div>
      </div>
    </div>
  );
}

function SummaryPanel({regions,filterGroup,alertesNationales,totalPoches,nbHopitaux}:{regions:RegionData[];filterGroup:string|null;alertesNationales:number;totalPoches:number;nbHopitaux:number}) {
  const active=regions.filter(r=>r.hospitals>0);
  const horsReseau=regions.length-active.length;
  const critiques=active.filter(r=>r.status==="critique").sort((a,b)=>a.stockPct-b.stockPct);
  const tensions=active.filter(r=>r.status==="tension").sort((a,b)=>a.stockPct-b.stockPct);
  const byStatus={optimal:active.filter(r=>r.status==="optimal").length,tension:active.filter(r=>r.status==="tension").length,critique:active.filter(r=>r.status==="critique").length};
  const filterStats=filterGroup?(()=>{const gp=(r:RegionData)=>{const bg=r.bloodGroups.find(b=>b.group===filterGroup);return bg&&bg.max>0?bg.qty/bg.max:0;};return{ok:active.filter(r=>gp(r)>0.5).length,tension:active.filter(r=>gp(r)>0.2&&gp(r)<=0.5).length,critique:active.filter(r=>gp(r)<=0.2).length};})():null;
  const statusRows:({"s":Status,"label":string,"count":number})[]= filterStats
    ?[{s:"optimal" as Status,label:"Suffisant",count:filterStats.ok},{s:"tension" as Status,label:"Tension",count:filterStats.tension},{s:"critique" as Status,label:"Critique",count:filterStats.critique}]
    :[{s:"optimal" as Status,label:"Optimal",count:byStatus.optimal},{s:"tension" as Status,label:"Tension",count:byStatus.tension},{s:"critique" as Status,label:"Critique",count:byStatus.critique}];
  const now=new Date().toLocaleString("fr-FR");
  return(
    <div className="flex flex-col h-full" style={{background:"var(--surface)",overflowY:"auto"}}>
      <div className="px-5 py-4 shrink-0" style={{borderBottom:"1px solid var(--line)"}}>
        <div className="mono text-[9px] uppercase tracking-[0.16em]" style={{color:"var(--txt-mute)"}}>{filterGroup?`Filtre · ${filterGroup}`:"Statut national"}</div>
        <div className="font-bold text-base mt-0.5" style={{color:"var(--txt)"}}>Vue d'ensemble</div>
      </div>
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto no-scrollbar">
        {statusRows.map(({s,label,count})=>(
          <div key={s} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full shrink-0" style={{background:STATUS_CFG[s].color,boxShadow:`0 0 8px ${STATUS_CFG[s].color}`}}/>
            <span className="flex-1 mono text-[11px]" style={{color:"var(--txt-dim)"}}>{label}</span>
            <span className="font-bold tabular-nums" style={{color:STATUS_CFG[s].color}}>{count}</span>
            <span className="mono text-[10px]" style={{color:"var(--txt-mute)"}}>régions</span>
          </div>
        ))}
        {horsReseau>0&&(
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full shrink-0" style={{background:STATUS_CFG.hors_reseau.color}}/>
            <span className="flex-1 mono text-[11px]" style={{color:"var(--txt-dim)"}}>Hors réseau</span>
            <span className="font-bold tabular-nums" style={{color:STATUS_CFG.hors_reseau.color}}>{horsReseau}</span>
            <span className="mono text-[10px]" style={{color:"var(--txt-mute)"}}>régions</span>
          </div>
        )}
        <div style={{borderTop:"1px solid var(--line)",paddingTop:12}}>
          <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{color:"var(--txt-mute)"}}>Régions critiques</div>
          {critiques.length===0&&tensions.length===0&&(
            <div className="mono text-[10px]" style={{color:"var(--txt-mute)"}}>Aucune région en tension ou critique.</div>
          )}
          {critiques.map(r=>(
            <div key={r.name} className="flex items-center gap-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:"#ce3341",boxShadow:"0 0 6px #ce3341"}}/>
              <span className="flex-1 font-semibold text-xs" style={{color:"var(--txt)"}}>{r.name}</span>
              <span className="mono text-[11px] font-bold tabular-nums" style={{color:"#ce3341"}}>{r.stockPct}%</span>
              {r.demandesUrgentes>0&&<span className="mono text-[10px] flex items-center gap-0.5" style={{color:"#ce3341"}}><Zap size={10} />{r.demandesUrgentes}</span>}
            </div>
          ))}
          {tensions.slice(0,2).map(r=>(
            <div key={r.name} className="flex items-center gap-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:"#d68a1a"}}/>
              <span className="flex-1 font-semibold text-xs" style={{color:"var(--txt)"}}>{r.name}</span>
              <span className="mono text-[11px] font-bold tabular-nums" style={{color:"#d68a1a"}}>{r.stockPct}%</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl px-4 py-3 space-y-1.5" style={{background:"var(--surface-2)",border:"1px solid var(--line)"}}>
          <div className="mono text-[9px] uppercase tracking-wider" style={{color:"var(--txt-mute)"}}>Résumé national</div>
          {[{label:"Poches totales",value:totalPoches.toLocaleString("fr-FR"),warn:false},{label:"Alertes actives",value:String(alertesNationales),warn:alertesNationales>0},{label:"Établissements",value:String(nbHopitaux),warn:false}].map(({label,value,warn})=>(
            <div key={label} className="flex justify-between mono text-[11px]"><span style={{color:"var(--txt-mute)"}}>{label}</span><span style={{color:warn?"#ce3341":"var(--txt)"}} className="font-bold tabular-nums">{value}</span></div>
          ))}
        </div>
        <div className="mono text-[10px] text-center" style={{color:"var(--txt-mute)"}}>Cliquez sur une région</div>
        <div className="mono text-[9px] text-center flex items-center justify-center gap-1" style={{color:"var(--txt-mute)",opacity:0.6}}><Clock size={10} /> {now}</div>
      </div>
    </div>
  );
}

interface Props { alertesNationales?:number; totalPoches?:number; nbHopitaux?:number; }

export function SenegalMap({alertesNationales=0,totalPoches=0,nbHopitaux=0}:Props) {
  const { data, loading, error } = useApi(() => api.stockByRegion(), []);
  const regions: RegionData[] = (data ?? []).map(toRegionData);
  const regionsByName: Record<string, RegionData> = Object.fromEntries(regions.map(r => [r.name, r]));

  const [selected,setSelected]=useState<RegionData|null>(null);
  const [hovered,setHovered]=useState<RegionData|null>(null);
  const [tipPos,setTipPos]=useState({x:0,y:0});
  const [filterGroup,setFilterGroup]=useState<string|null>(null);
  const [viewMode,setViewMode]=useState<ViewMode>("stock");
  const containerRef=useRef<HTMLDivElement>(null);
  const getColor=useCallback((name:string)=>getRegionColor(regionsByName[name],filterGroup,viewMode),[regionsByName,filterGroup,viewMode]);
  const handleMouseMove=useCallback((e:React.MouseEvent<HTMLDivElement>)=>{const rect=containerRef.current?.getBoundingClientRect();if(!rect)return;setTipPos({x:e.clientX-rect.left,y:e.clientY-rect.top});},[]);
  const containerW=containerRef.current?.offsetWidth??700;

  const legendItems = filterGroup
    ? [{color:"#2f9e63",label:"> 50%"},{color:"#d68a1a",label:"20–50%"},{color:"#ce3341",label:"< 20% critique"}]
    : viewMode==="stock"
      ? [{color:STATUS_CFG.optimal.color,label:"Optimal"},{color:STATUS_CFG.tension.color,label:"Tension"},{color:STATUS_CFG.critique.color,label:"Critique"}]
      : [{color:"#2f9e63",label:"0 demande"},{color:"#d68a1a",label:"1–2"},{color:"#ce3341",label:"3+"}];
  if (regions.some(r=>r.hospitals===0)) legendItems.push({color:STATUS_CFG.hors_reseau.color,label:"Hors réseau"});

  return(
    <div className="surface overflow-hidden" style={{borderRadius:16,border:"1px solid var(--line)"}}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 shrink-0" style={{borderBottom:"1px solid var(--line)",background:"var(--surface-2)"}}>
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{color:"var(--txt-mute)"}}>Carte Nationale · Stocks Sanguins</div>
          <div className="font-bold text-base" style={{color:"var(--txt)"}}>Sénégal · Temps Réel</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Mode d'affichage de la carte" className="flex rounded-lg overflow-hidden" style={{border:"1px solid var(--line)"}}>
            {VIEW_MODES.map(m=>(
              <button key={m.id} onClick={()=>{setViewMode(m.id);setFilterGroup(null);}} aria-pressed={viewMode===m.id} className="mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors" style={{background:viewMode===m.id?"var(--blood)":"transparent",color:viewMode===m.id?"white":"var(--txt-mute)"}}>{m.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Filter size={11} style={{color:"var(--txt-mute)"}} aria-hidden="true"/>
            <div role="group" aria-label="Filtrer par groupe sanguin" className="flex flex-wrap gap-1">
              {BLOOD_GROUPS.map(g=>(
                <button key={g} onClick={()=>{setFilterGroup(prev=>prev===g?null:g);setViewMode("stock");}} aria-pressed={filterGroup===g} className="mono text-[10px] px-2 py-0.5 rounded-md border transition-colors" style={{borderColor:filterGroup===g?"var(--blood)":"var(--line)",background:filterGroup===g?"rgba(206,51,65,0.15)":"transparent",color:filterGroup===g?"var(--blood)":"var(--txt-mute)"}}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-5"><Skeleton className="h-[520px]" /></div>
      ) : error ? (
        <div className="mx-5 my-4 rounded-xl px-4 py-3 mono text-[12px]" style={{background:"rgba(206,51,65,0.08)",border:"1px solid rgba(206,51,65,0.35)",color:"var(--blood)"}}>{error}</div>
      ) : (
      <>
      {/* Body */}
      <div className="flex" style={{minHeight:520}}>
        {/* Map */}
        <div ref={containerRef} className="relative flex-1 min-w-0 map-bg" onMouseMove={handleMouseMove} onMouseLeave={()=>setHovered(null)}>
          <ComposableMap projection="geoMercator" projectionConfig={{center:[-14.45,14.40],scale:5500}} width={760} height={520} style={{width:"100%",height:"100%"}}>
            <Geographies geography={GEO_URL}>
              {({geographies}:{geographies:any[]})=>geographies.map((geo:any)=>{
                const name:string=geo.properties.NAME_1;
                const rd=regionsByName[name];
                const color=getColor(name);
                const isSel=selected?.name===name;
                const isCrit=!!rd&&rd.hospitals>0&&rd.status==="critique"&&!filterGroup&&viewMode==="stock";
                return(
                  <Geography key={geo.rsmKey} geography={geo}
                    onMouseEnter={()=>rd&&setHovered(rd)}
                    onMouseLeave={()=>setHovered(null)}
                    onClick={()=>{if(!rd)return;setSelected(prev=>prev?.name===name?null:rd);}}
                    style={{
                      default:{fill:color,fillOpacity:isSel?0.72:0.32,stroke:color,strokeWidth:isSel?2:0.8,strokeOpacity:0.7,outline:"none",cursor:"pointer",filter:isCrit?`drop-shadow(0 0 8px ${color})`:undefined},
                      hover:{fill:color,fillOpacity:0.58,stroke:color,strokeWidth:2,strokeOpacity:1,outline:"none",cursor:"pointer"},
                      pressed:{fill:color,fillOpacity:0.75,stroke:color,strokeWidth:2.5,outline:"none"},
                    }}
                  />
                );
              })}
            </Geographies>

            {regions.map(region=>{
              const color=getColor(region.name);
              const isSel=selected?.name===region.name;
              const isHov=hovered?.name===region.name;
              return(
                <g key={region.name}>
                  {region.hospitals>0&&region.status==="critique"&&!filterGroup&&viewMode==="stock"&&(
                    <Marker coordinates={region.coords}>
                      <circle r={18} fill="none" stroke={color} strokeWidth={1.5} opacity={0} className="map-pulse-ring-1"/>
                      <circle r={11} fill="none" stroke={color} strokeWidth={1} opacity={0} className="map-pulse-ring-2"/>
                    </Marker>
                  )}
                  <Marker coordinates={region.coords}>
                    <text textAnchor="middle" y={4} style={{fontFamily:"'DM Mono',monospace",fontSize:region.name.length>10?"7px":"8px",fontWeight:isSel||isHov?700:600,fill:"var(--txt)",fillOpacity:isSel||isHov?1:0.88,letterSpacing:"0.06em",pointerEvents:"none",userSelect:"none"}}>
                      {region.name.toUpperCase()}
                    </text>
                  </Marker>
                  {region.demandesUrgentes>0&&(
                    <Marker coordinates={[region.coords[0]+0.08,region.coords[1]+0.10]}>
                      <circle r={7} fill="#ce3341" stroke="#0c1e3a" strokeWidth={1.5}/>
                      <text textAnchor="middle" y={3} style={{fontFamily:"'DM Mono',monospace",fontSize:"7px",fontWeight:800,fill:"white",pointerEvents:"none"}}>{region.demandesUrgentes}</text>
                    </Marker>
                  )}
                </g>
              );
            })}
          </ComposableMap>

          {hovered&&!selected&&<MapTooltip region={hovered} filterGroup={filterGroup} viewMode={viewMode} pos={tipPos} containerW={containerW}/>}

          {/* Rose des vents */}
          <div className="absolute top-3 right-3 select-none" style={{color:"rgba(120,150,220,0.5)"}}>
            <div className="mono text-[9px] text-center" style={{color:"rgba(160,185,240,0.7)"}}>N</div>
            <div className="flex items-center justify-center gap-1 mono text-[9px]">
              <span>O</span>
              <svg width={18} height={18} viewBox="0 0 18 18"><polygon points="9,1 10.5,9 9,7 7.5,9" fill="#ce3341"/><polygon points="9,17 10.5,9 9,11 7.5,9" fill="rgba(120,150,220,0.4)"/></svg>
              <span>E</span>
            </div>
            <div className="mono text-[9px] text-center" style={{opacity:0.5}}>S</div>
          </div>

          {/* Label Atlantique */}
          <div className="absolute bottom-4 left-3 mono text-[9px]" style={{color:"rgba(80,120,200,0.32)",letterSpacing:"0.14em",writingMode:"vertical-rl",transform:"rotate(180deg)"}}>OCÉAN ATLANTIQUE</div>
        </div>

        {/* Side panel */}
        <div className="shrink-0 flex flex-col" style={{width:272,borderLeft:"1px solid var(--line)",minHeight:520}}>
          {selected
            ?<DetailPanel region={selected} onClose={()=>setSelected(null)}/>
            :<SummaryPanel regions={regions} filterGroup={filterGroup} alertesNationales={alertesNationales} totalPoches={totalPoches} nbHopitaux={nbHopitaux}/>
          }
        </div>
      </div>

      {/* Legend bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 shrink-0" style={{borderTop:"1px solid var(--line)",background:"var(--surface-2)"}}>
        <div className="flex items-center gap-4">
          {legendItems.map(({color,label})=>(
            <span key={label} className="flex items-center gap-1.5 mono text-[10px]" style={{color:"var(--txt-mute)"}}>
              <span className="h-2 w-2 rounded-full" style={{background:color,boxShadow:`0 0 6px ${color}`}}/>{label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mono text-[10px]" style={{color:"var(--txt-mute)"}}>
          {filterGroup&&<button onClick={()=>setFilterGroup(null)} className="flex items-center gap-1 px-2 py-1 rounded-md border" style={{borderColor:"rgba(206,51,65,0.35)",color:"var(--blood)",background:"rgba(206,51,65,0.08)"}}><X size={10}/> Effacer {filterGroup}</button>}
          <span>Données GADM officiel · 14 régions</span>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
