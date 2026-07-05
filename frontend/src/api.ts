// Client API typé vers le Node Central Xéétali.

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export interface StockLine {
  groupe_sanguin: BloodGroup;
  quantite: number;
}

export interface HospitalInventory {
  hospital_id: number;
  nom: string;
  localisation: string;
  type: string;
  stocks: StockLine[];
}

export interface TransferPayload {
  source_hospital_id: number;
  target_hospital_id: number;
  groupe_sanguin: BloodGroup;
  quantite: number;
}

export interface TransferResult {
  id: number;
  statut: string;
  quantite: number;
  groupe_sanguin: BloodGroup;
}

// Erreur applicative portant le code HTTP et un message propre (issu du backend).
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<never> {
  let detail = `Erreur ${res.status}`;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") {
      detail = body.detail;
    } else if (Array.isArray(body?.detail)) {
      // Erreurs de validation Pydantic (422).
      detail = body.detail.map((e: { msg: string }) => e.msg).join(" ; ");
    }
  } catch {
    /* corps non-JSON : on garde le message générique */
  }
  throw new ApiError(res.status, detail);
}

export async function fetchInventory(): Promise<HospitalInventory[]> {
  const res = await fetch("/api/inventory");
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function createTransfer(payload: TransferPayload): Promise<TransferResult> {
  const res = await fetch("/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}
