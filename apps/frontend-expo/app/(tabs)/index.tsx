/**
 * Main demo screen for the microservice project.
 *
 * This screen lets you:
 *   1. Configure the backend URL (localhost or EC2)
 *   2. Check health of both services
 *   3. Login to get a Bearer token from auth-service
 *   4. Call the protected /api/info endpoint (info-service → auth-service sync call)
 *   5. View the raw JSON response including authValidationMs timing
 *
 * The key flow that demonstrates the assignment:
 *   Frontend → Nginx gateway → info-service → auth-service (synchronous HTTP)
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";

// Default backend URL: "localhost" for web, "10.0.2.2" for Android emulator
// (10.0.2.2 is the Android emulator's alias for the host machine's localhost)
const DEFAULT_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost"
    : "http://10.0.2.2";

// Type for tracking the status of API calls
type StatusType = "idle" | "loading" | "ok" | "error";
// Type for tracking health check results
type HealthState = "unknown" | "up" | "down" | "checking";

// Dark theme color palette used throughout the screen
const COLORS = {
  bgTop: "#0B1220",
  card: "#0F172A",
  card2: "#111827",
  border: "rgba(255,255,255,0.12)",
  text: "#E5E7EB",
  sub: "rgba(229,231,235,0.75)",
  accent2: "#38BDF8",
  pill: "rgba(255,255,255,0.14)",
};

// --- StatusPill: shows the current status (READY/WORKING/OK/ERROR) and HTTP code ---
function StatusPill({
  status,
  http,
  pulse,
}: {
  status: StatusType;
  http: number | null;
  pulse?: boolean;
}) {
  const label =
    status === "idle"
      ? "READY"
      : status === "loading"
      ? "WORKING"
      : status === "ok"
      ? "OK"
      : "ERROR";

  const bg =
    status === "ok"
      ? "rgba(34,197,94,0.22)"
      : status === "error"
      ? "rgba(251,113,133,0.22)"
      : status === "loading"
      ? "rgba(56,189,248,0.22)"
      : COLORS.pill;

  const fg =
    status === "ok"
      ? "#86EFAC"
      : status === "error"
      ? "#FDA4AF"
      : status === "loading"
      ? "#7DD3FC"
      : COLORS.text;

  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          opacity: pulse ? 0.75 : 1,
        }}
      >
        <Text style={{ color: fg, fontWeight: "900", fontSize: 12 }}>{label}</Text>
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: COLORS.pill,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 12 }}>
          {http !== null ? `HTTP ${http}` : "HTTP —"}
        </Text>
      </View>
    </View>
  );
}

// --- TinyBadge: small badge showing if a service is up/down ---
function TinyBadge({ state, label }: { state: HealthState; label: string }) {
  const [bg, fg, icon] =
    state === "up"
      ? ["rgba(34,197,94,0.22)", "#86EFAC", "✅"]
      : state === "down"
      ? ["rgba(251,113,133,0.22)", "#FDA4AF", "❌"]
      : state === "checking"
      ? ["rgba(56,189,248,0.22)", "#7DD3FC", "⏳"]
      : ["rgba(255,255,255,0.10)", COLORS.text, "•"];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
      }}
    >
      <Text style={{ color: fg, fontWeight: "900" }}>{icon}</Text>
      <Text style={{ color: fg, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

// --- Card: reusable card wrapper with a colored accent bar at the top ---
function Card({
  title,
  subtitle,
  children,
  topAccent = "rgba(56,189,248,0.85)",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  topAccent?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <View
        style={{
          height: 4,
          borderRadius: 999,
          backgroundColor: topAccent,
          marginBottom: 12,
          opacity: 0.75,
        }}
      />
      <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ marginTop: 4, color: COLORS.sub }}>{subtitle}</Text>
      ) : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

// --- PrimaryButton: filled action button (Login, Get Info) ---
function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "blue",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "blue" | "green" | "pink";
}) {
  const bg =
    variant === "green"
      ? "#16A34A"
      : variant === "pink"
      ? "#DB2777"
      : "#2563EB";

  const bgDisabled = "rgba(148,163,184,0.18)";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: disabled ? bgDisabled : bg,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: disabled ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.18)",
        minWidth: 120,
        transform: pressed && !disabled ? [{ scale: 0.99 }] : undefined,
      })}
    >
      {loading ? <ActivityIndicator color="white" /> : null}
      <Text
        style={{
          color: "white",
          fontWeight: "900",
          opacity: disabled ? 0.65 : 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// --- GhostButton: outlined/transparent button (Reset, Copy token, etc.) ---
function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: "rgba(255,255,255,0.06)",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 120,
      })}
    >
      <Text style={{ color: COLORS.text, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

// ======================== MAIN SCREEN COMPONENT ========================
export default function Index() {
  // --- State variables ---
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);    // Backend URL (configurable)

  const [token, setToken] = useState("");                      // Bearer token from auth-service
  const [status, setStatus] = useState<StatusType>("idle");     // Current request status
  const [pulse, setPulse] = useState(false);                    // Loading animation toggle
  const [httpStatus, setHttpStatus] = useState<number | null>(null);  // Last HTTP status code
  const [message, setMessage] = useState<string>("Redo. Klicka Login för att få token ✨"); // Status message
  const [raw, setRaw] = useState<string>("");                   // Raw JSON response
  const [showRaw, setShowRaw] = useState(false);                // Toggle raw data display

  const [authHealth, setAuthHealth] = useState<HealthState>("unknown");   // auth-service health
  const [infoHealth, setInfoHealth] = useState<HealthState>("unknown");   // info-service health
  const [healthNote, setHealthNote] = useState<string>("");               // Health check summary text

  // "Get Info" button is only enabled when we have a token
  const canFetchInfo = useMemo(() => token.trim().length > 0, [token]);

  // Pulse animation while loading (toggles every 350ms)
  useEffect(() => {
    let t: any;
    if (status === "loading") {
      setPulse(true);
      t = setInterval(() => setPulse((p) => !p), 350);
    } else {
      setPulse(false);
    }
    return () => t && clearInterval(t);
  }, [status]);

  // When the backend URL changes, reset health indicators
  useEffect(() => {
    setAuthHealth("unknown");
    setInfoHealth("unknown");
    setHealthNote("");
  }, [baseUrl]);

  // --- Health Check: pings both /auth/health and /api/health ---
  const checkHealth = async () => {
    setAuthHealth("checking");
    setInfoHealth("checking");
    setHealthNote("Checking…");

    try {
      const [a, i] = await Promise.allSettled([
        fetch(`${baseUrl}/auth/health`),
        fetch(`${baseUrl}/api/health`),
      ]);

      const authUp = a.status === "fulfilled" && a.value.ok;
      const infoUp = i.status === "fulfilled" && i.value.ok;

      setAuthHealth(authUp ? "up" : "down");
      setInfoHealth(infoUp ? "up" : "down");

      const now = new Date().toLocaleTimeString();
      const note = `Last checked ${now}: auth=${authUp ? "UP" : "DOWN"}, info=${
        infoUp ? "UP" : "DOWN"
      }`;
      setHealthNote(note);
      setMessage(note);
    } catch (e: any) {
      setAuthHealth("down");
      setInfoHealth("down");
      const now = new Date().toLocaleTimeString();
      const note = `Last checked ${now}: FAILED (${String(e?.message ?? e)})`;
      setHealthNote(note);
      setMessage(note);
    }
  };

  // Auto-check health once when the screen first loads
  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * LOGIN: sends POST /auth/login to auth-service (via Nginx gateway).
   * On success, stores the returned Bearer token in state.
   */
  const login = async () => {
    setStatus("loading");
    setHttpStatus(null);
    setMessage("Loggar in…");
    setRaw("");

    try {
      const r = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "sara", password: "pass" }),
      });

      setHttpStatus(r.status);
      const j = await r.json();

      setToken(j.token ?? "");
      setStatus(r.ok ? "ok" : "error");
      setMessage(r.ok ? "Inloggad! Token hämtad 🎉" : "Login misslyckades.");
      setRaw(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setStatus("error");
      setMessage("Kunde inte logga in. Kontrollera att backend kör + CORS.");
      setRaw(String(e?.message ?? e));
    }
  };

  /**
   * GET INFO: sends GET /api/info with the Bearer token.
   * info-service then SYNCHRONOUSLY calls auth-service to validate the token
   * before returning the protected data. This is the core of the assignment.
   */
  const getInfo = async () => {
    setStatus("loading");
    setHttpStatus(null);
    setMessage("Hämtar skyddad info (info-service → auth-service sync)…");
    setRaw("");

    try {
      const r = await fetch(`${baseUrl}/api/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHttpStatus(r.status);
      const text = await r.text();

      // Try to extract authValidationMs from JSON response (if present)
      let authMs: number | null = null;
      try {
        const j = JSON.parse(text);
        if (typeof j?.authValidationMs === "number") authMs = j.authValidationMs;
      } catch {
        // ignore
      }

      if (r.ok) {
        setStatus("ok");
        setMessage(
          `OK! info-service validerade token via auth-service ✅${
            authMs !== null ? ` (authValidationMs=${authMs}ms)` : ""
          }`
        );
      } else {
        setStatus("error");
        setMessage(
          `Inte OK. Prova logga in igen eller kontrollera token.${
            authMs !== null ? ` (authValidationMs=${authMs}ms)` : ""
          }`
        );
      }

      setRaw(text);
    } catch (e: any) {
      setStatus("error");
      setMessage("Kunde inte hämta info. Är gateway/backends igång?");
      setRaw(String(e?.message ?? e));
    }
  };

  // Copy the token to clipboard (web) or show it in an alert (mobile)
  const copyToken = async () => {
    if (!token) return;
    try {
      if (Platform.OS === "web" && navigator?.clipboard) {
        await navigator.clipboard.writeText(token);
        Alert.alert("Kopierat", "Token kopierad till urklipp ✅");
      } else {
        Alert.alert("Token", token);
      }
    } catch {
      Alert.alert("Token", token);
    }
  };

  // Reset all state back to initial values
  const reset = () => {
    setToken("");
    setStatus("idle");
    setHttpStatus(null);
    setMessage("Reset klar. Kör igen 🚀");
    setRaw("");
    setShowRaw(false);
  };

  // Switch back to localhost default URL
  const applyLocal = () => {
    setBaseUrl(DEFAULT_BASE_URL);
    setMessage(`Bytte backend URL till ${DEFAULT_BASE_URL}`);
  };

  // Pick an emoji based on status for the header
  const emoji =
    status === "ok" ? "🎉" : status === "error" ? "🧯" : status === "loading" ? "⏳" : "✨";

  const getInfoLabel = canFetchInfo ? "Get Info" : "🔒 Get Info (Login required)";

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        gap: 14,
        minHeight: "100%",
        backgroundColor: COLORS.bgTop,
      }}
    >
      {/* Clean header */}
      <View
        style={{
          borderRadius: 22,
          padding: 18,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          backgroundColor: COLORS.bgTop,
        }}
      >
        <View
          style={{
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(56,189,248,0.75)",
            marginBottom: 12,
          }}
        />

        <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.text }}>
          Microservice Demo {emoji}
        </Text>
        <Text style={{ marginTop: 6, color: COLORS.sub, lineHeight: 20 }}>
          Expo (web/app) + Spring Boot:{" "}
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>info-service</Text>{" "}
          → <Text style={{ color: COLORS.text, fontWeight: "900" }}>auth-service</Text>{" "}
          (synkront request/response)
        </Text>

        <View style={{ marginTop: 12 }}>
          <StatusPill status={status} http={httpStatus} pulse={pulse} />
        </View>
      </View>

      <Card
        title="Backend URL"
        subtitle="Byt mellan localhost och EC2 (eller valfri URL)."
        topAccent="rgba(56,189,248,0.85)"
      >
        <Text style={{ color: COLORS.sub, marginBottom: 6 }}>Backend base URL</Text>
        <TextInput
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="http://localhost eller http://<EC2_IP>"
          placeholderTextColor="rgba(229,231,235,0.55)"
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 12,
            backgroundColor: COLORS.card2,
            color: COLORS.text,
            fontFamily: Platform.OS === "web" ? "monospace" : undefined,
          }}
        />
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <GhostButton label="Use local default" onPress={applyLocal} />
          <GhostButton label="Check health" onPress={checkHealth} />
        </View>

        {healthNote ? (
          <Text style={{ marginTop: 10, color: COLORS.sub, fontWeight: "700" }}>
            {healthNote}
          </Text>
        ) : null}

        <Text style={{ marginTop: 8, color: COLORS.sub }}>
          Exempel: <Text style={{ color: COLORS.text, fontWeight: "900" }}>http://localhost</Text>{" "}
          eller <Text style={{ color: COLORS.text, fontWeight: "900" }}>http://12.34.56.78</Text>
        </Text>
      </Card>

      <Card
        title="Service Health"
        subtitle="Pingar båda tjänsterna. Bra i screencast innan demo."
        topAccent="rgba(34,197,94,0.85)"
      >
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <TinyBadge state={authHealth} label="auth-service" />
          <TinyBadge state={infoHealth} label="info-service" />
        </View>

        <Text style={{ marginTop: 10, color: COLORS.sub }}>
          Checking: <Text style={{ color: COLORS.text, fontWeight: "900" }}>{baseUrl}</Text>
        </Text>
        <Text style={{ marginTop: 6, color: COLORS.sub }}>
          URLs:{" "}
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>{baseUrl}/auth/health</Text>
          {"  "}•{"  "}
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>{baseUrl}/api/health</Text>
        </Text>
      </Card>

      <Card
        title="Actions"
        subtitle="Login → token → Get Info (info-service anropar auth-service synkront)"
        topAccent="rgba(219,39,119,0.85)"
      >
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <PrimaryButton
            label="Login"
            onPress={login}
            loading={status === "loading"}
            variant="pink"
          />
          <PrimaryButton
            label={getInfoLabel}
            onPress={getInfo}
            disabled={!canFetchInfo}
            loading={status === "loading"}
            variant="green"
          />
          <GhostButton label="Reset" onPress={reset} />
        </View>

        {!canFetchInfo ? (
          <Text style={{ marginTop: 10, color: "#FDE68A", fontWeight: "800" }}>
            🔒 Get Info är låst — klicka Login för att få en token.
          </Text>
        ) : null}
      </Card>

      <Card
        title="Access Token"
        subtitle="Bearer-token skickas i Authorization-headern"
        topAccent="rgba(56,189,248,0.85)"
      >
        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="Token (fylls efter login)"
          placeholderTextColor="rgba(229,231,235,0.55)"
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 12,
            backgroundColor: COLORS.card2,
            color: COLORS.text,
            fontFamily: Platform.OS === "web" ? "monospace" : undefined,
          }}
        />
        <View style={{ marginTop: 10 }}>
          <GhostButton label="Copy token" onPress={copyToken} disabled={!token} />
        </View>
      </Card>

      <Card
        title="Result"
        subtitle="Bra att visa i screencast (status + rådata + authValidationMs)"
        topAccent="rgba(245,158,11,0.85)"
      >
        <Text style={{ color: COLORS.text, fontWeight: "800" }}>{message}</Text>

        <Pressable
          onPress={() => setShowRaw((s) => !s)}
          style={({ pressed }) => ({
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.07)",
            opacity: pressed ? 0.85 : 1,
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          })}
        >
          <Text style={{ fontWeight: "900", color: COLORS.text }}>
            {showRaw ? "Hide raw data" : "Show raw data"}
          </Text>
        </Pressable>

        {showRaw ? (
          <View
            style={{
              marginTop: 12,
              backgroundColor: "#020617",
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
            }}
          >
            <Text
              style={{
                color: "#E2E8F0",
                fontFamily: Platform.OS === "web" ? "monospace" : undefined,
              }}
            >
              {raw || "—"}
            </Text>
          </View>
        ) : null}
      </Card>

      <Text style={{ textAlign: "center", color: "rgba(229,231,235,0.55)", marginTop: 6 }}>
        Demo: /auth/login → token → /api/info (sync validate, authValidationMs)
      </Text>
    </ScrollView>
  );
}