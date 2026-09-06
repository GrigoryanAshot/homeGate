import mqtt from "mqtt";

/** Retained ACL of invite ids that are still allowed to open the gate */
export const TOPIC_ACL = "home/gate/acl";

type AclPayload = { v: 1; allow: string[] };

function brokerUrl(): { url: string; username: string; password: string } {
  const host =
    process.env.MQTT_HOST ||
    process.env.NEXT_PUBLIC_MQTT_HOST ||
    "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud";
  const username =
    process.env.MQTT_USER ||
    process.env.NEXT_PUBLIC_MQTT_USER ||
    "Gate1";
  const password =
    process.env.MQTT_PASS ||
    process.env.NEXT_PUBLIC_MQTT_PASS ||
    "Ash7289...";
  // WebSocket like the app (HiveMQ Cloud)
  const port = Number(process.env.MQTT_WS_PORT || 8884);
  const path = process.env.MQTT_WS_PATH || "/mqtt";
  return {
    url: `wss://${host}:${port}${path}`,
    username,
    password,
  };
}

const globalAcl = globalThis as unknown as {
  __gateAclAllow?: string[];
  __gateAclAt?: number;
};

function cacheGet(): string[] | null {
  if (!globalAcl.__gateAclAllow) return null;
  if (Date.now() - (globalAcl.__gateAclAt ?? 0) > 60_000) return null;
  return globalAcl.__gateAclAllow;
}

function cacheSet(allow: string[]) {
  globalAcl.__gateAclAllow = allow;
  globalAcl.__gateAclAt = Date.now();
}

function parseAcl(raw: string): string[] {
  try {
    const data = JSON.parse(raw) as AclPayload;
    if (data?.v === 1 && Array.isArray(data.allow)) {
      return data.allow.filter((id) => typeof id === "string" && id.length > 0);
    }
  } catch {
    /* ignore */
  }
  return [];
}

/** Read current allow-list (retained MQTT), with short in-memory cache */
export function readInviteAllowList(): Promise<string[]> {
  const cached = cacheGet();
  if (cached) return Promise.resolve(cached);

  const { url, username, password } = brokerUrl();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (allow: string[]) => {
      if (settled) return;
      settled = true;
      cacheSet(allow);
      try {
        client.end(true);
      } catch {
        /* ignore */
      }
      resolve(allow);
    };

    const client = mqtt.connect(url, {
      username,
      password,
      clientId: `homegate-acl-r-${Math.random().toString(16).slice(2, 8)}`,
      connectTimeout: 8000,
      reconnectPeriod: 0,
    });

    const timer = setTimeout(() => finish(cacheGet() ?? []), 6000);

    client.on("connect", () => {
      client.subscribe(TOPIC_ACL, { qos: 0 });
    });

    client.on("message", (topic, payload) => {
      if (topic !== TOPIC_ACL) return;
      clearTimeout(timer);
      finish(parseAcl(payload.toString()));
    });

    client.on("error", () => {
      clearTimeout(timer);
      finish(cacheGet() ?? []);
    });
  });
}

export async function writeInviteAllowList(allow: string[]): Promise<void> {
  const unique = [...new Set(allow)];
  cacheSet(unique);
  const { url, username, password } = brokerUrl();
  const body: AclPayload = { v: 1, allow: unique };

  return new Promise((resolve, reject) => {
    const client = mqtt.connect(url, {
      username,
      password,
      clientId: `homegate-acl-w-${Math.random().toString(16).slice(2, 8)}`,
      connectTimeout: 8000,
      reconnectPeriod: 0,
    });

    const timer = setTimeout(() => {
      try {
        client.end(true);
      } catch {
        /* ignore */
      }
      reject(new Error("ACL publish timeout"));
    }, 8000);

    client.on("connect", () => {
      client.publish(
        TOPIC_ACL,
        JSON.stringify(body),
        { qos: 0, retain: true },
        (err) => {
          clearTimeout(timer);
          try {
            client.end(true);
          } catch {
            /* ignore */
          }
          if (err) reject(err);
          else resolve();
        },
      );
    });

    client.on("error", (err) => {
      clearTimeout(timer);
      try {
        client.end(true);
      } catch {
        /* ignore */
      }
      reject(err);
    });
  });
}

export async function addInviteToAllowList(id: string): Promise<void> {
  const allow = await readInviteAllowList();
  if (!allow.includes(id)) allow.push(id);
  await writeInviteAllowList(allow);
}

export async function removeInviteFromAllowList(id: string): Promise<void> {
  const allow = await readInviteAllowList();
  await writeInviteAllowList(allow.filter((x) => x !== id));
}

export async function isInviteAllowed(id: string): Promise<boolean> {
  const allow = await readInviteAllowList();
  return allow.includes(id);
}
