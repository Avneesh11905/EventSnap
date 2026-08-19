import { spawn } from "child_process";

const INFISICAL_API_URL = process.env.INFISICAL_API_URL || "https://app.infisical.com";
const INFISICAL_TOKEN = process.env.INFISICAL_TOKEN;
const CLIENT_ID = process.env.INFISICAL_CLIENT_ID;
const CLIENT_SECRET = process.env.INFISICAL_CLIENT_SECRET;
const WORKSPACE_ID = process.env.INFISICAL_WORKSPACE_ID;
const ENVIRONMENT = process.env.INFISICAL_ENVIRONMENT || "dev";

const commandArgs = process.argv.slice(2);

async function run() {
  if (!INFISICAL_TOKEN && (!CLIENT_ID || !CLIENT_SECRET || !WORKSPACE_ID)) {
    // Silently skip if no credentials are found (makes it invisible in production/Vercel)
    return spawnCommand();
  }

  try {
    let accessToken = "";
    let workspaceId = "";
    let environment = "";
    let secretPath = "/";

    if (INFISICAL_TOKEN) {
      accessToken = INFISICAL_TOKEN;
      const tokenRes = await fetch(`${INFISICAL_API_URL}/api/v2/service-token`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (!tokenRes.ok) throw new Error(`Token validation failed: ${tokenRes.statusText}`);
      const tokenData = await tokenRes.json();
      workspaceId = tokenData.workspace;
      environment = tokenData.scopes[0].environment;
      secretPath = tokenData.scopes[0].secretPath || "/";
    } else if (CLIENT_ID && CLIENT_SECRET && WORKSPACE_ID) {
      workspaceId = WORKSPACE_ID;
      environment = ENVIRONMENT;
      const authRes = await fetch(`${INFISICAL_API_URL}/api/v1/auth/universal-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
      });
      if (!authRes.ok) throw new Error(`Machine Identity Auth failed`);
      accessToken = (await authRes.json()).accessToken;
    }

    const secretsUrl = new URL(`${INFISICAL_API_URL}/api/v3/secrets/raw`);
    secretsUrl.searchParams.append("workspaceId", workspaceId);
    secretsUrl.searchParams.append("environment", environment);
    secretsUrl.searchParams.append("secretPath", secretPath); 

    const secretsRes = await fetch(secretsUrl.toString(), {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!secretsRes.ok) throw new Error(`Failed to fetch secrets`);
    
    // Inject secrets DIRECTLY into memory!
    const data = await secretsRes.json();
    for (const s of data.secrets || []) {
      process.env[s.secretKey] = s.secretValue;
    }
    
    // Match the Next.js checkmark styling
    console.log(`✓ Loaded ${data.secrets.length} secrets from Infisical`);
    spawnCommand();

  } catch (error) {
    console.error("⨯ Error fetching secrets from Infisical:", error);
    process.exit(1);
  }
}

function spawnCommand() {
  if (commandArgs.length === 0) return;
  
  // Spawn the requested command (e.g. 'next dev' or 'prisma generate')
  const child = spawn(commandArgs[0], commandArgs.slice(1), {
    stdio: "inherit",
    env: process.env,
    shell: true, // Needed for Windows commands
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

run();
