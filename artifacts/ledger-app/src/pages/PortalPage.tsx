import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Printer, AlertTriangle, Clock, ShieldCheck, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PortalPayload } from "@/lib/portal-utils";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const printStyles = `
@media print {
  @page { margin: 16mm 14mm; size: A4; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .print-show { display: block !important; }
  .print-flex { display: flex !important; }
  .watermark-layer { display: flex !important; }
}
@media screen {
  .print-show { display: none !important; }
  .print-flex { display: none !important; }
}
`;

type Status = "loading" | "expired" | "invalid" | "ok";

export default function PortalPage() {
  const [, params] = useRoute("/portal/:token");
  const token = params?.token ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [payload, setPayload] = useState<PortalPayload | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    (async () => {
      const { data, error } = await supabase
        .from("customer_portals")
        .select("payload, expires_at")
        .eq("token", token)
        .single();

      if (error || !data) { setStatus("invalid"); return; }

      const expired = Date.now() > new Date(data.expires_at).getTime();
      if (expired) {
        // Clean up expired record
        await supabase.from("customer_portals").delete().eq("token", token);
        setStatus("expired");
        return;
      }

      setPayload(data.payload as PortalPayload);
      setExpiresAt(data.expires_at);
      setStatus("ok");
    })();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto text-slate-400 animate-spin" size={36} />
          <p className="text-slate-500 text-sm">Loading statement…</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-3 p-8 max-w-sm">
          <AlertTriangle className="mx-auto text-amber-400" size={48} />
          <h1 className="text-xl font-bold text-slate-800">Invalid Link</h1>
          <p className="text-slate-500 text-sm">This link is invalid or has already been used. Please ask the sender for a new one.</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-3 p-8 max-w-sm">
          <Clock className="mx-auto text-slate-400" size={48} />
          <h1 className="text-xl font-bold text-slate-800">Link Expired</h1>
          <p className="text-slate-500 text-sm">This statement link expired after 48 hours. Please request a fresh one.</p>
        </div>
      </div>
    );
  }

  if (!payload) return null;

  const { biz, desc, cur, c, tx, wm } = payload;
  const totalCredit = tx.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebit  = tx.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const netBalance  = (c.opening_balance ?? 0) + totalCredit - totalDebit;
  const expiresOn   = new Date(expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const generatedOn = fmtDate(new Date().toISOString());
  const balPositive = netBalance >= 0;

  return (
    <>
      <style>{printStyles}</style>

      {/* Watermark layer */}
      <div
        className="watermark-layer"
        style={{ display: "none", position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", overflow: "hidden", alignItems: "center", justifyContent: "center" }}
      >
        {wm ? (
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(4, 1fr)", width: "100%", height: "100%" }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-25deg)" }}>
                <img src={wm} alt="" style={{ width: "180px", height: "180px", objectFit: "contain", opacity: 0.07 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-around", alignItems: "center" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: "140%", textAlign: "center", fontSize: "48px", fontWeight: 900, color: "rgba(15,23,42,0.045)", transform: "rotate(-30deg)", letterSpacing: "0.15em", userSelect: "none", whiteSpace: "nowrap" }}>
                {biz.toUpperCase()} · CONFIDENTIAL
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">

          {/* Screen header */}
          <div className="no-print flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {wm ? (
                <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <img src={wm} alt={biz} className="w-full h-full object-contain p-1" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-extrabold text-lg shrink-0">
                  {biz.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold text-slate-800">{biz}</h1>
                {desc && <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{desc}</p>}
                <p className="text-xs text-slate-400 font-medium mt-0.5">Customer Account Statement</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>

          {/* Print-only header */}
          <div className="print-show" style={{ borderBottom: "2.5px solid #0f172a", paddingBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {wm ? (
                  <div style={{ width: "52px", height: "52px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img src={wm} alt={biz} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
                  </div>
                ) : (
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "20px" }}>
                    {biz.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>{biz}</div>
                  {desc && <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px", maxWidth: "280px" }}>{desc}</div>}
                  <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px" }}>Account Statement</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", letterSpacing: "0.06em" }}>STATEMENT</div>
                <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>Generated: {generatedOn}</div>
                <div style={{ fontSize: "9px", color: "#64748b" }}>Valid until: {expiresOn}</div>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-extrabold text-lg">{c.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Customer</p>
                  <p className="font-bold text-slate-800 text-lg leading-tight">{c.name}</p>
                </div>
                {c.phone && <div><p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Phone</p><p className="text-slate-700 font-medium">{c.phone}</p></div>}
                {c.email && <div><p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Email</p><p className="text-slate-700 font-medium">{c.email}</p></div>}
                {c.address && <div><p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Address</p><p className="text-slate-700 font-medium">{c.address}</p></div>}
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Opening Balance", value: fmt(c.opening_balance ?? 0, cur), color: "text-slate-800",   bg: "bg-slate-50 border-slate-200" },
              { label: "Total Credit",    value: fmt(totalCredit, cur),            color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Total Debit",     value: fmt(totalDebit, cur),             color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
              { label: "Net Balance",     value: fmt(netBalance, cur),             color: balPositive ? "text-emerald-700" : "text-rose-700", bg: balPositive ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200" },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border p-4 ${item.bg}`}>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">{item.label}</p>
                <p className={`text-base font-extrabold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Transaction table */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Transaction History</h2>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">{tx.length} entries</span>
            </div>
            {tx.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No transactions recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-left font-semibold no-print">Mode</th>
                      <th className="px-4 py-3 text-right font-semibold text-emerald-700">Credit</th>
                      <th className="px-4 py-3 text-right font-semibold text-rose-700">Debit</th>
                      <th className="px-4 py-3 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let running = c.opening_balance ?? 0;
                      return tx.map((t, i) => {
                        if (t.type === "credit") running += t.amount;
                        else running -= t.amount;
                        const bal = running;
                        return (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">{fmtDate(t.date)}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{t.description ?? <span className="text-slate-300 italic">—</span>}</td>
                            <td className="px-4 py-3 no-print">
                              {t.payment_mode ? <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold capitalize">{t.payment_mode}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">{t.type === "credit" ? fmt(t.amount, cur) : ""}</td>
                            <td className="px-4 py-3 text-right font-semibold text-rose-600">{t.type === "debit" ? fmt(t.amount, cur) : ""}</td>
                            <td className={`px-4 py-3 text-right font-bold ${bal >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(bal, cur)}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-50">
                      <td colSpan={3} className="px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wide">Totals</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(totalCredit, cur)}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700">{fmt(totalDebit, cur)}</td>
                      <td className="px-4 py-3 text-right"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Closing Balance block */}
          <div className={`rounded-2xl border-2 p-5 flex items-center justify-between ${balPositive ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Closing Balance</p>
              <p className="text-xs text-slate-400">As of {generatedOn} · {tx.length} transactions</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black tracking-tight ${balPositive ? "text-emerald-700" : "text-rose-700"}`}>
                {fmt(netBalance, cur)}
              </p>
              <p className={`text-xs font-bold mt-0.5 ${balPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {balPositive ? "Amount receivable" : "Amount payable"}
              </p>
            </div>
          </div>

          {/* Screen footer */}
          <div className="no-print text-center space-y-1 pb-6">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
              <ShieldCheck size={12} />
              <span>Verified by <strong className="text-slate-600">{biz}</strong> · Read-only · Valid until {expiresOn}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-slate-300 text-xs">
              <Building2 size={11} />
              <span>Powered by LedgerPro</span>
            </div>
          </div>

          {/* Print-only footer */}
          <div className="print-flex" style={{ borderTop: "1px solid #cbd5e1", paddingTop: "10px", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "9px", color: "#94a3b8" }}>
              <strong style={{ color: "#475569" }}>{biz}</strong> · Confidential Account Statement · {generatedOn}
            </div>
            <div style={{ fontSize: "9px", color: "#94a3b8" }}>
              ✓ Verified · Read-only · Valid until {expiresOn} · Powered by LedgerPro
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
