import { CartDrawer } from "@/components/cart/cart-drawer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { JsonLd } from "@/components/seo/json-ld";
import { getStoreSettings } from "@/lib/catalog/repository";
import { siteConfig } from "@/lib/config/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

/** The admin's announcement leads; the house promises follow. Cached, so it stays in the static shell. */
async function Announcements() {
  const { announcement } = await getStoreSettings();
  const messages = [announcement, ...siteConfig.announcements].map((m) => m.trim()).filter((m, i, all) => m && all.indexOf(m) === i);
  return <AnnouncementBar messages={messages} />;
}

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Announcements />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <MobileMenu />
    </>
  );
}
