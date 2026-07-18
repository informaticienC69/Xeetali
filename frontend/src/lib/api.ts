// Client API typé vers le Node Central Xéétali (JWT + gestion d'erreurs propres).

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type Role = "ADMIN_CNTS" | "PERSONNEL_MEDICAL" | "DONNEUR";
export type PouchStatus = "DISPONIBLE" | "RESERVEE" | "UTILISEE" | "PERIMEE";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
  nom: string;
  user_id: number;
  hospital_id: number | null;
}

interface StockLine {
  groupe_sanguin: BloodGroup;
  quantite: number;
}
export interface HospitalInventory {
  hospital_id: number;
  nom: string;
  region_nom: string;
  type: string;
  stocks: StockLine[];
}
export interface Region {
  id: number;
  nom: string;
  capitale: string;
  population: number;
  longitude: number;
  latitude: number;
}
export interface Hospital {
  id: number;
  nom: string;
  region_id: number;
  region: Region;
  type: string;
}
export interface Pouch {
  id: number;
  uid: string;
  groupe_sanguin: BloodGroup;
  hospital_id: number;
  statut: PouchStatus;
  date_prelevement: string;
  date_peremption: string;
  qr_code_b64: string;
  created_at: string;
}
export interface PouchValidity {
  uid: string;
  existe: boolean;
  valide: boolean;
  statut: PouchStatus | null;
  perimee: boolean | null;
  date_peremption: string | null;
  motif: string;
}
export interface TransferResult {
  id: number;
  statut: string;
  quantite: number;
  groupe_sanguin: BloodGroup;
}
export interface BloodRequest {
  id: number;
  hospital_id: number;
  groupe_sanguin: BloodGroup;
  quantite: number;
  urgence: string;
  statut: string;
  created_at: string;
}
export interface DonorProfile {
  id: number;
  user_id: number;
  groupe_sanguin: BloodGroup;
  telephone: string;
  localisation: string;
  date_dernier_don: string | null;
}
export interface BadgeStatus {
  code: string;
  label: string;
  description: string;
  seuil: number;
  obtenu: boolean;
}
export interface DonorStats {
  nb_dons: number;
  total_volume_ml: number;
  vies_potentielles: number;
  points: number;
  niveau: string;
  niveau_index: number;
  progression: number;
  dons_avant_niveau_suivant: number;
  rang: number;
  nb_donneurs: number;
  dernier_don: string | null;
  prochain_don_eligible: string | null;
  eligible_maintenant: boolean;
  jours_avant_eligibilite: number;
  nb_reponses_alertes: number;
  badges: BadgeStatus[];
  streak_annees: number;
}
export interface UrgencyStats {
  vies_en_attente: number;
  capacite_pct: number;
  groupe_critique: string;
  regions: string;
}
export interface LeaderboardEntry {
  rang: number;
  nom_affiche: string;
  groupe_sanguin: BloodGroup;
  nb_dons: number;
  points: number;
  is_me: boolean;
}
export interface CollectionPoint {
  id: number;
  nom: string;
  localisation: string;
  hospital_id: number | null;
  horaires: string;
}
export interface Appointment {
  id: number;
  donor_id: number;
  collection_point_id: number;
  date: string;
  statut: string;
}
export interface Donation {
  id: number;
  donor_id: number;
  collection_point_id: number;
  groupe_sanguin: BloodGroup;
  volume: number;
  date: string;
}
export interface Alert {
  id: number;
  groupe_sanguin: BloodGroup;
  message: string;
  canal: string;
  portee: string;
  statut: string;
  created_at: string;
}
export interface AlertDispatch {
  alert_id: number;
  groupe_sanguin: BloodGroup;
  groupes_donneurs_compatibles: BloodGroup[];
  donneurs_notifies: number;
  numeros_masques: string[];
  message: string;
  canal: string;
  portee: string;
  envoi_reel: boolean;
}
export interface User {
  id: number;
  nom: string;
  email: string;
  role: Role;
  hospital_id: number | null;
}
export interface DashboardStats {
  total_poches_disponibles: number;
  stock_national_par_groupe: { groupe_sanguin: BloodGroup; quantite: number }[];
  nb_hopitaux: number;
  nb_donneurs: number;
  demandes_ouvertes: number;
  alertes_actives: number;
}

export interface LabeledCount {
  label: string;
  value: number;
}
export interface TimePoint {
  date: string;
  value: number;
}
export interface Analytics {
  total_poches_disponibles: number;
  nb_hopitaux: number;
  nb_donneurs: number;
  demandes_ouvertes: number;
  alertes_actives: number;
  poches_expirant_7j: number;
  total_transferts: number;
  dons_6_mois: number;
  stock_par_groupe: LabeledCount[];
  poches_par_statut: LabeledCount[];
  stock_par_hopital: LabeledCount[];
  donneurs_par_groupe: LabeledCount[];
  demandes_par_urgence: LabeledCount[];
  transferts_par_jour: TimePoint[];
  dons_par_mois: TimePoint[];
}

export interface PublicConfig {
  ideal_stock: number;
  low_stock_threshold: number;
}

interface RegionBloodGroupStock {
  groupe_sanguin: BloodGroup;
  quantite: number;
  cible: number;
}
export interface RegionStock {
  nom: string;
  capitale: string;
  population: number;
  coords: [number, number];
  nb_hopitaux: number;
  total_poches: number;
  stock_pct: number;
  statut: "optimal" | "tension" | "critique";
  demandes_urgentes: number;
  groupes: RegionBloodGroupStock[];
}

