# N8N AI Workflow Generator - Technical Implementation Plan

## Executive Summary

**Goal:** Build an AI-powered N8N workflow generator with visual preview in 1-2 weeks

**Stack Decision:**
- **Frontend:** Next.js + ReactFlow + Tailwind CSS
- **Database & Auth:** Supabase
- **Backend:** Python (FastAPI)
- **AI:** Anthropic Claude API
- **Deployment:** Vercel (Frontend) + Railway/Render (Backend)

**MVP Strategy:** Ship 70% accuracy with visual preview, improve iteratively

---

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│  Python Backend  │───▶│  Claude API     │
│   (ReactFlow)   │    │    (FastAPI)     │    │  (Workflow Gen) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│    Supabase     │    │   N8N Template   │
│  (DB + Auth)    │    │    Database      │
└─────────────────┘    └──────────────────┘
```

---

## Frontend Implementation (Next.js)

### Core Components

#### 1. **Main Workflow Generator Page**
```typescript
// components/WorkflowGenerator.tsx
- Text input for workflow description
- "Generate" button
- Loading state with progress indicators
- ReactFlow visualization area
- Export/Download buttons
```

#### 2. **ReactFlow Integration**
```typescript
// components/FlowVisualization.tsx
- Custom N8N-style nodes for each node type
- Connection validation and highlighting
- Zoom/pan controls
- Minimap for large workflows
- Node property panels (future feature)
```

#### 3. **Authentication & Billing**
```typescript
// components/Auth.tsx
- Supabase Auth integration
- Simple pricing tiers
- Usage tracking (workflows generated)
```

### ReactFlow Node Types
```typescript
const nodeTypes = {
  'http-request': HttpRequestNode,
  'webhook': WebhookNode,
  'gmail': GmailNode,
  'slack': SlackNode,
  'code': CodeNode,
  'if': IfNode,
  'set': SetNode,
  // ... other N8N node types
}
```

### Tech Stack Details
- **Next.js 14** (App Router)
- **ReactFlow** for workflow visualization
- **Tailwind CSS** for styling
- **Supabase JS** for auth/database
- **React Hook Form** for input handling
- **Axios** for API calls

---

## Backend Implementation (Python FastAPI)

### Core Structure
```python
# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client

app = FastAPI()

# Routes
/api/generate-workflow    # Main AI generation endpoint
/api/validate-workflow    # Workflow validation
/api/export-workflow      # Export to N8N JSON
/api/user/usage          # Usage tracking
```

### Key Modules

#### 1. **AI Workflow Generator**
```python
# app/services/workflow_generator.py
class WorkflowGenerator:
    def __init__(self):
        self.claude_client = anthropic.Anthropic()
        self.n8n_nodes = self.load_node_registry()
    
    async def generate_workflow(self, description: str) -> dict:
        # 1. Generate workflow with Claude
        # 2. Validate nodes exist
        # 3. Fix connections
        # 4. Return ReactFlow-compatible JSON
```

#### 2. **N8N Node Registry**
```python
# app/services/node_registry.py
class NodeRegistry:
    def __init__(self):
        self.available_nodes = self.load_from_n8n_docs()
    
    def validate_node(self, node_type: str) -> bool:
        return node_type in self.available_nodes
    
    def suggest_alternative(self, invalid_node: str) -> str:
        # Return HTTP Request + instructions for missing nodes
```

#### 3. **Workflow Validator**
```python
# app/services/validator.py
class WorkflowValidator:
    def validate_connections(self, workflow: dict) -> dict:
        # Check all nodes have proper source/target connections
        # Add missing connections
        # Return corrected workflow
    
    def validate_node_parameters(self, workflow: dict) -> dict:
        # Ensure required parameters are present
        # Add default values where missing
```

### Database Schema (Supabase)
```sql
-- Users (handled by Supabase Auth)

-- Workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255),
    description TEXT,
    n8n_json JSONB,
    reactflow_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    workflows_generated INTEGER DEFAULT 0,
    last_reset TIMESTAMP DEFAULT NOW(),
    plan VARCHAR(50) DEFAULT 'free'
);

-- Node Registry Cache
CREATE TABLE n8n_nodes (
    node_type VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(255),
    category VARCHAR(100),
    parameters JSONB,
    last_updated TIMESTAMP DEFAULT NOW()
);
```

---

## AI Implementation Strategy

### Claude Prompt Engineering
```python
WORKFLOW_GENERATION_PROMPT = """
You are an expert N8N workflow builder. Generate a valid N8N workflow JSON based on this description:

{user_description}

Rules:
1. Only use these valid N8N nodes: {valid_nodes}
2. If a node doesn't exist, use "HTTP Request" node instead
3. Ensure all nodes have proper connections
4. Include required parameters for each node
5. Generate unique node IDs

Available nodes: Gmail, Slack, HTTP Request, Webhook, Code, If, Set, Wait, Schedule Trigger, Manual Trigger

Return only valid JSON in this format:
{example_workflow_json}
"""
```

### Validation Pipeline
```python
async def generate_and_validate_workflow(description: str):
    # Step 1: Generate with Claude
    raw_workflow = await claude_generate(description)
    
    # Step 2: Validate nodes exist
    validated_workflow = node_registry.validate_nodes(raw_workflow)
    
    # Step 3: Fix connections
    connected_workflow = validator.fix_connections(validated_workflow)
    
    # Step 4: Convert to ReactFlow format
    reactflow_data = converter.to_reactflow(connected_workflow)
    
    return {
        'n8n_json': connected_workflow,
        'reactflow_json': reactflow_data,
        'warnings': validator.get_warnings()
    }
