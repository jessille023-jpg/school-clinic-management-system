const db = require("../config/db");

exports.getAllStudents = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM students WHERE status = "Active"'
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching students"
        });
    }
};

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
        console.error(error);
        res.status(500).json({
            message: "Error fetching student"
        });
    }
};

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

        await db.execute(
            `INSERT INTO students
            (student_id, full_name, course, age, gender, contact_number)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                student_id,
                full_name,
                course,
                age,
                gender,
                contact_number
            ]
        );

        res.status(201).json({
            message: "Student created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error creating student. ID might already exist."
        });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const {
            full_name,
            course,
            age,
            gender,
            contact_number
        } = req.body;

        await db.execute(
            `UPDATE students
             SET full_name = ?,
                 course = ?,
                 age = ?,
                 gender = ?,
                 contact_number = ?
             WHERE id = ?`,
            [
                full_name,
                course,
                age,
                gender,
                contact_number,
                req.params.id
            ]
        );

        res.json({
            message: "Student updated"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Update failed"
        });
    }
};

exports.archiveStudent = async (req, res) => {
    try {
        await db.execute(
            'UPDATE students SET status = "Archived" WHERE id = ?',
            [req.params.id]
        );

        res.json({
            message: "Student archived"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Archive failed"
        });
    }
};
