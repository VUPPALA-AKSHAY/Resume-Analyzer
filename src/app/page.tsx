"use client";

import React, { useEffect, useState, useRef } from "react";

import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Gauge } from "@/components/charts/gauge";
import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { ProgressCard, type Step as ProgressStep } from "@/components/progress-card";

interface ResumeSectionImprovement {
  sectionName: string;
  originalContent: string;
  improvementNeeds: string;
  optimizedContent: string;
}

interface AnalysisResponse {
  matchScore: number;
  breakdown: {
    experienceFit: number;
    skillAlignment: number;
    leadershipScore: number;
  };
  benchmarking: Array<{
    label: string;
    value: number;
    subtext: string;
    status: "normal" | "warning" | "danger";
  }>;
  criticalChanges: Array<{
    title: string;
    description: string;
    type: "high" | "medium" | "low";
  }>;
  keywords: Array<{
    keyword: string;
    count: number;
    status: "Optimized" | "Need more" | "Missing";
  }>;
  optimizedStatements: Array<{
    original: string;
    optimized: string;
    tag: string;
    badge: string;
  }>;
  resumeSections: ResumeSectionImprovement[];
}

interface PopupState {
  title: string;
  description: string;
}

const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];

function isAllowedResumeFile(file: File): boolean {
  const normalizedName = file.name.toLowerCase();
  return ALLOWED_RESUME_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
}

function getPopupForApiError(message: string): PopupState {
  if (message.toLowerCase().includes("please upload correct resume")) {
    return {
      title: "Upload The Correct Resume",
      description: "Please upload correct resume.",
    };
  }

  return {
    title: "Analysis Error",
    description: message,
  };
}

