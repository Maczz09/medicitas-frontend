import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Avatar, Spinner } from '@/components/ui';
import { usePacientesList } from '@/features/pacientes/usePacientes';
import { useDebounce } from '@/hooks/useDebounce';
import type { Paciente } from '@/types';

interface Props {
  value: Paciente | null;
  onChange: (p: Paciente | null) => void;
  label?: string;
}

export function PatientPicker({ value, onChange, label = 'Paciente' }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 300);
  const { data, isFetching } = usePacientesList({ q: debounced || undefined, page: 1, limit: 6 });

  if (value) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">{label}</label>
        <div className="flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/[0.06] p-3">
          <Avatar name={`${value.nombre} ${value.apellido}`} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-100">
              {value.nombre} {value.apellido}
            </p>
            <p className="font-mono text-xs text-ink-500">
              {value.tipo_documento} · {value.numero_documento}
            </p>
          </div>
          <button
            onClick={() => onChange(null)}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300"
            aria-label="Quitar paciente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-medium text-ink-300">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar paciente por nombre o documento…"
          className="h-10 w-full rounded-xl border border-white/10 bg-navy-900/60 pl-10 pr-3.5 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        {isFetching && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />}
      </div>

      {open && debounced && (
        <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-navy-800 p-1.5 shadow-card">
          {(data?.data ?? []).length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-ink-500">Sin coincidencias</p>
          ) : (
            data?.data.map((p) => (
              <button
                key={p.id_paciente}
                onMouseDown={() => {
                  onChange(p);
                  setQ('');
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]"
              >
                <Avatar name={`${p.nombre} ${p.apellido}`} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-100">
                    {p.nombre} {p.apellido}
                  </p>
                  <p className="font-mono text-xs text-ink-500">{p.numero_documento}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
