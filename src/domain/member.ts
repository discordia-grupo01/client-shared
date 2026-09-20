/**
 * El backend solo conoce el `user_id`: el nombre y el avatar se resuelven
 * aparte contra `GET /v1/users/:id`, uno por miembro -- no hay endpoint batch.
 */
export interface Member {
  user_id: string;
  is_owner: boolean;
  joined_at: string;
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
