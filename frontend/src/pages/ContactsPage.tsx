import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Users, Plus } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Contacts & Accounts"
        description="Customer directory, lead pipelines, and account records."
        action={
          <Button variant="primary" size="sm" disabled>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Contact
          </Button>
        }
      />

      <Card>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">CRM Contacts Module</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Data models, Flyway schema migrations, and REST CRUD workflows for Contacts will be introduced in Sprint 2.
          </p>
        </div>
      </Card>
    </div>
  );
};
