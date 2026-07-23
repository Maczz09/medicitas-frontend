import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input, Select } from '@/components/ui';
import { PatientPicker } from './PatientPicker';
import type { Paciente } from '@/types';

interface EstadoFiltro {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface PacienteFiltro {
  value: Paciente | null;
  onChange: (p: Paciente | null) => void;
}

interface Props {
  search: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  estado?: EstadoFiltro;
  paciente?: PacienteFiltro;
  extra?: ReactNode;
}

// Barra de búsqueda/filtros reutilizable — reemplaza el bloque de
// Input+debounce+Select que antes se repetía a mano en cada página admin.
export function ListToolbar({ search, estado, paciente, extra }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 md:flex-row md:flex-wrap md:items-end">
      <div className="min-w-[220px] flex-1">
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Buscar</label>
        <Input
          placeholder={search.placeholder ?? 'Buscar…'}
          leftIcon={<Search className="h-4 w-4" />}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
        />
      </div>

      {estado && (
        <div className="w-full md:w-48">
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Estado</label>
          <Select value={estado.value} onChange={(e) => estado.onChange(e.target.value)}>
            {estado.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      )}

      {paciente && (
        <div className="w-full md:w-72">
          <PatientPicker value={paciente.value} onChange={paciente.onChange} />
        </div>
      )}

      {extra}
    </div>
  );
}
