import { SiteChrome } from "@/components/layout/SiteChrome";

export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome surface="reading">{children}</SiteChrome>;
}