const TOKEN_KEY = "xeetali_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Handler global déclenché sur 401 (token expiré/invalide) → déconnexion.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // En production (Vercel), VITE_API_URL = URL complète du backend Render.
  // En développement, la variable est vide → chemin relatif géré par le proxy Vite.
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  const url = `${apiBase}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    // Token expiré/invalide sur une route protégée → déconnexion globale.
    if (res.status === 401 && !path.startsWith("/api/auth/")) onUnauthorized?.();
    let detail = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
      else if (Array.isArray(data?.detail))
        detail = data.detail.map((e: { msg: string }) => e.msg).join(" ; ");
    } catch {
      /* corps non-JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<TokenResponse>("POST", "/api/auth/login", { email, password }),
  register: (payload: { nom: string; email: string; password: string; role: Role }) =>
    request<TokenResponse>("POST", "/api/auth/register", payload),

  inventory: () => request<HospitalInventory[]>("GET", "/api/inventory"),

  registerPouch: (payload: {
    groupe_sanguin: BloodGroup;
    hospital_id: number;
    date_prelevement: string;
    date_peremption: string;
  }) => request<Pouch>("POST", "/api/pouches", payload),
  searchPouches: (q: { groupe_sanguin?: BloodGroup; hospital_id?: number; statut?: PouchStatus }) => {
    const p = new URLSearchParams();
    if (q.groupe_sanguin) p.set("groupe_sanguin", q.groupe_sanguin);
    if (q.hospital_id) p.set("hospital_id", String(q.hospital_id));
    if (q.statut) p.set("statut", q.statut);
    return request<Pouch[]>("GET", `/api/pouches/search?${p.toString()}`);
  },
  pouchValidity: (uid: string) =>
    request<PouchValidity>("GET", `/api/pouches/${encodeURIComponent(uid)}/validity`),
  updatePouchStatus: (uid: string, statut: PouchStatus) =>
    request<Pouch>("PATCH", `/api/pouches/${encodeURIComponent(uid)}/status`, { statut }),

  transfer: (payload: {
    source_hospital_id: number;
    target_hospital_id: number;
    groupe_sanguin: BloodGroup;
    quantite: number;
  }) => request<TransferResult>("POST", "/api/transfers", payload),

  createRequest: (payload: {
    hospital_id: number;
    groupe_sanguin: BloodGroup;
    quantite: number;
    urgence: string;
  }) => request<BloodRequest>("POST", "/api/requests", payload),
  updateRequest: (id: number, payload: Partial<BloodRequest>) => request<BloodRequest>("PUT", `/api/requests/${id}`, payload),
  listRequests: () => request<BloodRequest[]>("GET", "/api/requests"),

  myProfile: () => request<DonorProfile>("GET", "/api/donors/me/profile"),
  upsertProfile: (payload: {
    groupe_sanguin: BloodGroup;
    telephone: string;
    localisation: string;
    date_dernier_don?: string | null;
  }) => request<DonorProfile>("PUT", "/api/donors/me/profile", payload),
  myDonations: () => request<Donation[]>("GET", "/api/donors/me/donations"),
  donorStats: () => request<DonorStats>("GET", "/api/donors/me/stats"),
  leaderboard: () => request<LeaderboardEntry[]>("GET", "/api/donors/leaderboard"),
  urgencyStats: () => request<UrgencyStats>("GET", "/api/donors/urgency"),

  collectionPoints: (localisation?: string) =>
    request<CollectionPoint[]>(
      "GET",
      `/api/collection-points${localisation ? `?localisation=${encodeURIComponent(localisation)}` : ""}`,
    ),
  createAppointment: (payload: { collection_point_id: number; date: string }) =>
    request<Appointment>("POST", "/api/appointments", payload),
  myAppointments: () => request<Appointment[]>("GET", "/api/appointments"),

  listAlerts: () => request<Alert[]>("GET", "/api/alerts"),
  createAlert: (payload: { groupe_sanguin: BloodGroup; localisation?: string | null; canal?: string }) =>
    request<AlertDispatch>("POST", "/api/alerts", payload),
  respondAlert: (alertId: number, disponible: boolean) =>
    request<{ alert_id: number; disponible: boolean; instructions: string }>(
      "POST",
      `/api/alerts/${alertId}/respond`,
      { disponible },
    ),

  dashboard: () => request<DashboardStats>("GET", "/api/admin/dashboard"),
  analytics: () => request<Analytics>("GET", "/api/admin/analytics"),
  stockByRegion: () => request<RegionStock[]>("GET", "/api/admin/stock-by-region"),
  listRegions: () => request<Region[]>("GET", "/api/admin/regions"),
  publicConfig: () => request<PublicConfig>("GET", "/api/config/public"),
  listUsers: () => request<User[]>("GET", "/api/admin/users"),
  createUser: (payload: { nom: string; email: string; password: string; role: Role; hospital_id?: number | null }) =>
    request<User>("POST", "/api/admin/users", payload),
  deleteUser: (id: number) => request<void>("DELETE", `/api/admin/users/${id}`),
  listHospitals: () => request<Hospital[]>("GET", "/api/admin/hospitals"),
  createHospital: (payload: { nom: string; region_id: number; type: string }) =>
    request<Hospital>("POST", "/api/admin/hospitals", payload),
  deleteHospital: (id: number) => request<void>("DELETE", `/api/admin/hospitals/${id}`),
  campaign: (payload: { groupe_sanguin: BloodGroup; canal?: string }) =>
    request<AlertDispatch>("POST", "/api/admin/campaigns", payload),
};
