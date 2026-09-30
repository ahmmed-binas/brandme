"use client";

import { Download, FileImage, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";

type RenderedPage = { dataUrl: string; page: number };

export default function PdfToImageStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [status, setStatus] = useState("Drop a PDF to begin.");
  const [working, setWorking] = useState(false);

  async function convert(file: File) {
    if (file.type !== "application/pdf") { setStatus("Choose a PDF file to continue."); return; }
    if (file.size > 25 * 1024 * 1024) { setStatus("This free browser tool supports PDFs up to 25MB."); return; }
    setWorking(true); setPages([]); setFileName(file.name); setStatus("Opening your PDF locally…");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const pdfDocument = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const rendered: RenderedPage[] = [];
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        setStatus(`Rendering page ${pageNumber} of ${pdfDocument.numPages}…`);
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.65 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable in this browser.");
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        rendered.push({ dataUrl: canvas.toDataURL("image/png"), page: pageNumber });
      }
      setPages(rendered); setStatus(`${rendered.length} page${rendered.length === 1 ? "" : "s"} ready to download as PNG.`);
    } catch {
      setStatus("We couldn’t read that PDF. Try another file or a smaller PDF.");
    } finally { setWorking(false); }
  }

  return <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900 sm:p-7">
    <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) void convert(file); }} />
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Active tool</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">PDF → PNG</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">High-quality pages, processed only in your browser.</p></div><button type="button" onClick={() => inputRef.current?.click()} disabled={working} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-slate-950"><Upload size={16} /> {working ? "Converting" : "Select PDF"}</button></div>
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-white/15 dark:bg-white/5"><p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">{working ? <LoaderCircle className="animate-spin text-violet-600" size={18} /> : <FileImage className="text-violet-600" size={18} />}{status}</p>{fileName && <p className="mt-2 truncate text-xs text-slate-500">{fileName}</p>}</div>
    {pages.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2">{pages.map(({ dataUrl, page }) => <div key={page} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"><img src={dataUrl} alt={`Preview of PDF page ${page}`} className="h-48 w-full object-contain" /><a href={dataUrl} download={`${fileName.replace(/\.pdf$/i, "") || "page"}-${page}.png`} className="flex items-center justify-center gap-2 border-t border-slate-200 px-4 py-3 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:border-white/10 dark:text-violet-300 dark:hover:bg-white/5"><Download size={15} /> Download page {page}</a></div>)}</div>}
  </div>;
}