export default function Home() {
  const [step, setStep] = useState<"upload" | "loading" | "insights">("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [graphType, setGraphType] = useState<"Gauge Chart" | "Pie Chart" | "Bar Chart">("Bar Chart");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [sectionPage, setSectionPage] = useState(0);
  const [keywordPage, setKeywordPage] = useState(0);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [apiResult, setApiResult] = useState<AnalysisResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const matchScore = apiResult ? apiResult.matchScore : 78;

  const pieData = [
    {
      name: "Experience Fit",
      label: "Experience Fit",
      value: apiResult ? apiResult.breakdown.experienceFit : 85,
      color: "#006591",
    },
    {
      name: "Skill Alignment",
      label: "Skill Alignment",
      value: apiResult ? apiResult.breakdown.skillAlignment : 72,
      color: "#39b8fd",
    },
    {
      name: "Leadership Score",
      label: "Leadership Score",
      value: apiResult ? apiResult.breakdown.leadershipScore : 65,
      color: "#3cddc7",
    },
  ];

  const chartData = [
    { section: "Summary", roleFit: Math.round(72 * (pieData[0].value / 85)), impactStrength: Math.round(58 * (pieData[1].value / 72)) },
    { section: "Experience", roleFit: Math.round(94 * (pieData[0].value / 85)), impactStrength: Math.round(88 * (pieData[1].value / 72)) },
    { section: "Projects", roleFit: Math.round(81 * (pieData[0].value / 85)), impactStrength: Math.round(69 * (pieData[2].value / 65)) },
    { section: "Skills", roleFit: Math.round(67 * (pieData[0].value / 85)), impactStrength: Math.round(75 * (pieData[1].value / 72)) },
    { section: "Leadership", roleFit: Math.round(63 * (pieData[0].value / 85)), impactStrength: Math.round(61 * (pieData[2].value / 65)) },
    { section: "Keywords", roleFit: Math.round(78 * (pieData[0].value / 85)), impactStrength: Math.round(70 * (pieData[1].value / 72)) },
  ];

  const criticalChanges = apiResult ? apiResult.criticalChanges : [
    { title: "Add specific B2B SaaS metrics", description: "Hiring managers look for conversion, churn, or efficiency gains.", type: "high" },
    { title: "Highlight leadership in design systems", description: "Explicitly mention \"governance\" and \"multi-team adoption.\"", type: "medium" },
    { title: "Prioritize recent mobile work", description: "Re-order your experience to place the Native App project first.", type: "medium" },
    { title: "Clarify cross-functional collab", description: "Add \"Engineers\" and \"Product Managers\" to your collaboration statements.", type: "low" }
  ];

  const keywords = apiResult ? apiResult.keywords : [
    { keyword: "Interaction Design", count: 4, status: "Optimized" },
    { keyword: "Figma Components", count: 2, status: "Optimized" },
    { keyword: "User Research", count: 1, status: "Need more" },
    { keyword: "A/B Testing", count: 0, status: "Missing" },
    { keyword: "Heuristic Evaluation", count: 0, status: "Missing" }
  ];

  const resumeSections = apiResult ? apiResult.resumeSections : [
    {
      sectionName: "Professional Summary",
      originalContent: "Product Designer with 3 years of experience. Skilled in Figma, wireframing, and user research. Looking for a new opportunity in a fast-paced environment.",
      improvementNeeds: "Needs stronger positioning for a senior level. Focus on business outcomes, strategic scope, design system leadership, and cross-functional impact.",
      optimizedContent: "Senior Product Designer with 6+ years of experience leading end-to-end UX/UI strategy for high-growth enterprise SaaS platforms. Proven track record of scaling product adoption by 25% and governing atomic design systems that accelerate development velocity by 40%. Collaborative leader driving cross-functional alignment across product, engineering, and data science teams."
    },
    {
      sectionName: "Experience - Product Designer at CareerEmpower",
      originalContent: "- Designed user interface for the main B2B SaaS dashboard.\n- Created wireframes and low-fidelity prototypes for testing.\n- Worked with engineering to implement designs.",
      improvementNeeds: "Bullet points are task-oriented. Upgrade to show metrics, system-level design ownership, and collaboration patterns with engineering leadership.",
      optimizedContent: "- Spearheaded UX/UI architecture for core B2B SaaS analytics dashboards, resulting in a 12% decrease in customer churn within the first quarter.\n- Established a rigorous user-research validation protocol, conducting 30+ usability tests that directly informed product roadmap priorities.\n- Partnered with lead engineers to implement a React-based component library, reducing design-to-development handoff cycle times by 35%."
    },
    {
      sectionName: "Skills & Technologies",
      originalContent: "Figma, Sketch, Adobe XD, Wireframing, UX Design, Prototyping, HTML, CSS",
      improvementNeeds: "Missing key senior keywords: Design Systems, Interaction Design, WCAG/A11y, Design Metrics, and Stakeholder Alignment.",
      optimizedContent: "Design Systems (Governance & Scale), Advanced Interaction Design, WCAG 2.1 Accessibility Compliance, Prototyping (Figma/Principle), User Research & Usability Testing, Cross-Functional Collaboration, Agile/Scrum Methodologies"
    }
  ];

  const activeSectionIndex = Math.min(sectionPage, Math.max(resumeSections.length - 1, 0));
  const activeSection = resumeSections[activeSectionIndex] ?? resumeSections[0];
  const KEYWORDS_PER_PAGE = 7;
  const totalKeywordPages = Math.max(1, Math.ceil(keywords.length / KEYWORDS_PER_PAGE));
  const paginatedKeywords = keywords.slice(
    keywordPage * KEYWORDS_PER_PAGE,
    keywordPage * KEYWORDS_PER_PAGE + KEYWORDS_PER_PAGE
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tags = ["Product Manager", "Data Scientist", "UX Designer", "Senior Product Designer"];
  const STEP_DELAY = 1000;

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("resume-analyzer-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("resume-analyzer-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (step !== "loading" || progressSteps.length === 0) {
      return;
    }

    const allComplete = progressSteps.every((item) => item.status === "complete");

    if (allComplete) {
      if (apiResult) {
        setStep("insights");
      } else if (apiError) {
        setPopup(getPopupForApiError(apiError));
        setStep("upload");
      } else {
        progressTimeoutRef.current = setTimeout(() => {
          setProgressSteps((prev) => [...prev]);
        }, 500);
      }
      return;
    }

    progressTimeoutRef.current = setTimeout(() => {
      setProgressSteps((previous) => {
        let currentIndex = -1;
        let nextPendingIndex = -1;

        for (let index = 0; index < previous.length; index += 1) {
          if (previous[index].status === "in_progress" && currentIndex === -1) {
            currentIndex = index;
          }
          if (previous[index].status === "pending" && nextPendingIndex === -1) {
            nextPendingIndex = index;
          }
          if (currentIndex !== -1 && nextPendingIndex !== -1) {
            break;
          }
        }

        if (currentIndex === previous.length - 1 && previous[currentIndex].status === "in_progress") {
          if (apiResult) {
            return previous.map((item, index) =>
              index === currentIndex ? { ...item, status: "complete" } : item
            );
          } else if (apiError) {
            setPopup(getPopupForApiError(apiError));
            setStep("upload");
            return previous;
          } else {
            return previous;
          }
        }

        if (currentIndex === -1 && nextPendingIndex !== -1) {
          return previous.map((item, index) =>
            index === nextPendingIndex
              ? { ...item, status: "in_progress" }
              : item
          );
        }

        if (currentIndex !== -1) {
          return previous.map((item, index) => {
            if (index === currentIndex) {
              return { ...item, status: "complete" };
            }
            if (index === currentIndex + 1 && item.status === "pending") {
              return { ...item, status: "in_progress" };
            }
            return item;
          });
        }

        return previous;
      });
    }, STEP_DELAY);

    return () => {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
      }
    };
  }, [progressSteps, step, apiResult, apiError]);

  const createProgressSteps = (
    role: string,
    resumeName: string
  ): ProgressStep[] => [
    {
      id: "1",
      title: "Checking resume structure",
      description: `${resumeName} is being parsed and cleaned for analysis`,
      status: "in_progress",
    },
    {
      id: "2",
      title: "Matching skills to target role",
      description: `Comparing your experience against ${role}`,
      status: "pending",
    },
    {
      id: "3",
      title: "Suggesting improvements",
      description: "Identifying missing keywords and stronger impact statements",
      status: "pending",
    },
    {
      id: "4",
      title: "Preparing final insights",
      description: "Building your personalized dashboard and recommendations",
      status: "pending",
    },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (!isAllowedResumeFile(selectedFile)) {
        setFile(null);
        setFileName(null);
        setPopup({
          title: "Upload The Correct Document",
          description: "Upload the correct document.",
        });
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!isAllowedResumeFile(selectedFile)) {
        setFile(null);
        setFileName(null);
        e.target.value = "";
        setPopup({
          title: "Upload The Correct Document",
          description: "Upload the correct document.",
        });
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleAnalyze = () => {
    if (!file) {
      setPopup({
        title: "Upload Your Resume",
        description: "Please upload your resume first to start the analysis.",
      });
      return;
    }
    if (!jobRole.trim()) {
      setPopup({
        title: "Add Target Role",
        description: "Please specify the target job role before starting the analysis.",
      });
      return;
    }

    setApiResult(null);
    setApiError(null);
    setSectionPage(0);
    setKeywordPage(0);
    setProgressSteps(createProgressSteps(jobRole, fileName || "Resume"));
    setStep("loading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("jobRole", jobRole);

    fetch("/api/analyze", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Server returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setApiResult(data);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to analyze resume.";
        if (!message.toLowerCase().includes("please upload correct resume")) {
          console.error("Analysis error:", err);
        }
        setApiError(message);
      });
  };

  const resetUpload = () => {
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
    }
    setFile(null);
    setFileName(null);
    setJobRole("");
    setProgressSteps([]);
    setApiResult(null);
    setApiError(null);
    setSectionPage(0);
    setKeywordPage(0);
    setStep("upload");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-md shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border-b border-outline-variant/30">
        <div className="max-w-container-max mx-auto flex h-20 items-center justify-between px-4 md:px-margin-desktop">
          <div className="flex items-center gap-8">
            <span 
              className="font-bold text-xl tracking-tight text-primary cursor-pointer"
              onClick={resetUpload}
            >
              Shuroq AI
            </span>
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={resetUpload}
                className={`font-medium transition-colors text-sm ${step === "upload" ? "text-secondary border-b-2 border-secondary pb-1 font-bold" : "text-on-surface-variant hover:text-secondary"}`}
              >
                Dashboard
              </button>
              <button 
                className={`font-medium transition-colors text-sm ${step === "insights" ? "text-secondary border-b-2 border-secondary pb-1 font-bold" : "text-on-surface-variant hover:text-secondary"}`}
                onClick={() => {
                  if (step === "upload") {
                    setPopup({
                      title: "Start With A Resume",
                      description: "Upload your resume and click Analyze Resume first to open the insights view.",
                    });
                  }
                  else setStep("insights");
                }}
              >
                Analysis
              </button>
            </nav>
          </div>
          <div className="flex items-center justify-end">
            <button
              className="hidden lg:flex items-center rounded-lg border border-outline-variant/50 bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              type="button"
            >
              {theme === "dark" ? "White Mode" : "Black Mode"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28 pb-20">
        {step === "upload" && (
          <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop">
            <div className="max-w-3xl mx-auto flex flex-col items-center pt-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
                  Precision Career Analysis
                </h1>
                <p className="text-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
                  Our AI evaluates your experience against specific job requirements to highlight your strengths and bridge the gaps.
                </p>
              </div>

              <div 
                className={`w-full group relative bg-surface-container-lowest border-2 border-dashed rounded-xl p-12 mb-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] ${dragOver ? "border-secondary bg-secondary-fixed/20 upload-zone-pulse" : "border-outline-variant hover:bg-surface-container-low hover:border-secondary"}`}
                id="dropZone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 rounded-full bg-secondary-fixed flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300">
                  <span className="material-symbols-outlined text-on-secondary-container text-4xl">
                    {fileName ? "task_alt" : "cloud_upload"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  {fileName ? "Resume Uploaded" : "Drag & Drop Resume"}
                </h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  {fileName ? fileName : "Upload a PDF or Word resume to begin"}
                </p>
                <input 
                  accept=".pdf,.doc,.docx"
                  className="hidden" 
                  id="fileInput" 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  className="bg-surface-container-high text-on-surface font-semibold text-sm px-8 py-3 rounded-lg hover:bg-secondary hover:text-on-primary transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {fileName ? "Change File" : "Browse Files"}
                </button>
              </div>

              <div className="w-full bg-surface-container-lowest p-8 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] mb-10 border border-outline-variant/20">
                <label className="block text-sm font-semibold text-on-surface-variant mb-3" htmlFor="jobRole">
                  Target Job Role
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    search
                  </span>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-background border border-outline-variant rounded-lg text-base focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all" 
                    id="jobRole" 
                    placeholder="e.g., Senior Software Engineer" 
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span 
                      key={tag}
                      onClick={() => setJobRole(tag)}
                      className="px-3 py-1.5 bg-surface-container text-on-secondary-container text-xs font-medium rounded-full cursor-pointer hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleAnalyze}
                className="group w-full max-w-sm flex items-center justify-center gap-3 bg-secondary text-on-primary font-bold text-lg py-5 rounded-xl shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all duration-200"
              >
                <span>Analyze Resume</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
              <p className="mt-6 text-xs text-on-surface-variant opacity-60">
                Securely processed using Shuroq AI analysis models.
              </p>
            </div>
            <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-secondary-fixed-dim/10 blur-[120px] rounded-full -z-10"></div>
            <div className="fixed top-40 -right-40 w-80 h-80 bg-surface-variant/20 blur-[100px] rounded-full -z-10"></div>
          </div>
        )}

        {step === "loading" && (
          <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-full border border-outline-variant/40 bg-surface-container-low px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
              Shuroq AI Review
            </div>
            <h2 className="mb-3 text-2xl font-bold text-on-surface">
              Checking your resume and suggesting improvements
            </h2>
            <p className="mb-8 max-w-sm text-sm leading-6 text-on-surface-variant">
              We&apos;re reviewing{" "}
              <span className="font-semibold text-on-surface">{fileName}</span>{" "}
              for the
              <span className="font-semibold text-secondary"> {jobRole}</span>{" "}
              role and preparing tailored recommendations.
            </p>
            <ProgressCard steps={progressSteps} />
          </div>
        )}

        {step === "insights" && (
          <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop">
            <section className="mb-12">
              <div className="flex flex-col items-center justify-center gap-5 text-center">
                <div className="flex flex-col items-center">
                  <h1 className="text-3xl font-extrabold text-on-surface md:text-4xl">Insights For Your Resume</h1>
                  <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-lg text-on-surface-variant">
                    Resume match for: <span className="text-secondary font-bold">{jobRole || "Senior Product Designer"}</span>
                  </p>
                </div>
              </div>
            </section>
            <div className="grid grid-cols-12 gap-gutter items-start">
              <div className="order-1 col-span-12 bg-surface-container-lowest rounded-2xl p-6 md:p-8 card-shadow border border-outline-variant/25">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Compatibility Gap</h3>
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                      Switch between the same resume score views without crowding the chart.
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-3 overflow-hidden rounded-xl border border-outline-variant/35 bg-surface-container-low p-1 md:w-auto">
                    {[
                      { label: "Gauge Chart", value: "Gauge Chart" },
                      { label: "Breakdown View", value: "Pie Chart" },
                      { label: "Profile View", value: "Bar Chart" },
                    ].map((option) => {
                      const isSelected = graphType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setGraphType(option.value as "Gauge Chart" | "Pie Chart" | "Bar Chart")}
                          className={`rounded-lg px-4 py-2 text-xs font-bold transition-all hover:bg-secondary/10 hover:text-secondary ${
                            isSelected
                              ? "bg-surface-container-lowest text-on-surface shadow-sm"
                              : "text-on-surface-variant"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="flex flex-col justify-between rounded-xl border border-outline-variant/25 bg-surface-container-low/35 p-5">
                    <div>
                      <h4 className="text-base font-bold text-on-surface">ATS Score</h4>
                      <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                        Overall profile match for the selected target role.
                      </p>
                    </div>
                    <div className="mt-6">
                      <span className="text-5xl font-extrabold leading-none text-secondary">{matchScore}%</span>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Overall Match
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low/25 p-5">
                    {graphType === "Bar Chart" && (
                      <div>
                        <BarChart
                          aspectRatio="4 / 1.25"
                          data={chartData}
                          margin={{ top: 12, right: 12, bottom: 42, left: 12 }}
                          xDataKey="section"
                        >
                          <Grid horizontal />
                          <Bar dataKey="roleFit" fill="var(--chart-1)" lineCap="round" />
                          <Bar dataKey="impactStrength" fill="var(--chart-3)" lineCap="round" />
                          <BarXAxis />
                          <ChartTooltip />
                        </BarChart>

                        <div className="mt-4 flex flex-wrap justify-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/60 p-3">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[var(--chart-1)]" />
                            <span className="text-xs font-bold text-on-surface">Role Fit by Section</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[var(--chart-3)]" />
                            <span className="text-xs font-bold text-on-surface">Impact Strength</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {graphType === "Pie Chart" && (
                      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="flex justify-center">
                          <PieChart
                            data={pieData}
                            hoveredIndex={hoveredIndex}
                            innerRadius={72}
                            onHoverChange={setHoveredIndex}
                            size={230}
                          >
                            {pieData.map((_, i) => <PieSlice index={i} key={i} />)}
                            <PieCenter defaultLabel="ATS Score">
                              {({ value, label, isHovered }) => (
                                <div className="flex h-full w-full flex-col items-center justify-center text-center pointer-events-none">
                                  <span className="text-4xl font-extrabold leading-none text-on-surface">
                                    {isHovered ? value : matchScore}%
                                  </span>
                                  <span className="mt-2 max-w-[110px] text-[10px] font-bold uppercase leading-tight tracking-wider text-on-surface-variant">
                                    {label}
                                  </span>
                                </div>
                              )}
                            </PieCenter>
                          </PieChart>
                        </div>

                        <div className="grid content-center gap-3">
                          {pieData.map((item, index) => (
                            <button
                              key={item.name}
                              type="button"
                              onMouseEnter={() => setHoveredIndex(index)}
                              onMouseLeave={() => setHoveredIndex(null)}
                              className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-lowest/65 p-3 text-left transition-colors hover:border-secondary/35 hover:bg-secondary/5"
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-bold text-on-surface">{item.name}</span>
                              </span>
                              <span className="text-sm font-extrabold text-secondary">{item.value}%</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {graphType === "Gauge Chart" && (
                      <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="flex items-center justify-center">
                          <Gauge
                            value={matchScore}
                            centerValue={matchScore}
                            spacing={22}
                            inactiveFillOpacity={0.15}
                            defaultLabel="ATS Score"
                            suffix="%"
                            notchCornerRadius={4}
                            totalNotches={30}
                            useGradient={true}
                            minWidth={260}
                          />
                        </div>

                        <div className="grid content-center gap-3">
                          {pieData.map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-lowest/65 p-3 transition-colors hover:border-secondary/35 hover:bg-secondary/5"
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-bold text-on-surface">{item.name}</span>
                              </span>
                              <span className="text-sm font-extrabold text-secondary">{item.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-4 col-span-12 bg-surface-container-lowest rounded-2xl p-6 md:p-8 card-shadow border border-outline-variant/25 flex flex-col gap-6 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Detailed Resume Evaluation</h3>
                    <p className="text-xs text-on-surface-variant mt-1">AI-powered suggestions to align each resume section with role requirements</p>
                  </div>
                  <span className="shrink-0 bg-secondary/15 text-secondary px-3.5 py-1.5 rounded-full text-xs font-bold border border-secondary/20 self-start md:self-auto shadow-sm">
                    {resumeSections.length} Sections Analyzed
                  </span>
                </div>

                <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <aside className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/35 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-on-surface-variant">
                        Sections
                      </span>
                      <span className="shrink-0 rounded-full bg-secondary/12 px-2.5 py-1 text-[10px] font-bold text-secondary">
                        {activeSectionIndex + 1}/{resumeSections.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {resumeSections.map((sec, idx) => {
                        const isActive = activeSectionIndex === idx;
                        return (
                          <button
                            key={sec.sectionName}
                            type="button"
                            onClick={() => setSectionPage(idx)}
                            className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:border-secondary/35 hover:bg-secondary/5 hover:text-on-surface ${
                              isActive
                                ? "border-outline-variant/25 bg-surface-container-lowest text-on-surface"
                                : "border-outline-variant/20 bg-surface-container-lowest/55 text-on-surface-variant"
                            }`}
                          >
                            <span className="min-w-0 flex-1 text-xs font-semibold leading-relaxed break-words">
                              {sec.sectionName}
                            </span>
                            <span className="shrink-0 rounded-md bg-surface-container px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                              {idx + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </aside>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-5 md:p-6 transition-all duration-300 hover:border-secondary/35 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/25 pb-3">
                        <span className="min-w-0 flex-1 text-sm font-extrabold text-secondary uppercase tracking-wider break-words">
                          {activeSection.sectionName}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded uppercase tracking-wider">
                          Section {activeSectionIndex + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 items-stretch overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest/60 transition-colors hover:border-secondary/30 md:grid-cols-[180px_minmax(0,1fr)]">
                          <div className="flex items-center border-b border-outline-variant/20 bg-surface-container-low px-4 py-3 md:border-b-0 md:border-r">
                            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Original Content</span>
                          </div>
                          <div className="project-scrollbar h-[118px] overflow-y-auto p-4 text-sm italic leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                            {activeSection.originalContent ? activeSection.originalContent : (
                              <span className="text-outline text-xs block py-4">No content detected in original resume.</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 items-stretch overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm transition-colors hover:border-secondary/30 md:grid-cols-[180px_minmax(0,1fr)]">
                          <div className="flex items-center border-b border-outline-variant/20 bg-surface-container-low px-4 py-3 md:border-b-0 md:border-r">
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                              <span className="material-symbols-outlined text-sm text-secondary">auto_fix_high</span> Optimized
                            </span>
                          </div>
                          <div className="project-scrollbar relative h-[118px] overflow-y-auto p-4 text-sm font-medium leading-relaxed text-on-surface whitespace-pre-wrap">
                            {activeSection.optimizedContent}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-[25px] rounded-full pointer-events-none"></div>
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/35 px-4 py-3">
                      <p className="text-xs font-medium text-on-surface-variant">
                        Showing section {activeSectionIndex + 1} of {resumeSections.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSectionPage((current) => Math.max(0, current - 1))}
                          disabled={activeSectionIndex === 0}
                          className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-bold text-on-surface transition-all disabled:cursor-not-allowed disabled:opacity-45 hover:border-secondary/30 hover:bg-surface-container-lowest"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setSectionPage((current) => Math.min(resumeSections.length - 1, current + 1))}
                          disabled={activeSectionIndex >= resumeSections.length - 1}
                          className="rounded-lg border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary transition-all disabled:cursor-not-allowed disabled:opacity-45 hover:bg-secondary/15"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-2 col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-2xl p-8 card-shadow border border-outline-variant/25">
                <div className="mb-6 flex flex-col gap-3 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-on-surface">Resume Action Plan</h3>
                    <span className="rounded-full bg-secondary/12 px-3 py-1 text-xs font-semibold text-secondary">
                      {criticalChanges.length} Recommended Updates
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Focus first on the sections that improve recruiter clarity, keyword match, and measurable impact.
                  </p>
                </div>
                <div className="space-y-4">
                  {criticalChanges.map((change, idx) => {
                    const isHigh = change.type === "high";
                    const isMedium = change.type === "medium";
                    
                    let bgClass = "bg-surface-container-low/50";
                    let borderClass = "border-outline-variant/30";
                    let icon = "info";
                    let iconColor = "text-on-tertiary-container";
                    let badgeClass = "bg-surface-container text-on-surface-variant";
                    let badgeText = "Low";

                    if (isHigh) {
                      bgClass = "bg-error-container/10";
                      borderClass = "border-error/40";
                      icon = "priority_high";
                      iconColor = "text-error";
                      badgeClass = "bg-error-container text-on-error-container";
                      badgeText = "High";
                    } else if (isMedium) {
                      bgClass = "bg-secondary/5";
                      borderClass = "border-secondary/30";
                      icon = "trending_up";
                      iconColor = "text-secondary";
                      badgeClass = "bg-secondary/15 text-secondary";
                      badgeText = "Medium";
                    }

                    return (
                      <div key={idx} className={`rounded-2xl border p-4 ${bgClass} ${borderClass}`}>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`material-symbols-outlined ${iconColor} mt-0.5`}>{icon}</span>
                            <p className="font-bold text-sm leading-relaxed text-on-surface">{change.title}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>
                        <div className="rounded-xl bg-surface-container-lowest/70 p-3">
                          <p className="text-xs leading-relaxed text-on-surface-variant">{change.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="order-3 col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 card-shadow border border-outline-variant/25 overflow-hidden">
                <h3 className="mb-6 text-center text-lg font-bold text-on-surface">Missing Skills</h3>
                <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/70 bg-surface-container-low">
                        <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-[0.16em]">Required Keyword</th>
                        <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-[0.16em]">Occurrence</th>
                        <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-[0.16em]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {paginatedKeywords.map((kw, idx) => {
                        let statusBg = "bg-tertiary-fixed/25";
                        let statusColor = "text-on-tertiary-container";
                        let statusIcon = "check_circle";

                        if (kw.status === "Need more") {
                          statusBg = "bg-secondary-fixed/45";
                          statusColor = "text-on-secondary-fixed-variant";
                          statusIcon = "add_circle";
                        } else if (kw.status === "Missing") {
                          statusBg = "bg-error-container";
                          statusColor = "text-error";
                          statusIcon = "error";
                        }

                        return (
                          <tr key={`${kw.keyword}-${idx}`} className="transition-colors hover:bg-surface-container-low/40">
                            <td className="px-6 py-5 text-sm font-bold text-on-surface">{kw.keyword}</td>
                            <td className="px-6 py-5 text-sm text-on-surface-variant">{kw.count} {kw.count === 1 ? "time" : "times"}</td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center gap-2 rounded-full ${statusBg} px-3 py-1.5 text-sm font-semibold ${statusColor}`}>
                                <span className="material-symbols-outlined text-[18px]">{statusIcon}</span>
                                {kw.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/35 px-4 py-3">
                  <p className="text-xs font-medium text-on-surface-variant">
                    Showing rows {keywordPage * KEYWORDS_PER_PAGE + 1}-
                    {Math.min((keywordPage + 1) * KEYWORDS_PER_PAGE, keywords.length)} of {keywords.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setKeywordPage((current) => Math.max(0, current - 1))}
                      disabled={keywordPage === 0}
                      className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-bold text-on-surface transition-all disabled:cursor-not-allowed disabled:opacity-45 hover:border-secondary/30 hover:bg-surface-container-lowest"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeywordPage((current) => Math.min(totalKeywordPages - 1, current + 1))}
                      disabled={keywordPage >= totalKeywordPages - 1}
                      className="rounded-lg border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary transition-all disabled:cursor-not-allowed disabled:opacity-45 hover:bg-secondary/15"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {popup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/72 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface-container-lowest shadow-[0_24px_80px_rgba(2,12,27,0.42)]">
            <div className="relative p-6 sm:p-7">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-secondary/12 blur-3xl" />
              <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/14 text-secondary">
                  <span className="material-symbols-outlined text-3xl">description</span>
                </div>
                <h2 className="text-2xl font-extrabold text-on-surface">{popup.title}</h2>
                <p className="mt-3 max-w-sm text-sm leading-7 text-on-surface-variant">
                  {popup.description}
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPopup(null)}
                    className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:opacity-95"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


