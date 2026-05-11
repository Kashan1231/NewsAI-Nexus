# 📰 NewsAI Intelligence Platform

> **The next generation of news aggregation, powered by AI.**

NewsAI is a full-stack intelligence platform that leverages LLMs (Llama 3) and Vector Databases to provide a seamless, ad-free, and intelligent news reading experience.

![Frontend Preview](https://news-ai-nexus.vercel.app/og-image.png)

## ✨ Core Features

-   **🧠 Semantic Search**: Search for concepts, not just keywords, using pgvector and embeddings.
-   **🤖 Ask AI**: Chat directly with any news article to get deeper insights or simplified explanations.
-   **📝 AI Summaries**: Every article comes with an objective, AI-generated summary.
-   **⚡ Performance Refresh**: Database-backed refresh flow for sub-second page updates.
-   **🛡️ Enterprise Security**: Granular rate-limiting for AI, Search, and Auth routes.
-   **📧 Smart Digest**: Newsletter subscription with automated email delivery via Brevo.

## 🚀 Tech Stack

-   **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide Icons
-   **Backend**: Node.js, Express, node-cron
-   **Database**: PostgreSQL (Supabase) + pgvector
-   **AI**: Groq (Llama 3), HuggingFace (Embeddings)
-   **Auth**: JWT + Supabase
-   **Deployment**: Vercel (Frontend), Choreo (Backend)

## 📦 Project Structure

```text
├── news-aggregator/          # Next.js App
└── news-aggregator-backend/  # Express API
├── DATABASE.md               # Schema Documentation
└── PROJECT_REPORT.md         # Technical Overview
```

## 🛠️ Getting Started

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/Kashan1231/NewsAI-Nexus.git
    cd NewsAI-Nexus
    # Install in both folders
    cd news-aggregator && npm install
    cd ../news-aggregator-backend && npm install
    ```

2.  **Environment Setup**:
    -   Create `.env.local` in `news-aggregator/`
    -   Create `.env` in `news-aggregator-backend/`
    -   (Refer to `DATABASE.md` for SQL setup)

3.  **Run Locally**:
    -   Backend: `npm run dev` (Port 5000)
    -   Frontend: `npm run dev` (Port 3000)

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
