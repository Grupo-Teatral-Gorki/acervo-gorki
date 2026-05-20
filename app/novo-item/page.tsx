"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createItem } from "@/lib/firestore";
import { ItemCategoria } from "@/lib/types";
import Link from "next/link";

const categorias: { value: ItemCategoria; label: string }[] = [
  { value: "figurino", label: "Figurino" },
  { value: "adereço", label: "Adereço" },
  { value: "cenário", label: "Cenário" },
  { value: "iluminação", label: "Iluminação" },
  { value: "som", label: "Som" },
  { value: "maquiagem", label: "Maquiagem" },
  { value: "outro", label: "Outro" },
];

export default function NovoItemPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<ItemCategoria>("figurino");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login?redirect=/novo-item");
    return null;
  }

  if (role !== "admin") {
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">Acesso negado</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Apenas administradores podem criar itens.
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;

    setError("");
    setLoading(true);

    try {
      const id = await createItem({ nome: nome.trim(), categoria });
      setCreatedId(id);
      setNome("");
      setCategoria("figurino");
    } catch (err) {
      console.error("Erro ao criar item:", err);
      setError("Erro ao criar item. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-lg font-bold text-zinc-900">Novo Item</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {createdId && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">
              Item criado com sucesso!
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href={`/item/${createdId}`}
                className="text-sm font-medium text-emerald-700 underline underline-offset-2"
              >
                Ver item
              </Link>
              <span className="text-emerald-300">|</span>
              <button
                onClick={() => setCreatedId(null)}
                className="text-sm font-medium text-emerald-700 underline underline-offset-2"
              >
                Criar outro
              </button>
            </div>
            <p className="mt-2 text-xs text-emerald-600 break-all">
              URL do QR Code: {typeof window !== "undefined" ? window.location.origin : ""}/item/{createdId}
            </p>
          </div>
        )}

        {!createdId && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-zinc-700"
              >
                Nome do Item
              </label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="Ex: Vestido vermelho, Espada de madeira..."
              />
            </div>

            <div>
              <label
                htmlFor="categoria"
                className="block text-sm font-medium text-zinc-700"
              >
                Categoria
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ItemCategoria)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white"
              >
                {categorias.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !nome.trim()}
              className="flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Criar Item"
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
