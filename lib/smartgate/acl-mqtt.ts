import mqtt from "mqtt";

type AclPayload = { v: 1; allow: string[] };

export type MqttCreds = {
  host?: string;
  username?: string;
  password?: string;
  port?: number;
  path?: string;
};

type AclRead =
  | { status: "ok"; allow: string[] }
  | { status: "unavailable"; allow: string[] };

function topicAcl(gateId?: string): string {
  const id = gateId?.trim();
  if (id && !id.startsWith("gate-")) {
    return `home/gate/${id}/acl`;
  }
  return "home/gate/acl";
}

function brokerUrl(creds?: MqttCreds): {
  url: string;
  username: string;
  password: string;
} {
  const host =
    creds?.host?.trim() ||
    process.env.MQTT_HOST ||
    process.env.NEXT_PUBLIC_MQTT_HOST ||
    "3c391676ced3426b8300afc7d6b4961e.s1.eu.hivemq.cloud";
  const username =
    creds?.username?.trim() ||
    process.env.MQTT_USER ||
    process.env.NEXT_PUBLIC_MQTT_USER ||
    "Gate1";
  const password =
    creds?.password ??
    process.env.MQTT_PASS ??
    process.env.NEXT_PUBLIC_MQTT_PASS ??
    "Ash7289...";
  const port = Number(
    creds?.port || process.env.MQTT_WS_PORT || process.env.NEXT_PUBLIC_MQTT_PORT || 8884,
  );
  const path =
    creds?.path ||
    process.env.MQTT_WS_PATH ||
    process.env.NEXT_PUBLIC_MQTT_PATH ||
    "/mqtt";
  return {
    url: `wss://${host}:${port}${path}`,
    username,
    password,
  };
}

const globalAcl = globalThis as unknown as {
  __gateAclByTopic?: Record<
    string,
    { allow: string[]; at: number; known: boolean }
  >;
};

function cacheGet(topic: string) {
  const map = globalAcl.__gateAclByTopic ?? {};
  const row = map[topic];
  if (!row) return null;
  if (Date.now() - row.at > 300_000) return null;
  return row;
}

function cacheSet(topic: string, allow: string[], known: boolean) {
  if (!globalAcl.__gateAclByTopic) globalAcl.__gateAclByTopic = {};
  globalAcl.__gateAclByTopic[topic] = { allow, at: Date.now(), known };
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

export function readInviteAllowList(
  creds?: MqttCreds,
  gateId?: string,
): Promise<AclRead> {
  const topic = topicAcl(gateId);
  const cached = cacheGet(topic);
  if (cached?.known) {
    return Promise.resolve({ status: "ok", allow: cached.allow });
  }

  const { url, username, password } = brokerUrl(creds);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: AclRead) => {
      if (settled) return;
      settled = true;
      if (result.status === "ok") cacheSet(topic, result.allow, true);
      try {
        client.end(true);
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const client = mqtt.connect(url, {
      username,
      password,
      clientId: `homegate-acl-r-${Math.random().toString(16).slice(2, 8)}`,
      connectTimeout: 6000,
      reconnectPeriod: 0,
    });

    const timer = setTimeout(() => {
      finish({ status: "unavailable", allow: cacheGet(topic)?.allow ?? [] });
    }, 4500);

    client.on("connect", () => {
      client.subscribe(topic, { qos: 0 });
    });

    client.on("message", (msgTopic, payload) => {
      if (msgTopic !== topic) return;
      clearTimeout(timer);
      finish({ status: "ok", allow: parseAcl(payload.toString()) });
    });

    client.on("error", () => {
      clearTimeout(timer);
      finish({ status: "unavailable", allow: cacheGet(topic)?.allow ?? [] });
    });
  });
}

export async function writeInviteAllowList(
  allow: string[],
  creds?: MqttCreds,
  gateId?: string,
): Promise<void> {
  const topic = topicAcl(gateId);
  const unique = [...new Set(allow)];
  cacheSet(topic, unique, true);
  const { url, username, password } = brokerUrl(creds);
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
        topic,
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

export async function addInviteToAllowList(
  id: string,
  creds?: MqttCreds,
  gateId?: string,
): Promise<void> {
  const topic = topicAcl(gateId);
  const read = await readInviteAllowList(creds, gateId);
  const allow =
    read.status === "ok"
      ? [...read.allow]
      : [...(cacheGet(topic)?.allow ?? [])];
  if (!allow.includes(id)) allow.push(id);
  await writeInviteAllowList(allow, creds, gateId);
}

export async function removeInviteFromAllowList(
  id: string,
  creds?: MqttCreds,
  gateId?: string,
): Promise<void> {
  const topic = topicAcl(gateId);
  const read = await readInviteAllowList(creds, gateId);
  const allow =
    read.status === "ok"
      ? [...read.allow]
      : [...(cacheGet(topic)?.allow ?? [])];
  await writeInviteAllowList(
    allow.filter((x) => x !== id),
    creds,
    gateId,
  );
}

export async function inviteAllowStatus(
  id: string,
  creds?: MqttCreds,
  gateId?: string,
): Promise<"yes" | "no" | "unknown"> {
  const read = await readInviteAllowList(creds, gateId);
  if (read.status !== "ok") return "unknown";
  return read.allow.includes(id) ? "yes" : "no";
}
