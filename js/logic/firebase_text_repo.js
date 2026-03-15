import {
  onValue,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

function buildPath(roomId) {
  return `rooms/${roomId}/sharedText`;
}

export function subscribeSharedText(database, roomId, onData, onConnection) {
  const textRef = ref(database, buildPath(roomId));
  const connectedRef = ref(database, "/.info/connected");

  const unsubText = onValue(textRef, (snapshot) => {
    onData(snapshot.val() ?? null);
  });

  const unsubConnected = onValue(connectedRef, (snapshot) => {
    onConnection(Boolean(snapshot.val()));
  });

  return () => {
    unsubText();
    unsubConnected();
  };
}

export async function saveSharedText(database, roomId, payload) {
  const textRef = ref(database, buildPath(roomId));
  await set(textRef, payload);
}
