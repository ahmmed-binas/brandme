"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Light for everyone by default (owner's choice, October 2026), whatever the
 * device's own setting. Visitors can still switch to dark with the moon button,
 * and that choice is remembered. The new storage key starts everyone afresh
 * on light, including browsers that remembered dark before this change.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="fuccura-theme"
      enableColorScheme
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
