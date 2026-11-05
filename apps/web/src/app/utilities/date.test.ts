import { afterEach, describe, expect, test } from "vitest";
import { localDateTimeToISO, unixSeconds } from "./date";

const originalTimezone = process.env.TZ;

afterEach(() => {
  if (originalTimezone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimezone;
  }
});

describe("unixSeconds", () => {
  test.each(["Pacific/Auckland", "America/Los_Angeles"])(
    "treats timezone-less blockchain timestamps as UTC in %s",
    (timezone) => {
      process.env.TZ = timezone;

      expect(unixSeconds("2026-07-31T07:50:51.000")).toBe(
        Date.parse("2026-07-31T07:50:51.000Z") / 1000,
      );
    },
  );

  test("preserves an explicit timezone offset", () => {
    expect(unixSeconds("2026-07-31T07:50:51.000-04:00")).toBe(
      Date.parse("2026-07-31T07:50:51.000-04:00") / 1000,
    );
  });
});

describe("localDateTimeToISO", () => {
  test("converts local calendar fields to UTC", () => {
    expect(localDateTimeToISO("2026-07-31", "07:50")).toBe(
      new Date(2026, 6, 31, 7, 50).toISOString(),
    );
  });
});
