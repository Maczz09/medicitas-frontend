import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  size?: Size;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, description, size = 'md', children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={description ? undefined : undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className={cn(
                  // Centrado por margin:auto (no por translate) para no chocar con el
                  // transform que controla Framer Motion en la animación de entrada.
                  'glass-strong fixed inset-0 z-50 m-auto h-fit max-h-[90vh] w-[94vw] overflow-hidden rounded-2xl shadow-card',
                  sizes[size],
                )}
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-base font-semibold text-ink-100">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-0.5 text-xs text-ink-400">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-ink-100">
                    <X className="h-4.5 w-4.5" />
                  </Dialog.Close>
                </div>
                <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-5 py-5">{children}</div>
                {footer && (
                  <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] bg-navy-900/40 px-5 py-3.5">
                    {footer}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
