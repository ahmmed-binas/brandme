"use client";
import { useCallback, useMemo, useState, type ChangeEvent, type DragEvent, type FocusEvent, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import {
  getFileType,
  extractFileContent,
  cleanOCRText,
  extractOCRJSON,
} from "@/utils/FileExtraction";
import LoadingBars from "@/utils/LoadingUI";
import InfoCloud from "@/utils/cloudInfo";

const UPLOAD_GIF_SRC = "/uploadcv.gif";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  name: string;
  professional_title: string;
  about_yourself_sm: string;
  summary_about_yourself: string;
  github_link: string;
  linkedin_link: string;
  instagram_link: string;
  email: string;
  phone: string;
  address: string;
  skills: string;
  experience: string;
  education: string;
  institutions: string[];
}

interface ProjectEntry {
  project_name: string;
  project_pic: string;
  project_summary: string;
  project_file?: File;
}

interface EducationEntry {
  institution: string;
  subject: string;
  startDate: string;
  endDate: string;
  place: string;
}

interface ExperienceEntry {
  work_institution_name: string;
  work_title: string;
  place_of_work: string;
  link_for_company: string;
  work_summary: string;
  start_date: string;
  end_date: string;
  technologies: string[];
}

type WordCountField =
  | "nameInput"
  | "proTitleInput"
  | "about_yourself_smInput"
  | "about_yrselfInput"
  | "about_ProjectInput"
  | "about_WorkInput"
  | "project_NameInput";

const EMPTY_FORM_DATA: FormData = {
  name: "",
  professional_title: "",
  about_yourself_sm: "",
  summary_about_yourself: "",
  github_link: "",
  linkedin_link: "",
  instagram_link: "",
  email: "",
  phone: "",
  address: "",
  skills: "",
  experience: "",
  education: "",
  institutions: [],
};

const EMPTY_PROJECT: ProjectEntry = {
  project_name: "",
  project_pic: "",
  project_summary: "",
};

const EMPTY_EDUCATION: EducationEntry = {
  institution: "",
  subject: "",
  startDate: "",
  endDate: "",
  place: "",
};

const EMPTY_EXPERIENCE: ExperienceEntry = {
  work_institution_name: "",
  work_title: "",
  place_of_work: "",
  link_for_company: "",
  work_summary: "",
  start_date: "",
  end_date: "",
  technologies: [""],
};

const WORD_LIMITS: Record<WordCountField, number> = {
  nameInput: 25,
  proTitleInput: 15,
  about_yourself_smInput: 65,
  about_yrselfInput: 800,
  about_ProjectInput: 300,
  about_WorkInput: 300,
  project_NameInput: 20,
};

const EMPTY_WORD_COUNT: Record<WordCountField, number> = {
  nameInput: 0,
  proTitleInput: 0,
  about_yourself_smInput: 0,
  about_yrselfInput: 0,
  about_ProjectInput: 0,
  about_WorkInput: 0,
  project_NameInput: 0,
};

