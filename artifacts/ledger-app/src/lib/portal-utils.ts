import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

export interface PortalPayload {
  v: 1;
  biz: string;
  desc?: string;
  cur: string;
  exp: number;
  wm?: string;
  c: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    opening_balance: number;
  };
  tx: Array<{
    date: string;
    type: "credit" | "debit";
    amount: number;
    description: string | null;
    payment_mode: string | null;
    reference_id: string | null;
  }>;
}

export async function createPortalLink(
  customerId: string,
  userId: string,
  payload: PortalPayload
): Promise<string> {
  const token = nanoid(10);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Delete any old (expired or active) portal links for this customer to keep DB clean
  await supabase
    .from("customer_portals")
    .delete()
    .eq("customer_id", customerId)
    .eq("user_id", userId);

  const { error } = await supabase.from("customer_portals").insert({
    token,
    customer_id: customerId,
    user_id: userId,
    payload: payload as any,
    expires_at: expiresAt,
  });

  if (error) throw error;
  return `${window.location.origin}/portal/${token}`;
}

export function isPortalExpired(expiresAt: string): boolean {
  return Date.now() > new Date(expiresAt).getTime();
}

export function compressWatermark(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 380;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.25));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
