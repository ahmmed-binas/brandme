"use client";

import {
  FaGithub,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface PortfolioProject {
  title?: string;
  description?: string;
  technologies?: string[];
  github?: string;
  live_url?: string;
  image?: string;
}

export interface PortfolioExperience {
  job_title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  technologies?: string[];
  website?: string;
}

export interface PortfolioData {
  name?: string;
  professional_title?: string;
  tagline?: string;

  summary?: string[];

  github?: string;
  linkedin?: string;
  instagram?: string;
  email?: string;

  skills?: string[];

  projects?: PortfolioProject[];

  experience?: PortfolioExperience[];
}

/*
|--------------------------------------------------------------------------
| Assets
|--------------------------------------------------------------------------
*/

const defaultProjectImage =
  "/p1assets/firstpage.PNG";

const rotationbooth =
  "/p1assets/rotation booth.gif";

/*
|--------------------------------------------------------------------------
| Default data
|--------------------------------------------------------------------------
|
| This is ONLY a fallback.
|
| AI-generated finalData will replace this.
|
*/

const defaultData: PortfolioData = {
  name: "Your Name",

  professional_title:
    "Web Developer",

  tagline:
    "I build accessible, pixel-perfect digital experiences for the web.",

  summary: [
    "Welcome to my portfolio.",
    "This portfolio is generated from your portfolio data."
  ],

  github: "",
  linkedin: "",
  instagram: "",
  email: "",

  skills: [],

  projects: [],

  experience: [],
};

/*
|--------------------------------------------------------------------------
| Template 1
|--------------------------------------------------------------------------
*/

export default function TemplateTSXOne({
  finalData,
  theme = "midnight",
  embedded = false,
}: {
  finalData?: PortfolioData;
  theme?: "midnight" | "classic" | "dark" | "light";
  embedded?: boolean;
}) {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [activeSection, setActiveSection] =
    useState("about");

  const torchRef =
    useRef<HTMLDivElement>(null);

  /*
  |--------------------------------------------------------------------------
  | Navigation sections
  |--------------------------------------------------------------------------
  */

  const sections = [
    "about",
    "experience",
    "project",
  ];

  /*
  |--------------------------------------------------------------------------
  | Use finalData
  |--------------------------------------------------------------------------
  */

  const active: PortfolioData =
    finalData || defaultData;

  /*
  |--------------------------------------------------------------------------
  | Intersection Observer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const sectionEls =
      document.querySelectorAll("section");

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(
                entry.target.id
              );
            }
          });
        },
        {
          threshold: 0.6,
        }
      );

    sectionEls.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Theme
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (embedded) return;
    const param =
      new URLSearchParams(
        window.location.search
      );

    const queryTheme =
      param.get("theme");

    let bgColor = "";
    let textColor = "";

    if (queryTheme === "classic") {
      bgColor = "#0a192f";
      textColor = "#ccd6f6";
    } else if (queryTheme === "light") {
      bgColor = "#f8fafc";
      textColor = "#172033";
    } else if (queryTheme === "dark") {
      bgColor = "#000000";
      textColor = "#f5f5f5";
    } else {
      bgColor = "#0a192f";
      textColor = "#ccd6f6";
    }

    document.documentElement.style.backgroundColor =
      bgColor;

    document.documentElement.style.color =
      textColor;

    document.body.style.backgroundColor =
      bgColor;

    document.body.style.color =
      textColor;

    document.documentElement.style.setProperty(
      "--theme-bg",
      bgColor
    );
  }, [embedded]);

  /*
  |--------------------------------------------------------------------------
  | Torch / Mouse Light
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (embedded) return;
    const handleMouseMove = (
      e: MouseEvent
    ) => {
      const x = e.clientX;
      const y = e.clientY;

      if (torchRef.current) {
        torchRef.current.style.background =
          `radial-gradient(
            circle 400px at ${x}px ${y}px,
            rgba(255, 255, 255, 0.1),
            transparent 90%
          )`;
      }
    };

    document.addEventListener(
      "mousemove",
      handleMouseMove
    );

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove
      );
    };
  }, [embedded]);

  /*
  |--------------------------------------------------------------------------
  | Safe arrays
  |--------------------------------------------------------------------------
  */

  const summary =
    Array.isArray(active.summary)
      ? active.summary
      : [];

  const projects =
    Array.isArray(active.projects)
      ? active.projects
      : [];

  const experience =
    Array.isArray(active.experience)
      ? active.experience
      : [];

  const previewSidebarPosition = embedded
    ? "sticky top-0 z-30 self-start w-full shrink-0 xl:h-screen xl:w-120"
    : "xl:fixed xl:top-0 xl:left-0 xl:h-screen xl:w-120";
  const previewContentOffset = embedded ? "xl:ml-0 xl:pl-12" : "xl:ml-64 xl:pl-70";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div style={{ overflowWrap: "anywhere" }} className={`relative min-h-screen flex flex-col xl:flex-row ${embedded ? "overflow-visible" : "overflow-x-hidden"} [&_h1]:break-words [&_h2]:break-words [&_h3]:break-words [&_p]:break-words [&_span]:break-words ${theme === "light" ? "bg-slate-50 text-slate-800 [&_h1]:text-slate-950 [&_h2]:text-slate-800 [&_h3]:text-slate-800 [&_p]:text-slate-600 [&_.text-gray-500]:text-slate-500" : theme === "dark" ? "bg-black text-slate-100" : theme === "classic" ? "bg-[#172554] text-[#dbeafe]" : "bg-[#0a192f] text-[#ccd6f6]"}`}>

      {/* --------------------------------------------------------------- */}
      {/* Torch effect                                                    */}
      {/* --------------------------------------------------------------- */}

      <div
        ref={torchRef}
        className={`
          ${embedded ? "absolute" : "fixed"}
          inset-0
          pointer-events-none
          transition-all
          duration-200
          z-40
        `}
      />

      {/* --------------------------------------------------------------- */}
      {/* Left sidebar                                                    */}
      {/* --------------------------------------------------------------- */}

      <div
        style={embedded ? { position: "sticky", top: 0, alignSelf: "flex-start", height: "100vh" } : undefined}
        className={`
          w-full
          p-4
          md:pl-12
          md:pt-8
          lg:pl-16
          lg:pt-10
          xl:pl-18
          xl:pt-12
          text-left
          ${previewSidebarPosition}
        `}
      >

        {/* Name */}

        <h1
          className={`
            text-4xl
            sm:text-5xl
            md:text-6xl
            lg:text-7xl
            font-formyname
            text-gray-300
            font-bold
            leading-tight
          `}
        >
          {active.name}
        </h1>

        {/* Professional title */}

        <h2
          className={`
            text-lg
            sm:text-xl
            md:text-2xl
            lg:text-3xl
            font-formyname
            text-gray-300
            mt-3
          `}
        >
          {active.professional_title}
        </h2>

        {/* Tagline */}

        <h2
          className={`
            text-lg
            sm:text-xl
            md:text-2xl
            lg:text-2xl
            font-bold
            text-gray-500
            mt-[10px]
          `}
        >
          {active.tagline}
        </h2>

        {/* ------------------------------------------------------------- */}
        {/* Desktop navigation                                            */}
        {/* ------------------------------------------------------------- */}

        <div className="flex hidden xl:block">

          <nav
            className="
              flex
              flex-col
              space-y-6
              mt-10
            "
          >

            {sections.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() =>
                  setActiveSection(id)
                }
                className={`
                  flex
                  items-center
                  space-x-3
                  cursor-pointer
                  group
                  ${
                    activeSection === id
                      ? "text-gray-100 font-bold"
                      : "text-gray-300"
                  }
                `}
              >

                <div
                  className={`
                    w-6
                    h-1
                    rounded-sm
                    transition-all
                    duration-300
                    ${
                      activeSection === id
                        ? "w-12 bg-white"
                        : "bg-white group-hover:w-12"
                    }
                  `}
                />

                <span
                  className="
                    text-lg
                    sm:text-xl
                    md:text-2xl
                    lg:text-2xl
                    font-medium
                    transition-colors
                    duration-300
                  "
                >
                  {id.charAt(0).toUpperCase() +
                    id.slice(1)}
                </span>

              </a>
            ))}

          </nav>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* Social links                                                   */}
        {/* ------------------------------------------------------------- */}

        <nav
          className="
            flex
            flex-row
            space-x-6
            mt-10
          "
        >

          {/* GitHub */}

          {active.github && (
            <a
              href={active.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              aria-label="GitHub"
            >
              <FaGithub
                className="
                  text-gray-500
                  hover:text-black
                  text-2xl
                  transition-transform
                  transform
                "
              />
            </a>
          )}

          {/* LinkedIn */}

          {active.linkedin && (
            <a
              href={active.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <FaLinkedin
                className="
                  text-gray-500
                  hover:text-blue-600
                  text-2xl
                  transition-transform
                  transform
                "
              />
            </a>
          )}

          {/* Instagram */}

          {active.instagram && (
            <a
              href={active.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              aria-label="Instagram"
            >
              <FaInstagram
                className="
                  text-gray-500
                  hover:text-pink-500
                  text-2xl
                  transition-transform
                  transform
                "
              />
            </a>
          )}

          {/* Email */}

          {active.email && (
            <a
              href={`mailto:${active.email}`}
              className="group"
              aria-label="Email"
            >
              <MdEmail
                className="
                  text-gray-500
                  hover:text-red-500
                  text-2xl
                  transition-transform
                  transform
                "
              />
            </a>
          )}

        </nav>

      </div>

      {/* --------------------------------------------------------------- */}
      {/* Main content                                                    */}
      {/* --------------------------------------------------------------- */}

      <main
        className="
          flex-1
          scroll-smooth
        "
      >

        {/* ============================================================= */}
        {/* ABOUT                                                         */}
        {/* ============================================================= */}

        <section
          id="about"
          className={`
            min-h-screen
            flex
            justify-center
            px-6
            md:px-12
            ${previewContentOffset}
            pt-7
          `}
        >

          <div
            className="
              max-w-3xl
              text-left
              mt-10
            "
          >

            {summary.length > 0 ? (
              summary.map(
                (
                  paragraph: string,
                  index: number
                ) => (
                  <p
                    key={index}
                    className="
                      text-sm
                      sm:text-base
                      md:text-lg
                      lg:text-2xl
                      leading-relaxed
                      mb-4
                    "
                  >
                    {paragraph}
                  </p>
                )
              )
            ) : (
              <p
                className="
                  text-sm
                  sm:text-base
                  md:text-lg
                  lg:text-2xl
                  leading-relaxed
                "
              >
                No summary available.
              </p>
            )}

          </div>

        </section>

        {/* ============================================================= */}
        {/* PROJECTS                                                       */}
        {/* ============================================================= */}

        <section
          id="project"
          className={`
            min-h-screen
            px-6
            md:px-12
            ${previewContentOffset}
            pt-12
            flex
            flex-col
            gap-12
          `}
        >

          {projects.length > 0 ? (
            projects.map(
              (
                project: PortfolioProject,
                index: number
              ) => (

                <div
                  key={index}
                  className="
                    flex
                    flex-col
                    md:flex-row
                    hover:bg-gray-700/50
                    shadow-lg
                    rounded-lg
                    overflow-hidden
                  "
                >

                  {/* Project image */}

                  <div
                    className="
                      min-w-0
                      md:w-1/2
                      relative
                      h-50
                    "
                  >

                    <Image
                      src={
                        project.image ||
                        defaultProjectImage
                      }
                      alt={
                        project.title ||
                        "Project"
                      }
                      fill
                      unoptimized
                      className="
                        object-cover
                        rounded-lg
                      "
                    />

                  </div>

                  {/* Project content */}

                  <div
                    className="
                      min-w-0
                      md:w-1/2
                      p-6
                      flex
                      flex-col
                      justify-center
                    "
                  >

                    <h3
                      className="
                        text-2xl
                        font-semibold
                        mb-2
                      "
                    >
                      {project.title}
                    </h3>

                    <p>
                      {project.description}
                    </p>

                    {/* Technologies */}

                    {project.technologies &&
                      project.technologies.length >
                        0 && (
                        <div
                          className="
                            flex
                            flex-wrap
                            gap-2
                            mt-5
                          "
                        >
                          {project.technologies.map(
                            (
                              tech: string,
                              techIndex: number
                            ) => (
                              <span
                                key={techIndex}
                                className="
                                  bg-gray-200/90
                                  text-gray-800
                                  text-xs
                                  sm:text-sm
                                  font-medium
                                  px-4
                                  py-1
                                  rounded-full
                                "
                              >
                                {tech}
                              </span>
                            )
                          )}
                        </div>
                      )}

                    {/* Project links */}

                    {(project.github ||
                      project.live_url) && (
                      <div
                        className="
                          flex
                          gap-5
                          mt-5
                        "
                      >

                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              underline
                              hover:text-blue-400
                            "
                          >
                            GitHub
                          </a>
                        )}

                        {project.live_url && (
                          <a
                            href={project.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              underline
                              hover:text-blue-400
                            "
                          >
                            Live
                          </a>
                        )}

                      </div>
                    )}

                  </div>

                </div>

              )
            )
          ) : (
            <div className="py-20">
              <p className="text-gray-500">
                No projects available.
              </p>
            </div>
          )}

        </section>

        {/* ============================================================= */}
        {/* EXPERIENCE                                                     */}
        {/* ============================================================= */}

        <section
          id="experience"
          className={`
            min-h-screen
            px-6
            sm:px-10
            lg:px-16
            ${embedded ? "xl:ml-0" : "xl:ml-[38%]"}
            py-20
          `}
        >

          <div
            className="
              max-w-4xl
              mx-auto
            "
          >

            {experience.length > 0 ? (
              experience.map(
                (
                  exp: PortfolioExperience,
                  index: number
                ) => {

                  const experienceContent = (
                    <div
                      className="
                        relative
                        group
                        rounded-2xl
                        overflow-hidden
                        p-6
                        md:p-8
                        transition-all
                        duration-300
                        hover:bg-gray-700/40
                        hover:scale-[1.01]
                        border
                        border-white/10
                      "
                    >

                      {/* Date */}

                      <span
                        className="
                          block
                          text-xs
                          sm:text-sm
                          font-medium
                          text-gray-400
                          mb-4
                        "
                      >
                        {exp.start_date}

                        {exp.start_date &&
                          exp.end_date &&
                          " — "}

                        {exp.end_date}
                      </span>

                      {/* Content */}

                      <div className="text-left">

                        {/* Job title */}

                        <h3
                          className="
                            text-xl
                            sm:text-2xl
                            md:text-3xl
                            font-semibold
                            text-gray-300
                            mb-4
                          "
                        >
                          {exp.job_title}

                          {exp.job_title &&
                            exp.location &&
                            " — "}

                          {exp.location}
                        </h3>

                        {/* Company */}

                        {exp.company && (
                          <p
                            className="
                              text-sm
                              sm:text-base
                              md:text-lg
                              text-blue-500
                              font-semibold
                              mb-3
                            "
                          >
                            {exp.company}
                          </p>
                        )}

                        {/* Description */}

                        {exp.description && (
                          <p
                            className="
                              text-sm
                              sm:text-base
                              md:text-lg
                              text-gray-400
                              leading-relaxed
                              mb-4
                            "
                          >
                            {exp.description}
                          </p>
                        )}

                        {/* Technology stack */}

                        {exp.technologies &&
                          exp.technologies.length >
                            0 && (
                            <div
                              className="
                                flex
                                flex-wrap
                                gap-3
                                mt-6
                              "
                            >

                              {exp.technologies.map(
                                (
                                  tech: string,
                                  techIndex: number
                                ) => (
                                  <span
                                    key={techIndex}
                                    className="
                                      bg-gray-200/90
                                      text-gray-800
                                      text-xs
                                      sm:text-sm
                                      font-medium
                                      px-4
                                      py-1
                                      rounded-full
                                    "
                                  >
                                    {tech}
                                  </span>
                                )
                              )}

                            </div>
                          )}

                      </div>

                      {/* Hover overlay */}

                      <div
                        className="
                          absolute
                          inset-0
                          bg-blue-500/10
                          opacity-0
                          group-hover:opacity-100
                          transition-opacity
                          duration-300
                          pointer-events-none
                        "
                      />

                    </div>
                  );

                  /*
                  |--------------------------------------------------------------------------
                  | If experience has a website, make the card clickable.
                  |--------------------------------------------------------------------------
                  */

                  if (exp.website) {
                    return (
                      <a
                        key={index}
                        href={exp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mb-8"
                      >
                        {experienceContent}
                      </a>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="mb-8"
                    >
                      {experienceContent}
                    </div>
                  );
                }
              )
            ) : (
              <div className="py-20">
                <p className="text-gray-500">
                  No experience available.
                </p>
              </div>
            )}

          </div>

        </section>

        {/* ============================================================= */}
        {/* FOOTER                                                         */}
        {/* ============================================================= */}


        {/* ============================================================= */}
        {/* Rotating booth                                                 */}
        {/* ============================================================= */}

        {!embedded && <Image
          src={rotationbooth}
          alt="Rotating Booth"
          width={80}
          height={80}
          unoptimized
          className="
            hidden
            md:block
            fixed
            bottom-4
            right-4
            w-16
            h-16
            lg:w-20
            lg:h-20
            object-contain
            z-50
          "
        />}

      </main>

    </div>
  );
}
