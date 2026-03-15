function formatDateTime(timestamp, languageNumber) {
  if (!timestamp) {
    return "-";
  }

  const locales = {
    "1": "ja-JP",
    "2": "en-US",
    "3": "zh-TW"
  };

  return new Intl.DateTimeFormat(locales[languageNumber] ?? "ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date(timestamp));
}

export function createAppUi({ store, i18n, sharedTextLogic, roomLogic }) {
  const elements = {
    appTitle: document.querySelector("#appTitle"),
    languageLabel: document.querySelector("#languageLabel"),
    languageSelect: document.querySelector("#languageSelect"),
    roomLabel: document.querySelector("#roomLabel"),
    roomInput: document.querySelector("#roomInput"),
    joinButton: document.querySelector("#joinButton"),
    connectionStatusLabel: document.querySelector("#connectionStatusLabel"),
    connectionStatus: document.querySelector("#connectionStatus"),
    saveStatusLabel: document.querySelector("#saveStatusLabel"),
    saveStatus: document.querySelector("#saveStatus"),
    errorMessage: document.querySelector("#errorMessage"),
    textarea: document.querySelector("#sharedTextarea"),
    updatedByLabel: document.querySelector("#updatedByLabel"),
    updatedByValue: document.querySelector("#updatedByValue"),
    updatedAtLabel: document.querySelector("#updatedAtLabel"),
    updatedAtValue: document.querySelector("#updatedAtValue"),
    onlineLabel: document.querySelector("#onlineLabel"),
    onlineValue: document.querySelector("#onlineValue"),
    clearButton: document.querySelector("#clearButton")
  };

  function populateLanguageSelect() {
    elements.languageSelect.innerHTML = "";
    i18n.languages.forEach((language) => {
      const option = document.createElement("option");
      option.value = language.number;
      option.textContent = language.label;
      elements.languageSelect.append(option);
    });
  }

  function render(state) {
    const translate = (key) => i18n.t(key, state.language);
    elements.appTitle.textContent = translate("app_title");
    elements.languageLabel.textContent = translate("label_language");
    elements.roomLabel.textContent = translate("label_room");
    elements.joinButton.textContent = translate("btn_join");
    elements.connectionStatusLabel.textContent = translate("label_connection_status");
    elements.saveStatusLabel.textContent = translate("label_save_status");
    elements.updatedByLabel.textContent = translate("label_updated_by");
    elements.updatedAtLabel.textContent = translate("label_updated_at");
    elements.onlineLabel.textContent = translate("label_online_status");
    elements.clearButton.textContent = translate("btn_clear");
    elements.textarea.placeholder = translate("msg_placeholder");
    elements.languageSelect.value = state.language;
    elements.roomInput.value = document.activeElement === elements.roomInput ? elements.roomInput.value : state.roomId;
    elements.connectionStatus.textContent = translate(
      state.connectionStatus === "connected" ? "msg_connected" :
      state.connectionStatus === "connecting" ? "msg_connecting" :
      "msg_idle"
    );
    elements.saveStatus.textContent = translate(
      state.saveStatus === "saving" ? "msg_saving" : "msg_saved"
    );
    elements.textarea.disabled = !state.roomId;
    if (document.activeElement !== elements.textarea && elements.textarea.value !== state.sharedText) {
      elements.textarea.value = state.sharedText;
    }
    elements.updatedByValue.textContent = state.remoteUpdatedBy || translate("msg_unknown_user");
    elements.updatedAtValue.textContent = formatDateTime(state.remoteUpdatedAt, state.language);
    elements.onlineValue.textContent = translate(state.isOnline ? "msg_online" : "msg_offline");
    elements.errorMessage.hidden = !state.errorMessage;
    elements.errorMessage.textContent = state.errorMessage;
    document.title = `${translate("app_title")} | RQ Adventurers' Inn`;
  }

  populateLanguageSelect();

  elements.languageSelect.addEventListener("change", (event) => {
    const language = event.target.value;
    i18n.saveLanguage(language);
    store.setState({ language });
  });

  elements.joinButton.addEventListener("click", () => {
    const roomId = roomLogic.normalizeRoomId(elements.roomInput.value);
    if (!roomLogic.validateRoomId(roomId)) {
      store.setState({ errorMessage: i18n.t("msg_invalid_room", store.getState().language) });
      return;
    }
    store.setState({
      roomId,
      connectionStatus: "connecting",
      saveStatus: "saved",
      errorMessage: ""
    });
    roomLogic.updateRoomQuery(roomId);
    sharedTextLogic.reconnect();
  });

  elements.clearButton.addEventListener("click", () => {
    elements.textarea.value = "";
    elements.textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });

  return {
    mount() {
      return store.subscribe(render);
    }
  };
}
