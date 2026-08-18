import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, toggle } = useLanguage();
  const isArabic = lang === "ar";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn("text-sm font-medium", className)}
      aria-label={isArabic ? "Switch to EN" : "التبديل إلى AR"}
      aria-pressed={isArabic}
    >
      {isArabic ? "EN" : "AR"}
    </Button>
  );
}
