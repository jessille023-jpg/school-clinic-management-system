import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

const VISIT_TYPES = [
  "A1 - Medical Consultation",
  "A2 - Medical Follow-up",
  "A3 - Dental Consultation",
  "A4 - Dental Follow-up",
  "A5 - Physical Examination",
];

const emptyForm = () => ({
  student_id: "",
  visit_type: VISIT_TYPES[0],
  visit_date: new Date().toLocaleDateString("en-CA"),
  visit_time: new Date().toTimeString().slice(0, 5),
  physician_name: "",
  reason: "",
  medical_history: "",
  blood_pressure: "",
  temperature: "",
  pulse_rate: "",
  respiratory_rate: "",
  oxygen_saturation: "",
  weight: "",
  assessment: "",
  treatment: "",
  starter_dose: "",
  procedure_name: "",
  advice: "",
  remarks: "",
  follow_up_required: false,
});

const styles = {
  page: { padding: 24, color: "#263238" },
  heading: { marginBottom: 5, color: "#2e7d32" },
  subtitle: { color: "#607d8b", marginTop: 0 },
  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: 6,
    background: "#2e7d32",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondary: {
    padding: "10px 15px",
    border: "1px solid #cfd8dc",
    borderRadius: 6,
    background: "white",
    color: "#263238",
    cursor: "pointer",
    fontWeight: 600,
  },
  danger: {
    padding: "10px 15px",
    border: "none",
    borderRadius: 6,
    background: "#b71c1c",
    color: "white",
    cursor: "pointer",
  },
  card: {
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 15,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#455a64" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 10,
    border: "1px solid #cfd8dc",
    borderRadius: 6,
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: 10,
    border: "1px solid #cfd8dc",
    borderRadius: 6,
    minHeight: 85,
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: 14,
  },
  tableWrap: { overflowX: "auto", marginTop: 15 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    background: "#f1f8e9",
    padding: 12,
    borderBottom: "1px solid #dce8d5",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #eeeeee",
    verticalAlign: "top",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  modal: {
    background: "#fff",
    borderRadius: 10,
    width: "100%",
    maxWidth: 850,
    maxHeight: "92vh",
    overflowY: "auto",
    padding: 24,
    boxSizing: "border-box",
  },
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const formatDate = (value) => {
  if (!value) return "—";

  // Keep the date as saved in MySQL.
  // Do not convert it to a JavaScript Date,
  // because timezone conversion can shift the day.
  const raw = String(value).slice(0, 10);
  const parts = raw.split("-");

  if (parts.length !== 3) return raw;

  const [year, month, day] = parts;
  return `${month}/${day}/${year}`;
};

const formatTime = (value) => {
  if (!value) return "—";

  const raw = String(value);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return raw;

  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${suffix}`;
};

const getStudentName = (visit, students) => {
  if (visit?.student_name) return visit.student_name;

  const student = students.find(
    (item) => Number(item.id) === Number(visit?.student_id)
  );

  return student?.full_name || "Unknown student";
};

const getStudentNumber = (visit, students) => {
  if (visit?.student_number) return visit.student_number;

  const student = students.find(
    (item) => Number(item.id) === Number(visit?.student_id)
  );

  return student?.student_id || "—";
};

const getVitalSigns = (visit) => {
  const value = visit?.vital_signs;

  if (!value) return "—";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div
      style={{
        padding: "11px 0",
        borderBottom: "1px solid #eeeeee",
        overflowWrap: "anywhere",
      }}
    >
      <div style={{ fontSize: 12, color: "#607d8b", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ whiteSpace: "pre-wrap" }}>
        {displayValue(value)}
      </div>
    </div>
  );
}

export default function Services() {
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterVisitType, setFilterVisitType] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [visitResponse, studentResponse] = await Promise.all([
        API.get("/visits"),
        API.get("/students"),
      ]);

      setVisits(
        Array.isArray(visitResponse.data) ? visitResponse.data : []
      );

      setStudents(
        Array.isArray(studentResponse.data) ? studentResponse.data : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load clinic visits. Check your login and backend server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedStudent = useMemo(
    () =>
      students.find(
        (student) => Number(student.id) === Number(form.student_id)
      ),
    [students, form.student_id]
  );

  const studentHistory = useMemo(() => {
    if (!form.student_id) return [];

    return visits.filter(
      (visit) =>
        Number(visit.student_id) === Number(form.student_id) &&
        Number(visit.id) !== Number(editingVisit?.id)
    );
  }, [visits, form.student_id, editingVisit]);

  const filteredVisits = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return visits
      .filter((visit) => {
        const studentName = getStudentName(visit, students);
        const studentNumber = getStudentNumber(visit, students);

        const matchesSearch =
          !query ||
          [
            visit.id,
            studentName,
            studentNumber,
            visit.reason,
            visit.visit_type,
            visit.physician_name,
          ].some((value) =>
            String(value ?? "").toLowerCase().includes(query)
          );

        const matchesType =
          !filterVisitType || visit.visit_type === filterVisitType;

        const matchesDate =
          !filterDate ||
          String(visit.visit_date ?? "").slice(0, 10) === filterDate;

        return matchesSearch && matchesType && matchesDate;
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [visits, students, searchText, filterVisitType, filterDate]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openNewForm = () => {
    setEditingVisit(null);
    setForm(emptyForm());
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const startEditingVisit = (visit) => {
    const rawVitals = getVitalSigns(visit);
    const vitalValues = {
      blood_pressure: "",
      temperature: "",
      pulse_rate: "",
      respiratory_rate: "",
      oxygen_saturation: "",
      weight: "",
    };

    const labels = {
      blood_pressure: /(?:BP|blood pressure)\s*:\s*([^,\n]+)/i,
      temperature: /(?:temperature|temp)\s*:\s*([^,\n]+)/i,
      pulse_rate: /(?:pulse(?: rate)?|heart rate)\s*:\s*([^,\n]+)/i,
      respiratory_rate: /(?:respiratory rate|resp rate|RR)\s*:\s*([^,\n]+)/i,
      oxygen_saturation: /(?:oxygen saturation|SpO2|O2 sat)\s*:\s*([^,\n]+)/i,
      weight: /weight\s*:\s*([^,\n]+)/i,
    };

    Object.entries(labels).forEach(([key, regex]) => {
      const match = rawVitals.match(regex);
      if (match) vitalValues[key] = match[1].trim();
    });

    setEditingVisit(visit);
    setSelectedVisit(null);
    setError("");
    setSuccess("");
    setForm({
      ...emptyForm(),
      student_id: String(visit.student_id ?? ""),
      visit_type: visit.visit_type || VISIT_TYPES[0],
      visit_date: String(visit.visit_date ?? "").slice(0, 10),
      visit_time: String(visit.visit_time ?? "").slice(0, 5),
      physician_name: visit.physician_name || "",
      reason: visit.reason || "",
      medical_history: visit.medical_history || "",
      ...vitalValues,
      assessment: visit.assessment || "",
      treatment: visit.treatment || "",
      starter_dose: visit.starter_dose || "",
      procedure_name: visit.procedure_name || "",
      advice: visit.advice || "",
      remarks: visit.remarks || "",
      follow_up_required: Number(visit.follow_up_required) === 1,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVisit(null);
    setForm(emptyForm());
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.student_id) {
      setError("Please select a student.");
      return;
    }

    if (!form.visit_type || !form.visit_date || !form.visit_time) {
      setError("Please complete the visit type, date, and time.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please enter the reason for the visit.");
      return;
    }

    const numericFields = [
      ["Temperature", form.temperature],
      ["Pulse rate", form.pulse_rate],
      ["Respiratory rate", form.respiratory_rate],
      ["Oxygen saturation", form.oxygen_saturation],
      ["Weight", form.weight],
    ];

    for (const [label, value] of numericFields) {
      if (value.trim() && !Number.isFinite(Number(value))) {
        setError(`${label} must be a valid number.`);
        return;
      }
    }

    const warnings = [];

    if (
      form.temperature &&
      (Number(form.temperature) < 30 || Number(form.temperature) > 45)
    ) {
      warnings.push("Temperature is outside the review range of 30–45 °C.");
    }

    if (
      form.pulse_rate &&
      (Number(form.pulse_rate) < 30 || Number(form.pulse_rate) > 220)
    ) {
      warnings.push("Pulse rate is outside the review range of 30–220 bpm.");
    }

    if (
      form.respiratory_rate &&
      (Number(form.respiratory_rate) < 5 ||
        Number(form.respiratory_rate) > 60)
    ) {
      warnings.push("Respiratory rate is outside the review range of 5–60.");
    }

    if (
      form.oxygen_saturation &&
      (Number(form.oxygen_saturation) < 70 ||
        Number(form.oxygen_saturation) > 100)
    ) {
      warnings.push("Oxygen saturation is outside the review range of 70–100%.");
    }

    if (
      form.weight &&
      (Number(form.weight) <= 0 || Number(form.weight) > 500)
    ) {
      warnings.push("Please review the entered weight.");
    }

    if (warnings.length && !window.confirm(warnings.join("\n") + "\n\nContinue saving?")) {
      return;
    }

    let user = {};

    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }

    const staffId = user.id || user.staff_id;

    if (!staffId) {
      setError("Your staff ID is missing. Please log out and log in again.");
      return;
    }

    const vitalParts = [
      form.blood_pressure.trim() && `BP: ${form.blood_pressure.trim()}`,
      form.temperature.trim() && `Temperature: ${form.temperature.trim()} C`,
      form.pulse_rate.trim() && `Pulse: ${form.pulse_rate.trim()} bpm`,
      form.respiratory_rate.trim() &&
        `Respiratory Rate: ${form.respiratory_rate.trim()}`,
      form.oxygen_saturation.trim() &&
        `Oxygen Saturation: ${form.oxygen_saturation.trim()}%`,
      form.weight.trim() && `Weight: ${form.weight.trim()} kg`,
    ].filter(Boolean);

    const payload = {
      student_id: Number(form.student_id),
      staff_id: Number(staffId),
      physician_name: form.physician_name.trim() || null,
      visit_type: form.visit_type,
      visit_date: form.visit_date,
      visit_time: form.visit_time,
      reason: form.reason.trim(),
      medical_history: form.medical_history.trim(),
      vital_signs: vitalParts.length
        ? vitalParts.join(", ")
        : editingVisit
          ? getVitalSigns(editingVisit) === "—"
            ? ""
            : getVitalSigns(editingVisit)
          : "",
      assessment: form.assessment.trim(),
      treatment: form.treatment.trim(),
      starter_dose: form.starter_dose.trim(),
      procedure_name: form.procedure_name.trim(),
      advice: form.advice.trim(),
      remarks: form.remarks.trim(),
      follow_up_required: form.follow_up_required ? 1 : 0,
    };

    setSaving(true);

    try {
      if (editingVisit) {
        await API.put(`/visits/${editingVisit.id}`, payload);
        setSuccess("Clinic visit updated successfully.");
      } else {
        await API.post("/visits", payload);
        setSuccess("Clinic visit recorded successfully.");
      }

      setShowForm(false);
      setEditingVisit(null);
      setForm(emptyForm());
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the clinic visit. Please check your entries and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePrintClinicSlip = () => {
    if (!selectedVisit) return;

    const escapeHtml = (value) =>
      String(value ?? "—").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]);

    const fields = [
      ["Visit ID", `#${selectedVisit.id}`],
      ["Student Name", getStudentName(selectedVisit, students)],
      ["Student Number", getStudentNumber(selectedVisit, students)],
      ["Visit Type", selectedVisit.visit_type],
      ["Visit Date", formatDate(selectedVisit.visit_date)],
      ["Visit Time", formatTime(selectedVisit.visit_time)],
      ["Physician / Attending Staff", selectedVisit.physician_name],
      ["Reason for Visit", selectedVisit.reason],
      ["Medical History", selectedVisit.medical_history],
      ["Vital Signs", getVitalSigns(selectedVisit)],
      ["Assessment / Findings", selectedVisit.assessment],
      ["Treatment", selectedVisit.treatment],
      ["Starter Dose / Medication Details", selectedVisit.starter_dose],
      ["Procedure", selectedVisit.procedure_name],
      ["Advice / Instructions", selectedVisit.advice],
      ["Remarks", selectedVisit.remarks],
      [
        "Follow-up Required",
        Number(selectedVisit.follow_up_required) === 1 ? "Yes" : "No",
      ],
    ];

    const printWindow = window.open("", "_blank", "width=850,height=900");

    if (!printWindow) {
      window.alert("Please allow pop-ups for this page to print the clinic slip.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinic Visit Slip #${escapeHtml(selectedVisit.id)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              font-family: Arial, sans-serif;
              color: #222;
              font-size: 12px;
              line-height: 1.5;
            }
            header {
              text-align: center;
              border-bottom: 2px solid #2e7d32;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            h1 { color: #2e7d32; margin: 0; font-size: 22px; }
            h2 { margin: 5px 0 0; font-size: 16px; }
            .field {
              display: grid;
              grid-template-columns: 190px 1fr;
              gap: 12px;
              padding: 8px 0;
              border-bottom: 1px solid #ddd;
              break-inside: avoid;
            }
            .label { font-weight: bold; }
            .value { white-space: pre-wrap; overflow-wrap: anywhere; }
            .signatures {
              display: flex;
              justify-content: space-between;
              gap: 40px;
              margin-top: 55px;
            }
            .signature {
              flex: 1;
              text-align: center;
              border-top: 1px solid #333;
              padding-top: 8px;
            }
            .footer {
              margin-top: 25px;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <header>
            <h1>SCHOOL CLINIC</h1>
            <h2>CLINIC VISIT SLIP</h2>
          </header>
          ${fields.map(([label, value]) => `
            <div class="field">
              <div class="label">${escapeHtml(label)}</div>
              <div class="value">${escapeHtml(value || "—")}</div>
            </div>
          `).join("")}
          <div class="signatures">
            <div class="signature">Physician / Attending Staff</div>
            <div class="signature">Signature</div>
          </div>
          <div class="footer">School Clinic Management System</div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const clearFilters = () => {
    setSearchText("");
    setFilterVisitType("");
    setFilterDate("");
  };

  return (
    <Layout>
      <div style={styles.page}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <h1 style={styles.heading}>Clinic Services</h1>
            <p style={styles.subtitle}>
              Record and view clinic visits and consultations
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={styles.secondary} onClick={loadData}>
              Refresh
            </button>
            <button style={styles.button} onClick={openNewForm}>
              + Record Clinic Visit
            </button>
          </div>
        </div>

        {error && !showForm && (
          <div
            role="alert"
            style={{
              background: "#ffebee",
              color: "#b71c1c",
              padding: 12,
              borderRadius: 6,
              marginTop: 15,
            }}
          >
            {error}
          </div>
        )}

        {success && !showForm && (
          <div
            role="status"
            style={{
              background: "#e8f5e9",
              color: "#1b5e20",
              padding: 12,
              borderRadius: 6,
              marginTop: 15,
            }}
          >
            {success}
          </div>
        )}

        {showForm && (
          <form style={styles.card} onSubmit={handleSubmit}>
            <h2>{editingVisit ? "Edit Clinic Visit" : "Record Clinic Visit"}</h2>

            {error && (
              <div
                role="alert"
                style={{
                  background: "#ffebee",
                  color: "#b71c1c",
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 15,
                }}
              >
                {error}
              </div>
            )}

            <div style={styles.grid}>
              <Field label="Student *">
                <select
                  name="student_id"
                  value={form.student_id}
                  onChange={updateField}
                  required
                  style={styles.input}
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.student_id})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Visit Type *">
                <select
                  name="visit_type"
                  value={form.visit_type}
                  onChange={updateField}
                  required
                  style={styles.input}
                >
                  {VISIT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>

              <Field label="Visit Date *">
                <input
                  type="date"
                  name="visit_date"
                  value={form.visit_date}
                  onChange={updateField}
                  required
                  style={styles.input}
                />
              </Field>

              <Field label="Visit Time *">
                <input
                  type="time"
                  name="visit_time"
                  value={form.visit_time}
                  onChange={updateField}
                  required
                  style={styles.input}
                />
              </Field>

              <Field label="Physician / Attending Staff">
                <input
                  name="physician_name"
                  value={form.physician_name}
                  onChange={updateField}
                  style={styles.input}
                  placeholder="Enter physician name"
                />
              </Field>

              <Field label="Reason for Visit *">
                <input
                  name="reason"
                  value={form.reason}
                  onChange={updateField}
                  required
                  style={styles.input}
                  placeholder="Reason for the visit"
                />
              </Field>
            </div>

            {selectedStudent && (
              <div
                style={{
                  background: "#f1f8e9",
                  padding: 14,
                  borderRadius: 6,
                  marginTop: 18,
                }}
              >
                <strong>Selected Student</strong>
                <p style={{ marginBottom: 0 }}>
                  {selectedStudent.full_name} — {selectedStudent.student_id}
                </p>
                <p style={{ marginBottom: 0 }}>
                  Course: {selectedStudent.course || "—"} | Age: {selectedStudent.age ?? "—"}
                </p>
              </div>
            )}

            {form.visit_type.includes("Follow-up") && form.student_id && (
              <div style={{ marginTop: 18 }}>
                <h3>Previous Clinic Visits</h3>
                {studentHistory.length === 0 ? (
                  <p>No previous visits found for this student.</p>
                ) : (
                  <ul>
                    {studentHistory.map((visit) => (
                      <li key={visit.id}>
                        #{visit.id} — {visit.visit_type} —{" "}
                        {formatDate(visit.visit_date)} — {visit.reason || "No reason recorded"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <h3 style={{ marginTop: 24 }}>Medical Information</h3>

            <div style={{ ...styles.grid, marginTop: 15 }}>
              <Field label="Medical History">
                <textarea
                  name="medical_history"
                  value={form.medical_history}
                  onChange={updateField}
                  style={styles.textarea}
                />
              </Field>
              <Field label="Vital Signs — Blood Pressure">
                <input
                  name="blood_pressure"
                  value={form.blood_pressure}
                  onChange={updateField}
                  placeholder="e.g. 120/80"
                  style={styles.input}
                />
              </Field>
              <Field label="Temperature (°C)">
                <input
                  type="number"
                  step="any"
                  name="temperature"
                  value={form.temperature}
                  onChange={updateField}
                  style={styles.input}
                />
              </Field>
              <Field label="Pulse Rate (bpm)">
                <input
                  type="number"
                  step="any"
                  name="pulse_rate"
                  value={form.pulse_rate}
                  onChange={updateField}
                  style={styles.input}
                />
              </Field>
              <Field label="Respiratory Rate">
                <input
                  type="number"
                  step="any"
                  name="respiratory_rate"
                  value={form.respiratory_rate}
                  onChange={updateField}
                  style={styles.input}
                />
              </Field>
              <Field label="Oxygen Saturation (%)">
                <input
                  type="number"
                  step="any"
                  name="oxygen_saturation"
                  value={form.oxygen_saturation}
                  onChange={updateField}
                  style={styles.input}
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  type="number"
                  step="any"
                  name="weight"
                  value={form.weight}
                  onChange={updateField}
                  style={styles.input}
                />
              </Field>
            </div>

            <h3 style={{ marginTop: 24 }}>Treatment and Instructions</h3>

            <div style={{ ...styles.grid, marginTop: 15 }}>
              <Field label="Assessment / Findings">
                <textarea
                  name="assessment"
                  value={form.assessment}
                  onChange={updateField}
                  style={styles.textarea}
                />
              </Field>
              <Field label="Treatment">
                <textarea
                  name="treatment"
                  value={form.treatment}
                  onChange={updateField}
                  style={styles.textarea}
                />
              </Field>
              <Field label="Starter Dose / Medication Details">
                <textarea
                  name="starter_dose"
                  value={form.starter_dose}
                  onChange={updateField}
                  style={styles.textarea}
                />
              </Field>
              <Field label="Procedure">
                <textarea
                  name="procedure_name"
                  value={form.procedure_name}
                  onChange={updateField}
                  style={styles.textarea}
                />
              </Field>
              <Field label="Advice / Instructions">
                <textarea
                  name="advice"
                  value={form.advice}
                  onChange={updateField}
                  style={styles.textarea}
                />
              </Field>
              <Field label="Remarks">
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={updateField}
                  style={styles.textarea}
                />
              </Field>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginTop: 18,
              }}
            >
              <input
                type="checkbox"
                name="follow_up_required"
                checked={form.follow_up_required}
                onChange={updateField}
              />
              Follow-up required
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button type="submit" style={styles.button} disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingVisit
                    ? "Update Clinic Visit"
                    : "Save Clinic Visit"}
              </button>
              <button type="button" style={styles.secondary} onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <section style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 5 }}>Recorded Clinic Visits</h2>
              <span style={{ color: "#607d8b", fontSize: 13 }}>
                {filteredVisits.length} visit(s) displayed
              </span>
            </div>
            <button style={styles.secondary} onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <div style={{ ...styles.grid, marginTop: 18 }}>
            <Field label="Search Visits">
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search student, number, reason..."
                style={styles.input}
              />
            </Field>

            <Field label="Filter by Visit Type">
              <select
                value={filterVisitType}
                onChange={(event) => setFilterVisitType(event.target.value)}
                style={styles.input}
              >
                <option value="">All Visit Types</option>
                {VISIT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </Field>

            <Field label="Filter by Visit Date">
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                style={styles.input}
              />
            </Field>
          </div>

          {loading ? (
            <p>Loading clinic visits...</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      "Visit ID",
                      "Student",
                      "Student Number",
                      "Visit Type",
                      "Date",
                      "Time",
                      "Reason",
                      "Follow-up",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} style={styles.th}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id}>
                      <td style={styles.td}>#{visit.id}</td>
                      <td style={styles.td}>{getStudentName(visit, students)}</td>
                      <td style={styles.td}>{getStudentNumber(visit, students)}</td>
                      <td style={styles.td}>{visit.visit_type}</td>
                      <td style={styles.td}>{formatDate(visit.visit_date)}</td>
                      <td style={styles.td}>{formatTime(visit.visit_time)}</td>
                      <td style={styles.td}>{displayValue(visit.reason)}</td>
                      <td style={styles.td}>
                        {Number(visit.follow_up_required) === 1 ? "Yes" : "No"}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            style={styles.secondary}
                            onClick={() => setSelectedVisit(visit)}
                          >
                            View Details
                          </button>
                          <button
                            style={styles.button}
                            onClick={() => startEditingVisit(visit)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredVisits.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ ...styles.td, textAlign: "center" }}>
                        No clinic visits match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedVisit && (
          <div style={styles.overlay} onClick={() => setSelectedVisit(null)}>
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="visit-details-title"
              style={styles.modal}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <h2 id="visit-details-title" style={{ marginTop: 0 }}>
                  Clinic Visit Details #{selectedVisit.id}
                </h2>
                <button
                  style={styles.secondary}
                  onClick={() => setSelectedVisit(null)}
                >
                  Close
                </button>
              </div>

              <div style={styles.grid}>
                <Detail
                  label="Student Name"
                  value={getStudentName(selectedVisit, students)}
                />
                <Detail
                  label="Student Number"
                  value={getStudentNumber(selectedVisit, students)}
                />
                <Detail label="Visit Type" value={selectedVisit.visit_type} />
                <Detail label="Visit Date" value={formatDate(selectedVisit.visit_date)} />
                <Detail label="Visit Time" value={formatTime(selectedVisit.visit_time)} />
                <Detail
                  label="Physician / Attending Staff"
                  value={selectedVisit.physician_name}
                />
                <Detail label="Reason for Visit" value={selectedVisit.reason} />
                <Detail label="Medical History" value={selectedVisit.medical_history} />
                <Detail label="Vital Signs" value={getVitalSigns(selectedVisit)} />
                <Detail label="Assessment / Findings" value={selectedVisit.assessment} />
                <Detail label="Treatment" value={selectedVisit.treatment} />
                <Detail
                  label="Starter Dose / Medication Details"
                  value={selectedVisit.starter_dose}
                />
                <Detail label="Procedure" value={selectedVisit.procedure_name} />
                <Detail label="Advice / Instructions" value={selectedVisit.advice} />
                <Detail label="Remarks" value={selectedVisit.remarks} />
                <Detail
                  label="Follow-up Required"
                  value={Number(selectedVisit.follow_up_required) === 1 ? "Yes" : "No"}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 24,
                }}
              >
                <button style={styles.button} onClick={handlePrintClinicSlip}>
                  Print Clinic Slip
                </button>
                <button
                  style={styles.secondary}
                  onClick={() => startEditingVisit(selectedVisit)}
                >
                  Edit This Visit
                </button>
                <button
                  style={styles.secondary}
                  onClick={() => setSelectedVisit(null)}
                >
                  Close Details
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
