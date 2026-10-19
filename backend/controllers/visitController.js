const db = require('../config/db');

exports.createVisit = async (req, res) => {
    try {
        const data = req.body;
        const query = `INSERT INTO clinic_visits (student_id, staff_id, visit_type, visit_date, visit_time, reason, medical_history, vital_signs, assessment, treatment, procedure_name, advice, starter_dose, prescription, laboratory_request, medical_certificate, remarks, follow_up_required) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await db.execute(query, [
            data.student_id, data.staff_id, data.visit_type, data.visit_date, data.visit_time, 
            data.reason, data.medical_history, data.vital_signs, data.assessment, data.treatment, 
            data.procedure_name, data.advice, data.starter_dose, data.prescription, 
            data.laboratory_request, data.medical_certificate, data.remarks, data.follow_up_required
        ]);
        res.status(201).json({ message: "Visit recorded successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error recording visit" });
    }
};

exports.getVisitsByStudent = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM clinic_visits WHERE student_id = ? ORDER BY visit_date DESC', [req.params.studentId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching history" });
    }
};

exports.getAllVisits = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT cv.*, s.full_name as student_name FROM clinic_visits cv JOIN students s ON cv.student_id = s.id ORDER BY cv.created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching visits" });
    }
};