const LANGUAGE_STORAGE_KEY = "rq-share-language";

export function createI18n(languageRows, messageRows) {
  const languages = languageRows.map((row) => ({
    number: row.number,
    label: row.language,
    column: `name_L${row.number}`
  }));

  const messages = messageRows.reduce((map, row) => {
    map[row.key] = row;
    return map;
  }, {});

  function getStoredLanguage() {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return languages.find((language) => language.number === stored)?.number ?? languages[0]?.number ?? "1";
  }

  function saveLanguage(languageNumber) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageNumber);
  }

  function t(key, languageNumber) {
    const fallback = messages[key];
    if (!fallback) {
      return key;
    }
    const language = languages.find((item) => item.number === languageNumber) ?? languages[0];
    return fallback[language.column] || fallback[languages[0].column] || key;
  }

  return {
    languages,
    t,
    getStoredLanguage,
    saveLanguage
  };
}
