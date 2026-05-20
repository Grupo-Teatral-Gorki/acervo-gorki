"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { secondaryAuth } from "@/lib/firebase";
import {
  getAllUsers,
  setUserRole,
  createUserProfile,
} from "@/lib/firestore";
import { UserProfile, UserRole } from "@/lib/types";
import Link from "next/link";

export default function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/admin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || role !== "admin") return;

    async function fetchUsers() {
      try {
        const all = await getAllUsers();
        setUsers(all);
      } catch (err) {
        console.error("Erro ao buscar usuarios:", err);
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [user, role]);

  async function handleToggleRole(targetUser: UserProfile) {
    const newRole: UserRole = targetUser.role === "admin" ? "user" : "admin";
    setTogglingId(targetUser.id);

    try {
      await setUserRole(targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Erro ao alterar role:", err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreating(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        newEmail,
        newPassword
      );

      await createUserProfile(
        cred.user.uid,
        newEmail,
        newName || newEmail,
        newRole
      );

      await signOut(secondaryAuth);

      const newUserProfile: UserProfile = {
        id: cred.user.uid,
        email: newEmail,
        displayName: newName || newEmail,
        role: newRole,
        createdAt: null as unknown as UserProfile["createdAt"],
      };
      setUsers((prev) => [...prev, newUserProfile]);

      setCreateSuccess(`Usuario "${newName || newEmail}" criado com sucesso!`);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("user");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === "auth/email-already-in-use") {
        setCreateError("Este email ja esta em uso.");
      } else if (firebaseError.code === "auth/weak-password") {
        setCreateError("A senha deve ter pelo menos 6 caracteres.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setCreateError("Email invalido.");
      } else {
        setCreateError("Erro ao criar usuario. Tente novamente.");
      }
    } finally {
      setCreating(false);
    }
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
          <h1 className="text-lg font-bold text-zinc-900">Gerenciar Usuarios</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-8">
        {/* Criar novo usuario */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Criar novo usuario
          </h2>

          <form
            onSubmit={handleCreateUser}
            className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4"
          >
            {createError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {createSuccess}
              </div>
            )}

            <div>
              <label htmlFor="newName" className="block text-sm font-medium text-zinc-700">
                Nome
              </label>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="Nome do usuario"
              />
            </div>

            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="newEmail"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-700">
                Senha
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="Minimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="newRole" className="block text-sm font-medium text-zinc-700">
                Permissao
              </label>
              <select
                id="newRole"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Criar Usuario"
              )}
            </button>
          </form>
        </section>

        {/* Lista de usuarios */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Usuarios ({users.length})
          </h2>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-violet-200 border-t-violet-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <p className="text-sm text-zinc-500">Nenhum usuario encontrado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {u.displayName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === "admin"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {u.role === "admin" ? "Admin" : "Usuario"}
                    </span>
                    {u.id !== user!.uid && (
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={togglingId === u.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          u.role === "admin"
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {togglingId === u.id
                          ? "..."
                          : u.role === "admin"
                          ? "Revogar"
                          : "Promover"}
                      </button>
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
