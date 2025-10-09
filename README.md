# PDF-Based Quiz & Learning Companion

A web application that allows students to interact with PDFs (like NCERT Class XI Physics), generate quizzes, track progress, and use a ChatGPT-inspired virtual teaching companion.

---

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Installation](#installation)  
3. [Configuration](#configuration)  
4. [Running the App](#running-the-app)  
5. [Features](#features)  
   - [Must-Have Features](#must-have-features)  
   - [Nice-to-Have Features](#nice-to-have-features)  
6. [Submission Requirements](#submission-requirements)  
7. [Project Architecture](#project-architecture)  
8. [LLM & AI Tools](#llm--ai-tools)  

---

## Prerequisites

- **Node.js** (v18+ recommended)  
- **npm** (comes with Node.js)  
- Gemini API key (for quiz generation & AI features)  

---

## Installation

1. **Clone the repository**  

```bash
git clone https://github.com/Shreya111111/BeyondChats/
cd BeyondChats
```

2. **Install dependencies**  

```bash
npm install
```

3. **Set environment variables**  

Create a `.env.local` file in the root directory and add:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. **Seed PDFs**  

- For testing, include some sample PDFs such as NCERT Class XI Physics PDFs in a folder like `public/pdfs/`.  
- Users can also upload their own PDFs through the app.

---

## Running the App

```bash
npm run dev
```

- The app will start on `http://localhost:3000` (or a port specified by your environment).  
- Open the URL in your browser to access the application.

---

## Features

### Must-Have Features

1. **Source Selector**
   - Simple component to choose:
     - All uploaded PDFs
     - Specific PDF
   - Seeded with NCERT PDFs for testing
   - User can upload their own PDF coursebook

2. **PDF Viewer**
   - Display the selected PDF alongside the chat in a split view or tab

3. **Quiz Generator Engine**
   - Generate:
     - MCQs (Multiple Choice Questions)  
     - SAQs (Short Answer Questions)  
     - LAQs (Long Answer Questions)  
   - Render the quiz, capture user answers, score submissions  
   - Provide explanations for each answer  
   - Option to generate new set of questions  

4. **Progress Tracking**
   - Track user’s strengths and weaknesses through quizzes  
   - Tiny dashboard to manage and visualize learning journey  

---

### Nice-to-Have Features

1. **Chat UI (ChatGPT-inspired)**
   - Acts as a virtual teacher / teaching companion  
   - Clean, mobile-responsive design  

2. **RAG (Retrieval-Augmented Generation) Answers with Citations**
   - Ingest selected PDFs: chunk + embed  
   - Chatbot answers must cite page numbers and quote snippets from source  

3. **YouTube Video Recommendations**
   - Recommends relevant educational videos from YouTube based on uploaded PDFs  

---

## Submission Requirements

1. **GitHub Repository**
   - `README.md` (setup, run instructions, project explanation, tools used)  
   - Verifiable commits to track development progress  

2. **Live Demo**
   - https://beyondchats-g0cpb8h2i-shreyas-projects-ad80b7e8.vercel.app/

---

## Project Architecture (Suggested)

```
/public
    /pdfs             # Seeded PDFs
/src
    /components       # React components (PDF viewer, chat UI, quiz engine)
.env.local
package.json
README.md
```

---

## LLM & AI Tools

- **Gemini API**: for quiz generation, RAG-based answers  
- **Embedding & Chunking**: for PDF content retrieval and citation  
- Optional: **YouTube API** for video recommendations  

---

**Note:** Users can extend this application by adding authentication, advanced analytics, or gamification features for better engagement.
