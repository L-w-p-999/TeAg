import MainShell from "./MainShell";
import { ModelProvider } from "@/lib/store/modelContext";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ModelProvider>
      <MainShell>{children}</MainShell>
    </ModelProvider>
  );
}
