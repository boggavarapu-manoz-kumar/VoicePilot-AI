import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { BookOpen, Plus } from 'lucide-react';

export const KnowledgeBasePage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Knowledge Base (RAG)"
        description="Ground your voice agents with verified company documents, FAQs, and product manuals."
        action={
          <Button variant="primary" size="sm" disabled>
            <Plus className="w-4 h-4 mr-1.5" />
            Upload Document
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={BookOpen}
          title="No Knowledge Sources Attached"
          description="Vector embedding pipelines and knowledge ingestion workflows will be introduced in Sprint 5."
          action={
            <Button variant="outline" size="sm" disabled>
              Learn about RAG Indexing
            </Button>
          }
        />
      </Card>
    </div>
  );
};
