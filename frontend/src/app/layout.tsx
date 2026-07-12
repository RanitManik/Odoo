import "./global.css";
import Providers from "./providers";
import { ToastProvider } from "@/components/ui/toast-provider";
import NextTopLoader from "nextjs-toploader";

export const metadata = {
  title: "AssetFlow | Enterprise Asset Management",
  description: "Track, allocate, and maintain your physical assets and shared resources through a centralized platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader color="#4f46e5" showSpinner={false} />
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
