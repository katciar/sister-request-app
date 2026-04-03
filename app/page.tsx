"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type EquipmentOption = "bed" | "desk" | "kitchen" | "other";

export default function HomePage() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    whoAreYou: "",
    requestTitle: "",
    date: "",
    startTime: "",
    endTime: "",
    sleepover: "no" as "yes" | "no",
    equipmentRequired: [] as EquipmentOption[],
    otherEquipment: "",
    purpose: "",
  });

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

    if (
      !form.whoAreYou.trim() ||
      !form.requestTitle.trim() ||
      !form.date ||
      !form.startTime ||
      !form.endTime
    ) {
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
        who_are_you: form.whoAreYou.trim(),
        request_title: form.requestTitle.trim(),
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
      setMessage(`Could not save request: ${error.message}`);
      setSubmitting(false);
      return;
    }

    setForm({
      whoAreYou: "",
      requestTitle: "",
      date: "",
      startTime: "",
      endTime: "",
      sleepover: "no",
      equipmentRequired: [],
      otherEquipment: "",
      purpose: "",
    });

    setMessage("Request submitted.");
    setSubmitting(false);
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Sister Stop By Request</h1>
        <p style={styles.subtitle}>Submit a request for a date and time.</p>

        {message ? <div style={styles.message}>{message}</div> : null}

        <section style={styles.card}>
          <h2>Submit a request</h2>

          <form onSubmit={submitRequest} style={styles.form}>
            <label style={styles.label}>
              Who are you?
              <input
                style={styles.input}
                value={form.whoAreYou}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, whoAreYou: e.target.value }))
                }
                placeholder="Example: Lauren"
              />
            </label>

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
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f7fb",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "760px",
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