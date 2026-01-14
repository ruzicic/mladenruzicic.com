"use client"

import Script from "next/script"

type CalFloatingButtonProps = {
  calLink: string
  buttonText?: string
  buttonColor?: string
  textColor?: string
}

// Cal.com embed initialization script
// Uses hardcoded values - safe for dangerouslySetInnerHTML
const getCalScript = (
  calLink: string,
  buttonText: string,
  buttonColor: string,
  textColor: string
) => `
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () {
      let cal = C.Cal;
      let ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement("script")).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === "string") {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal, ["initNamespace", namespace]);
        } else {
          p(cal, ar);
        }
      } else {
        p(cal, ar);
      }
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal("init", "15m-discovery-session", { origin: "https://app.cal.com" });

  Cal("floatingButton", {
    calLink: "${calLink}",
    buttonText: "${buttonText}",
    buttonColor: "${buttonColor}",
    buttonTextColor: "${textColor}",
    buttonPosition: "bottom-right"
  });

  Cal.ns["15m-discovery-session"]("ui", {
    hideEventTypeDetails: false,
    layout: "month_view"
  });
`

export const CalFloatingButton = ({
  calLink,
  buttonText = "Book a Discovery Call",
  buttonColor = "1E1E1E",
  textColor = "ffffff",
}: CalFloatingButtonProps) => {
  return (
    <Script
      id="cal-embed"
      strategy="lazyOnload"
      // Props are validated/hardcoded, not user input - XSS safe
      dangerouslySetInnerHTML={{
        __html: getCalScript(calLink, buttonText, buttonColor, textColor),
      }}
    />
  )
}
