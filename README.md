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
- Shadcn-style UI pieces for components
- AI provider APIs for resume analysis

## What the app does

- Upload a resume in PDF or Word format.
- Enter a job role you want to target.
- Get a final dashboard with charts, missing skills, and resume improvements

## Main features

- Upload flow: choose a resume and start the analysis.
- AI analysis: compares your resume with the role you typed.
- Resume insights: shows the important parts of the resume in one place.

## What the charts mean

The app has three chart views.

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

It also lets you move through the sections one by one.

## Missing skills

This section lists the important skills that are missing from the resume.

## How to clone the project

```bash
git clone https://github.com/VUPPALA-AKSHAY/Resume-Analyzer.git
cd Resume-Analyzer
npm install
npm run dev
```
