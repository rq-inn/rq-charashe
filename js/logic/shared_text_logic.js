import { saveSharedText, subscribeSharedText } from "./firebase_text_repo.js";

export function createSharedTextLogic({ database, store }) {
  let unsubscribeRoom = null;
  let saveTimer = null;
  let isApplyingRemote = false;

  function clearPendingTimer() {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = null;
    }
  }

  async function persistText(value) {
    const { roomId, uid } = store.getState();
    if (!roomId || !uid) {
      return;
    }

    store.setState({ saveStatus: "saving", errorMessage: "" });
    await saveSharedText(database, roomId, {
      value,
      updatedAt: Date.now(),
      updatedBy: uid
    });
    store.setState({ saveStatus: "saved", errorMessage: "" });
  }

  function joinRoom(roomId) {
    if (unsubscribeRoom) {
      unsubscribeRoom();
      unsubscribeRoom = null;
    }
    clearPendingTimer();

    store.setState({
      roomId,
      connectionStatus: "connecting",
      saveStatus: "saved",
      errorMessage: ""
    });

    unsubscribeRoom = subscribeSharedText(
      database,
      roomId,
      (data) => {
        const nextValue = data?.value ?? "";
        isApplyingRemote = true;
        store.setState({
          sharedText: nextValue,
          remoteUpdatedAt: data?.updatedAt ?? null,
          remoteUpdatedBy: data?.updatedBy ?? ""
        });
        isApplyingRemote = false;
      },
      (isOnline) => {
        store.setState({
          isOnline,
          connectionStatus: isOnline ? "connected" : "idle"
        });
      }
    );
  }

  function scheduleSave(value, delayMs = 400) {
    store.setState({ sharedText: value });
    if (isApplyingRemote) {
      return;
    }

    clearPendingTimer();
    saveTimer = window.setTimeout(() => {
      persistText(value).catch((error) => {
        console.error(error);
        store.setState({ errorMessage: error.message, saveStatus: "idle" });
      });
    }, delayMs);
  }

  function clearText() {
    scheduleSave("");
  }

  function dispose() {
    clearPendingTimer();
    if (unsubscribeRoom) {
      unsubscribeRoom();
    }
  }

  return {
    joinRoom,
    scheduleSave,
    clearText,
    dispose
  };
}
