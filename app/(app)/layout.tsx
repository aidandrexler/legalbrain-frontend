import Sidebar from '@/components/layout/Sidebar';
import FloatingResearch from '@/components/layout/FloatingResearch';
import ApiKeysBanner from '@/components/layout/ApiKeysBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F4F2EE' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60 min-h-screen">
        <ApiKeysBanner />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <FloatingResearch />
    </div>
  );
}
