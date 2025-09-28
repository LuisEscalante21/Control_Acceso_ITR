import { Router } from 'express';
import absencesController from '../controllers/absencesController.js';

const router = Router();

router.post('/', absencesController.createOrUpdateAbsence); 
router.get('/', absencesController.getAbsences); 
router.get('/:id', absencesController.getAbsenceById);
router.patch('/:id', absencesController.updateAbsence);
router.delete('/:id', absencesController.deleteAbsence);

export default router;