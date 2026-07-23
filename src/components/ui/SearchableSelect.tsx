import { useState, useRef, useEffect, useId, forwardRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchableSelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  className?: string;
  id?: string;
}

export const SearchableSelect = forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({ label, error, value, onChange, options = [], placeholder = 'Buscar...', className, id }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to top when opening
    useEffect(() => {
      if (!isOpen) {
        setSearchTerm('');
      } else {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 10);
      }
    }, [isOpen]);

    const filteredOptions = options.filter((opt) =>
      (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group options
    const groupedOptions = filteredOptions.reduce((acc, opt) => {
      const group = opt.group || 'default';
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, SearchableSelectOption[]>);

    return (
      <div className={cn("w-full", className)} ref={containerRef}>
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-ink-300">
            {label}
          </label>
        )}
        <div className="relative" ref={ref}>
          <div
            className={cn(
              'flex min-h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-navy-900/60 px-3.5 py-2 text-sm text-ink-100 transition-colors',
              isOpen ? 'border-brand-500/60 ring-2 ring-brand-500/30' : 'hover:border-white/20',
              error && 'border-bad/60',
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={cn('block truncate', !selectedOption && 'text-ink-400')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {value && (
                <div
                  role="button"
                  tabIndex={0}
                  className="p-1 hover:text-brand-300 text-ink-400 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onChange('');
                    }
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </div>
              )}
              <ChevronDown className={cn("h-4 w-4 text-ink-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1.5 max-h-60 w-full overflow-hidden rounded-xl border border-white/10 bg-navy-800 shadow-xl"
              >
                <div className="border-b border-white/5 bg-navy-850/50 p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full rounded-lg bg-navy-900/50 py-1.5 pl-8 pr-3 text-sm text-ink-100 placeholder-ink-400 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto p-1.5 custom-scrollbar">
                  {filteredOptions.length === 0 ? (
                    <div className="py-3 text-center text-xs text-ink-400">
                      No se encontraron resultados
                    </div>
                  ) : (
                    <>
                      {groupedOptions['default']?.map((opt) => (
                        <div
                          key={opt.value}
                          className={cn(
                            "cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors",
                            opt.disabled
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-brand-500/10 hover:text-brand-300",
                            value === opt.value ? "bg-brand-500/20 text-brand-300 font-medium" : "text-ink-200"
                          )}
                          onClick={() => {
                            if (!opt.disabled) {
                              onChange(opt.value);
                              setIsOpen(false);
                            }
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                      
                      {Object.keys(groupedOptions).filter(k => k !== 'default').map(group => (
                        <div key={group} className="mt-2 first:mt-0">
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                            {group}
                          </div>
                          {groupedOptions[group].map((opt) => (
                            <div
                              key={opt.value}
                              className={cn(
                                "cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors",
                                opt.disabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-brand-500/10 hover:text-brand-300",
                                value === opt.value ? "bg-brand-500/20 text-brand-300 font-medium" : "text-ink-200"
                              )}
                              onClick={() => {
                                if (!opt.disabled) {
                                  onChange(opt.value);
                                  setIsOpen(false);
                                }
                              }}
                            >
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
        </div>
      </div>
    );
  }
);
SearchableSelect.displayName = 'SearchableSelect';
