import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, increment, setDoc, onSnapshot, collection, query, orderBy, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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

// Session Management
export const updateSession = async (sessionId) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  try {
    await setDoc(sessionRef, {
      lastActive: serverTimestamp(),
      userAgent: navigator.userAgent,
      isOnline: true
    }, { merge: true });
  } catch (error) {
    console.error('Error updating session:', error);
  }
};

export const subscribeToSessions = (callback) => {
  const q = query(collection(db, 'sessions'), orderBy('lastActive', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(sessions);
  });
};

// Ban Management
export const checkBanStatus = async (sessionId) => {
  const banRef = doc(db, 'bans', sessionId);
  const banDoc = await getDoc(banRef);
  return banDoc.exists();
};

export const banUser = async (sessionId) => {
  const banRef = doc(db, 'bans', sessionId);
  await setDoc(banRef, {
    bannedAt: serverTimestamp(),
  });
};

export const unbanUser = async (sessionId) => {
  const banRef = doc(db, 'bans', sessionId);
  await deleteDoc(banRef);
};

export const subscribeToBans = (callback) => {
  const q = collection(db, 'bans');
  return onSnapshot(q, (snapshot) => {
    const bans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(bans);
  });
};
