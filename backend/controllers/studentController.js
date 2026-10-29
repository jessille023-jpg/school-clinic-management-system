const db = require("../config/db");

// GET: Retrieve active students
exports.getAllStudents = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM students WHERE status = ? ORDER BY id DESC',
            ["Active"]
        );

        res.json(rows);
    } catch (error) {
        console.error("Error fetching students:", error.message);
        res.status(500).json({
            message: "Error fetching students"
        });
    }
};

// GET: Retrieve one student by school student ID
exports.getStudentById = async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM students WHERE student_id = ?",
            [req.params.studentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching student:", error.message);
        res.status(500).json({
            message: "Error fetching student"
        });
    }
};

// POST: Create a student
exports.createStudent = async (req, res) => {
    try {
        const {
            student_id,
            full_name,
            course,
            age,
            gender,
            contact_number
        } = req.body;

        if (
            !student_id || !student_id.trim() ||
            !full_name || !full_name.trim() ||
            !course || !course.trim() ||
            age === undefined || age === null || age === "" ||
            !gender || !gender.trim() ||
            !contact_number || !contact_number.trim()
        ) {
            return res.status(400).json({
                message: "All student fields are required"
            });
        }

        const parsedAge = Number(age);

        if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
            return res.status(400).json({
                message: "Age must be a valid number between 1 and 120"
            });
        }

        const [existing] = await db.execute(
            "SELECT id FROM students WHERE student_id = ?",
            [student_id.trim()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Student ID already exists"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO students
            (student_id, full_name, course, age, gender, contact_number)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                student_id.trim(),
                full_name.trim(),
                course.trim(),
                parsedAge,
                gender.trim(),
                contact_number.trim()
            ]
        );

        res.status(201).json({
            message: "Student created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error("Error creating student:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Student ID already exists"
            });
        }

        res.status(500).json({
            message: "Error creating student"
        });
    }
};

// PUT: Update an existing student by database ID
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            full_name,
            course,
            age,
            gender,
            contact_number
        } = req.body;

        if (
            !full_name || !full_name.trim() ||
            !course || !course.trim() ||
            age === undefined || age === null || age === "" ||
            !gender || !gender.trim() ||
            !contact_number || !contact_number.trim()
        ) {
            return res.status(400).json({
                message: "All student fields are required"
            });
        }

        const parsedAge = Number(age);

        if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
            return res.status(400).json({
                message: "Age must be a valid number between 1 and 120"
            });
        }

        const [existing] = await db.execute(
            "SELECT id FROM students WHERE id = ? AND status = ?",
            [id, "Active"]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Active student not found"
            });
        }

        await db.execute(
            `UPDATE students
             SET full_name = ?,
                 course = ?,
                 age = ?,
                 gender = ?,
                 contact_number = ?
             WHERE id = ? AND status = ?`,
            [
                full_name.trim(),
                course.trim(),
                parsedAge,
                gender.trim(),
                contact_number.trim(),
                id,
                "Active"
            ]
        );

        res.json({
            message: "Student updated successfully"
        });
    } catch (error) {
        console.error("Error updating student:", error.message);
        res.status(500).json({
            message: "Update failed"
        });
    }
};

// PATCH: Archive a student instead of permanently deleting the record
exports.archiveStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute(
            "SELECT id FROM students WHERE id = ? AND status = ?",
            [id, "Active"]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Active student not found"
            });
        }

        await db.execute(
            'UPDATE students SET status = ? WHERE id = ?',
            ["Archived", id]
        );

        res.json({
            message: "Student archived successfully"
        });
    } catch (error) {
        console.error("Error archiving student:", error.message);
        res.status(500).json({
            message: "Archive failed"
        });
    }
};

