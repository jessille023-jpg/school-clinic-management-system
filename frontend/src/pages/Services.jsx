
import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Services.css";

const VISIT_TYPES = [
  "A1 - Medical Consultation",
  "A2 - Medical Follow-up",
  "A3 - Dental Consultation",
  "A4 - Dental Follow-up",
  "A5 - Physical Examination",
];

const emptyForm = {
  student_id: "",
  visit_type: VISIT_TYPES[0],
  visit_date: new Date().toLocaleDateString("en-CA"),
  visit_time: "",
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
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "—";
  const time = String(value).slice(0, 5);
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function displayValue(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

function getVitalSigns(visit) {
  if (visit.vital_signs) return visit.vital_signs;

  return [
    visit.blood_pressure && `BP: ${visit.blood_pressure}`,
    visit.temperature && `Temp: ${visit.temperature} °C`,
    visit.pulse_rate && `Pulse: ${visit.pulse_rate} bpm`,
    visit.respiratory_rate && `RR: ${visit.respiratory_rate}/min`,
    visit.oxygen_saturation && `SpO₂: ${visit.oxygen_saturation}%`,
    visit.weight && `Weight: ${visit.weight} kg`,
  ]
    .filter(Boolean)
    .join(" • ") || "—";
}

export default function Services() {
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingVisit, setEditingVisit] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [visitsResponse, studentsResponse] = await Promise.all([
        API.get("/visits"),
        API.get("/students"),
      ]);

      setVisits(
        Array.isArray(visitsResponse.data)
          ? visitsResponse.data
          : visitsResponse.data?.visits || []
      );

      setStudents(
        Array.isArray(studentsResponse.data)
          ? studentsResponse.data
          : studentsResponse.data?.students || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load clinic visits or student records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStudent = (studentId) =>
    students.find(
      (student) =>
        String(student.id) === String(studentId) ||
        String(student.student_id) === String(studentId)
    );

  const getStudentName = (visit) => {
    const student =
      getStudent(visit.student_id) ||
      students.find(
        (item) => String(item.id) === String(visit.student_id)
      );

    return (
      visit.student_name ||
      visit.full_name ||
      student?.full_name ||
      student?.name ||
      "Unknown student"
    );
  };

  const getStudentNumber = (visit) => {
    const student = getStudent(visit.student_id);

    return (
      visit.student_number ||
      student?.student_id ||
      visit.student_code ||
      "—"
    );
  };

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const studentName = getStudentName(visit).toLowerCase();
      const studentNumber = getStudentNumber(visit).toLowerCase();
      const reason = String(visit.reason || "").toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        studentNumber.includes(query) ||
        reason.includes(query) ||
        String(visit.visit_type || "").toLowerCase().includes(query);

      const matchesType =
        filterType === "all" || visit.visit_type === filterType;

      const visitDate = visit.visit_date
        ? String(visit.visit_date).slice(0, 10)
        : "";

      const matchesDate = !filterDate || visitDate === filterDate;

      return matchesSearch && matchesType && matchesDate;
    });
  }, [visits, students, search, filterType, filterDate]);

  const openNewForm = () => {
    setEditingVisit(null);
    setForm({
      ...emptyForm,
      visit_date: new Date().toLocaleDateString("en-CA"),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (visit) => {
    setEditingVisit(visit);

    const dateValue = visit.visit_date
      ? String(visit.visit_date).slice(0, 10)
      : emptyForm.visit_date;

    setForm({
      ...emptyForm,
      ...visit,
      student_id: String(visit.student_id || ""),
      visit_date: dateValue,
      visit_time: visit.visit_time
        ? String(visit.visit_time).slice(0, 5)
        : "",
      follow_up_required:
        Boolean(visit.follow_up_required) ||
        visit.follow_up_required === 1 ||
        visit.follow_up_required === "1",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.student_id) {
      setError("Please select a student.");
      return;
    }

    if (!form.visit_date || !form.visit_time) {
      setError("Please provide the visit date and time.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please enter the reason for the visit.");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    const vitalSigns = [
      form.blood_pressure && `BP: ${form.blood_pressure}`,
      form.temperature && `Temp: ${form.temperature} °C`,
      form.pulse_rate && `Pulse: ${form.pulse_rate} bpm`,
      form.respiratory_rate && `RR: ${form.respiratory_rate}/min`,
      form.oxygen_saturation && `SpO₂: ${form.oxygen_saturation}%`,
      form.weight && `Weight: ${form.weight} kg`,
    ]
      .filter(Boolean)
      .join(", ");

    const payload = {
      student_id: Number(form.student_id),
      staff_id: Number(storedUser.id || storedUser.staff_id || 1),
      physician_name: form.physician_name,
      visit_type: form.visit_type,
      visit_date: form.visit_date,
      visit_time: form.visit_time,
      reason: form.reason.trim(),
      medical_history: form.medical_history,
      vital_signs: vitalSigns,
      assessment: form.assessment,
      treatment: form.treatment,
      starter_dose: form.starter_dose,
      procedure_name: form.procedure_name,
      advice: form.advice,
      remarks: form.remarks,
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
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the clinic visit. Please check your API and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePrintClinicSlip = (visit) => {
    const printWindow = window.open("", "_blank", "width=850,height=700");

    if (!printWindow) {
      setError("Please allow pop-ups to print the clinic slip.");
      return;
    }

    const studentName = getStudentName(visit);
    const studentNumber = getStudentNumber(visit);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Clinic Visit Slip</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #222; }
          h1, h2, p { margin-top: 0; }
          h1 { text-align: center; color: #2e7d32; }
          .subtitle { text-align: center; margin-bottom: 28px; }
          .section { margin: 18px 0; padding: 14px; border: 1px solid #ddd; }
          .label { font-weight: bold; }
          .line { margin: 10px 0; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>UNIVERSITY OF ILOILO · PHINMA</h1>
        <p class="subtitle">School Clinic — Clinic Visit Slip</p>
        <div class="section">
          <h2>Student Information</h2>
          <p><span class="label">Name:</span> ${escapeHtml(studentName)}</p>
          <p><span class="label">Student Number:</span> ${escapeHtml(studentNumber)}</p>
        </div>
        <div class="section">
          <h2>Visit Information</h2>
          <p><span class="label">Visit Type:</span> ${escapeHtml(visit.visit_type)}</p>
          <p><span class="label">Date:</span> ${escapeHtml(formatDate(visit.visit_date))}</p>
          <p><span class="label">Time:</span> ${escapeHtml(formatTime(visit.visit_time))}</p>
          <p><span class="label">Reason:</span> ${escapeHtml(visit.reason)}</p>
          <p><span class="label">Vital Signs:</span> ${escapeHtml(getVitalSigns(visit))}</p>
          <p><span class="label">Medical History:</span> ${escapeHtml(visit.medical_history)}</p>
          <p><span class="label">Assessment:</span> ${escapeHtml(visit.assessment)}</p>
          <p><span class="label">Treatment:</span> ${escapeHtml(visit.treatment)}</p>
          <p><span class="label">Procedure:</span> ${escapeHtml(visit.procedure_name)}</p>
          <p><span class="label">Advice:</span> ${escapeHtml(visit.advice)}</p>
          <p><span class="label">Remarks:</span> ${escapeHtml(visit.remarks)}</p>
        </div>
        <div class="line">Clinic Staff Signature: __________________________</div>
        <button onclick="window.print()">Print Clinic Slip</button>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const renderField = (
    label,
    name,
    { type = "text", required = false, placeholder = "", step } = {}
  ) => (
    <label className="services-field" key={name}>
      <span>
        {label}
        {required && <span className="services-required"> *</span>}
      </span>
      <input
        type={type}
        name={name}
        value={form[name] ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        step={step}
      />
    </label>
  );

  const selectedStudent = getStudent(form.student_id);

  return (
    <Layout>
      <main className="services-page">
        <header className="services-header">
          <div>
            <span className="services-eyebrow">
              UNIVERSITY OF ILOILO · PHINMA
            </span>
            <h1>Clinic Services</h1>
            <p>Record and view clinic visits and consultations.</p>
          </div>

          <div className="services-header-actions">
            <button
              type="button"
              className="services-btn services-btn-secondary"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button
              type="button"
              className="services-btn services-btn-primary"
              onClick={openNewForm}
            >
              + Record Clinic Visit
            </button>
          </div>
        </header>

        {error && (
          <div className="services-alert error" role="alert">
            {error}
            <button type="button" onClick={() => setError("")}>×</button>
          </div>
        )}

        {success && (
          <div className="services-alert success" role="status">
            {success}
            <button type="button" onClick={() => setSuccess("")}>×</button>
          </div>
        )}

        <section className="services-summary-grid">
          <article className="services-summary-card">
            <div className="services-summary-icon green">✚</div>
            <div>
              <span>Total Visits</span>
              <strong>{visits.length}</strong>
            </div>
          </article>

          <article className="services-summary-card">
            <div className="services-summary-icon blue">▣</div>
            <div>
              <span>Students Registered</span>
              <strong>{students.length}</strong>
            </div>
          </article>

          <article className="services-summary-card">
            <div className="services-summary-icon orange">◷</div>
            <div>
              <span>Today's Visits</span>
              <strong>
                {
                  visits.filter(
                    (visit) =>
                      String(visit.visit_date || "").slice(0, 10) ===
                      new Date().toLocaleDateString("en-CA")
                  ).length
                }
              </strong>
            </div>
          </article>
        </section>

        {showForm && (
          <section className="services-panel" id="visit-form">
            <div className="services-panel-heading">
              <div>
                <h2>{editingVisit ? "Edit Clinic Visit" : "Record Clinic Visit"}</h2>
                <p>Enter the student and consultation details below.</p>
              </div>
              <button
                type="button"
                className="services-btn services-btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingVisit(null);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <h3 className="services-form-section-title">Student and Visit Details</h3>

              <div className="services-form-grid">
                <label className="services-field">
                  <span>Student <span className="services-required">*</span></span>
                  <select
                    name="student_id"
                    value={form.student_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name || student.name} — {student.student_id}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="services-field">
                  <span>Visit Type <span className="services-required">*</span></span>
                  <select
                    name="visit_type"
                    value={form.visit_type}
                    onChange={handleChange}
                    required
                  >
                    {VISIT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                {renderField("Visit Date", "visit_date", {
                  type: "date",
                  required: true,
                })}
                {renderField("Visit Time", "visit_time", {
                  type: "time",
                  required: true,
                })}
                {renderField("Physician / Clinic Staff", "physician_name", {
                  placeholder: "Enter name",
                })}
              </div>

              {selectedStudent && (
                <div className="services-student-preview">
                  <strong>{selectedStudent.full_name || selectedStudent.name}</strong>
                  <span>Student No.: {selectedStudent.student_id}</span>
                  <span>{selectedStudent.course || "Course not specified"}</span>
                </div>
              )}

              <h3 className="services-form-section-title">Consultation Details</h3>
              <div className="services-form-grid">
                <label className="services-field services-field-wide">
                  <span>Reason for Visit <span className="services-required">*</span></span>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the reason for the visit"
                    required
                  />
                </label>

                <label className="services-field services-field-wide">
                  <span>Medical History</span>
                  <textarea
                    name="medical_history"
                    value={form.medical_history}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Relevant medical history, allergies, or existing conditions"
                  />
                </label>
              </div>

              <h3 className="services-form-section-title">Vital Signs</h3>
              <div className="services-form-grid">
                {renderField("Blood Pressure", "blood_pressure", {
                  placeholder: "e.g. 120/80",
                })}
                {renderField("Temperature (°C)", "temperature", {
                  type: "number",
                  step: "0.1",
                  placeholder: "e.g. 36.5",
                })}
                {renderField("Pulse Rate (bpm)", "pulse_rate", {
                  type: "number",
                  placeholder: "e.g. 72",
                })}
                {renderField("Respiratory Rate (/min)", "respiratory_rate", {
                  type: "number",
                  placeholder: "e.g. 18",
                })}
                {renderField("Oxygen Saturation (%)", "oxygen_saturation", {
                  type: "number",
                  step: "0.1",
                  placeholder: "e.g. 98",
                })}
                {renderField("Weight (kg)", "weight", {
                  type: "number",
                  step: "0.1",
                  placeholder: "e.g. 55.0",
                })}
              </div>

              <h3 className="services-form-section-title">Assessment and Treatment</h3>
              <div className="services-form-grid">
                <label className="services-field">
                  <span>Assessment / Findings</span>
                  <textarea
                    name="assessment"
                    value={form.assessment}
                    onChange={handleChange}
                    rows="3"
                  />
                </label>

                <label className="services-field">
                  <span>Treatment</span>
                  <textarea
                    name="treatment"
                    value={form.treatment}
                    onChange={handleChange}
                    rows="3"
                  />
                </label>

                {renderField("Starter Dose / Medication", "starter_dose", {
                  placeholder: "If applicable",
                })}
                {renderField("Procedure", "procedure_name", {
                  placeholder: "If applicable",
                })}

                <label className="services-field services-field-wide">
                  <span>Advice / Instructions</span>
                  <textarea
                    name="advice"
                    value={form.advice}
                    onChange={handleChange}
                    rows="2"
                  />
                </label>

                <label className="services-field services-field-wide">
                  <span>Remarks</span>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    rows="2"
                  />
                </label>
              </div>

              <label className="services-checkbox">
                <input
                  type="checkbox"
                  name="follow_up_required"
                  checked={form.follow_up_required}
                  onChange={handleChange}
                />
                <span>Follow-up visit required</span>
              </label>

              <div className="services-form-actions">
                <button
                  type="button"
                  className="services-btn services-btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVisit(null);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="services-btn services-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingVisit
                    ? "Update Clinic Visit"
                    : "Save Clinic Visit"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="services-panel">
          <div className="services-panel-heading">
            <div>
              <h2>Clinic Visit Records</h2>
              <p>Search and manage recorded consultations.</p>
            </div>
            <span className="services-count">{filteredVisits.length} records</span>
          </div>

          <div className="services-filter-grid">
            <label className="services-field">
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student, student number, reason..."
              />
            </label>

            <label className="services-field">
              <span>Visit Type</span>
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
              >
                <option value="all">All visit types</option>
                {VISIT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="services-field">
              <span>Visit Date</span>
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="services-btn services-btn-secondary services-filter-clear"
              onClick={() => {
                setSearch("");
                setFilterType("all");
                setFilterDate("");
              }}
            >
              Clear Filters
            </button>
          </div>

          <div className="services-table-wrapper">
            <table className="services-table">
              <thead>
                <tr>
                  <th>Visit ID</th>
                  <th>Student</th>
                  <th>Visit Type</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td>
                      <span className="services-visit-id">
                        #{visit.id}
                      </span>
                    </td>
                    <td>
                      <div className="services-student-name">
                        {getStudentName(visit)}
                      </div>
                      <div className="services-muted">
                        {getStudentNumber(visit)}
                      </div>
                    </td>
                    <td>
                      <span className="services-visit-type">
                        {visit.visit_type}
                      </span>
                    </td>
                    <td>
                      <div>{formatDate(visit.visit_date)}</div>
                      <div className="services-muted">
                        {formatTime(visit.visit_time)}
                      </div>
                    </td>
                    <td>
                      <span className="services-reason">
                        {displayValue(visit.reason)}
                      </span>
                    </td>
                    <td>
                      {Boolean(visit.follow_up_required) ||
                      visit.follow_up_required === 1 ||
                      visit.follow_up_required === "1" ? (
                        <span className="services-follow-up yes">Required</span>
                      ) : (
                        <span className="services-follow-up no">Not required</span>
                      )}
                    </td>
                    <td>
                      <div className="services-row-actions">
                        <button
                          type="button"
                          className="services-action-btn"
                          onClick={() => setSelectedVisit(visit)}
                          title="View details"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="services-action-btn"
                          onClick={() => openEditForm(visit)}
                          title="Edit visit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="services-action-btn"
                          onClick={() => handlePrintClinicSlip(visit)}
                          title="Print clinic slip"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredVisits.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="services-empty">
                        <strong>No clinic visits found</strong>
                        <span>Try changing your search or filters.</span>
                      </div>
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="7">
                      <div className="services-empty">Loading clinic visits...</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedVisit && (
          <div
            className="services-modal-overlay"
            onClick={() => setSelectedVisit(null)}
          >
            <section
              className="services-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="visit-details-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="services-modal-header">
                <div>
                  <span className="services-eyebrow">CLINIC RECORD</span>
                  <h2 id="visit-details-title">Visit #{selectedVisit.id} Details</h2>
                </div>
                <button
                  type="button"
                  className="services-modal-close"
                  onClick={() => setSelectedVisit(null)}
                  aria-label="Close visit details"
                >
                  ×
                </button>
              </div>

              <div className="services-details-grid">
                <Detail label="Student" value={getStudentName(selectedVisit)} />
                <Detail label="Student Number" value={getStudentNumber(selectedVisit)} />
                <Detail label="Visit Type" value={selectedVisit.visit_type} />
                <Detail label="Date" value={formatDate(selectedVisit.visit_date)} />
                <Detail label="Time" value={formatTime(selectedVisit.visit_time)} />
                <Detail label="Physician / Staff" value={selectedVisit.physician_name} />
                <Detail label="Reason" value={selectedVisit.reason} />
                <Detail label="Medical History" value={selectedVisit.medical_history} />
                <Detail label="Vital Signs" value={getVitalSigns(selectedVisit)} />
                <Detail label="Assessment" value={selectedVisit.assessment} />
                <Detail label="Treatment" value={selectedVisit.treatment} />
                <Detail label="Medication / Starter Dose" value={selectedVisit.starter_dose} />
                <Detail label="Procedure" value={selectedVisit.procedure_name} />
                <Detail label="Advice / Instructions" value={selectedVisit.advice} />
                <Detail label="Remarks" value={selectedVisit.remarks} />
                <Detail
                  label="Follow-up"
                  value={
                    Boolean(selectedVisit.follow_up_required) ||
                    selectedVisit.follow_up_required === 1 ||
                    selectedVisit.follow_up_required === "1"
                      ? "Required"
                      : "Not required"
                  }
                />
              </div>

              <div className="services-modal-actions">
                <button
                  type="button"
                  className="services-btn services-btn-secondary"
                  onClick={() => setSelectedVisit(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="services-btn services-btn-primary"
                  onClick={() => {
                    const visit = selectedVisit;
                    setSelectedVisit(null);
                    openEditForm(visit);
                  }}
                >
                  Edit Visit
                </button>
                <button
                  type="button"
                  className="services-btn services-btn-secondary"
                  onClick={() => handlePrintClinicSlip(selectedVisit)}
                >
                  Print Slip
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </Layout>
  );
}

function Detail({ label, value }) {
  return (
    <div className="services-detail">
      <span className="services-detail-label">{label}</span>
      <span className="services-detail-value">{displayValue(value)}</span>
    </div>
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
