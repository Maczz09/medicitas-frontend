import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { ROLE_META } from '@/lib/roles';
import { fmtDate } from '@/lib/format';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleMeta = user ? ROLE_META[user.rol] : null;
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-navy-950/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-ink-300 hover:bg-white/[0.06] hover:text-ink-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden flex-col sm:flex">
        <p className="text-sm font-semibold capitalize text-ink-200">
          {fmtDate(new Date(), 'EEEE, dd MMMM')}
        </p>
        <p className="text-xs text-ink-500">Panel de {roleMeta?.label ?? '—'}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Tooltip content={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </Tooltip>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/[0.06] focus:outline-none">
            <Avatar name={user?.nombre} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="max-w-[140px] truncate text-xs font-semibold text-ink-100">
                {user?.nombre ?? '—'}
              </p>
              <p className={`text-[11px] font-medium ${roleMeta?.color ?? 'text-ink-400'}`}>
                {roleMeta?.label}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 rounded-xl border border-white/10 bg-navy-800 p-1.5 shadow-card data-[state=open]:animate-scale-in"
            >
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold text-ink-100">{user?.nombre}</p>
                <p className="truncate text-xs text-ink-400">{user?.email}</p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-white/[0.06]" />
              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-rose-300 outline-none transition-colors data-[highlighted]:bg-bad/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
