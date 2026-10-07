import { brand } from "@/lib/brand";

/**
 * Who runs the site, for the privacy policy and terms. Set LEGAL_NAME (the
 * person or company), LEGAL_COUNTRY (whose law applies) and, optionally,
 * LEGAL_ADDRESS. Until they're set the pages show a draft notice and the
 * go-live checklist says what's missing.
 */
export const legal = {
  name: process.env.LEGAL_NAME?.trim() || null,
  country: process.env.LEGAL_COUNTRY?.trim() || null,
  address: process.env.LEGAL_ADDRESS?.trim() || null,
  email: brand.contactEmail,
  /** Change this when the text of either page changes. */
  updated: "7 October 2026",
};

export const legalConfigured = () => Boolean(legal.name && legal.country);
export const operator = () => legal.name ?? "[your name]";
export const governingCountry = () => legal.country ?? "[your country]";
