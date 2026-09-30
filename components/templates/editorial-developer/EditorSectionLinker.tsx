"use client";

import { useEffect } from "react";

const sectionMap: Record<string, string> = {
  top: "identity", snapshot: "identity", about: "about", projects: "projects", experience: "experience", skills: "skills",
};

/** Enables preview-to-editor navigation only when this template is embedded in its editor iframe. */
export default function EditorSectionLinker() {
  useEffect(() => {
    const select = (event: MouseEvent) => {
      if (window.parent === window) return;
      const section = (event.target as HTMLElement).closest("section[id]")?.id;
      const editorSection = section ? sectionMap[section] : undefined;
      if (editorSection) window.parent.postMessage({ type: "editorial-select-section", section: editorSection }, window.location.origin);
    };
    document.addEventListener("click", select);
    return () => document.removeEventListener("click", select);
  }, []);
  return null;
}
