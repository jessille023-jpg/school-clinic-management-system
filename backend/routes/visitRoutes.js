const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, visitController.getAllVisits);
router.get('/student/:studentId', auth, visitController.getVisitsByStudent);
router.post('/', auth, visitController.createVisit);
module.exports = router;