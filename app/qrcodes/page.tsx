"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAllItems } from "@/lib/firestore";
import { Item } from "@/lib/types";
import QRCode from "qrcode";
import Link from "next/link";

export default function QRCodesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/qrcodes");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || role !== "admin") return;

    async function fetchItems() {
      try {
        const all = await getAllItems();
        setItems(all);

        const urls: Record<string, string> = {};
        for (const item of all) {
          const url = `${window.location.origin}/item/${item.id}`;
          urls[item.id] = await QRCode.toDataURL(url, {
            width: 200,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });
        }
        setQrDataUrls(urls);
      } catch (err) {
        console.error("Erro ao buscar itens:", err);
      } finally {
        setLoadingItems(false);
      }
    }

    fetchItems();
  }, [user, role]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsToPrint =
      selected.size > 0
        ? items.filter((i) => selected.has(i.id))
        : items;

    const cards = itemsToPrint
      .map(
        (item) => `
        <div class="card">
          <img src="${qrDataUrls[item.id] || ""}" alt="QR Code" />
          <p class="name">${item.nome}</p>
          <p class="category">${item.categoria}</p>
          <p class="url">${baseUrl}/item/${item.id}</p>
        </div>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - Acervo</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; padding: 20px; }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .card {
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            break-inside: avoid;
          }
          .card img {
            width: 150px;
            height: 150px;
            margin: 0 auto 8px;
            display: block;
          }
          .card .name {
            font-size: 14px;
            font-weight: 600;
            color: #18181b;
          }
          .card .category {
            font-size: 11px;
            color: #71717a;
            text-transform: capitalize;
            margin-top: 2px;
          }
          .card .url {
            font-size: 9px;
            color: #a1a1aa;
            margin-top: 4px;
            word-break: break-all;
          }
          @media print {
            body { padding: 0; }
            .grid { gap: 12px; }
            .card { border: 1px solid #d4d4d8; }
          }
        </style>
      </head>
      <body>
        <div class="grid">${cards}</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (!user) return null;

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
            Apenas administradores podem acessar esta pagina.
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
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
            <h1 className="text-lg font-bold text-zinc-900">QR Codes</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              {selected.size === items.length ? "Desmarcar" : "Selecionar"} todos
            </button>
            <button
              onClick={handlePrint}
              disabled={loadingItems || items.length === 0}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              Imprimir{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {loadingItems ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
              <p className="text-sm text-zinc-500">Gerando QR codes...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm text-zinc-500">Nenhum item cadastrado.</p>
            <Link
              href="/novo-item"
              className="mt-3 inline-block text-sm font-medium text-violet-600"
            >
              Criar primeiro item
            </Link>
          </div>
        ) : (
          <div
            ref={printRef}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
          >
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${
                  selected.has(item.id)
                    ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                {qrDataUrls[item.id] ? (
                  <img
                    src={qrDataUrls[item.id]}
                    alt={`QR Code - ${item.nome}`}
                    className="mx-auto h-32 w-32 sm:h-36 sm:w-36"
                  />
                ) : (
                  <div className="mx-auto flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                  </div>
                )}
                <p className="mt-2 text-sm font-semibold text-zinc-900 truncate">
                  {item.nome}
                </p>
                <p className="text-xs capitalize text-zinc-500">
                  {item.categoria}
                </p>
                {selected.has(item.id) && (
                  <div className="mt-2 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-violet-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
