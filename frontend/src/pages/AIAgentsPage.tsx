import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Bot, Plus } from 'lucide-react';

export const AIAgentsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="AI Voice Agents"
        description="Conversational prompts, speech synthesis voices, and RAG knowledge bases."
        action={
          <Button variant="primary" size="sm" disabled>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Agent
          </Button>
        }
      />

      <Card>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">AI Agents & Orchestration</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Local/remote LLM inference bridges, STT/TTS connectors, and vector RAG pipelines are scheduled for Sprint 5.
          </p>
        </div>
      </Card>
    </div>
  );
};
