const db = require("../config/db");

exports.getStats = async (req, res) => {
    try {
        const [students] = await db.execute(
            `SELECT COUNT(*) AS totalStudents
             FROM students
             WHERE status = 'Active'`
        );

        const [visits] = await db.execute(
            `SELECT COUNT(*) AS totalVisits
             FROM clinic_visits`
        );

        const [today] = await db.execute(
            `SELECT COUNT(*) AS todayVisits
             FROM clinic_visits
             WHERE visit_date >= CURDATE()
               AND visit_date < CURDATE() + INTERVAL 1 DAY`
        );

        const [monthly] = await db.execute(
            `SELECT COUNT(*) AS monthlyVisits
             FROM clinic_visits
             WHERE visit_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
               AND visit_date < DATE_FORMAT(
                   CURDATE() + INTERVAL 1 MONTH, '%Y-%m-01'
               )`
        );

        const [followUps] = await db.execute(
            `SELECT COUNT(*) AS followUpsRequired
             FROM clinic_visits
             WHERE follow_up_required = 1`
        );

        const [breakdown] = await db.execute(
            `SELECT visit_type, COUNT(*) AS count
             FROM clinic_visits
             GROUP BY visit_type
             ORDER BY visit_type`
        );

        const [recentVisits] = await db.execute(
            `SELECT
                cv.id,
                cv.visit_type,
                cv.visit_date,
                cv.visit_time,
                cv.reason,
                cv.physician_name,
                s.full_name AS student_name,
                s.student_id AS student_number
             FROM clinic_visits cv
             LEFT JOIN students s ON cv.student_id = s.id
             ORDER BY cv.created_at DESC
             LIMIT 5`
        );

        return res.json({
            totalStudents: Number(students[0].totalStudents),
            totalVisits: Number(visits[0].totalVisits),
            todayVisits: Number(today[0].todayVisits),
            monthlyVisits: Number(monthly[0].monthlyVisits),
            followUpsRequired: Number(followUps[0].followUpsRequired),
            breakdown: breakdown.map(item => ({
                visit_type: item.visit_type,
                count: Number(item.count)
            })),
            recentVisits
        });
    } catch (error) {
        console.error("Dashboard error:", error);

        return res.status(500).json({
            message: "Unable to load dashboard statistics."
        });
    }
};
