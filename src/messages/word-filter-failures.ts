import type { ApiFailure } from "../domain/api-result";

import { SESSION_EXPIRED_MESSAGE } from "./errors";
import { BANNED_WORDS_LOAD_FAILED, BANNED_WORDS_SAVE_FAILED } from "./actions";
import { messageFor } from "./message-for";
import { NO_PERMISSION_WORD_FILTER } from "./permissions";
import { WORD_FILTER_REASONS } from "./reasons";

/** Texto de un fallo de `GET /servers/:id/banned-words`, igual en las dos apps. */
export function listBannedWordsFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  if (failure.status === 403) return NO_PERMISSION_WORD_FILTER;
  return messageFor(failure, {}, BANNED_WORDS_LOAD_FAILED);
}

/** Texto de un fallo de `PUT /servers/:id/banned-words`, igual en las dos apps. */
export function saveBannedWordsFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return messageFor(
    failure,
    WORD_FILTER_REASONS,
    failure.status === 403
      ? NO_PERMISSION_WORD_FILTER
      : BANNED_WORDS_SAVE_FAILED,
  );
}
