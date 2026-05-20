import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Item, HistoryEntry, ItemCategoria, UserProfile, UserRole } from "./types";

export async function getItem(id: string): Promise<Item | null> {
  const docRef = doc(db, "items", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as Item;
}

export async function retirarItem(
  itemId: string,
  itemName: string,
  userId: string,
  userName: string,
  motivo: string
): Promise<void> {
  const itemRef = doc(db, "items", itemId);

  await updateDoc(itemRef, {
    status: "retirado",
    currentBorrowerId: userId,
    currentBorrowerName: userName,
    currentMotivo: motivo,
    updatedAt: Timestamp.now(),
  });

  await addDoc(collection(db, "history"), {
    itemId,
    itemName,
    userId,
    userName,
    action: "retirada",
    motivo,
    timestamp: Timestamp.now(),
  });
}

export async function devolverItem(
  itemId: string,
  itemName: string,
  userId: string,
  userName: string
): Promise<void> {
  const itemRef = doc(db, "items", itemId);

  await updateDoc(itemRef, {
    status: "disponivel",
    currentBorrowerId: null,
    currentBorrowerName: null,
    currentMotivo: null,
    updatedAt: Timestamp.now(),
  });

  await addDoc(collection(db, "history"), {
    itemId,
    itemName,
    userId,
    userName,
    action: "devolucao",
    motivo: null,
    timestamp: Timestamp.now(),
  });
}

export async function createItem(data: {
  nome: string;
  categoria: ItemCategoria;
}): Promise<string> {
  const docRef = doc(collection(db, "items"));
  await setDoc(docRef, {
    nome: data.nome,
    categoria: data.categoria,
    status: "disponivel",
    qrcodeUrl: "",
    currentBorrowerId: null,
    currentBorrowerName: null,
    currentMotivo: null,
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getAllItems(): Promise<Item[]> {
  const snapshot = await getDocs(collection(db, "items"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);
}

export async function getItemsComUsuario(userId: string): Promise<Item[]> {
  const q = query(
    collection(db, "items"),
    where("currentBorrowerId", "==", userId),
    where("status", "==", "retirado")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);
}

export async function getHistoricoUsuario(
  userId: string,
  maxItems = 10
): Promise<HistoryEntry[]> {
  const q = query(
    collection(db, "history"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(maxItems)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HistoryEntry);
}

// ===== USERS =====

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as UserProfile;
}

export async function createUserIfNotExists(
  uid: string,
  email: string,
  displayName: string
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) return existing;

  const profile: Omit<UserProfile, "id"> = {
    email,
    displayName,
    role: "user",
    createdAt: Timestamp.now(),
  };

  await setDoc(doc(db, "users", uid), profile);
  return { id: uid, ...profile };
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile);
}

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    email,
    displayName,
    role,
    createdAt: Timestamp.now(),
  });
}
