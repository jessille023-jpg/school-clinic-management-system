const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [totalStudents] = await db.execute('SELECT COUNT(*) as count FROM students WHERE status="Active"');
        const [totalVisits] = await db.execute('SELECT COUNT(*) as count FROM clinic_visits');
        const [todayVisits] = await db.execute('SELECT COUNT(*) as count FROM clinic_visits WHERE visit_date = CURDATE()');
        
        const [typeCounts] = await db.execute(`
            SELECT visit_type, COUNT(*) as count 
            FROM clinic_visits 
            GROUP BY visit_type
        `);

        res.json({
            totalStudents: totalStudents[0].count,
            totalVisits: totalVisits[0].count,
            todayVisits: todayVisits[0].count,
            breakdown: typeCounts
        });
    } catch (error) {
        res.status(500).json({ message: "Error loading dashboard" });
    }
};