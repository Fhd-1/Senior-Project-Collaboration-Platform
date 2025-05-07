import "../services/firebaseConfig"; // ensures Firebase is initialized first
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const auth = getAuth();
const db = getFirestore();

export const signUp = async (email, password, firstName, lastName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    firstName,
    lastName,
  });
};

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, password);

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback) =>
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(getFirestore(), "users", user.uid));
      const userData = snap.exists() ? snap.data() : null;
      callback({ ...user, ...userData });
    } else {
      callback(null);
    }
  });

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const uid = user.uid;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) {
    const [firstName, ...rest] = user.displayName.split(" ");
    const lastName = rest.join(" ");
    await setDoc(doc(db, "users", uid), {
      uid,
      email: user.email,
      firstName,
      lastName,
    });
  }
};
