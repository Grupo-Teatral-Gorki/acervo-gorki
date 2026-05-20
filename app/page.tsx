"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getItemsComUsuario, getHistoricoUsuario } from "@/lib/firestore";
import { Item, HistoryEntry } from "@/lib/types";
import Link from "next/link";

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [meusItens, setMeusItens] = useState<Item[]>([]);
  const [historico, setHistorico] = useState<HistoryEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const [itens, hist] = await Promise.all([
          getItemsComUsuario(user!.uid),
          getHistoricoUsuario(user!.uid),
        ]);
        setMeusItens(itens);
        setHistorico(hist);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-zinc-900">Acervo</h1>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <Link
                  href="/novo-item"
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                >
                  + Novo
                </Link>
                <Link
                  href="/qrcodes"
                  className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50"
                >
                  QR Codes
                </Link>
                <Link
                  href="/admin"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
                >
                  Admin
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Itens comigo ({meusItens.length})
          </h2>

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-violet-200 border-t-violet-600" />
            </div>
          ) : meusItens.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <p className="text-sm text-zinc-500">
                Nenhum item retirado no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {meusItens.map((item) => (
                <Link
                  key={item.id}
                  href={`/item/${item.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {item.nome}
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">
                      {item.categoria}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Comigo
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Meu Historico
          </h2>

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-violet-200 border-t-violet-600" />
            </div>
          ) : historico.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <p className="text-sm text-zinc-500">
                Nenhuma acao registrada ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      entry.action === "retirada"
                        ? "bg-violet-100 text-violet-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {entry.action === "retirada" ? (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {entry.itemName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.action === "retirada"
                        ? "Retirada"
                        : "Devolucao"}{" "}
                      &middot;{" "}
                      {entry.timestamp?.toDate().toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {entry.motivo && (
                      <p className="mt-0.5 text-xs text-zinc-400 truncate">
                        {entry.motivo}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
