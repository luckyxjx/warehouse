import { Decimal } from "@prisma/client/runtime/library";

export function toNumber(value: Decimal | number | string): number {
  return Number(value);
}

export function money(value: Decimal | number | string | null | undefined): number {
  return Number((Number(value ?? 0)).toFixed(2));
}
