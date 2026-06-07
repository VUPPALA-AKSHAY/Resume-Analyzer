# Resume Analyzer

Resume Analyzer is a web app that helps you check how well your resume matches a job role.
It reads a resume, shows a match score, highlights missing skills, and suggests stronger wording.

## Live app

- Vercel link: https://resume-analyzer-sage-eight.vercel.app/

## Tech stack

This project uses:

- Next.js and React for the app
- Node.js on the server side for the API route
- TypeScript for type-safe code
- Tailwind CSS for styling
- VisX and D3 for the charts
- Mammoth, PDF.js, and Unpdf for reading resume files
- Lucide and Motion for icons and animations
- Radix, Base UI, and Shadcn-style UI pieces for components
- AI provider APIs for resume analysis

## Backend

The project does not use a separate backend app.
Instead, it uses a Next.js API route at `/api/analyze` that runs on Node.js.
That route:

- reads the uploaded file
- extracts the resume text
- checks if the file looks like a resume
- sends the text to the AI analysis service

## What the app does

- Upload a resume in PDF or Word format.
- Enter a job role you want to target.
- See a loading flow that shows the analysis step by step.
- Get a final dashboard with charts, missing skills, and resume improvements.
- If the file does not look like a real resume, the app asks you to upload the correct resume.

## Main features

- Theme switch: change between light and dark mode.
- Upload flow: choose a resume and start the analysis.
- Progress screen: shows what the app is doing while the file is being checked.
- AI analysis: compares your resume with the role you typed.
- Error popup: shows a friendly popup when the file is wrong or the resume cannot be analyzed.
- Resume insights: shows the important parts of the resume in one place.
- Pagination: long lists like missing skills and resume sections are split into pages.
- Share and download actions: lets you save or share the report.

## What the charts mean

The app has three chart views. They all tell the same story in different ways.

### Gauge Chart

- Shows the overall match score.
- The bigger the number, the better the resume matches the role.
- This is the fastest way to understand the result.

### Pie Chart

- Breaks the score into main parts.
- It shows how strong the resume is in:
  - experience fit
  - skill alignment
  - leadership score
- This helps you see which area is strong and which area needs work.

### Bar Chart

- Shows the resume section by section.
- It compares how each section supports the job role.
- The sections include:
  - Summary
  - Experience
  - Projects
  - Skills
  - Leadership
  - Keywords
- This chart is useful when you want to know which part of the resume should be improved first.

## Detailed resume evaluation

The detailed resume area shows:

- the selected resume section
- the original content
- an optimized version
- a short strategy for improvement

It also lets you move through the sections one by one.

## Missing skills

This section lists the important skills that are missing from the resume.
It shows the most useful missing keywords first, with pagination for longer lists.

## How the app works

1. Upload your resume.
2. Type the role you want.
3. Start the analysis.
4. Wait for the loading steps to finish.
5. Read the score, charts, missing skills, and improvement tips.

## How to clone the project

```bash
git clone https://github.com/VUPPALA-AKSHAY/Resume-Analyzer.git
cd Resume-Analyzer
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Notes

- The app is meant for resume analysis and improvement.
- If the uploaded file is not a real resume, the app will stop and show a message asking for the correct resume.
