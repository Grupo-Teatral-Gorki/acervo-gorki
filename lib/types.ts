import { Timestamp } from "firebase/firestore";

export type ItemStatus = "disponivel" | "retirado";

export type ItemCategoria =
  | "figurino"
  | "adereço"
  | "cenário"
  | "iluminação"
  | "som"
  | "maquiagem"
  | "outro";

export interface Item {
  id: string;
  nome: string;
  categoria: ItemCategoria;
  status: ItemStatus;
  qrcodeUrl: string;
  currentBorrowerId: string | null;
  currentBorrowerName: string | null;
  currentMotivo: string | null;
  updatedAt: Timestamp;
}

export type UserRole = "admin" | "user";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}

export type HistoryAction = "retirada" | "devolucao";

export interface HistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  userId: string;
  userName: string;
  action: HistoryAction;
  motivo: string | null;
  timestamp: Timestamp;
}
