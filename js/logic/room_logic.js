const ROOM_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

export function getInitialRoomId() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room")?.trim() ?? "";
  return ROOM_PATTERN.test(roomId) ? roomId : "";
}

export function validateRoomId(roomId) {
  return ROOM_PATTERN.test(roomId.trim());
}

export function normalizeRoomId(roomId) {
  return roomId.trim();
}

export function updateRoomQuery(roomId) {
  const url = new URL(window.location.href);
  if (roomId) {
    url.searchParams.set("room", roomId);
  } else {
    url.searchParams.delete("room");
  }
  window.history.replaceState({}, "", url);
}
