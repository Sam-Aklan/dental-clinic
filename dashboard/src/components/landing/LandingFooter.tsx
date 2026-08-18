import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useDoctorsQuery } from "@/hooks/booking";
import { LanguageSwitcher } from "@/components/shared/language-switcher/LanguageSwitcher";
import { useLanguage } from "@/hooks/use-language";



function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export function LandingFooter() {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const currentYear = new Date().getFullYear();

  // Load doctors to find the default lobby queue ID
  const { data: doctors } = useDoctorsQuery();
  const envDoctorId = import.meta.env.VITE_DEFAULT_DOCTOR_ID;
  
  // Find first active doctor if env variable is not specified
  const defaultDoctor = doctors?.find((d) => d.isActive) || doctors?.[0];
  const doctorId = envDoctorId || defaultDoctor?.id;
  const lobbyUrl = doctorId ? `/lobby/${doctorId}` : null;

  const handleQuickLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id);
    if (element) {
      e.preventDefault();
      const yOffset = -72;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground" id="contact">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Column 1: Brand & Tagline */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Smile Clinic Logo" className="size-20 object-contain" />
              <span className="text-lg font-bold tracking-tight">
                {dir === "rtl" ? "عيادة الأسنان" : "Dental Clinic"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("landing.footer.tagline")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dir === "rtl" 
                ? "123 شارع المركز الطبي، جناح 100" 
                : "123 Medical Center St, Suite 100"}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              {t("landing.footer.quickLinks")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => handleQuickLinkClick(e, "hero")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.nav.home")}
                </a>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.hero.cta.book")}
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.nav.login")}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("landing.nav.register")}
                </Link>
              </li>
              {lobbyUrl && (
                <li>
                  <Link
                    to={lobbyUrl}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t("landing.hero.cta.queue")}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              {t("landing.footer.contact")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:info@dentalclinic.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                >
                  info@dentalclinic.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+15550000000"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                  dir="ltr"
                >
                  +1 (555) 000-0000
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Media Icons */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              {dir === "rtl" ? "تابعنا" : "Follow Us"}
            </h3>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors p-2 -m-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={dir === "rtl" ? "قم بزيارة صفحتنا على فيسبوك" : "Visit our Facebook page"}
              >
                <FacebookIcon className="size-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors p-2 -m-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={dir === "rtl" ? "قم بزيارة صفحتنا على إنستغرام" : "Visit our Instagram page"}
              >
                <InstagramIcon className="size-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors p-2 -m-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={dir === "rtl" ? "قم بزيارة صفحتنا على إكس" : "Visit our X page"}
              >
                <TwitterIcon className="size-5" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border/70 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-start">
            {t("landing.footer.copyright", { year: currentYear })}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {dir === "rtl" ? "تغيير اللغة:" : "Change Language:"}
            </span>
            <LanguageSwitcher className="border border-border/70 bg-background hover:bg-accent px-3 py-1 rounded" />
          </div>
        </div>

      </div>
    </footer>
  );
}
