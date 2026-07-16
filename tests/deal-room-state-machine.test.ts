import { describe, expect, it } from "vitest";
import {
  ACTIVE_STATUSES,
  canAgree,
  canFinalize,
  canPropose,
  canTransition,
  isActive,
  isTerminal,
  TERMINAL_STATUSES,
} from "@/lib/deal-rooms/state-machine";
import type { DealRoomStatus } from "@/lib/types";

const ALL: DealRoomStatus[] = [
  "open",
  "agreed",
  "signed",
  "settled",
  "declined",
  "cancelled",
  "expired",
  "superseded",
];

describe("deal room state machine", () => {
  it("happy path: open → agreed → signed → settled", () => {
    expect(canTransition("open", "agreed")).toBe(true);
    expect(canTransition("agreed", "signed")).toBe(true);
    expect(canTransition("signed", "settled")).toBe(true);
  });

  it("a new revision reopens an agreed room", () => {
    expect(canTransition("agreed", "open")).toBe(true);
  });

  it("a cancelled final offer reopens a signed room to agreed", () => {
    expect(canTransition("signed", "agreed")).toBe(true);
  });

  it("terminal states accept no transitions", () => {
    for (const from of TERMINAL_STATUSES) {
      for (const to of ALL) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it("never allows skipping agreement: open → signed is illegal", () => {
    expect(canTransition("open", "signed")).toBe(false);
  });

  it("never allows settling an unsigned room", () => {
    expect(canTransition("open", "settled")).toBe(false);
    expect(canTransition("agreed", "settled")).toBe(false);
  });

  it("terminal and active sets partition all statuses", () => {
    for (const s of ALL) {
      expect(isTerminal(s) !== isActive(s)).toBe(true);
      expect(TERMINAL_STATUSES.has(s) || ACTIVE_STATUSES.has(s)).toBe(true);
    }
  });

  it("guards: propose only while negotiating, agree only when open, finalize only when agreed", () => {
    expect(canPropose("open")).toBe(true);
    expect(canPropose("agreed")).toBe(true);
    expect(canPropose("signed")).toBe(false);
    expect(canPropose("settled")).toBe(false);

    expect(canAgree("open")).toBe(true);
    expect(canAgree("agreed")).toBe(false);
    expect(canAgree("signed")).toBe(false);

    expect(canFinalize("agreed")).toBe(true);
    expect(canFinalize("open")).toBe(false);
    expect(canFinalize("signed")).toBe(false);
  });
});
