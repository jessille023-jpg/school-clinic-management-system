const express = require("express");
const router = express.Router();

const visitController = require("../controllers/visitController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, visitController.getAllVisits);

router.get("/student/:studentId", auth, visitController.getVisitsByStudent);

router.post("/", auth, visitController.createVisit);

router.put("/:id", auth, visitController.updateVisit);

router.post("/:id/slip", auth, visitController.createSlipRecord);

module.exports = router;
