import { Router } from 'express';
import { analyzeController } from '../controllers/analyze.controller.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

// Supports both JSON body and multipart/form-data (with 'image' file field)
router.post('/', uploadMiddleware.single('image'), analyzeController.analyze);

export default router;
