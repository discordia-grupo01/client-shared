export interface MemberProfile {
  name: string;
  avatar_url: string;
  description: string;
  status_text: string;
  status_emoji: string;
}

export interface Member {
  user_id: string;
  is_owner: boolean;
  joined_at: string;
  profile?: MemberProfile | null;
  /** Hasta cuando esta silenciado (ISO); `null` o ausente si no lo esta. */
  muted_until?: string | null;
  /** Ids de sus roles (`@everyone` incluido); se cruzan con `GET /roles`. */
  role_ids?: string[];
}

/** Paginado: el back usa limit 20 por defecto y corta en 100. */
export interface MemberListResponse {
  members: Member[];
  total: number;
  limit: number;
  offset: number;
}

export type ListMembersResult =
  | { ok: true; members: Member[]; total: number }
  | { ok: false; message: string };

/**
 * `Member` ya cruzado con su perfil publico. Lo arma el front, por eso va en
 * camelCase: las entidades que espejan la API van en snake_case.
 */
export interface MemberInfo {
  userId: string;
  name: string;
  avatarUrl: string | null;
  roleIds: string[];
}

export interface MemberPageQuery {
  search?: string;
  limit?: number;
  offset?: number;
  hasRole?: boolean;
}

export function memberPageQueryString(query: MemberPageQuery): string {
  const params: string[] = [];
  const search = query.search?.trim() ?? "";
  if (search !== "") params.push(`q=${encodeURIComponent(search)}`);
  if (query.hasRole === false) params.push("has_role=false");
  if (query.limit != null) params.push(`limit=${query.limit}`);
  if (query.offset) params.push(`offset=${query.offset}`);
  return params.length > 0 ? `?${params.join("&")}` : "";
}

export function appendMembersPage(
  loaded: readonly Member[],
  page: readonly Member[],
): Member[] {
  const seen = new Set(loaded.map((member) => member.user_id));
  return [...loaded, ...page.filter((member) => !seen.has(member.user_id))];
}
