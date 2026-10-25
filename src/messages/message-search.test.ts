import { describe, expect, it } from "vitest";

import {
  MESSAGE_SEARCH_FAILED,
  MESSAGE_SEARCH_PAGE_FAILED,
  MESSAGE_SEARCH_RATE_LIMITED,
  messageAttachmentsCount,
  messageSearchErrorFor,
  messageSearchResultsCount,
} from "./message-search";

describe("messageSearchResultsCount", () => {
  it("singular, plural y tope", () => {
    expect(messageSearchResultsCount(1)).toBe("1 resultado");
    expect(messageSearchResultsCount(15)).toBe("15 resultados");
    expect(messageSearchResultsCount(1000, true)).toBe("1000+ resultados");
  });
});

describe("messageSearchErrorFor", () => {
  it("traduce los codigos del back y el rate limit del gateway", () => {
    expect(messageSearchErrorFor("INVALID_CURSOR")).toBe(
      MESSAGE_SEARCH_PAGE_FAILED,
    );
    expect(messageSearchErrorFor(undefined, 429)).toBe(
      MESSAGE_SEARCH_RATE_LIMITED,
    );
    expect(messageSearchErrorFor("OTRA_COSA", 500)).toBe(MESSAGE_SEARCH_FAILED);
  });
});

describe("messageAttachmentsCount", () => {
  it("singular y plural", () => {
    expect(messageAttachmentsCount(1)).toBe("1 adjunto");
    expect(messageAttachmentsCount(3)).toBe("3 adjuntos");
  });
});
