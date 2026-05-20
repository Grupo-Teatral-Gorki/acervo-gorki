"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { getItem, retirarItem, devolverItem } from "@/lib/firestore";
import { Item } from "@/lib/types";
import Link from "next/link";

type ActionState = "idle" | "loading" | "success" | "error";

export default function ItemPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/item/${itemId}`)}`);
    }
  }, [user, authLoading, router, itemId]);

  useEffect(() => {
    if (!itemId) return;

    async function fetchItem() {
      try {
        const data = await getItem(itemId);
        if (!data) {
          setNotFound(true);
        } else {
          setItem(data);
        }
      } catch (err) {
        console.error("Erro ao buscar item:", err);
        setNotFound(true);
      } finally {
        setLoadingItem(false);
      }
    }

    fetchItem();
  }, [itemId]);

  async function handleRetirada() {
    if (!user || !item || !motivo.trim()) return;

    setActionState("loading");
    try {
      await retirarItem(
        item.id,
        item.nome,
        user.uid,
        user.displayName || user.email || "Usuario",
        motivo.trim()
      );
      setActionState("success");
      setActionMessage("Item retirado com sucesso!");
      setItem({
        ...item,
        status: "retirado",
        currentBorrowerId: user.uid,
        currentBorrowerName: user.displayName || user.email || "Usuario",
        currentMotivo: motivo.trim(),
      });
    } catch (err) {
      console.error("Erro na retirada:", err);
      setActionState("error");
      setActionMessage("Erro ao retirar item. Tente novamente.");
    }
  }

  async function handleDevolucao() {
    if (!user || !item) return;

    setActionState("loading");
    try {
      await devolverItem(
        item.id,
        item.nome,
        user.uid,
        user.displayName || user.email || "Usuario"
      );
      setActionState("success");
      setActionMessage("Item devolvido com sucesso!");
      setItem({
        ...item,
        status: "disponivel",
        currentBorrowerId: null,
        currentBorrowerName: null,
        currentMotivo: null,
      });
    } catch (err) {
      console.error("Erro na devolucao:", err);
      setActionState("error");
      setActionMessage("Erro ao devolver item. Tente novamente.");
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (loadingItem) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <p className="text-sm text-zinc-500">Buscando item...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Item nao encontrado
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Este QR Code pode estar desatualizado.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
          >
            Voltar ao inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const isComigo = item.status === "retirado" && item.currentBorrowerId === user!.uid;
  const isComOutro = item.status === "retirado" && item.currentBorrowerId !== user!.uid;
  const isDisponivel = item.status === "disponivel";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Detalhes do Item</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{item.nome}</h2>
              <p className="mt-0.5 text-sm capitalize text-zinc-500">
                {item.categoria}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isDisponivel
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isDisponivel ? "Disponivel" : "Retirado"}
            </span>
          </div>

          {actionState === "success" && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionMessage}
            </div>
          )}

          {actionState === "error" && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionMessage}
            </div>
          )}

          {isDisponivel && actionState !== "success" && (
            <div className="space-y-4 border-t border-zinc-100 pt-4">
              <p className="text-sm text-zinc-600">
                Este item esta disponivel para retirada.
              </p>
              <div>
                <label
                  htmlFor="motivo"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Motivo da Retirada
                </label>
                <textarea
                  id="motivo"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Ensaio da peca X, Apresentacao no teatro Y..."
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                />
              </div>
              <button
                onClick={handleRetirada}
                disabled={actionState === "loading" || !motivo.trim()}
                className="flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionState === "loading" ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Confirmar Retirada"
                )}
              </button>
            </div>
          )}

          {isComigo && actionState !== "success" && (
            <div className="space-y-4 border-t border-zinc-100 pt-4">
              <div className="rounded-lg bg-violet-50 px-4 py-3">
                <p className="text-sm font-medium text-violet-800">
                  Este item esta com voce
                </p>
                {item.currentMotivo && (
                  <p className="mt-1 text-xs text-violet-600">
                    Motivo: {item.currentMotivo}
                  </p>
                )}
              </div>
              <button
                onClick={handleDevolucao}
                disabled={actionState === "loading"}
                className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionState === "loading" ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Confirmar Devolucao"
                )}
              </button>
            </div>
          )}

          {isComOutro && (
            <div className="space-y-3 border-t border-zinc-100 pt-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Item indisponivel
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      Este item esta com{" "}
                      <span className="font-medium">
                        {item.currentBorrowerName}
                      </span>
                    </p>
                    {item.currentMotivo && (
                      <p className="mt-1 text-xs text-amber-600">
                        Motivo: {item.currentMotivo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
