const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, studentController.getAllStudents);
router.get('/:studentId', auth, studentController.getStudentById);
router.post('/', auth, studentController.createStudent);
router.put('/:id', auth, studentController.updateStudent);
router.patch('/:id/archive', auth, studentController.archiveStudent);
module.exports = router;