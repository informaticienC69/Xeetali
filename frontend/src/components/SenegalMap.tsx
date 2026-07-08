// SenegalMap.tsx — XÉÉTALI · Carte fidèle 100% (react-simple-maps + GADM officiel)
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import {
  AlertTriangle, Building2, ChevronRight,
  Droplet, Filter, Minus, TrendingDown, TrendingUp,
  Users, X, Zap, Clock
} from "lucide-react";

const GEO_URL = "/senegal-regions.json";

const STATUS_CFG = {
  optimal:  { color: "#4ade80", label: "Optimal",  bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.35)" },
  tension:  { color: "#f59e0b", label: "Tension",  bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" },
  critique: { color: "#E63946", label: "Critique", bg: "rgba(230,57,70,0.12)",  border: "rgba(230,57,70,0.35)" },
} as const;
type Status = keyof typeof STATUS_CFG;

const VIEW_MODES = [
  { id: "stock",   label: "Stock" },
  { id: "alertes", label: "Alertes" },
  { id: "densite", label: "Densité" },
] as const;
type ViewMode = typeof VIEW_MODES[number]["id"];

const BLOOD_GROUPS = ["O+","O-","A+","A-","B+","B-","AB+","AB-"];

interface BG { group: string; qty: number; max: number; }
interface RegionData {
  name: string; capital: string; status: Status;
  stockPct: number; totalPoches: number; bloodGroups: BG[];
  hospitals: number; alertes: number; population: number;
  trend: "up" | "down" | "stable"; coords: [number, number];
}

const REGIONS_DATA: Record<string, RegionData> = {
  "Dakar":        { name:"Dakar",        capital:"Dakar",        status:"critique", stockPct:28, totalPoches:86,  hospitals:8, alertes:5, population:3732284, trend:"down",   coords:[-17.35,14.75], bloodGroups:[{group:"O+",qty:25,max:90},{group:"O-",qty:4,max:35},{group:"A+",qty:20,max:75},{group:"A-",qty:5,max:25},{group:"B+",qty:18,max:60},{group:"B-",qty:3,max:18},{group:"AB+",qty:8,max:30},{group:"AB-",qty:3,max:10}] },
  "Diourbel":     { name:"Diourbel",     capital:"Diourbel",     status:"optimal",  stockPct:81, totalPoches:201, hospitals:2, alertes:0, population:1527838, trend:"up",    coords:[-16.25,14.73], bloodGroups:[{group:"O+",qty:78,max:90},{group:"O-",qty:18,max:22},{group:"A+",qty:55,max:65},{group:"A-",qty:12,max:15},{group:"B+",qty:22,max:30},{group:"B-",qty:6,max:8},{group:"AB+",qty:7,max:9},{group:"AB-",qty:3,max:4}] },
  "Fatick":       { name:"Fatick",       capital:"Fatick",       status:"optimal",  stockPct:67, totalPoches:167, hospitals:1, alertes:0, population:785455,  trend:"stable", coords:[-16.50,14.35], bloodGroups:[{group:"O+",qty:55,max:70},{group:"O-",qty:12,max:20},{group:"A+",qty:42,max:58},{group:"A-",qty:10,max:16},{group:"B+",qty:28,max:38},{group:"B-",qty:7,max:10},{group:"AB+",qty:8,max:12},{group:"AB-",qty:5,max:7}] },
  "Kaffrine":     { name:"Kaffrine",     capital:"Kaffrine",     status:"optimal",  stockPct:63, totalPoches:156, hospitals:1, alertes:0, population:662218,  trend:"up",    coords:[-15.55,14.11], bloodGroups:[{group:"O+",qty:52,max:70},{group:"O-",qty:11,max:20},{group:"A+",qty:40,max:55},{group:"A-",qty:9,max:16},{group:"B+",qty:26,max:38},{group:"B-",qty:7,max:11},{group:"AB+",qty:8,max:14},{group:"AB-",qty:3,max:6}] },
  "Kaolack":      { name:"Kaolack",      capital:"Kaolack",      status:"tension",  stockPct:40, totalPoches:108, hospitals:2, alertes:3, population:1080093, trend:"down",   coords:[-15.90,14.00], bloodGroups:[{group:"O+",qty:35,max:70},{group:"O-",qty:5,max:22},{group:"A+",qty:28,max:55},{group:"A-",qty:7,max:17},{group:"B+",qty:18,max:42},{group:"B-",qty:5,max:13},{group:"AB+",qty:7,max:20},{group:"AB-",qty:3,max:8}] },
  "Kédougou":     { name:"Kédougou",     capital:"Kédougou",     status:"tension",  stockPct:38, totalPoches:89,  hospitals:1, alertes:1, population:178711,  trend:"stable", coords:[-12.35,12.85], bloodGroups:[{group:"O+",qty:30,max:65},{group:"O-",qty:6,max:20},{group:"A+",qty:24,max:52},{group:"A-",qty:6,max:15},{group:"B+",qty:15,max:38},{group:"B-",qty:4,max:12},{group:"AB+",qty:3,max:17},{group:"AB-",qty:1,max:6}] },
  "Kolda":        { name:"Kolda",        capital:"Kolda",        status:"optimal",  stockPct:71, totalPoches:173, hospitals:1, alertes:0, population:701019,  trend:"up",    coords:[-14.94,13.09], bloodGroups:[{group:"O+",qty:58,max:75},{group:"O-",qty:13,max:22},{group:"A+",qty:44,max:60},{group:"A-",qty:10,max:17},{group:"B+",qty:30,max:40},{group:"B-",qty:8,max:12},{group:"AB+",qty:9,max:16},{group:"AB-",qty:1,max:6}] },
  "Louga":        { name:"Louga",        capital:"Louga",        status:"optimal",  stockPct:72, totalPoches:188, hospitals:2, alertes:0, population:967578,  trend:"up",    coords:[-15.50,15.40], bloodGroups:[{group:"O+",qty:62,max:80},{group:"O-",qty:14,max:20},{group:"A+",qty:48,max:60},{group:"A-",qty:11,max:15},{group:"B+",qty:35,max:40},{group:"B-",qty:8,max:12},{group:"AB+",qty:7,max:20},{group:"AB-",qty:3,max:8}] },
  "Matam":        { name:"Matam",        capital:"Matam",        status:"critique", stockPct:18, totalPoches:41,  hospitals:1, alertes:4, population:562539,  trend:"down",   coords:[-13.80,15.10], bloodGroups:[{group:"O+",qty:12,max:60},{group:"O-",qty:1,max:20},{group:"A+",qty:10,max:50},{group:"A-",qty:2,max:15},{group:"B+",qty:8,max:40},{group:"B-",qty:1,max:12},{group:"AB+",qty:5,max:20},{group:"AB-",qty:2,max:8}] },
  "Saint-Louis":  { name:"Saint-Louis",  capital:"Saint-Louis",  status:"tension",  stockPct:45, totalPoches:142, hospitals:3, alertes:2, population:981418,  trend:"down",   coords:[-15.70,16.25], bloodGroups:[{group:"O+",qty:45,max:60},{group:"O-",qty:3,max:20},{group:"A+",qty:38,max:50},{group:"A-",qty:8,max:15},{group:"B+",qty:28,max:40},{group:"B-",qty:5,max:12},{group:"AB+",qty:12,max:20},{group:"AB-",qty:3,max:8}] },
  "Sédhiou":      { name:"Sédhiou",      capital:"Sédhiou",      status:"tension",  stockPct:42, totalPoches:95,  hospitals:1, alertes:1, population:452682,  trend:"stable", coords:[-15.60,12.70], bloodGroups:[{group:"O+",qty:32,max:65},{group:"O-",qty:7,max:20},{group:"A+",qty:25,max:52},{group:"A-",qty:6,max:15},{group:"B+",qty:16,max:38},{group:"B-",qty:4,max:11},{group:"AB+",qty:4,max:16},{group:"AB-",qty:1,max:6}] },
  "Tambacounda":  { name:"Tambacounda",  capital:"Tambacounda",  status:"critique", stockPct:22, totalPoches:52,  hospitals:2, alertes:3, population:728140,  trend:"down",   coords:[-13.85,13.85], bloodGroups:[{group:"O+",qty:18,max:70},{group:"O-",qty:2,max:20},{group:"A+",qty:14,max:55},{group:"A-",qty:3,max:15},{group:"B+",qty:10,max:40},{group:"B-",qty:2,max:12},{group:"AB+",qty:3,max:18},{group:"AB-",qty:0,max:7}] },
  "Thiès":        { name:"Thiès",        capital:"Thiès",        status:"tension",  stockPct:48, totalPoches:124, hospitals:3, alertes:2, population:1793038, trend:"stable", coords:[-16.90,14.90], bloodGroups:[{group:"O+",qty:40,max:70},{group:"O-",qty:8,max:22},{group:"A+",qty:30,max:58},{group:"A-",qty:9,max:18},{group:"B+",qty:22,max:45},{group:"B-",qty:5,max:14},{group:"AB+",qty:7,max:23},{group:"AB-",qty:3,max:9}] },
  "Ziguinchor":   { name:"Ziguinchor",   capital:"Ziguinchor",   status:"optimal",  stockPct:58, totalPoches:144, hospitals:2, alertes:0, population:571434,  trend:"up",    coords:[-16.29,12.57], bloodGroups:[{group:"O+",qty:48,max:75},{group:"O-",qty:10,max:22},{group:"A+",qty:36,max:58},{group:"A-",qty:8,max:17},{group:"B+",qty:24,max:40},{group:"B-",qty:6,max:12},{group:"AB+",qty:8,max:16},{group:"AB-",qty:4,max:7}] },
};

const SUPPLY_ROUTES = [
  { from:"Diourbel", to:"Dakar" },
  { from:"Louga", to:"Matam" },
  { from:"Kaffrine", to:"Tambacounda" },
];

function getRegionColor(name: string, filterGroup: string|null, viewMode: ViewMode): string {
  const r = REGIONS_DATA[name];
  if (!r) return "#1e293b";
  if (filterGroup) {
    const bg = r.bloodGroups.find(b => b.group === filterGroup);
    if (!bg) return "#1e293b";
    const p = bg.qty/bg.max;
    return p>0.5?"#4ade80":p>0.2?"#f59e0b":"#E63946";
  }
  if (viewMode==="alertes") return r.alertes===0?"#4ade80":r.alertes<=2?"#f59e0b":"#E63946";
  if (viewMode==="densite") { const d=(r.totalPoches/r.population)*100000; return d>15?"#4ade80":d>8?"#f59e0b":"#E63946"; }
  return STATUS_CFG[r.status].color;
}

function fmtPop(n:number){return n>=1e6?`${(n/1e6).toFixed(2)}M`:`${Math.round(n/1000)}k`;}

function MapTooltip({region,filterGroup,viewMode,pos,containerW}:{region:RegionData;filterGroup:string|null;viewMode:ViewMode;pos:{x:number;y:number};containerW:number}) {
  const color=getRegionColor(region.name,filterGroup,viewMode);
  const flip=pos.x>containerW*0.65;
  const shown=filterGroup?region.bloodGroups.filter(b=>b.group===filterGroup):region.bloodGroups.slice(0,5);
  return (
    <div className="dropdown-pop backdrop-blur-xl" style={{position:"absolute",left:flip?pos.x-210:pos.x+14,top:Math.max(8,pos.y-20),width:196,background:"color-mix(in srgb, var(--surface) 80%, transparent)",border:`1px solid ${color}50`,borderRadius:12,padding:"10px 12px",boxShadow:`0 12px 40px rgba(0,0,0,0.5),inset 0 0 0 1px rgba(255,255,255,0.2)`,zIndex:100,pointerEvents:"none"}}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="syne font-bold text-sm" style={{color:"var(--txt)"}}>{region.name}</div>
          <div className="mono text-[10px] uppercase tracking-wider" style={{color:"var(--txt-mute)"}}>{region.capital}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="mono text-[10px] px-2 py-0.5 rounded-md" style={{background:STATUS_CFG[region.status].bg,color,border:`1px solid ${color}40`}}>{STATUS_CFG[region.status].label}</span>
          <span className="syne font-extrabold text-lg tabular-nums" style={{color}}>{region.stockPct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{background:"var(--line)"}}>
        <div className="h-full rounded-full scale-x-in" style={{width:`${region.stockPct}%`,background:color,boxShadow:`0 0 8px ${color}80`}}/>
      </div>
      <div className="space-y-1">
        <div className="mono text-[9px] uppercase tracking-wider mb-1" style={{color:"var(--txt-mute)"}}>{filterGroup?`Groupe ${filterGroup}`:"Groupes sanguins"}</div>
        {shown.map((bg, i)=>{const p=Math.round((bg.qty/bg.max)*100);const bc=p>50?"#4ade80":p>20?"#f59e0b":"#E63946";return(
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
        {region.alertes>0&&<span className="flex items-center gap-1 mono text-[10px]" style={{color:"#E63946"}}><AlertTriangle size={10}/> {region.alertes}</span>}
      </div>
      <div className="mono text-[9px] mt-1" style={{color:"var(--txt-mute)"}}>Cliquez pour les détails →</div>
    </div>
  );
}

function DetailPanel({region,onClose}:{region:RegionData;onClose:()=>void}) {
  const navigate = useNavigate();
  const color=STATUS_CFG[region.status].color;
  const TI=region.trend==="up"?TrendingUp:region.trend==="down"?TrendingDown:Minus;
  return(
    <div className="flex flex-col h-full" style={{background:"var(--surface)",animation:"cardIn 0.22s ease both",overflowY:"auto"}}>
      <div className="flex items-start justify-between px-5 py-4 shrink-0" style={{borderBottom:"1px solid var(--line)",background:`linear-gradient(135deg, ${color}10, transparent)`}}>
        <div>
          <div className="mono text-[9px] uppercase tracking-[0.16em] mb-0.5" style={{color:"var(--txt-mute)"}}>Région sélectionnée</div>
          <div className="syne font-extrabold text-lg" style={{color:"var(--txt)"}}>{region.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="mono text-[10px] px-2 py-0.5 rounded-md" style={{background:STATUS_CFG[region.status].bg,color,border:`1px solid ${color}40`}}>{STATUS_CFG[region.status].label}</span>
            <TI size={12} style={{color:region.trend==="up"?"#4ade80":region.trend==="down"?"#E63946":"var(--txt-mute)"}}/>
          </div>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:"var(--surface-2)",color:"var(--txt-mute)"}}><X size={14}/></button>
      </div>
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto no-scrollbar">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="mono text-[10px] uppercase tracking-wider" style={{color:"var(--txt-mute)"}}>Stock total</span>
            <span className="syne font-extrabold text-2xl tabular-nums" style={{color}}>{region.stockPct}%</span>
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
            {region.bloodGroups.map(bg=>{const p=Math.round((bg.qty/bg.max)*100);const bc=p>50?"#4ade80":p>20?"#f59e0b":"#E63946";return(
              <div key={bg.group}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2"><span className="mono text-[11px] font-bold w-8" style={{color:"var(--txt)"}}>{bg.group}</span>{p<20&&<AlertTriangle size={10} style={{color:"#E63946"}}/>}</div>
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
            {icon:AlertTriangle,label:"Alertes actives",value:region.alertes,warn:region.alertes>0},
            {icon:Droplet,label:"Poches/100k",value:Math.round(region.totalPoches/region.population*100000),warn:false},
          ].map(({icon:Icon,label,value,warn})=>(
            <div key={label} className="rounded-lg px-3 py-2" style={{background:"var(--surface-2)",border:"1px solid var(--line)"}}>
              <Icon size={12} style={{color:warn?"#E63946":"var(--txt-mute)"}}/>
              <div className="syne font-bold mt-1" style={{color:warn?"#E63946":"var(--txt)"}}>{value}</div>
              <div className="mono text-[9px]" style={{color:"var(--txt-mute)"}}>{label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-1">
          <button onClick={() => navigate("/admin/campaign")} className="btn-blood w-full py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90" style={{opacity:region.alertes>0||region.stockPct<40?1:0.5}}><Zap size={14}/> Lancer alerte urgence</button>
          <button onClick={() => navigate("/admin/transfer")} className="w-full py-2.5 text-sm flex items-center justify-center gap-2 rounded-xl border mono text-[11px] uppercase tracking-wider cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-sm" style={{borderColor:"var(--line)",color:"var(--txt-dim)",background:"var(--surface-2)"}} onMouseEnter={(e) => { e.currentTarget.style.borderColor="var(--txt-mute)"; e.currentTarget.style.color="var(--txt)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor="var(--line)"; e.currentTarget.style.color="var(--txt-dim)"; }}><ChevronRight size={14}/> Commander approvisionnement</button>
        </div>
      </div>
    </div>
  );
}

function SummaryPanel({filterGroup,alertesNationales,totalPoches,nbHopitaux}:{filterGroup:string|null;alertesNationales:number;totalPoches:number;nbHopitaux:number}) {
  const regions=Object.values(REGIONS_DATA);
  const critiques=regions.filter(r=>r.status==="critique").sort((a,b)=>a.stockPct-b.stockPct);
  const tensions=regions.filter(r=>r.status==="tension").sort((a,b)=>a.stockPct-b.stockPct);
  const byStatus={optimal:regions.filter(r=>r.status==="optimal").length,tension:regions.filter(r=>r.status==="tension").length,critique:regions.filter(r=>r.status==="critique").length};
  const filterStats=filterGroup?(()=>{const gp=(r:RegionData)=>{const bg=r.bloodGroups.find(b=>b.group===filterGroup);return bg?bg.qty/bg.max:0;};return{ok:regions.filter(r=>gp(r)>0.5).length,tension:regions.filter(r=>gp(r)>0.2&&gp(r)<=0.5).length,critique:regions.filter(r=>gp(r)<=0.2).length};})():null;
  const statusRows:({"s":Status,"label":string,"count":number})[]= filterStats
    ?[{s:"optimal" as Status,label:"Suffisant",count:filterStats.ok},{s:"tension" as Status,label:"Tension",count:filterStats.tension},{s:"critique" as Status,label:"Critique",count:filterStats.critique}]
    :[{s:"optimal" as Status,label:"Optimal",count:byStatus.optimal},{s:"tension" as Status,label:"Tension",count:byStatus.tension},{s:"critique" as Status,label:"Critique",count:byStatus.critique}];
  const now=new Date().toLocaleString("fr-FR");
  return(
    <div className="flex flex-col h-full" style={{background:"var(--surface)",overflowY:"auto"}}>
      <div className="px-5 py-4 shrink-0" style={{borderBottom:"1px solid var(--line)"}}>
        <div className="mono text-[9px] uppercase tracking-[0.16em]" style={{color:"var(--txt-mute)"}}>{filterGroup?`Filtre · ${filterGroup}`:"Statut national"}</div>
        <div className="syne font-bold text-base mt-0.5" style={{color:"var(--txt)"}}>Vue d'ensemble</div>
      </div>
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto no-scrollbar">
        {statusRows.map(({s,label,count})=>(
          <div key={s} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full shrink-0" style={{background:STATUS_CFG[s].color,boxShadow:`0 0 8px ${STATUS_CFG[s].color}`}}/>
            <span className="flex-1 mono text-[11px]" style={{color:"var(--txt-dim)"}}>{label}</span>
            <span className="syne font-bold tabular-nums" style={{color:STATUS_CFG[s].color}}>{count}</span>
            <span className="mono text-[10px]" style={{color:"var(--txt-mute)"}}>régions</span>
          </div>
        ))}
        <div style={{borderTop:"1px solid var(--line)",paddingTop:12}}>
          <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{color:"var(--txt-mute)"}}>Régions critiques</div>
          {critiques.map(r=>(
            <div key={r.name} className="flex items-center gap-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:"#E63946",boxShadow:"0 0 6px #E63946"}}/>
              <span className="flex-1 syne font-semibold text-xs" style={{color:"var(--txt)"}}>{r.name}</span>
              <span className="mono text-[11px] font-bold tabular-nums" style={{color:"#E63946"}}>{r.stockPct}%</span>
              {r.alertes>0&&<span className="mono text-[10px] flex items-center gap-0.5" style={{color:"#E63946"}}><Zap size={10} />{r.alertes}</span>}
            </div>
          ))}
          {tensions.slice(0,2).map(r=>(
            <div key={r.name} className="flex items-center gap-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:"#f59e0b"}}/>
              <span className="flex-1 syne font-semibold text-xs" style={{color:"var(--txt)"}}>{r.name}</span>
              <span className="mono text-[11px] font-bold tabular-nums" style={{color:"#f59e0b"}}>{r.stockPct}%</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl px-4 py-3 space-y-1.5" style={{background:"var(--surface-2)",border:"1px solid var(--line)"}}>
          <div className="mono text-[9px] uppercase tracking-wider" style={{color:"var(--txt-mute)"}}>Résumé national</div>
          {[{label:"Poches totales",value:totalPoches.toLocaleString("fr-FR"),warn:false},{label:"Alertes actives",value:String(alertesNationales),warn:alertesNationales>0},{label:"Établissements",value:String(nbHopitaux),warn:false}].map(({label,value,warn})=>(
            <div key={label} className="flex justify-between mono text-[11px]"><span style={{color:"var(--txt-mute)"}}>{label}</span><span style={{color:warn?"#E63946":"var(--txt)"}} className="font-bold tabular-nums">{value}</span></div>
          ))}
        </div>
        <div className="mono text-[10px] text-center" style={{color:"var(--txt-mute)"}}>Cliquez sur une région</div>
        <div className="mono text-[9px] text-center flex items-center justify-center gap-1" style={{color:"var(--txt-mute)",opacity:0.6}}><Clock size={10} /> {now}</div>
      </div>
    </div>
  );
}

interface Props { alertesNationales?:number; totalPoches?:number; nbHopitaux?:number; }

export function SenegalMap({alertesNationales=12,totalPoches=1947,nbHopitaux=28}:Props) {
  const [selected,setSelected]=useState<RegionData|null>(null);
  const [hovered,setHovered]=useState<RegionData|null>(null);
  const [tipPos,setTipPos]=useState({x:0,y:0});
  const [filterGroup,setFilterGroup]=useState<string|null>(null);
  const [viewMode,setViewMode]=useState<ViewMode>("stock");
  const containerRef=useRef<HTMLDivElement>(null);
  const getColor=useCallback((name:string)=>getRegionColor(name,filterGroup,viewMode),[filterGroup,viewMode]);
  const handleMouseMove=useCallback((e:React.MouseEvent<HTMLDivElement>)=>{const rect=containerRef.current?.getBoundingClientRect();if(!rect)return;setTipPos({x:e.clientX-rect.left,y:e.clientY-rect.top});},[]);
  const containerW=containerRef.current?.offsetWidth??700;
  const supplyRoutes=viewMode==="stock"&&!filterGroup?SUPPLY_ROUTES:[];

  return(
    <div className="surface overflow-hidden" style={{borderRadius:16,border:"1px solid var(--line)"}}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 shrink-0" style={{borderBottom:"1px solid var(--line)",background:"var(--surface-2)"}}>
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{color:"var(--txt-mute)"}}>Carte Nationale · Stocks Sanguins</div>
          <div className="syne font-bold text-base" style={{color:"var(--txt)"}}>Sénégal · Temps Réel</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg overflow-hidden" style={{border:"1px solid var(--line)"}}>
            {VIEW_MODES.map(m=>(
              <button key={m.id} onClick={()=>{setViewMode(m.id);setFilterGroup(null);}} className="mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors" style={{background:viewMode===m.id?"var(--blood)":"transparent",color:viewMode===m.id?"white":"var(--txt-mute)"}}>{m.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Filter size={11} style={{color:"var(--txt-mute)"}}/>
            <div className="flex flex-wrap gap-1">
              {BLOOD_GROUPS.map(g=>(
                <button key={g} onClick={()=>{setFilterGroup(prev=>prev===g?null:g);setViewMode("stock");}} className="mono text-[10px] px-2 py-0.5 rounded-md border transition-colors" style={{borderColor:filterGroup===g?"var(--blood)":"var(--line)",background:filterGroup===g?"rgba(230,57,70,0.15)":"transparent",color:filterGroup===g?"var(--blood)":"var(--txt-mute)"}}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{minHeight:520}}>
        {/* Map */}
        <div ref={containerRef} className="relative flex-1 min-w-0 map-bg" onMouseMove={handleMouseMove} onMouseLeave={()=>setHovered(null)}>
          <ComposableMap projection="geoMercator" projectionConfig={{center:[-14.45,14.40],scale:5500}} width={760} height={520} style={{width:"100%",height:"100%"}}>
            <Geographies geography={GEO_URL}>
              {({geographies}:{geographies:any[]})=>geographies.map((geo:any)=>{
                const name:string=geo.properties.NAME_1;
                const rd=REGIONS_DATA[name];
                const color=getColor(name);
                const isSel=selected?.name===name;
                const isCrit=rd?.status==="critique"&&!filterGroup&&viewMode==="stock";
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

            {supplyRoutes.map(route=>{
              const f=REGIONS_DATA[route.from];const t=REGIONS_DATA[route.to];
              if(!f||!t)return null;
              const color=getColor(t.name);
              return(<Line key={`${route.from}-${route.to}`} from={f.coords} to={t.coords} stroke={color} strokeWidth={1.5} strokeOpacity={0.55} strokeDasharray="10 7" className="supply-route"/>);
            })}

            {Object.values(REGIONS_DATA).map(region=>{
              const color=getColor(region.name);
              const isSel=selected?.name===region.name;
              const isHov=hovered?.name===region.name;
              return(
                <g key={region.name}>
                  {region.status==="critique"&&!filterGroup&&viewMode==="stock"&&(
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
                  {region.alertes>0&&(
                    <Marker coordinates={[region.coords[0]+0.08,region.coords[1]+0.10]}>
                      <circle r={7} fill="#E63946" stroke="#0c1e3a" strokeWidth={1.5}/>
                      <text textAnchor="middle" y={3} style={{fontFamily:"'DM Mono',monospace",fontSize:"7px",fontWeight:800,fill:"white",pointerEvents:"none"}}>{region.alertes}</text>
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
              <svg width={18} height={18} viewBox="0 0 18 18"><polygon points="9,1 10.5,9 9,7 7.5,9" fill="#E63946"/><polygon points="9,17 10.5,9 9,11 7.5,9" fill="rgba(120,150,220,0.4)"/></svg>
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
            :<SummaryPanel filterGroup={filterGroup} alertesNationales={alertesNationales} totalPoches={totalPoches} nbHopitaux={nbHopitaux}/>
          }
        </div>
      </div>

      {/* Legend bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 shrink-0" style={{borderTop:"1px solid var(--line)",background:"var(--surface-2)"}}>
        <div className="flex items-center gap-4">
          {(filterGroup?[{color:"#4ade80",label:"> 50%"},{color:"#f59e0b",label:"20–50%"},{color:"#E63946",label:"< 20% critique"}]:viewMode==="stock"?Object.entries(STATUS_CFG).map(([,v])=>({color:v.color,label:v.label})):viewMode==="alertes"?[{color:"#4ade80",label:"0 alerte"},{color:"#f59e0b",label:"1–2"},{color:"#E63946",label:"3+"}]:[{color:"#4ade80",label:"> 15/100k"},{color:"#f59e0b",label:"8–15"},{color:"#E63946",label:"< 8"}]).map(({color,label})=>(
            <span key={label} className="flex items-center gap-1.5 mono text-[10px]" style={{color:"var(--txt-mute)"}}>
              <span className="h-2 w-2 rounded-full" style={{background:color,boxShadow:`0 0 6px ${color}`}}/>{label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mono text-[10px]" style={{color:"var(--txt-mute)"}}>
          {filterGroup&&<button onClick={()=>setFilterGroup(null)} className="flex items-center gap-1 px-2 py-1 rounded-md border" style={{borderColor:"rgba(230,57,70,0.35)",color:"var(--blood)",background:"rgba(230,57,70,0.08)"}}><X size={10}/> Effacer {filterGroup}</button>}
          <span>Données GADM officiel · 14 régions</span>
        </div>
      </div>
    </div>
  );
}




