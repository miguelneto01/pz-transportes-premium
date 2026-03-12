import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAE_uLbq_NrtqTL7yr55xdKVnz6d6nd_Ic",
  authDomain: "pztransp.firebaseapp.com",
  projectId: "pztransp",
  storageBucket: "pztransp.firebasestorage.app",
  messagingSenderId: "950404250616",
  appId: "1:950404250616:web:c947d4366867c6ff57b40d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Generic helpers
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  let q;
  if (collectionName === 'motoristas' || collectionName === 'veiculos') {
    q = query(collection(db, collectionName));
  } else {
    // Otimização: Limitar a 150 registros recentes para poupar leituras no feed ao vivo
    q = query(collection(db, collectionName), orderBy("data", "desc"), limit(150));
  }
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

export const subscribeToVeiculos = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "veiculos"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// Otimização: Buscar dados de relatórios sob demanda para poupar leituras
export const fetchReportData = async (collectionName: string, startDate: string, endDate: string) => {
  const q = query(
    collection(db, collectionName),
    where("data", ">=", startDate),
    where("data", "<=", endDate)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Ordenar localmente para evitar necessidade de índices compostos no Firestore
  return data.sort((a: any, b: any) => b.data.localeCompare(a.data));
};
