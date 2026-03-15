export function createSharedTextLogic({
  textarea,
  getRoomId,
  getUid,
  subscribeSharedText,
  saveSharedText
}) {
  if (!textarea) {
    throw new Error("shared_text_logic: textarea is required");
  }

  let isApplyingRemote = false;
  let debounceTimer = null;
  let unsubscribe = null;
  let lastRemoteValue = "";

  function normalizeRoomId(rawRoomId) {
    if (typeof rawRoomId !== "string") return "";
    return rawRoomId.trim();
  }

  function normalizeText(rawText) {
    return String(rawText ?? "");
  }

  function buildPayload(text) {
    return {
      value: normalizeText(text),
      updatedAt: Date.now(),
      updatedBy: String(getUid?.() ?? "")
    };
  }

  async function flushSave(text) {
    const roomId = normalizeRoomId(getRoomId?.());

    if (!roomId) {
      console.warn("[shared_text_logic] save skipped: invalid roomId", getRoomId?.());
      return;
    }

    const payload = buildPayload(text);

    console.log("[shared_text_logic] saving", {
      roomId,
      valueType: typeof payload.value,
      updatedByType: typeof payload.updatedBy
    });

    await saveSharedText(roomId, payload);
  }

  function scheduleSave() {
    if (isApplyingRemote) return;

    const text = normalizeText(textarea.value);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      flushSave(text).catch((error) => {
        console.error("[shared_text_logic] save failed", error);
      });
    }, 400);
  }

  function applyRemoteValue(remoteData) {
    const remoteValue = normalizeText(remoteData?.value);

    if (textarea.value === remoteValue && lastRemoteValue === remoteValue) {
      return;
    }

    isApplyingRemote = true;
    textarea.value = remoteValue;
    lastRemoteValue = remoteValue;
    isApplyingRemote = false;
  }

  function bindInput() {
    textarea.addEventListener("input", scheduleSave);
  }

  function unbindInput() {
    textarea.removeEventListener("input", scheduleSave);
  }

  function startSubscription() {
    const roomId = normalizeRoomId(getRoomId?.());

    if (!roomId) {
      console.warn("[shared_text_logic] subscribe skipped: invalid roomId", getRoomId?.());
      return;
    }

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    console.log("[shared_text_logic] subscribe", { roomId });

    unsubscribe = subscribeSharedText(roomId, (remoteData) => {
      try {
        applyRemoteValue(remoteData);
      } catch (error) {
        console.error("[shared_text_logic] applyRemoteValue failed", error);
      }
    });
  }

  function stopSubscription() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  function reconnect() {
    stopSubscription();
    startSubscription();
  }

  function destroy() {
    stopSubscription();
    unbindInput();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  bindInput();

  return {
    reconnect,
    destroy
  };
}
