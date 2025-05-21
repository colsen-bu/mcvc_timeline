# Timeline Planner App

A lightweight, modern web application built with Next.js, designed to help individuals or teams visually plan and manage timelines for work or development projects. The core goal is simplicity—offering a clean, intuitive interface that makes it easy to break down a project into milestones, assign timeframes, and track progress at a glance.

## Key Features

- **Clean, Minimal UI**: A modern design aesthetic with minimal distractions, optimized for focus and usability
- **Timeline Visualization**: Create and edit timelines using draggable blocks, calendar-style views, or Gantt chart-like visualizations
- **Project & Milestone Management**: Define projects, add milestones/tasks with due dates, durations, and optional tags or color-coding
- **Quick Edits**: Inline editing of task names, durations, and start/end dates without modal popups
- **Autosave / Persistence**: Data stored using localStorage (for MVP) with optional cloud sync
- **Fast Deployment**: Optimized for deployment on Vercel

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
