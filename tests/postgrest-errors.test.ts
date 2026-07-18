import { describe, expect, it } from "vitest";
import { isMissingPostgrestColumn } from "@/lib/db/postgrest-errors";

describe("isMissingPostgrestColumn", () => {
  it("recognizes PostgREST schema-cache missing-column errors", () => {
    expect(
      isMissingPostgrestColumn(
        {
          code: "PGRST204",
          message: "Could not find the 'rarity_rank' column in the schema cache",
        },
        "rarity_rank",
      ),
    ).toBe(true);
  });

  it("recognizes PostgreSQL undefined-column errors", () => {
    expect(
      isMissingPostgrestColumn(
        { code: "42703", details: "column required_max_rarity_rank does not exist" },
        "required_max_rarity_rank",
      ),
    ).toBe(true);
  });

  it("does not hide unrelated database failures", () => {
    expect(
      isMissingPostgrestColumn(
        { code: "23505", message: "duplicate key rarity_rank" },
        "rarity_rank",
      ),
    ).toBe(false);
    expect(isMissingPostgrestColumn(null, "rarity_rank")).toBe(false);
  });
});
