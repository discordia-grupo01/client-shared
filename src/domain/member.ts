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
