import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const partidosRef = collection(db, 'partidos');

// Escuchar partidos en tiempo real
export function escucharPartidos(callback) {
  return onSnapshot(partidosRef, (snapshot) => {
    const partidos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(partidos);
  });
}

// Actualizar marcador
export async function actualizarMarcador(id, golesLocal, golesVisitante) {
  const partidoDoc = doc(db, 'partidos', id);
  await updateDoc(partidoDoc, {
    golesLocal,
    golesVisitante
  });
}
