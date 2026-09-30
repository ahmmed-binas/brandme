"use client";

import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import DeveloperSnapshot from "./components/DeveloperSnapshot";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import EngineeringApproach from "./components/EngineeringApproach";
import Education from "./components/Education";
import Certifications from "./components/Certifications";
import OpenSource from "./components/OpenSource";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import CustomCursor from "./components/CustomCursor";
import { EditorialDataProvider } from "./EditorialDataContext";
import EditorSectionLinker from "./EditorSectionLinker";
import type { PortfolioData } from "./data";

/** This template owns its design tokens; content never controls presentation. */
export default function EditorialDeveloperTemplate({ data }: { data?: PortfolioData }) {
  return <EditorialDataProvider data={data}>
    <div className="editorial-developer" data-template="editorial-developer">
      <EditorSectionLinker />
      <CustomCursor />
      <Navigation />
      <main><Hero /><DeveloperSnapshot /><About /><Experience /><Projects /><Skills /><EngineeringApproach /><Education /><Certifications /><OpenSource /><Services /><Testimonials /><Contact /></main>
      <Footer />
    </div>
  </EditorialDataProvider>;
}
