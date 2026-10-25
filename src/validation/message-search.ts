import {
  MAX_MESSAGE_SEARCH_LENGTH,
  MESSAGE_SEARCH_PAGE_SIZE,
} from "../constants/limits";
import type { MessageSearchQuery } from "../domain/message-search";
import {
  MESSAGE_SEARCH_EMPTY_QUERY,
  MESSAGE_SEARCH_TEXT_TOO_LONG,
} from "../messages/message-search";

export function normalizeMessageSearchQuery(
  query: MessageSearchQuery,
): MessageSearchQuery {
  return { text: query.text.trim(), authorId: query.authorId || null };
}

export function validateMessageSearch(
  query: MessageSearchQuery,
): string | undefined {
  const { text, authorId } = normalizeMessageSearchQuery(query);
  if (!text && !authorId) return MESSAGE_SEARCH_EMPTY_QUERY;
  if ([...text].length > MAX_MESSAGE_SEARCH_LENGTH) {
    return MESSAGE_SEARCH_TEXT_TOO_LONG;
  }
  return undefined;
}

export function messageSearchParams(
  query: MessageSearchQuery,
  before?: string | null,
): Record<string, string> {
  const { text, authorId } = normalizeMessageSearchQuery(query);
  const params: Record<string, string> = {
    limit: String(MESSAGE_SEARCH_PAGE_SIZE),
  };
  if (text) params.q = text;
  if (authorId) params.author_id = authorId;
  if (before) params.before = before;
  return params;
}
