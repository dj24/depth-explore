import { WorkerProvider } from "@/contexts/worker-context";
import "./global.css";

export const metadata = {
  title: "Video Depth Explorer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WorkerProvider>{children}</WorkerProvider>
      </body>
    </html>
  );
}
