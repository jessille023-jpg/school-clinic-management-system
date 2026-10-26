import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Students.css";

const emptyForm = {
    student_id: "",
    full_name: "",
    course: "",
    age: "",
    gender: "",
    contact_number: ""
};

function Students() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [archivingId, setArchivingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const isEditing = editingId !== null;

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/students");
            const data = response.data;

            setStudents(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.students)
                        ? data.students
                        : []
            );
        } catch (err) {
            console.error("Failed to load students:", err);
            setError(
                err.response?.data?.message ||
                "Failed to retrieve students. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const filteredStudents = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return students.filter(student =>
            [
                student.student_id,
                student.full_name,
                student.course,
                student.gender,
                student.contact_number
            ].some(value =>
                String(value ?? "").toLowerCase().includes(keyword)
            )
        );
    }, [students, search]);

    const openAddForm = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
        setMessage("");
        setError("");
        setShowForm(true);

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Opens the form and fills it with the selected student's information.
    const openEditForm = (student) => {
        const id = student.id ?? student.student_db_id;

        if (id == null) {
            console.error("Student record has no database ID:", student);
            setError(
                "Cannot edit this student because the database ID is missing. Check the GET /api/students response."
            );
            return;
        }

        setEditingId(id);

        setForm({
            student_id: student.student_id ?? "",
            full_name: student.full_name ?? "",
            course: student.course ?? "",
            age: student.age == null ? "" : String(student.age),
            gender: student.gender ?? "",
            contact_number: student.contact_number ?? ""
        });

        setMessage("");
        setError("");
        setShowForm(true);

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm({ ...emptyForm });
        setError("");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) return;

        setSaving(true);
        setMessage("");
        setError("");

        const payload = {
            student_id: form.student_id.trim(),
            full_name: form.full_name.trim(),
            course: form.course.trim(),
            age: form.age === "" ? null : Number(form.age),
            gender: form.gender || null,
            contact_number: form.contact_number.trim() || null
        };

        if (
            !payload.student_id ||
            !payload.full_name ||
            !payload.course
        ) {
            setError("Student ID, Full Name, and Course are required.");
            setSaving(false);
            return;
        }

        if (
            payload.age !== null &&
            (!Number.isInteger(payload.age) || payload.age < 1)
        ) {
            setError("Please enter a valid age.");
            setSaving(false);
            return;
        }

        const wasEditing = isEditing;
        const currentEditingId = editingId;

        try {
            if (wasEditing) {
                await API.put(
                    `/students/${currentEditingId}`,
                    payload
                );
            } else {
                await API.post("/students", payload);
            }

            setMessage(
                wasEditing
                    ? "Student updated successfully!"
                    : "Student created successfully!"
            );

            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });

            await fetchStudents();
        } catch (err) {
            console.error("Failed to save student:", err);

            setError(
                err.response?.data?.message ||
                `Failed to ${wasEditing ? "update" : "create"} student. Please try again.`
            );
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (student) => {
        const confirmed = window.confirm(
            `Are you sure you want to archive ${student.full_name}?`
        );

        if (!confirmed) return;

        setMessage("");
        setError("");
        setArchivingId(student.id);

        try {
            await API.patch(`/students/${student.id}/archive`);

            setMessage(
                `${student.full_name} has been archived successfully.`
            );

            await fetchStudents();
        } catch (err) {
            console.error("Failed to archive student:", err);

            setError(
                err.response?.data?.message ||
                "Failed to archive student. Please try again."
            );
        } finally {
            setArchivingId(null);
        }
    };

    return (
        <Layout>
            <main className="students-page">
                <header className="students-header">
                    <div>
                        <span className="students-eyebrow">
                            UNIVERSITY OF ILOILO · PHINMA
                        </span>
                        <h1>Student Records</h1>
                        <p>
                            View, search, and manage student information.
                        </p>
                    </div>

                    <div className="students-header-actions">
                        <button
                            className="students-btn students-btn-primary"
                            type="button"
                            onClick={openAddForm}
                        >
                            <span>＋</span> Add Student
                        </button>

                        <button
                            className="students-btn students-btn-secondary"
                            type="button"
                            onClick={fetchStudents}
                            disabled={loading}
                        >
                            <span>↻</span>
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </header>

                {message && (
                    <div className="students-alert success" role="status">
                        <span>✓</span>
                        <p>{message}</p>
                        <button
                            type="button"
                            onClick={() => setMessage("")}
                            aria-label="Dismiss message"
                        >
                            ×
                        </button>
                    </div>
                )}

                {error && (
                    <div className="students-alert error" role="alert">
                        <span>!</span>
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="students-summary-grid">
                    <article className="students-summary-card">
                        <div>
                            <p>Active Students</p>
                            <strong>{students.length}</strong>
                            <span>Currently active records</span>
                        </div>
                        <div className="students-summary-icon green">♙</div>
                    </article>

                    <article className="students-summary-card">
                        <div>
                            <p>Search Results</p>
                            <strong>{filteredStudents.length}</strong>
                            <span>
                                {search.trim()
                                    ? "Matching your search"
                                    : "All active students"}
                            </span>
                        </div>
                        <div className="students-summary-icon blue">⌕</div>
                    </article>
                </section>

                {showForm && (
                    <section
                        className="students-panel students-form-panel"
                        id="student-form"
                    >
                        <div className="students-panel-heading">
                            <div>
                                <h2>
                                    {isEditing
                                        ? "Edit Student"
                                        : "Add New Student"}
                                </h2>
                                <p>Fields marked with * are required.</p>
                            </div>

                            <button
                                className="students-close-btn"
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                aria-label="Close form"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="students-form-grid">
                                <div className="students-field">
                                    <label htmlFor="student_id">
                                        Student ID *
                                    </label>
                                    <input
                                        id="student_id"
                                        name="student_id"
                                        value={form.student_id}
                                        onChange={handleChange}
                                        placeholder="e.g. 2026-00123"
                                        required
                                    />
                                </div>

                                <div className="students-field">
                                    <label htmlFor="full_name">
                                        Full Name *
                                    </label>
                                    <input
                                        id="full_name"
                                        name="full_name"
                                        value={form.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div className="students-field">
                                    <label htmlFor="course">Course *</label>
                                    <input
                                        id="course"
                                        name="course"
                                        value={form.course}
                                        onChange={handleChange}
                                        placeholder="Enter course"
                                        required
                                    />
                                </div>

                                <div className="students-field">
                                    <label htmlFor="age">Age</label>
                                    <input
                                        id="age"
                                        name="age"
                                        type="number"
                                        min="1"
                                        value={form.age}
                                        onChange={handleChange}
                                        placeholder="Enter age"
                                    />
                                </div>

                                <div className="students-field">
                                    <label htmlFor="gender">Gender</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                    </select>
                                </div>

                                <div className="students-field">
                                    <label htmlFor="contact_number">
                                        Contact Number
                                    </label>
                                    <input
                                        id="contact_number"
                                        name="contact_number"
                                        type="tel"
                                        value={form.contact_number}
                                        onChange={handleChange}
                                        placeholder="Enter contact number"
                                    />
                                </div>
                            </div>

                            <div className="students-form-actions">
                                <button
                                    type="submit"
                                    className="students-btn students-btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : isEditing
                                            ? "Save Changes"
                                            : "Save Student"}
                                </button>

                                <button
                                    type="button"
                                    className="students-btn students-btn-secondary"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="students-panel">
                    <div className="students-panel-heading records-heading">
                        <div>
                            <h2>All Student Records</h2>
                            <p>
                                Manage your registered student information.
                            </p>
                        </div>

                        <label className="students-search">
                            <span>⌕</span>
                            <input
                                type="search"
                                placeholder="Search name, ID, course..."
                                aria-label="Search students"
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="students-table-wrapper">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Student ID</th>
                                    <th>Course</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Contact Number</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id ?? student.student_id}>
                                        <td>
                                            <div className="students-name-cell">
                                                <span className="students-avatar">
                                                    {(student.full_name || "?")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                                <strong>{student.full_name}</strong>
                                            </div>
                                        </td>

                                        <td className="students-id-cell">
                                            {student.student_id}
                                        </td>
                                        <td>{student.course}</td>
                                        <td>{student.age ?? "—"}</td>
                                        <td>{student.gender || "—"}</td>
                                        <td>{student.contact_number || "—"}</td>
                                        <td>
                                            <span className="students-status">
                                                {student.status || "Active"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="students-row-actions">
                                                <button
                                                    type="button"
                                                    className="students-action-edit"
                                                    onClick={() => openEditForm(student)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="students-action-archive"
                                                    disabled={
                                                        archivingId === student.id
                                                    }
                                                    onClick={() => handleArchive(student)}
                                                >
                                                    {archivingId === student.id
                                                        ? "Archiving..."
                                                        : "Archive"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {!loading && filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="students-empty">
                                                <span>⌕</span>
                                                <strong>No students found</strong>
                                                <p>
                                                    Try another search or add a
                                                    new student record.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {loading && students.length === 0 && (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="students-empty">
                                                Loading student records...
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <footer className="students-table-footer">
                        Showing <strong>{filteredStudents.length}</strong> of{" "}
                        <strong>{students.length}</strong> active students
                    </footer>
                </section>
            </main>
        </Layout>
    );
}

export default Students;