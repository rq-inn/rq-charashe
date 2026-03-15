import { auth, db } from "./firebase_init.js";
import { loadCsv } from "./core/csv_loader.js";
import { createI18n } from "./core/i18n.js";
import { createStateStore } from "./core/state_store.js";
import { startAnonymousAuth } from "./logic/auth_logic.js";
import {
  saveSharedText as saveSharedTextRepo,
  subscribeConnectionStatus,
  subscribeSharedText as subscribeSharedTextRepo
} from "./logic/firebase_text_repo.js";
import * as roomLogic from "./logic/room_logic.js";
import { createSharedTextLogic } from "./logic/shared_text_logic.js";
import { createAppUi } from "./ui/app_ui.js";

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("./service-worker.js");
  }
}

async function bootstrap() {
  const [languageRows, messageRows] = await Promise.all([
    loadCsv("./csv/language.csv"),
    loadCsv("./csv/message.csv")
  ]);

  const i18n = createI18n(languageRows, messageRows);
  const store = createStateStore({
    language: i18n.getStoredLanguage(),
    uid: "",
    authStatus: "idle",
    roomId: roomLogic.getInitialRoomId(),
    sharedText: "",
    connectionStatus: "idle",
    saveStatus: "saved",
    isOnline: false,
    remoteUpdatedAt: null,
    remoteUpdatedBy: "",
    errorMessage: ""
  });

  const textarea = document.querySelector("#sharedTextarea");
  const sharedTextLogic = createSharedTextLogic({
    textarea,
    getRoomId: () => store.getState().roomId,
    getUid: () => store.getState().uid,
    subscribeSharedText: (roomId, onData) =>
      subscribeSharedTextRepo(db, roomId, (remoteData) => {
        store.setState({
          sharedText: String(remoteData?.value ?? ""),
          remoteUpdatedAt: Number(remoteData?.updatedAt ?? 0) || 0,
          remoteUpdatedBy: String(remoteData?.updatedBy ?? "")
        });
        onData(remoteData);
      }),
    saveSharedText: async (roomId, payload) => {
      store.setState({ saveStatus: "saving", errorMessage: "" });
      await saveSharedTextRepo(db, roomId, payload);
      store.setState({ saveStatus: "saved", errorMessage: "" });
    }
  });
  const ui = createAppUi({ store, i18n, sharedTextLogic, roomLogic });
  ui.mount();

  subscribeConnectionStatus(db, (isOnline) => {
    store.setState({
      isOnline,
      connectionStatus: store.getState().roomId && isOnline ? "connected" : store.getState().roomId ? "connecting" : "idle"
    });
  });

  await registerServiceWorker();
  await startAnonymousAuth(auth, store);

  if (store.getState().roomId) {
    store.setState({ connectionStatus: "connecting" });
    sharedTextLogic.reconnect();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  window.alert(error.message);
});
