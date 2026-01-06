import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const partidosRef = collection(db, 'partidos');

export async function crearPartido(partido) {
  await addDoc(partidosRef, {
    local: partido.local,
    visitante: partido.visitante,
    golesLocal: 0,
    golesVisitante: 0,
    grupo: partido.grupo,
    estado: 'En juego'
  });
}
