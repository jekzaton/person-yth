import type { Account } from "@/db/schema/tbl_account";

// ==========================================
// 1. ACCOUNT ROLE / STATUS
// ==========================================

export type PersonRole = Account["ac_role"];

export type PersonStatus = 0 | 1;

export type PersonStatusFilter = "all" | "active" | "inactive";

export type PersonRoleFilter = "all" | PersonRole;

type PersonDatabaseFields = Pick<
  Account,
  | "ac_id"
  | "ac_cid"
  | "ac_username"
  | "ac_hn"
  | "ac_pname"
  | "ac_fname"
  | "ac_lname"
  | "ac_pname_eng"
  | "ac_fname_eng"
  | "ac_lname_eng"
  | "ac_email"
  | "ac_phone_number"
  | "dep_id"
  | "ps_id"
  | "ps_type_id"
  | "img_profile"
  | "level"
  | "ac_active"
  | "ac_role"
>;

export type PersonItem = PersonDatabaseFields & {
  createdAt: string;
  updatedAt: string;
  ps_name?: string | null;
  dep_name?: string | null;
  ps_name_type?: string | null;
  ac_birthday: string | null;
  ac_nickname: string | null;
  img_profile?: string | null;
};

// ==========================================
// 3. QUERY PARAMETERS
// ==========================================

export interface PersonQueryParams {
  page?: number;
  limit?: number;

  search?: string;

  status?: PersonStatusFilter;
  role?: PersonRoleFilter;

  dep_id?: number;
}

// ==========================================
// 4. PAGINATION
// ==========================================

export interface PersonPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==========================================
// 5. STATISTICS
// ==========================================

export interface PersonStats {
  total: number;
  active: number;
  inactive: number;
}

// ==========================================
// 6. API RESPONSE
// ==========================================

export interface PersonListResponse {
  success: true;
  message: string;

  data: PersonItem[];

  pagination: PersonPagination;
  stats: PersonStats;
}

// ==========================================
// 7. API ERROR RESPONSE
// ==========================================

export interface PersonErrorResponse {
  success: false;
  message: string;
}

export type PersonApiResponse = PersonListResponse | PersonErrorResponse;

// ==========================================
// 8. COMPONENT PROPS
// ==========================================

export interface PersonListProps {
  data: PersonItem[];
  isLoading?: boolean;

  pagination?: PersonPagination;
  stats?: PersonStats;

  onEdit?: (person: PersonItem) => void;
  onView?: (person: PersonItem) => void;
}

// ==========================================
// 9. DEFAULT VALUES
// ==========================================

export const DEFAULT_PERSON_PAGINATION: PersonPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export const DEFAULT_PERSON_STATS: PersonStats = {
  total: 0,
  active: 0,
  inactive: 0,
};

// ==========================================
// 10. DEFAULT FILTERS
// ==========================================

export const DEFAULT_PERSON_QUERY: Required<Omit<PersonQueryParams, "dep_id">> =
  {
    page: 1,
    limit: 10,
    search: "",
    status: "all",
    role: "all",
  };

export type PersonDetail = {
  ac_id: number;
  ac_cid: string | null;
  ac_birthday: string | null;
  ac_username: string | null;
  ac_nickname: string | null;
  ac_pname: string | null;
  ac_fname: string;
  ac_lname: string;
  ac_pname_eng: string | null;
  ac_fname_eng: string | null;
  ac_lname_eng: string | null;
  ac_email: string | null;
  ac_phone_number: string | null;
  ac_hn: string | null;
  dep_id: number | null;
  ps_id: number | null;
  ps_type_id: number | null;
  ac_certificate_number: string | null;
  ac_role: "admin" | "member" | "user";
  level: number;
  ac_active: number;
  dep_name?: string | null;
  ps_name?: string | null;
  ps_type_name?: string | null;
};
