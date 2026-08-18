import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";

i18n.init({
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        offers: {
          loading: "Loading offer...",
          title: "Waitlist Offer",
          doctorLabel: "Doctor",
          specialization: "Specialization",
          offeredSlot: "Offered Slot",
          currentAppointment: "Your Current Appointment",
          compareLabel: "Comparison",
          from: "From",
          to: "to",
          accept: "Accept Offer",
          decline: "Decline",
          cancel: "Cancel",
          confirm: "Confirm",
          retry: "Retry",
          expired: "This offer has expired.",
          accepted: "Offer Accepted",
          declined: "Offer Declined",
          acceptedDescription: "Your appointment has been scheduled.",
          declinedDescription: "You have declined this offer.",
          notFound: "Offer not found.",
          forbidden: "You do not have access to this offer.",
          genericError: "Something went wrong. Please try again.",
          unavailable: "This slot is no longer available.",
          countdownLabel: "Offer expires in",
          goToAppointments: "View My Appointments",
          goToWaitlist: "Back to Waitlist",
          acceptDialogTitle: "Accept Offer",
          acceptDialogDescription: "Are you sure you want to accept this offer? Your current appointment will be replaced.",
          declineDialogTitle: "Decline Offer",
          declineDialogDescription: "Are you sure you want to decline this offer? This slot will be offered to another patient.",
          acceptSuccess: "Offer accepted successfully.",
          declineSuccess: "Offer declined.",
          acceptError: "Failed to accept offer. Please try again.",
          declineError: "Failed to decline offer. Please try again.",
          pending: "Processing...",
          nextStepAppointments: "Your appointment has been scheduled. View your appointments to see the details.",
          nextStepWaitlist: "You can return to the waitlist to join other doctors' lists.",
          safeNextStep: "Return to the home page to explore other options.",
        },
      },
    },
    ar: {
      translation: {
        offers: {
          loading: "جارٍ تحميل العرض...",
          title: "عرض قائمة الانتظار",
          doctorLabel: "الطبيب",
          specialization: "التخصص",
          offeredSlot: "الموعد المعروض",
          currentAppointment: "موعدك الحالي",
          compareLabel: "المقارنة",
          from: "من",
          to: "إلى",
          accept: "قبول العرض",
          decline: "رفض",
          cancel: "إلغاء",
          confirm: "تأكيد",
          retry: "إعادة المحاولة",
          expired: "انتهت صلاحية هذا العرض.",
          accepted: "تم قبول العرض",
          declined: "تم رفض العرض",
          acceptedDescription: "تم جدولة موعدك.",
          declinedDescription: "لقد رفضت هذا العرض.",
          notFound: "العرض غير موجود.",
          forbidden: "ليس لديك صلاحية للوصول إلى هذا العرض.",
          genericError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
          unavailable: "هذا الموعد لم يعد متاحاً.",
          countdownLabel: "ينتهي العرض خلال",
          goToAppointments: "عرض مواعيدي",
          goToWaitlist: "العودة إلى قائمة الانتظار",
          acceptDialogTitle: "قبول العرض",
          acceptDialogDescription: "هل أنت متأكد أنك تريد قبول هذا العرض؟ سيتم استبدال موعدك الحالي.",
          declineDialogTitle: "رفض العرض",
          declineDialogDescription: "هل أنت متأكد أنك تريد رفض هذا العرض؟ سيتم عرض هذا الموعد على مريض آخر.",
          acceptSuccess: "تم قبول العرض بنجاح.",
          declineSuccess: "تم رفض العرض.",
          acceptError: "فشل قبول العرض. يرجى المحاولة مرة أخرى.",
          declineError: "فشل رفض العرض. يرجى المحاولة مرة أخرى.",
          pending: "جارٍ المعالجة...",
          nextStepAppointments: "تم جدولة موعدك. اطلع على مواعيدك لمشاهدة التفاصيل.",
          nextStepWaitlist: "يمكنك العودة إلى قائمة الانتظار للانضمام إلى قوائم أطباء آخرين.",
          safeNextStep: "عد إلى الصفحة الرئيسية لاستكشاف خيارات أخرى.",
        },
      },
    },
  },
});

export function createOfferQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithOfferProviders(ui: ReactNode) {
  const queryClient = createOfferQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper }),
  };
}

export function setLanguage(lng: "en" | "ar") {
  i18n.changeLanguage(lng);
}
