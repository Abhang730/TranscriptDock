"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { CreateOrderResponse, PublicConfig } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type State =
  | { status: "loading" }
  | { status: "unavailable"; reason: string }
  | { status: "ready"; keyId: string }
  | { status: "processing" }
  | { status: "done"; credits: number }
  | { status: "error"; message: string };

export function SupportPackCta({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = React.useState<State>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<PublicConfig>("/api/config")
      .then((config) => {
        if (cancelled) return;
        setState(
          config.paymentsEnabled
            ? { status: "ready", keyId: "" }
            : {
                status: "unavailable",
                reason:
                  "Checkout is disabled because Razorpay credentials are not configured on the server.",
              },
        );
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: "unavailable",
            reason: "The payment service could not be reached.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout() {
    setState({ status: "processing" });
    try {
      const order = await apiFetch<CreateOrderResponse>("/api/payments", {
        method: "POST",
      });
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("The Razorpay checkout script could not be loaded.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        order_id: order.orderId,
        name: "TranscriptDock",
        description: `${order.credits} transcript credits (one-time support pack)`,
        theme: { color: "#0b0b0b" },
        handler: (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          void verifyPayment(response);
        },
        modal: {
          ondismiss: () => setState({ status: "ready", keyId: order.keyId }),
        },
      });

      checkout.open();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Checkout could not be started.",
      });
    }
  }

  async function verifyPayment(response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) {
    setState({ status: "processing" });
    try {
      const result = await apiFetch<{ creditsGranted: number; balance: number }>(
        "/api/payments/verify",
        {
          method: "POST",
          body: JSON.stringify({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          }),
        },
      );
      setState({ status: "done", credits: result.creditsGranted });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "The payment could not be verified.",
      });
    }
  }

  if (state.status === "done") {
    return (
      <Alert variant="success">
        <AlertDescription>
          Payment verified. {state.credits} credits have been added to your
          account.
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button size="lg" variant="accent" disabled>
          Buy support pack — ₹49
        </Button>
        <p className="max-w-md text-xs text-[#6b6b6b]">{state.reason}</p>
        <p className="max-w-md text-xs text-[#6b6b6b]">
          Nothing will be charged. The server-side order, signature and webhook
          verification code is in place and can be tested with Razorpay test keys.
        </p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button asChild size="lg" variant="accent">
          <Link href="/sign-in?next=%2Fpricing%23support-pack">
            Sign in to buy the pack
          </Link>
        </Button>
        <p className="text-xs text-[#6b6b6b]">
          One-time ₹49. No recurring billing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        size="lg"
        variant="accent"
        onClick={startCheckout}
        isLoading={state.status === "processing" || state.status === "loading"}
      >
        Buy support pack — ₹49
      </Button>
      <p className="text-xs text-[#6b6b6b]">
        One-time ₹49. No recurring billing. Credits are granted only after
        server-side signature verification.
      </p>
      {state.status === "error" ? (
        <p role="alert" className="max-w-md text-xs font-bold text-[#d22b2b]">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

let razorpayPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayPromise = null;
      reject(new Error("Could not load the Razorpay checkout script."));
    };
    document.body.appendChild(script);
  });

  return razorpayPromise;
}
