import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function DashboardHome() {
  return (
    <Card className="max-w-xl mx-auto p-8 text-center bg-black border border-white/10">
      <h1 className="text-3xl font-bold mb-4 text-white">Welcome to n8n AI Workflow Generator</h1>
      <p className="mb-6 text-white">Start by generating a new workflow using the menu on the left.</p>
      <Button className="text-lg px-8 py-3" asChild>
        <a href="#">Generate Workflow</a>
      </Button>
    </Card>
  );
} 