# n8n Automated Workflow Generator

An intelligent, chat-based tool for automatically generating [n8n](https://n8n.io/) workflows using the power of AI. Describe your desired workflow in plain English, and watch as it's built for you on an interactive canvas.

## ✨ Features

-   **AI-Powered Workflow Generation**: Leverages large language models to understand your requirements and generate complex n8n workflows.
-   **Conversational Interface**: A simple and intuitive chat interface to interact with the AI.
-   **Interactive Canvas**: View, and potentially edit, the generated workflows on a zoomable, pannable canvas powered by React Flow.
-   **Multi-Model Support**: Support for various AI providers like OpenAI, Anthropic, and Google.
-   **Documentation-Aware**: The AI can search through n8n documentation to build more accurate workflows.
-   **Workflow Management**: Save, view, and manage your generated workflows.

## 🚀 Tech Stack

-   **Frontend**:
    -   [Next.js](https://nextjs.org/)
    -   [React](https://react.dev/)
    -   [TypeScript](https://www.typescriptlang.org/)
    -   [Tailwind CSS](https://tailwindcss.com/)
    -   [React Flow](https://reactflow.dev/) for the workflow canvas
    -   [TanStack Query](https://tanstack.com/query/latest) for data fetching and state management
-   **Backend**:
    -   [Python 3](https.py/python.org/)
    -   [FastAPI](https://fastapi.tiangolo.com/) for the REST API
    -   Support for various LLMs (OpenAI, Anthropic, Google).
-   **Database**:
    -   [Supabase](https://supabase.com/) (PostgreSQL)

## 📂 Project Structure

The project is a monorepo with two main packages:

-   `backend/`: The Python FastAPI application that handles AI logic, workflow generation, and serves the API.
-   `frontend/`: The Next.js web application that provides the user interface.

See the `README.md` files in each directory for more details on each part.

## 🛠️ Getting Started

### Prerequisites

-   Node.js and npm (or yarn/pnpm)
-   Python 3.10+ and pip
-   A Supabase project
-   API keys for your chosen AI provider (e.g., OpenAI)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd n8n-automated
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    pip install -r requirements.txt
    # You will need to set up your environment variables.
    # Create a .env file and add your Supabase and AI provider credentials.
    # Example .env file content:
    # SUPABASE_URL=...
    # SUPABASE_KEY=...
    # OPENAI_API_KEY=...
    # ANTHROPIC_API_KEY=...
    # ... and other necessary variables
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    # You will need to set up your environment variables.
    # Create a .env.local file and add your Supabase credentials.
    # Example .env.local file content:
    # NEXT_PUBLIC_SUPABASE_URL=...
    # NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    ```

### Running the application

1.  **Run the backend server:**
    ```bash
    cd backend
    # Make sure your virtual environment is activated
    uvicorn app.main:app --reload
    ```
    The backend will be running on `http://127.0.0.1:8000`.

2.  **Run the frontend development server:**
    ```bash
    cd frontend
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📖 Usage

1.  Navigate to the chat interface.
2.  Start a conversation by describing the workflow you want to create.
    *Example: "Create a workflow that gets the latest 5 posts from Hacker News and sends them to a Discord channel."*
3.  The AI will ask clarifying questions if needed.
4.  The generated workflow will appear on the canvas.

## 🙌 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request 