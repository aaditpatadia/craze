import { SiteChrome } from "@/components/layout/SiteChrome";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome surface="product">{children}</SiteChrome>;
}
