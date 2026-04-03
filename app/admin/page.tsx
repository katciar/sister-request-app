"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type EquipmentOption = "bed" | "desk" | "kitchen" | "other";
type RequestStatus = "pending" | "approved" | "denied";

type RequestItem = {
  id: number;
  created_at?: string;
  request_title: string;
  date: string;
  start_time: string;
  end_time: string;
  sleepover: "yes" | "no";
  equipment_required: EquipmentOption[];
  other_equipment: string | null;
  purpose: string | null;
  status: RequestStatus;
};

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hasCookie = document.cookie.includes("admin_auth=true");
    if (hasCookie) {
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) {
      loadRequests();
    }
  }, [isAuthed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginMessage("Checking password...");

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoginMessage(data.message || "Login failed.");
      return;
    }

    setIsAuthed(true);
    setLoginMessage("");
    setPassword("");
  }

  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD ERROR:", error);
      setMessage(`Could not load requests: ${error.message}`);
      setLoading(false);
      return;
    }

    setRequests((data ?? []) as RequestItem[]);
    setLoading(false);
  }

async function updateRequestStatus(
  id: number,
  nextStatus: "approved" | "denied"
) {
  if (nextStatus === "approved") {
    const res = await fetch("/api/approve-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId: id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Could not approve request.");
      return;
    }

    setMessage(
      data.invitedLauren
        ? "Request approved and Lauren was invited."
        : "Request approved and event was added to your calendar."
    );

    await loadRequests();
    return;
  }

  const { error } = await supabase
    .from("requests")
    .update({ status: "denied" })
    .eq("id", id);

  if (error) {
    setMessage(`Could not update request: ${error.message}`);
    return;
  }

  setMessage("Request denied.");
  await loadRequests();
}

  const counts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      denied: requests.filter((r) => r.status === "denied").length,
    };
  }, [requests]);

  function formatEquipment(request: RequestItem) {
    const labels = request.equipment_required.map((item) => {
      if (item === "bed") return "Bed";
      if (item === "desk") return "Desk";
      if (item === "kitchen") return "Kitchen";
      return "Other";
    });

    if (
      request.equipment_required.includes("other") &&
      request.other_equipment
    ) {
      return `${labels.join(", ")} (${request.other_equipment})`;
    }

    return labels.join(", ");
  }

  if (!isAuthed) {
    return (
      <main style={styles.page}>
        <div style={styles.loginWrap}>
          <div style={styles.card}>
            <h1 style={styles.title}>Admin Login</h1>
            <p style={styles.subtitle}>Enter your admin password.</p>

            {loginMessage ? (
              <div style={styles.message}>{loginMessage}</div>
            ) : null}

            <form onSubmit={handleLogin} style={styles.form}>
              <label style={styles.label}>
                Password
                <input
                  style={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button type="submit" style={styles.button}>
                Log in
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Admin View</h1>
        <p style={styles.subtitle}>Review and manage requests.</p>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <strong>{counts.pending}</strong>
            <span>Pending</span>
          </div>
          <div style={styles.statCard}>
            <strong>{counts.approved}</strong>
            <span>Approved</span>
          </div>
          <div style={styles.statCard}>
            <strong>{counts.denied}</strong>
            <span>Denied</span>
          </div>
        </div>

        {message ? <div style={styles.message}>{message}</div> : null}

        <section style={styles.card}>
          <h2>Requests</h2>

          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p>No requests yet.</p>
          ) : (
            <div style={styles.requestList}>
              {requests.map((request) => (
                <div key={request.id} style={styles.requestCard}>
                  <p>
                    <strong>Request:</strong> {request.request_title}
                  </p>
                  <p>
                    <strong>Date:</strong> {request.date}
                  </p>
                  <p>
                    <strong>Time:</strong> {request.start_time} to{" "}
                    {request.end_time}
                  </p>
                  <p>
                    <strong>Sleepover:</strong> {request.sleepover}
                  </p>
                  <p>
                    <strong>Equipment required:</strong>{" "}
                    {formatEquipment(request)}
                  </p>
                  <p>
                    <strong>Purpose:</strong>{" "}
                    {request.purpose ? request.purpose : "Not provided"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span style={statusStyle(request.status)}>
                      {request.status}
                    </span>
                  </p>

                  {request.status === "pending" ? (
                    <div style={styles.actions}>
                      <button
                        type="button"
                        style={styles.approveButton}
                        onClick={() =>
                          updateRequestStatus(request.id, "approved")
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        style={styles.denyButton}
                        onClick={() =>
                          updateRequestStatus(request.id, "denied")
                        }
                      >
                        Deny
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function statusStyle(status: RequestStatus): React.CSSProperties {
  if (status === "approved") return { color: "green", fontWeight: 700 };
  if (status === "denied") return { color: "crimson", fontWeight: 700 };
  return { color: "#a16207", fontWeight: 700 };
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f7fb",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  loginWrap: {
    maxWidth: "500px",
    margin: "80px auto",
  },
  title: {
    fontSize: "40px",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "24px",
    color: "#555",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  statCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px 20px",
    minWidth: "120px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  message: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#3730a3",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "16px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    cursor: "pointer",
  },
  requestList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  },
  requestCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  },
  approveButton: {
    background: "green",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  denyButton: {
    background: "crimson",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  },
};