/** Places the cursor at the end of an element after a manual DOM insert. */
function insertLineBreak(editable: HTMLDivElement) {
  editable.focus();
  const selection = window.getSelection();
  if (!selection) return;

  if (!selection.rangeCount || !editable.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(editable);
    fallbackRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(fallbackRange);
  }

  const range = selection.getRangeAt(0);
  const br = document.createElement("br");
  range.insertNode(br);

  // Zero-width space keeps the caret visible after a trailing <br>.
  const zeroWidth = document.createTextNode("\u200B");
  range.setStartAfter(br);
  range.insertNode(zeroWidth);
  range.setStartAfter(zeroWidth);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function DetailExtractorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);
  const [cvText, setCvText] = useState("");

  const [projects, setProjects] = useState<ProjectEntry[]>([{ ...EMPTY_PROJECT }]);
  const [education, setEducation] = useState<EducationEntry[]>([{ ...EMPTY_EDUCATION }]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([{ ...EMPTY_EXPERIENCE }]);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [activeInput, setActiveInput] = useState<WordCountField | null>(null);
  const [wordCount, setWordCount] = useState<Record<WordCountField, number>>(EMPTY_WORD_COUNT);

  const filetype = file ? getFileType(file) : null;

  // ================= FILE HANDLERS =================
  const processFile = useCallback(async (fileToProcess: File) => {
    setLoading(true);
    setProgress(0);
    try {
      const rawContent = await extractFileContent(fileToProcess, (p: number) =>
        setProgress(Math.round(p * 100))
      );
      const cleanContent = cleanOCRText(rawContent);
      setCvText(cleanContent);

      const extracted = extractOCRJSON(cleanContent) ?? {};
      setFormData((prev) => ({
        ...prev,
        name: extracted.name ?? prev.name,
        email: extracted.email ?? prev.email,
        phone: extracted.phone ?? prev.phone,
        address: extracted.address ?? prev.address,
        linkedin_link: extracted.linkedin ?? prev.linkedin_link,
        github_link: extracted.github ?? prev.github_link,
        skills: extracted.skills ?? prev.skills,
        experience: extracted.experience ?? prev.experience,
        education: extracted.education ?? prev.education,
        institutions: extracted.institutions ?? prev.institutions,
      }));
    } catch (err) {
      console.error("CV extraction failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    void processFile(selected);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setFile(dropped);
    void processFile(dropped);
  };

  // ================= INPUT HANDLERS =================
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEducationChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEducation((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [name]: value } : entry))
    );
  };

  const handleProjectChange = (
    index: number,
    e: { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setProjects((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [name]: value } : entry))
    );
  };

  const handleProjectImageChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const previewUrl = URL.createObjectURL(selected);
    setProjects((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, project_pic: previewUrl, project_file: selected } : entry
      )
    );
  };

  const handleExperienceChange = (
    index: number,
    e: { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setExperience((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [name]: value } : entry))
    );
  };

  const handleTechnologyChange = (expIndex: number, techIndex: number, value: string) => {
    setExperience((prev) =>
      prev.map((entry, i) =>
        i === expIndex
          ? {
              ...entry,
              technologies: entry.technologies.map((tech, t) => (t === techIndex ? value : tech)),
            }
          : entry
      )
    );
  };

  // ================= ADD / DELETE =================
  const addEducation = () => setEducation((prev) => [...prev, { ...EMPTY_EDUCATION }]);
  const deleteEducation = (index: number) =>
    setEducation((prev) => prev.filter((_, i) => i !== index));

  const addProject = () => setProjects((prev) => [...prev, { ...EMPTY_PROJECT }]);
  const deleteProject = (index: number) =>
    setProjects((prev) => prev.filter((_, i) => i !== index));

  const addExperience = () => setExperience((prev) => [...prev, { ...EMPTY_EXPERIENCE, technologies: [""] }]);
  const deleteExperience = (index: number) =>
    setExperience((prev) => prev.filter((_, i) => i !== index));

  const addTechnology = (expIndex: number) =>
    setExperience((prev) =>
      prev.map((entry, i) =>
        i === expIndex ? { ...entry, technologies: [...entry.technologies, ""] } : entry
      )
    );

  const deleteTechnology = (expIndex: number, techIndex: number) =>
    setExperience((prev) =>
      prev.map((entry, i) =>
        i === expIndex
          ? { ...entry, technologies: entry.technologies.filter((_, t) => t !== techIndex) }
          : entry
      )
    );

  // ================= WORD COUNT =================
  const handleFocus = (field: WordCountField) => setActiveInput(field);

  const handleWordCount = (
    e: ChangeEvent<HTMLInputElement> | { currentTarget: HTMLDivElement },
    field: WordCountField
  ) => {
    const target = e.currentTarget as HTMLInputElement | HTMLDivElement;
    const text = "isContentEditable" in target && target.isContentEditable
      ? target.innerText
      : (target as HTMLInputElement).value ?? "";
    setWordCount((prev) => ({ ...prev, [field]: text.length }));
  };

  const currentCount = activeInput ? wordCount[activeInput] : 0;
  const currentLimit = activeInput ? WORD_LIMITS[activeInput] : 20;
  const progressPercentage = useMemo(() => {
    const pct = (currentCount / currentLimit) * 100;
    return Number.isNaN(pct) ? 0 : Math.min(pct, 100);
  }, [currentCount, currentLimit]);

  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercentage / 100) * circumference;

  // ================= RICH TEXT HELPERS =================
  const applyBold = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    document.execCommand("bold");
  };

  const insertLineBreakInto = (elementId: string) => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const editable = document.getElementById(elementId) as HTMLDivElement | null;
    if (editable) insertLineBreak(editable);
  };

  const handleEditableKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    insertLineBreak(e.currentTarget);
  };

  const trimEditableOnInput = (
    e: FormEvent<HTMLDivElement>,
    field: WordCountField,
    maxChars: number
  ) => {
    const el = e.currentTarget;
    handleWordCount({ currentTarget: el }, field);
    if (el.innerText.length <= maxChars) return;

    el.innerText = el.innerText.substring(0, maxChars);
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  // ================= SUBMIT =================
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Build the website payload from the fields currently displayed in this
    // form, so the submitted template reflects user edits as well as AI data.
    const getPlainText = (value: string) => {
      const element = document.createElement("div");
      element.innerHTML = value;
      return element.innerText.trim();
    };

    const portfolioData = {
      name: formData.name.trim(),
      professional_title: formData.professional_title.trim(),
      tagline: formData.about_yourself_sm.trim(),
      summary: formData.summary_about_yourself
        ? [getPlainText(formData.summary_about_yourself)]
        : [],
      github: formData.github_link.trim(),
      linkedin: formData.linkedin_link.trim(),
      instagram: formData.instagram_link.trim(),
      email: formData.email.trim(),
      skills: formData.skills.split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean),
      projects: projects
        .filter((project) => project.project_name.trim() || project.project_summary.trim())
        .map((project) => ({
          title: project.project_name.trim(),
          description: getPlainText(project.project_summary),
          image: project.project_pic || undefined,
        })),
      experience: experience
        .filter((job) => job.work_title.trim() || job.work_institution_name.trim())
        .map((job) => ({
          job_title: job.work_title.trim(),
          company: job.work_institution_name.trim(),
          location: job.place_of_work.trim(),
          website: job.link_for_company.trim(),
          start_date: job.start_date,
          end_date: job.end_date,
          description: getPlainText(job.work_summary),
          technologies: job.technologies.map((item) => item.trim()).filter(Boolean),
        })),
    };

    sessionStorage.setItem("portfolioData", JSON.stringify(portfolioData));
    const selectedTemplate = new URLSearchParams(window.location.search).get("template") || "template-one";
    window.location.assign(`/templates/${selectedTemplate}`);
  };

  function mapAIDataToForm(aiData: any) {

  return {

    form: {
      name: aiData.name || "",
      professional_title: aiData.professional_title || "",

      about_yourself_sm:
        aiData.summary?.slice(0, 65) || "",

      summary_about_yourself:
        aiData.summary || "",

      email: aiData.email || "",
      phone: aiData.phone || "",
      address: aiData.address || "",

      linkedin_link:
        aiData.linkedin || "",

      github_link:
        aiData.github || "",

      instagram_link: "",

      skills:
        Array.isArray(aiData.skills)
          ? aiData.skills.join(", ")
          : "",

    },


    experience:
      (aiData.experience || []).map((exp:any)=>({

        work_institution_name:
          exp.company || "",

        work_title:
          exp.job_title || "",

        place_of_work:
          exp.location || "",

        link_for_company:
          "",

        work_summary:
          exp.description || "",

        start_date:
          exp.start_date || "",

        end_date:
          exp.end_date || "",

        technologies:
          exp.technologies || [""]

      })),



    education:

      (aiData.education || []).map((edu:any)=>({

        institution:
          edu.institution || "",

        subject:
          edu.degree || "",

        startDate:
          edu.start_date || "",

        endDate:
          edu.end_date || "",

        place:
          edu.location || ""

      })),


    projects:

      (aiData.projects || []).map((project:any)=>({

        project_name:
          project.name || "",

        project_pic:
          "",

        project_summary:
          project.description || ""

      }))

  };

}
const handleAIProcess = async () => {
  if (!cvText.trim()) {
    setAiError("Upload a CV first — there's no text to summarize yet.");
    return;
  }

  setAiLoading(true);
  setAiError(null);

  try {
    const response = await fetch(
      "http://localhost:5000/api/ai/generate-summary",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv_text: cvText,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI summary request failed (${response.status})`);
    }

    const aiData = await response.json();

    console.log("FINAL AI DATA:", aiData);

    // server.js returns 200 OK even on failure paths, using
    // { error: ... } or { warning: ..., raw: ... } instead of a
    // proper HTTP error status — so response.ok alone won't catch
    // these. Check explicitly before touching form state.
    if (aiData.error) {
      setAiError(aiData.error);
      return;
    }

    if (aiData.warning) {
      console.warn("AI warning:", aiData.warning, aiData.raw);
      setAiError(
        "The AI response wasn't fully usable — some fields may be missing. You can fill them in manually."
      );
      // Fall through: some paths still return partial/raw data worth
      // keeping in the form, so we don't `return` here.
    }

    // -------- MAIN FORM DATA --------

    setFormData((prev) => ({
      ...prev,

      name:
        aiData.name || prev.name,

      professional_title:
        aiData.professional_title || prev.professional_title,


      about_yourself_sm:
        aiData.summary
          ? aiData.summary.substring(0,65)
          : prev.about_yourself_sm,


  

      summary_about_yourself:
        aiData.summary || prev.summary_about_yourself,


      email:
        aiData.email || prev.email,


      phone:
        aiData.phone || prev.phone,


      address:
        aiData.address || prev.address,


      linkedin_link:
        aiData.linkedin || prev.linkedin_link,


      github_link:
        aiData.github || prev.github_link,


      skills:
        Array.isArray(aiData.skills)
          ? aiData.skills.join(", ")
          : prev.skills

    }));





    // -------- SUMMARY EDITOR --------

    const editor =
      document.getElementById("summaryEditor");


    if (editor && aiData.summary) {
      editor.innerText = aiData.summary;
    }




    // -------- EXPERIENCE --------

    if (
      Array.isArray(aiData.experience) &&
      aiData.experience.length > 0
    ) {

      setExperience(
        aiData.experience.map((exp:any)=>({

          work_institution_name:
            exp.company || "",

          work_title:
            exp.job_title || "",

          place_of_work:
            exp.location || "",

          link_for_company:
            "",

          work_summary:
            exp.description || "",

          start_date:
            exp.start_date || "",

          end_date:
            exp.end_date || "",

          technologies:
            exp.technologies?.length
              ? exp.technologies
              : [""]

        }))
      );

    }




    // -------- EDUCATION --------

    if (
      Array.isArray(aiData.education) &&
      aiData.education.length > 0
    ) {

      setEducation(
        aiData.education.map((edu:any)=>({

          institution:
            edu.institution || "",

          subject:
            edu.degree || "",

          startDate:
            edu.start_date || "",

          endDate:
            edu.end_date || "",

          place:
            edu.location || ""

        }))
      );

    }




    // -------- PROJECTS --------

    if (
      Array.isArray(aiData.projects) &&
      aiData.projects.length > 0
    ) {

      setProjects(
        aiData.projects.map((project:any)=>({

          project_name:
            project.name || "",

          project_pic:
            "",

          project_summary:
            project.description || ""

        }))
      );

    }



    // -------- SAVE FOR TEMPLATE PREVIEW --------
    // Lets TemplateChooser render the same data via TemplateTSXOne
    // whenever the user navigates there, without prop drilling across
    // routes. Shaped to match PortfolioData, not the internal
    // formData/experience/education/projects state above.

    const previewData = {
      name: aiData.name || formData.name || "",
      professional_title: aiData.professional_title || formData.professional_title || "",
      tagline: formData.about_yourself_sm || formData.summary_about_yourself || "",
      summary: aiData.summary ? [aiData.summary] : [],
      github: aiData.github || formData.github_link || "",
      linkedin: aiData.linkedin || formData.linkedin_link || "",
      instagram: formData.instagram_link || "",
      email: aiData.email || formData.email || "",
      skills: Array.isArray(aiData.skills) ? aiData.skills : [],
      projects: Array.isArray(aiData.projects)
        ? aiData.projects.map((p: any) => ({
            title: p.name || "",
            description: p.description || "",
            technologies: p.technologies || [],
            github: p.github || "",
            live_url: p.live_url || "",
          }))
        : [],
      experience: Array.isArray(aiData.experience)
        ? aiData.experience.map((exp: any) => ({
            job_title: exp.job_title || "",
            company: exp.company || "",
            location: exp.location || "",
            start_date: exp.start_date || "",
            end_date: exp.end_date || "",
            description: exp.description || "",
            technologies: exp.technologies || [],
          }))
        : [],
    };

    sessionStorage.setItem("portfolioData", JSON.stringify(previewData));



  } catch (error) {

    console.error(
      "AI summary error:",
      error
    );

    setAiError(
      "Couldn't generate a summary right now. Please try again."
    );

  } finally {

    setAiLoading(false);

  }
};
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      {loading && <LoadingBars message="Loading" progress={progress} />}

      <div className="mx-auto mb-6 max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Portfolio studio</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Build it your way.</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Edit every word, project, image, and experience manually—or import a CV to use as a starting point. Nothing is published until you choose to preview it.</p>
      </div>
      <div className="mx-auto flex w-full max-w-5xl min-h-[680px] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left Section - CV Upload */}
        <div className="w-1/2 flex flex-col items-center justify-center border-r border-gray-300 p-4">
          <h2 className="text-xl md:text-2xl font-extrabold mb-2 text-center text-gray-800 tracking-wide font-sans">
            Start with your details
          </h2>
          <h3 className="text-sm md:text-base font-medium text-center text-gray-500 tracking-wide font-sans">
            Import is optional. You can fill in every field manually.
          </h3>

          <div
            className={`flex flex-col items-center mt-3 w-full p-4 border-2 border-dashed rounded-lg ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={UPLOAD_GIF_SRC} alt="Upload CV" className="w-full h-full object-contain" />
            </div>

            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-gray-200 hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 text-gray-700 px-6 py-2 rounded-lg shadow-sm hover:shadow-lg font-medium mt-3"
            >
              Upload CV
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
              className="hidden"
            />

            {file && <p className="text-sm mt-2 text-gray-600">Selected file: {file.name}</p>}
            {dragActive && <p className="text-sm mt-1 text-blue-500">Drop the file here...</p>}
          </div>

          <p className="mt-5 rounded-lg bg-blue-50 p-3 text-center text-xs leading-5 text-blue-900">AI-assisted import is optional. Connect an AI provider only after reviewing its privacy terms and explicitly consenting to share your information.</p>

          <button
            type="button"
            disabled={aiLoading}
            className="bg-black text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 mt-10 rounded-md"
            onClick={() => void handleAIProcess()}
          >
            {aiLoading ? "Generating…" : "✨ Generate summary with AI"}
          </button>
          {aiError && <p className="text-sm mt-2 text-red-500 text-center">{aiError}</p>}
        </div>

        <div className="w-1/2 p-4 flex flex-col justify-start overflow-y-auto">
          <div className="sticky top-0 bg-gray-300 py-2 z-50 mb-5 pb-0 rounded-sm px-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">Candidate Details</h2>
            <span className="ml-10">Word Count →</span>
            <div className="relative flex items-center justify-center ml-2">
              <svg width="60" height="60" className="-rotate-90">
                <circle cx="30" cy="30" r={radius} stroke="#e5e7eb" fill="transparent" strokeWidth="6" />
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke={progressPercentage < 90 ? "#3b82f6" : "#22c55e"}
                  fill="transparent"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute text-xs font-medium text-gray-700">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              maxLength={25}
              onFocus={() => handleFocus("nameInput")}
              onChange={(e) => {
                handleInputChange(e);
                handleWordCount(e, "nameInput");
              }}
              className="border border-gray-300 rounded-md w-full h-[32px] px-2"
            />
            <input
              type="text"
              name="professional_title"
              placeholder="Professional Title"
              value={formData.professional_title}
              maxLength={15}
              onFocus={() => handleFocus("proTitleInput")}
              onChange={(e) => {
                handleInputChange(e);
                handleWordCount(e, "proTitleInput");
              }}
              className="border border-gray-300 rounded-md w-full h-[32px] px-2"
            />
            <input
              type="text"
              name="about_yourself_sm"
              placeholder="About Yourself (short)"
              value={formData.about_yourself_sm}
              onFocus={() => handleFocus("about_yourself_smInput")}
              onChange={(e) => {
                handleInputChange(e);
                handleWordCount(e, "about_yourself_smInput");
              }}
              className="border border-gray-300 rounded-md w-full h-[32px] px-2"
            />

            <input
              type="text"
              name="github_link"
              placeholder="GitHub Link"
              value={formData.github_link}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-md w-full h-[32px] px-2"
            />
            <input
              type="text"
              name="linkedin_link"
              placeholder="LinkedIn Link"
              value={formData.linkedin_link}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-md w-full h-[32px] px-2"
            />
            <input
              type="text"
              name="instagram_link"
              placeholder="Instagram Link"
              value={formData.instagram_link}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-md w-full h-[32px] px-2"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-md w-full h-[32px] px-2"
            />

            {/* Summary */}
            <div className="space-y-2">
              <label className="font-medium text-sm">
                Summary About Yourself (about 800 words, following the paragraph sequence)
              </label>
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={applyBold}
                  className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertLineBreakInto("summaryEditor")}
                  className="px-2 py-1 border rounded text-sm hover:bg-gray-100 bg-gray-100"
                >
                  ↵
                </button>
                <InfoCloud
                  buttonLabel="i"
                  infoText="This section allows you to type your summary. Use Enter to add line breaks and Bold to format text. Follow the ghost template below for the best results."
                  width="w-72"
                />
              </div>

         <div className="relative">

  {/* Show template only when AI summary is empty */}
  {!formData.summary_about_yourself && (
    <div className="absolute inset-0 text-gray-400 opacity-40 pointer-events-none whitespace-pre-line px-2 py-1 text-[0.65rem]">
      <p className="text-xs md:text-base leading-relaxed mb-4">
        I’m a developer passionate about crafting accessible, pixel-perfect web
        experiences that fuse thoughtful design with robust engineering.
      </p>

      <p className="text-xs md:text-base leading-relaxed mb-4">
        I thrive at the intersection of design and development — building interfaces
        that look great, perform efficiently, and remain inclusive for all users.
      </p>

      <p className="text-base md:text-lg leading-relaxed mb-4">
        During my internship at{" "}
        <span className="font-semibold text-blue-600">
          Kaizen Star Technologies
        </span>,
        I worked independently to design, develop, and deploy projects.
      </p>

      <p className="text-base md:text-lg leading-relaxed">
        My goal is to provide{" "}
        <span className="font-semibold text-blue-600">
          real-world solutions powered by artificial intelligence
        </span>
        .
      </p>
    </div>
  )}

  <div
    id="summaryEditor"
    contentEditable
    suppressContentEditableWarning
    dir="ltr"
    onFocus={() => handleFocus("about_yrselfInput")}
    style={{
      direction: "ltr",
      textAlign: "left",
      unicodeBidi: "bidi-override",
      caretColor: "black",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
    className="relative border border-gray-300 rounded-md w-full min-h-auto px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 bg-transparent z-10"
    onBlur={(e) => {
      const cleaned = e.currentTarget.innerHTML.replace(/\u200B/g, "");
      setFormData((prev) => ({
        ...prev,
        summary_about_yourself: cleaned,
      }));
    }}
    onInput={(e) => trimEditableOnInput(e, "about_yrselfInput", 800)}
    onKeyDown={handleEditableKeyDown}
  />
</div>
            </div>

            {/* Projects Section */}
            <div className="space-y-3 border p-3 rounded-md mt-4">
              <h2 className="font-bold">Projects</h2>

              {projects.map((project, index) => (
                <div key={index} className="border rounded-md p-3 bg-gray-50 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => deleteProject(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    ✕
                  </button>

                  <input
                    type="text"
                    name="project_name"
                    placeholder="Project Name"
                    maxLength={20}
                    value={project.project_name}
                    onFocus={() => handleFocus("project_NameInput")}
                    onChange={(e) => {
                      handleProjectChange(index, e);
                      handleWordCount(e, "project_NameInput");
                    }}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2 text-sm"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      id={`fileInput-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProjectImageChange(index, e)}
                      className="hidden"
                    />

                    {project.project_pic && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.project_pic}
                        alt={project.project_name || "Project preview"}
                        className="w-32 h-32 object-cover rounded-md mt-2"
                      />
                    )}
                    <label
                      htmlFor={`fileInput-${index}`}
                      className="px-3 py-1 max-w-[90px] bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-sm"
                    >
                      Choose Image
                    </label>

                    {project.project_file && (
                      <span className="text-sm text-gray-700">{project.project_file.name}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium text-sm flex justify-center">
                      Project Summary
                    </label>
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={applyBold}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
                      >
                        <b>B</b>
                      </button>
                      <InfoCloud
                        buttonLabel="i"
                        infoText="Describe your project. Use Enter to add line breaks and Bold to format text. Max 300 characters."
                        width="w-72"
                      />
                    </div>

                    <div
                      id={`projectSummary-${index}`}
                      contentEditable
                      suppressContentEditableWarning
                       dangerouslySetInnerHTML={{
    __html: project.project_summary,
  }}
                      dir="ltr"
                      onFocus={() => handleFocus("about_ProjectInput")}
                      style={{
                        direction: "ltr",
                        textAlign: "left",
                        unicodeBidi: "bidi-override",
                        caretColor: "black",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                      onInput={(e) => trimEditableOnInput(e, "about_ProjectInput", 300)}
                      className="border border-gray-300 rounded-md w-full min-h-[80px] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                      onBlur={(e) => {
                        const cleaned = e.currentTarget.innerHTML.replace(/\u200B/g, "");
                        handleProjectChange(index, {
                          target: { name: "project_summary", value: cleaned },
                        });
                      }}
                      onKeyDown={handleEditableKeyDown}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addProject}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                + Add project
              </button>
            </div>

            {/* Experience Section */}
            <div className="space-y-3 border p-3 rounded-md">
              <h2 className="font-bold">Experience</h2>

              {experience.map((exp, index) => (
                <div key={index} className="border rounded-md p-3 bg-gray-50 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => deleteExperience(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    ✕
                  </button>

                  <input
                    type="text"
                    name="work_institution_name"
                    placeholder="Institution / Company Name"
                    maxLength={30}
                    value={exp.work_institution_name}
                    onChange={(e) => handleExperienceChange(index, e)}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                  />

                  <input
                    type="text"
                    name="work_title"
                    placeholder="Job Title"
                    maxLength={30}
                    value={exp.work_title}
                    onChange={(e) => handleExperienceChange(index, e)}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                  />

                  <input
                    type="text"
                    name="place_of_work"
                    placeholder="Place of Work"
                    maxLength={30}
                    value={exp.place_of_work}
                    onChange={(e) => handleExperienceChange(index, e)}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                  />

                  <input
                    type="text"
                    name="link_for_company"
                    placeholder="Link of Company Website"
                    value={exp.link_for_company}
                    onChange={(e) => handleExperienceChange(index, e)}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                  />

                  <div className="space-y-2">
                    <label className="font-medium text-sm flex justify-center">
                      Work Summary / Description
                    </label>
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={applyBold}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
                      >
                        <b>B</b>
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={insertLineBreakInto(`workSummary-${index}`)}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-100 bg-gray-100"
                      >
                        ↵
                      </button>
                      <InfoCloud
                        buttonLabel="i"
                        infoText="Describe your work experience. Use Enter to add line breaks and Bold to format text."
                        width="w-72"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 text-gray-400 opacity-40 pointer-events-none whitespace-pre-line px-2 py-1 text-[0.65rem]">
                        <p className="text-sm md:text-base text-gray-400 mb-4">
                          Developed during my internship at{" "}
                          <span className="font-semibold text-blue-600">
                            Kaizen Star Technologies
                          </span>
                          , this project automated critical database backups for clients such as
                          pharmacies and medical clinics.
                        </p>
                        <p className="text-sm md:text-base text-gray-400 mb-4">
                          Built with <span className="font-semibold">C#</span> and SQL dump
                          techniques, it eliminated the need for manual intervention by scheduling
                          secure, regular backups.
                        </p>
                        <p className="text-sm md:text-base text-gray-400">
                          This project strengthened my problem-solving skills and demonstrated my
                          ability to take a solution from concept to deployment.
                        </p>
                      </div>

                      <div
                        id={`workSummary-${index}`}
                        contentEditable
                        suppressContentEditableWarning
                        dir="ltr"
                         dangerouslySetInnerHTML={{
                          __html: exp.work_summary,
                        }}
                            onFocus={() => handleFocus("about_WorkInput")}
                        style={{
                          direction: "ltr",
                          textAlign: "left",
                          unicodeBidi: "bidi-override",
                          caretColor: "black",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                        className="relative border border-gray-300 rounded-md w-full min-h-[400px] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 bg-transparent z-10"
                        onBlur={(e) => {
                          const cleaned = e.currentTarget.innerHTML.replace(/\u200B/g, "");
                          handleExperienceChange(index, {
                            target: { name: "work_summary", value: cleaned },
                          });
                        }}
                        onInput={(e) => trimEditableOnInput(e, "about_WorkInput", 300)}
                        onKeyDown={handleEditableKeyDown}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      name="start_date"
                      value={exp.start_date}
                      onChange={(e) => handleExperienceChange(index, e)}
                      className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                    />
                    <input
                      type="date"
                      name="end_date"
                      value={exp.end_date}
                      onChange={(e) => handleExperienceChange(index, e)}
                      className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Technologies Used</h3>
                    {exp.technologies.map((tech, tIndex) => (
                      <div key={tIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Technology ${tIndex + 1}`}
                          value={tech}
                          maxLength={30}
                          onChange={(e) => handleTechnologyChange(index, tIndex, e.target.value)}
                          className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                        />
                        <button
                          type="button"
                          onClick={() => deleteTechnology(index, tIndex)}
                          className="text-red-500 text-xs hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTechnology(index)}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      + Add Technology
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addExperience}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                + Add experience
              </button>
            </div>

            {/* Education Section */}
            <div className="space-y-3 border p-3 rounded-md">
              <h2 className="font-bold">Education</h2>

              {education.map((edu, index) => (
                <div key={index} className="border rounded-md p-3 bg-gray-50 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => deleteEducation(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    ✕
                  </button>

                  <input
                    type="text"
                    name="institution"
                    placeholder="Institution Name"
                    maxLength={40}
                    value={edu.institution}
                    onChange={(e) => handleEducationChange(index, e)}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                  />
                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject / Degree"
                    maxLength={40}
                    value={edu.subject}
                    onChange={(e) => handleEducationChange(index, e)}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                  />
                  <input
                    type="text"
                    name="place"
                    placeholder="Place"
                    maxLength={40}
                    value={edu.place}
                    onChange={(e) => handleEducationChange(index, e)}
                    className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      name="startDate"
                      value={edu.startDate}
                      onChange={(e) => handleEducationChange(index, e)}
                      className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                    />
                    <input
                      type="date"
                      name="endDate"
                      value={edu.endDate}
                      onChange={(e) => handleEducationChange(index, e)}
                      className="border border-gray-300 rounded-md w-full h-[32px] px-2"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addEducation}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                + Add education
              </button>
            </div>

            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-black w-full py-2 rounded-md font-medium"
            >
              Submit
            </button>
            <p className="text-sm mt-1 text-gray-800">File type: {filetype ?? "—"}</p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DetailExtractorPage;
