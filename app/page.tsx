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

export default function HomePage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    requestTitle: "",
    date: "",
    startTime: "",
    endTime: "",
    sleepover: "no" as "yes" | "no",
    equipmentRequired: [] as EquipmentOption[],
    otherEquipment: "",
    purpose: "",
  });

  useEffect(() => {
    loadRequests();
  }, []);

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

  const counts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      denied: requests.filter((r) => r.status === "denied").length,
    };
  }, [requests]);

  function toggleEquipment(option: EquipmentOption) {
    setForm((prev) => {
      const isSelected = prev.equipmentRequired.includes(option);

      const nextEquipment = isSelected
        ? prev.equipmentRequired.filter((item) => item !== option)
        : [...prev.equipmentRequired, option];

      return {
        ...prev,
        equipmentRequired: nextEquipment,
        otherEquipment:
          option === "other" && isSelected ? "" : prev.otherEquipment,
      };
    });
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!form.requestTitle || !form.date || !form.startTime || !form.endTime) {
      setMessage("Please fill out all required fields.");
      return;
    }

    if (form.equipmentRequired.length === 0) {
      setMessage("Please select at least one equipment option.");
      return;
    }

    if (
      form.equipmentRequired.includes("other") &&
      !form.otherEquipment.trim()
    ) {
      setMessage('Please describe the "Other" equipment required.');
      return;
    }

    setSubmitting(true);
    setMessage("Saving request...");

    const { error } = await supabase.from("requests").insert([
      {
        request_title: form.requestTitle,
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        sleepover: form.sleepover,
        equipment_required: form.equipmentRequired,
        other_equipment: form.otherEquipment.trim() || null,
        purpose: form.purpose.trim() || null,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("INSERT ERROR:", error);
      setMessage(`Could not save request: ${error.message}`);
      setSubmitting(false);
      return;
    }

    setForm({
      requestTitle: "",
      date: "",
      startTime: "",
      endTime: "",
      sleepover: "no",
      equipmentRequired: [],
      otherEquipment: "",
      purpose: "",
    });

    setMessage("Request saved.");
    setSubmitting(false);
    await loadRequests();
  }

  async function updateRequestStatus(
    id: number,
    nextStatus: "approved" | "denied"
  ) {
    const { error } = await supabase
      .from("requests")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      console.error("UPDATE ERROR:", error);
      setMessage(`Could not update request: ${error.message}`);
      return;
    }

    setMessage(
      nextStatus === "approved" ? "Request approved." : "Request denied."
    );

    await loadRequests();
  }

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

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Sister Stop By Request</h1>
        <p style={styles.subtitle}>
          She submits a request, and you review it in your admin view.
        </p>

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

        <div style={styles.grid}>
          <section style={styles.card}>
            <h2>Submit a request</h2>

            <form onSubmit={submitRequest} style={styles.form}>
              <label style={styles.label}>
                What is the Request
                <input
                  style={styles.input}
                  value={form.requestTitle}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      requestTitle: e.target.value,
                    }))
                  }
                  placeholder="Example: Stop by after work"
                />
              </label>

              <label style={styles.label}>
                Date
                <input
                  style={styles.input}
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </label>

              <div style={styles.timeRow}>
                <label style={styles.label}>
                  Start time
                  <input
                    style={styles.input}
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                  />
                </label>

                <label style={styles.label}>
                  End time
                  <input
                    style={styles.input}
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                  />
                </label>
              </div>

              <label style={styles.label}>
                Is this a sleepover request?
                <select
                  style={styles.input}
                  value={form.sleepover}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sleepover: e.target.value as "yes" | "no",
                    }))
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>

              <div style={styles.label}>
                <span>Equipment required</span>

                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.equipmentRequired.includes("bed")}
                      onChange={() => toggleEquipment("bed")}
                    />
                    Bed
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.equipmentRequired.includes("desk")}
                      onChange={() => toggleEquipment("desk")}
                    />
                    Desk
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.equipmentRequired.includes("kitchen")}
                      onChange={() => toggleEquipment("kitchen")}
                    />
                    Kitchen
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.equipmentRequired.includes("other")}
                      onChange={() => toggleEquipment("other")}
                    />
                    Other
                  </label>
                </div>
              </div>

              {form.equipmentRequired.includes("other") ? (
                <label style={styles.label}>
                  What other equipment is required?
                  <input
                    style={styles.input}
                    value={form.otherEquipment}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        otherEquipment: e.target.value,
                      }))
                    }
                    placeholder="Example: Air mattress, monitor, extra chair"
                  />
                </label>
              ) : null}

              <label style={styles.label}>
                Purpose (optional)
                <textarea
                  style={styles.textarea}
                  value={form.purpose}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, purpose: e.target.value }))
                  }
                  placeholder="Optional details"
                />
              </label>

              <button type="submit" style={styles.button} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
          </section>

          <section style={styles.card}>
            <h2>Admin view</h2>

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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
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
  textarea: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    minHeight: "100px",
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
  timeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "10px 0 4px 0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
};