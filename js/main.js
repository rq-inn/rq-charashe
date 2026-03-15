import { auth, db } from "./firebase_init.js";
import { loadCsv } from "./core/csv_loader.js";
import { createI18n } from "./core/i18n.js";
import { createStateStore } from "./core/state_store.js";
import { startAnonymousAuth } from "./logic/auth_logic.js";
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

  const sharedTextLogic = createSharedTextLogic({ database: db, store });
  const ui = createAppUi({ store, i18n, sharedTextLogic, roomLogic });
  ui.mount();

  await registerServiceWorker();
  await startAnonymousAuth(auth, store);

  if (store.getState().roomId) {
    sharedTextLogic.joinRoom(store.getState().roomId);
  }
}

bootstrap().catch((error) => {
  console.error(error);
  window.alert(error.message);
});
