import { z } from "zod";
import type { RegistrantContact } from "./vercel";

/** "+44 7700 900123" → "+44.7700900123", the registry (EPP) phone format. The country code must be separated. */
export function normalisePhone(value: string): string | null {
  const match = value.trim().match(/^\+(\d{1,3})[\s.-]+([\d\s().-]{4,20})$/);
  if (!match) return null;
  const number = match[2].replace(/\D/g, "");
  return number.length >= 4 && number.length <= 14 ? `+${match[1]}.${number}` : null;
}

const field = (label: string, max = 100) => z.string().trim().min(1, `${label} is required.`).max(max);

/** Registrant details required by ICANN. The buyer is the legal owner of the domain. */
export const contactSchema = z.object({
  firstName: field("First name"),
  lastName: field("Last name"),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().transform((value, context) => {
    const phone = normalisePhone(value);
    if (!phone) context.addIssue({ code: "custom", message: "Enter your phone with its country code, e.g. +44 7700 900123." });
    return phone ?? "";
  }),
  address1: field("Address", 200),
  city: field("City"),
  state: z.string().trim().max(100),
  zip: field("Postcode", 20),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Choose a country."),
}) satisfies z.ZodType<RegistrantContact, unknown>;
