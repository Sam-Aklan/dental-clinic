import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/shared/language-switcher/LanguageSwitcher";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";



export function LandingNavbar() {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Monitor scroll for glassmorphism styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initially
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scrollspy section tracking
  useEffect(() => {
    const sectionIds = ["hero", "services", "how-it-works", "contact"];
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -50% 0px", // Trigger when section is in active view
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // GSAP Initial load animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    import("gsap").then(({ gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      );

      const items: HTMLElement[] = [];
      if (logoRef.current) items.push(logoRef.current);
      if (linksRef.current) {
        items.push(...(Array.from(linksRef.current.children) as HTMLElement[]));
      }
      if (actionsRef.current) {
        items.push(...(Array.from(actionsRef.current.children) as HTMLElement[]));
      }

      if (items.length > 0) {
        tl.fromTo(
          items,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 },
          "-=0.4"
        );
      }
    });
  }, []);

  // GSAP Mobile Drawer Items Animation
  useEffect(() => {
    if (isMobileMenuOpen) {
      const timer = setTimeout(() => {
        const container = document.getElementById("mobile-nav-links");
        if (container) {
          import("gsap").then(({ gsap }) => {
            gsap.fromTo(
              Array.from(container.children),
              { y: 15, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
            );
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -72; // Header height offset
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const navLinks = [
    { id: "hero", labelKey: "landing.nav.home" },
    { id: "services", labelKey: "landing.nav.services" },
    { id: "how-it-works", labelKey: "landing.nav.howItWorks" },
    { id: "contact", labelKey: "landing.nav.contact" },
  ];

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-border bg-background/80 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div ref={logoRef}>
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "hero")}
            className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-90"
            aria-label={t("landing.nav.home")}
          >
            <img src="/logo.png" alt="Smile Clinic Logo" className="size-20 p-2  object-cover" />
            <span className="text-lg font-bold tracking-tight">
              {dir === "rtl" ? "عيادة الأسنان" : "Dental Clinic"}
            </span>
          </a>
        </div>

        {/* Desktop Nav Links */}
        {!isMobile && (
          <nav
            ref={linksRef}
            aria-label={t("nav.label")}
            className="flex items-center gap-8"
          >
            {navLinks.map((link) => {
              const active = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleNavClick(e, link.id)}
                  className={`relative py-1 text-sm font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                    active
                      ? "text-primary after:scale-x-100"
                      : "text-muted-foreground"
                  }`}
                >
                  {t(link.labelKey)}
                </a>
              );
            })}
          </nav>
        )}

        {/* Desktop Controls & CTA */}
        {!isMobile && (
          <div ref={actionsRef} className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" asChild className="hover:scale-[1.03] transition-transform">
              <Link to="/login">{t("landing.nav.login")}</Link>
            </Button>
            <Button asChild className="hover:scale-[1.03] transition-transform shadow-md">
              <Link to="/register">{t("landing.nav.register")}</Link>
            </Button>
          </div>
        )}

        {/* Mobile Hamburger Trigger */}
        {isMobile && (
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? t("shell.header.closeMenu") : t("shell.header.openMenu")}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-links"
              className="relative size-10 shrink-0"
            >
              {isMobileMenuOpen ? (
                <X className="size-6 transition-transform rotate-0 scale-100" />
              ) : (
                <Menu className="size-6 transition-transform rotate-0 scale-100" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer (Sheet) */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side={dir === "rtl" ? "left" : "right"}
            className="flex w-72 flex-col justify-between p-6 bg-background/95 backdrop-blur-md"
          >
            <SheetHeader className="text-start">
              <SheetTitle className="flex items-center gap-2 font-bold">
                <img src="/logo.png" alt="Smile Clinic Logo" className="size-5 object-contain" />
                <span>{dir === "rtl" ? "عيادة الأسنان" : "Dental Clinic"}</span>
              </SheetTitle>
            </SheetHeader>

            {/* Links container */}
            <div
              id="mobile-nav-links"
              className="flex flex-1 flex-col gap-5 pt-8"
            >
              {navLinks.map((link) => {
                const active = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className={`text-lg font-medium transition-colors hover:text-primary ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {t(link.labelKey)}
                  </a>
                );
              })}
            </div>

            {/* Bottom drawer section with Auth Buttons */}
            <div className="flex flex-col gap-3 pt-6 border-t border-border">
              <Button variant="outline" asChild className="w-full">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  {t("landing.nav.login")}
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  {t("landing.nav.register")}
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}
