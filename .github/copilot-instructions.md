<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Timeline Planner App

This is a Next.js application using TypeScript and Tailwind CSS for a Timeline Planner tool. The application helps users visually plan and manage timelines for work or development projects with a clean, intuitive interface.

## Key Features

- Clean, minimal UI with Tailwind CSS
- Timeline visualization with draggable blocks or Gantt chart-like views
- Project & milestone management with due dates, durations, and tags
- Quick inline editing of tasks and timelines
- Data persistence using localStorage (MVP) with potential for Supabase/Firebase integration
- Optimized for Vercel deployment

## Tech Stack

- Frontend: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- State Management: React Context API or Zustand
- Optional Backend: Vercel Serverless Functions (for future auth/sync features)
- Optional DB: Supabase or Firebase (for multi-device access)

## Code Style Guidelines

- Use TypeScript interfaces for all data models
- Implement React functional components with hooks
- Use named exports for components and utilities
- Follow atomic design principles for component organization
- Implement responsive design using Tailwind breakpoints
- Use client-side components only when necessary for interactivity