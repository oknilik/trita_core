import fs from "node:fs";
import path from "node:path";

function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDotenv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1);
    result[key] = stripWrappingQuotes(rawValue);
  }
  return result;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  return parseDotenv(content);
}

function normalizeConnectionUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function isPooledPostgresUrl(url) {
  if (!url) return false;
  try {
    return new URL(url).hostname.includes("-pooler.");
  } catch {
    return false;
  }
}

function resolveEnvFromFiles(cwd) {
  const env = {};
  const orderedFiles = [".env", ".env.test", ".env.test.local"];
  for (const fileName of orderedFiles) {
    const absolute = path.join(cwd, fileName);
    const loaded = loadEnvFile(absolute);
    Object.assign(env, loaded);
  }
  return env;
}

export function resolveIntegrationTestDbEnv(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const processEnv = options.processEnv ?? process.env;
  const fileEnv = resolveEnvFromFiles(cwd);

  const testDatabaseUrl =
    processEnv.TEST_DATABASE_URL ??
    processEnv.DATABASE_URL_TEST ??
    fileEnv.TEST_DATABASE_URL ??
    fileEnv.DATABASE_URL_TEST;

  if (!testDatabaseUrl) {
    throw new Error(
      "Missing TEST_DATABASE_URL. Create .env.test (see .env.test.example) with a dedicated integration test DB.",
    );
  }

  const testDatabaseComesFromProcess = Boolean(
    processEnv.TEST_DATABASE_URL ?? processEnv.DATABASE_URL_TEST,
  );
  // Egy explicit process-level TEST_DATABASE_URL mellé ne keverjünk be
  // véletlenül fájlból egy másik branchhez tartozó direct URL-t.
  const configuredTestDirectUrl = testDatabaseComesFromProcess
    ? (processEnv.TEST_DIRECT_URL ?? processEnv.DIRECT_URL_TEST ?? testDatabaseUrl)
    : (fileEnv.TEST_DIRECT_URL ?? fileEnv.DIRECT_URL_TEST ?? testDatabaseUrl);

  // Neon esetén a runtime DATABASE_URL a pooler, a migrációs DIRECT_URL a
  // közvetlen endpoint. Régebbi lokális env-ekben ez a két érték felcserélve
  // szerepelt; csak a feloldott tesztfolyamatban korrigáljuk, a fájlt nem
  // írjuk át. Más szolgáltatóknál/localhoston a sorrendet érintetlenül hagyjuk.
  const urlsAreReversed =
    !isPooledPostgresUrl(testDatabaseUrl) && isPooledPostgresUrl(configuredTestDirectUrl);
  const resolvedTestDatabaseUrl = urlsAreReversed ? configuredTestDirectUrl : testDatabaseUrl;
  const resolvedTestDirectUrl = urlsAreReversed ? testDatabaseUrl : configuredTestDirectUrl;

  const devDatabaseUrl = processEnv.DATABASE_URL ?? fileEnv.DATABASE_URL;
  const normalizedDev = normalizeConnectionUrl(devDatabaseUrl);
  const normalizedTest = normalizeConnectionUrl(resolvedTestDatabaseUrl);

  if (normalizedDev && normalizedDev === normalizedTest) {
    throw new Error(
      "TEST_DATABASE_URL must not match DATABASE_URL. Use a separate integration test database.",
    );
  }

  return {
    DATABASE_URL: resolvedTestDatabaseUrl,
    DIRECT_URL: resolvedTestDirectUrl,
    TEST_DATABASE_URL: resolvedTestDatabaseUrl,
    TEST_DIRECT_URL: resolvedTestDirectUrl,
    TRITA_INTEGRATION_TEST_DB: "1",
  };
}
