import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const auth = getAuth();

export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const uid = userCredential.user.uid;

  const userDoc = await getDoc(doc(db, 'usuarios', uid));
  const rol = userDoc.exists() ? userDoc.data().rol : 'publico';

  return { uid, rol };
}
