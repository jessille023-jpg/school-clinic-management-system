const db = require("../config/db");

// Record a new clinic visit
exports.createVisit = async (req, res) => {
    try {
        const {
            student_id,
            staff_id,
            physician_name,
            visit_type,
            visit_date,
            visit_time,
            reason,
            medical_history,
            vital_signs,
            assessment,
            treatment,
            starter_dose,
            procedure_name,
            advice,
            remarks,
            follow_up_required
        } = req.body;

        if (!student_id || !staff_id || !visit_type || !visit_date || !visit_time) {
            return res.status(400).json({
                message: "Student, staff, visit type, date, and time are required."
            });
        }

        const sql = `
            INSERT INTO clinic_visits (
                student_id,
                staff_id,
                physician_name,
                visit_type,
                visit_date,
                visit_time,
                reason,
                medical_history,
                vital_signs,
                assessment,
                treatment,
                starter_dose,
                procedure_name,
                advice,
                remarks,
                follow_up_required
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            student_id,
            staff_id,
            physician_name || null,
            visit_type,
            visit_date,
            visit_time,
            reason || null,
            medical_history || null,
            vital_signs || null,
            assessment || null,
            treatment || null,
            starter_dose || null,
            procedure_name || null,
            advice || null,
            remarks || null,
            follow_up_required ? 1 : 0
        ];

        const [result] = await db.execute(sql, values);

        return res.status(201).json({
            message: "Clinic visit recorded successfully.",
            id: result.insertId
        });
    } catch (error) {
        console.error("Error recording clinic visit:", error);

        return res.status(500).json({
            message: "Error recording clinic visit.",
            error: error.message
        });
    }
};

// Get visits for one student
exports.getVisitsByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const [visits] = await db.execute(
            `SELECT *
             FROM clinic_visits
             WHERE student_id = ?
             ORDER BY visit_date DESC, visit_time DESC`,
            [studentId]
        );

        return res.json(visits);
    } catch (error) {
        console.error("Error retrieving student visits:", error);

        return res.status(500).json({
            message: "Error retrieving student visits."
        });
    }
};


 // Get all clinic visits
exports.getAllVisits = async (req, res) => {
    try {
        const [visits] = await db.execute(
            `SELECT
                cv.*,
                DATE_FORMAT(cv.visit_date, '%Y-%m-%d') AS visit_date,
                s.full_name AS student_name
             FROM clinic_visits cv
             LEFT JOIN students s ON cv.student_id = s.id
             ORDER BY cv.created_at DESC`
        );

        return res.json(visits);
    } catch (error) {
        console.error("Error retrieving clinic visits:", error);

        return res.status(500).json({
            message: "Error retrieving clinic visits."
        });
    }
};


// Edit an existing clinic visit
exports.updateVisit = async (req, res) => {
    try {
        const visitId = Number(req.params.id);

        if (!Number.isInteger(visitId) || visitId <= 0) {
            return res.status(400).json({
                message: "Invalid clinic visit ID."
            });
        }

        const {
            student_id,
            staff_id,
            physician_name,
            visit_type,
            visit_date,
            visit_time,
            reason,
            medical_history,
            vital_signs,
            assessment,
            treatment,
            starter_dose,
            procedure_name,
            advice,
            remarks,
            follow_up_required
        } = req.body;

        if (!student_id || !staff_id || !visit_type || !visit_date || !visit_time) {
            return res.status(400).json({
                message: "Student, staff, visit type, date, and time are required."
            });
        }

        const [existing] = await db.execute(
            "SELECT id FROM clinic_visits WHERE id = ?",
            [visitId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Clinic visit not found."
            });
        }

        const sql = `
            UPDATE clinic_visits
            SET
                student_id = ?,
                staff_id = ?,
                physician_name = ?,
                visit_type = ?,
                visit_date = ?,
                visit_time = ?,
                reason = ?,
                medical_history = ?,
                vital_signs = ?,
                assessment = ?,
                treatment = ?,
                starter_dose = ?,
                procedure_name = ?,
                advice = ?,
                remarks = ?,
                follow_up_required = ?
            WHERE id = ?
        `;

        const values = [
            student_id,
            staff_id,
            physician_name || null,
            visit_type,
            visit_date,
            visit_time,
            reason || null,
            medical_history || null,
            vital_signs || null,
            assessment || null,
            treatment || null,
            starter_dose || null,
            procedure_name || null,
            advice || null,
            remarks || null,
            follow_up_required ? 1 : 0,
            visitId
        ];

        await db.execute(sql, values);

        return res.json({
            message: "Clinic visit updated successfully.",
            id: visitId
        });
    } catch (error) {
        console.error("Error updating clinic visit:", error);

        return res.status(500).json({
            message: "Error updating clinic visit.",
            error: error.message
        });
    }
};

