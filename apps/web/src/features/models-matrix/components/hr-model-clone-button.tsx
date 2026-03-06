"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OperationError } from "@feedback-360/api-contract";

type CloneResponse =
  | {
      ok: true;
      data: {
        modelVersionId: string;
      };
    }
  | {
      ok: false;
      error: OperationError;
    };

export const HrModelCloneButton = ({
  sourceModelVersionId,
  returnTo = "/hr/models",
  testId,
  label = "Clone draft",
  variant = "default",
}: {
  sourceModelVersionId: string;
  returnTo?: string;
  testId?: string;
  label?: string;
  variant?: "default" | "outline";
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClone = async () => {
    setIsSubmitting(true);

    const response = await fetch("/api/hr/models/clone", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sourceModelVersionId,
        returnTo,
      }),
    });

    const payload = (await response.json()) as CloneResponse;
    setIsSubmitting(false);

    if (!payload.ok) {
      const redirect = new URL(returnTo, window.location.origin);
      redirect.searchParams.set("error", payload.error.code);
      window.location.assign(`${redirect.pathname}${redirect.search}`);
      return;
    }

    window.location.assign(`/hr/models/${payload.data.modelVersionId}?cloned=1`);
  };

  return (
    <Button
      type="button"
      variant={variant}
      data-testid={testId}
      disabled={isSubmitting}
      onClick={onClone}
    >
      {isSubmitting ? "Создаём draft…" : label}
    </Button>
  );
};
