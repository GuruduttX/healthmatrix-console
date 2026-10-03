import { MobileNav, Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";

export default function ConsoleLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:py-6 print:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
