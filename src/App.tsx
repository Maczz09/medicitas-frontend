import { AppRouter } from './router';
import { useRealtimeSync } from './hooks/useRealtimeSync';

export default function App() {
  useRealtimeSync();
  return <AppRouter />;
}
