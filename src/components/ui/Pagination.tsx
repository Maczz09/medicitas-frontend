import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import type { PageMeta } from '@/types';

interface Props {
  meta: PageMeta | undefined;
  page: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({ meta, page, onPageChange, itemLabel = 'resultados' }: Props) {
  if (!meta) return null;
  const totalPages = meta.totalPages || 1;

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <p className="text-xs text-ink-400">
        {meta.total} {itemLabel} · página {meta.page} de {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
