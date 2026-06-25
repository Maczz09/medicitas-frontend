import { Hammer } from 'lucide-react';
import { PageHeader, Card, CardBody, EmptyState } from '@/components/ui';

export default function PlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <CardBody>
          <EmptyState
            icon={Hammer}
            title="Sección en construcción"
            description="Este módulo estará disponible en breve."
          />
        </CardBody>
      </Card>
    </div>
  );
}
