import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, increment, setDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const incrementVisitCount = async () => {
  const statsRef = doc(db, 'stats', 'global');
  try {
    const statsDoc = await getDoc(statsRef);
    if (!statsDoc.exists()) {
      await setDoc(statsRef, { visitCount: 1 });
    } else {
      await updateDoc(statsRef, {
        visitCount: increment(1)
      });
    }
  } catch (error) {
    console.error('Error incrementing visit count:', error);
  }
};

export const subscribeToVisitCount = (callback) => {
  const statsRef = doc(db, 'stats', 'global');
  return onSnapshot(statsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().visitCount);
    } else {
      callback(0);
    }
  }, (error) => {
    console.error('Error listening to visit count:', error);
  });
};
