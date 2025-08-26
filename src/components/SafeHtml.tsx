"use client";

import DOMPurify from "isomorphic-dompurify";
import React from "react";

type SafeHtmlProps = {
  html: string | null | undefined;
  className?: string;
};

export function SafeHtml({ html, className }: SafeHtmlProps) {
  if (!html) return null;
  const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}


