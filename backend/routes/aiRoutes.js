const express = require('express');
const router = express.Router();
const { getRecommendation, getInsights, getTodaysPlan, getProductivityScore } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/recommend', getRecommendation);
router.post('/insights', getInsights);
router.post('/today-plan', getTodaysPlan);
router.post('/productivity-score', getProductivityScore);

module.exports = router;