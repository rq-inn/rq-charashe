import {
  onValue,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

function normalizeRoomId(roomId) {
  return typeof roomId === "string" ? roomId.trim() : "";
}

function buildSharedTextPath(roomId) {
  return `rooms/${roomId}/sharedText`;
}

export function subscribeSharedText(database, roomId, onData) {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) {
    throw new Error("firebase_text_repo: roomId must be a string");
  }

  const targetRef = ref(database, buildSharedTextPath(normalizedRoomId));
  return onValue(targetRef, (snapshot) => {
    onData(snapshot.val() ?? { value: "", updatedAt: 0, updatedBy: "" });
  });
}

export function subscribeConnectionStatus(database, onConnection) {
  const connectedRef = ref(database, "/.info/connected");
  return onValue(connectedRef, (snapshot) => {
    onConnection(Boolean(snapshot.val()));
  });
}

export async function saveSharedText(database, roomId, payload) {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) {
    throw new Error("firebase_text_repo: roomId must be a string");
  }

  const targetRef = ref(database, buildSharedTextPath(normalizedRoomId));
  await set(targetRef, payload);
}
