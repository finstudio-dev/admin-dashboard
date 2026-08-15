export type Role = "member" | "admin";
export type MemberStatus = "pending" | "active" | "suspended";
export type DepositMethod = "bkash" | "nagad" | "rocket" | "bank" | "cash" | "other";
export type DepositStatus = "pending" | "approved" | "rejected";
export type OrgCategory =
  | "late_fee"
  | "membership_fee"
  | "org_upgrade"
  | "expense"
  | "adjustment"
  | "other";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: MemberStatus;
  created_at: string;
}

export interface Deposit {
  id: string;
  member_id: string;
  amount: number;
  method: DepositMethod;
  transaction_ref: string | null;
  note: string | null;
  receipt_url: string | null;
  period_month: string;
  status: DepositStatus;
  source: "member" | "admin";
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_note: string | null;
  profiles?: Profile;
}

export interface OrgBalanceEntry {
  id: string;
  amount: number;
  category: OrgCategory;
  description: string | null;
  created_by: string;
  created_at: string;
  profiles?: Profile;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles?: Profile;
}

export interface OrgSettings {
  id: true;
  org_name: string;
  logo_url: string | null;
  updated_by: string | null;
  updated_at: string;
}
