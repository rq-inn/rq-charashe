import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

export async function startAnonymousAuth(auth, store) {
  store.setState({ authStatus: "signing-in" });

  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        return;
      }
      store.setState({
        uid: user.uid,
        authStatus: "ready"
      });
      unsubscribe();
      resolve(user);
    }, reject);
  });
}
