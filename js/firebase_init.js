import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBNlEwSF0_uANKEM4MY4gdyFVeTyNeRU4A",
  authDomain: "rq-character-share.firebaseapp.com",
  projectId: "rq-character-share",
  storageBucket: "rq-character-share.firebasestorage.app",
  messagingSenderId: "819332277760",
  appId: "1:819332277760:web:37e7052d544867266e1ae5"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

signInAnonymously(auth)
  .then(() => {
    console.log("匿名ログイン成功");
  })
  .catch((error) => {
    console.error(error);
  });