```

---

## Data Flow & API Design

### Main Generation Endpoint
```python
@app.post("/api/generate-workflow")
async def generate_workflow(
    request: WorkflowRequest,
    user: User = Depends(get_current_user)
):
    # Check usage limits
    if not await check_usage_limit(user.id):
        raise HTTPException(403, "Usage limit exceeded")
    
    # Generate workflow
    result = await workflow_generator.generate(request.description)
    
    # Save to database
    workflow_id = await save_workflow(user.id, result)
    
    # Update usage
    await increment_usage(user.id)
    
    return {
        "workflow_id": workflow_id,
        "n8n_json": result['n8n_json'],
        "reactflow_json": result['reactflow_json'],
        "warnings": result['warnings']
    }
```

### Request/Response Format
```typescript
// Request
interface WorkflowRequest {
  description: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

// Response
interface WorkflowResponse {
  workflow_id: string;
  n8n_json: object;
  reactflow_json: {
    nodes: Node[];
    edges: Edge[];
  };
  warnings: string[];
}
```

---

## ReactFlow Integration Details

### Custom Node Components
```typescript
// components/nodes/HttpRequestNode.tsx
const HttpRequestNode = ({ data, selected }) => {
  return (
    <div className={`p-4 border rounded-lg ${selected ? 'border-blue-500' : 'border-gray-300'}`}>
      <div className="flex items-center gap-2">
        <HttpIcon />
        <span className="font-semibold">HTTP Request</span>
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {data.method} {data.url}
      </div>
      
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

### Workflow Conversion
```typescript
// utils/workflowConverter.ts
export function convertN8NToReactFlow(n8nWorkflow: any) {
  const nodes = n8nWorkflow.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: calculatePosition(node), // Auto-layout
    data: {
      label: node.name,
      parameters: node.parameters,
      ...node
    }
  }));

  const edges = extractConnections(n8nWorkflow.connections);
  
  return { nodes, edges };
}
```

---

## Deployment Strategy

### Frontend (Vercel)
```yaml
# vercel.json
{
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_API_BASE_URL": "@api-base-url"
  }
}
```

### Backend (Railway/Render)
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables
```bash
# Backend
ANTHROPIC_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
DATABASE_URL=postgresql://...

# Frontend
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=https://api...
```

---

## MVP Development Timeline

### Week 1: Core Functionality
**Days 1-2: Backend Setup**
- FastAPI project structure
- Supabase integration
- Basic Claude API integration
- Simple workflow generation endpoint

**Days 3-4: Frontend Foundation**
- Next.js project setup
- Supabase auth integration
- Basic UI for workflow input
- ReactFlow integration

**Days 5-7: AI Integration**
- Workflow generation pipeline
- Basic validation logic
- N8N to ReactFlow conversion
- End-to-end testing

### Week 2: Polish & Launch
**Days 8-10: UI/UX**
- Custom ReactFlow nodes
- Workflow visualization improvements
- Error handling and loading states
- Export functionality

**Days 11-12: Validation & Testing**
- Node registry implementation
- Connection validation
- User testing with real N8N workflows
- Bug fixes

**Days 13-14: Launch Prep**
- Deployment setup
- Basic pricing/usage limits
- Landing page
- ProductHunt launch prep

---

## Success Metrics & Iteration

### MVP Success Metrics
- **Technical:** 70%+ workflows generate without errors
- **User:** 50+ signups in first month
- **Business:** 10+ paying users at €30/month
- **Feedback:** Clear direction for v2 improvements

### Post-MVP Roadmap
1. **Accuracy Improvements** (Month 2)
   - Better Claude prompts
   - User feedback integration
   - Advanced validation

2. **Editing Features** (Month 3)
   - Visual node editing
   - Parameter customization
   - Real-time validation

3. **Advanced Features** (Month 4+)
   - N8N instance integration
   - Template library
   - Collaboration features

---

## Risk Mitigation

### Technical Risks
- **Claude API limits:** Implement rate limiting, usage monitoring
- **ReactFlow complexity:** Start simple, add features incrementally
- **N8N changes:** Monitor their API/docs for updates

### Business Risks
- **Low accuracy:** Set expectations, iterate quickly
- **Limited market:** Expand to other automation platforms
- **Competition:** Focus on visual preview advantage

### Execution Risks
- **Scope creep:** Stick to MVP features only
- **Perfect solution syndrome:** Ship at 70% accuracy
- **Analysis paralysis:** Set 2-week hard deadline

---

## Conclusion

This tech stack is optimized for **speed and iteration**:
- **Python backend:** Fast development, great AI library support
- **Next.js + ReactFlow:** Modern, powerful frontend stack
- **Supabase:** Instant database and auth
- **Claude API:** Best-in-class AI for workflow generation

**Key Success Factor:** Ship the imperfect MVP in 2 weeks, then improve based on real user feedback. The visual preview with ReactFlow will be your main differentiator over existing JSON-only tools.

**Next Step:** Start with the backend workflow generation logic - that's your core value proposition. Everything else is just packaging around that core AI workflow generator.