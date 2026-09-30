"use client";

import { createContext, useContext } from "react";
import { portfolioData, type PortfolioData } from "./data";

const EditorialDataContext = createContext<PortfolioData>(portfolioData);

export function EditorialDataProvider({ data, children }: { data?: PortfolioData; children: React.ReactNode }) {
  return <EditorialDataContext.Provider value={data ?? portfolioData}>{children}</EditorialDataContext.Provider>;
}

export function useEditorialData() {
  return useContext(EditorialDataContext);
}
