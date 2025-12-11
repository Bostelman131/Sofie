import express from 'express';
import CallController from '../controllers/callController';

const router = express.Router();
const callController = new CallController();

router.post('/incoming-call', callController.handleIncomingCall.bind(callController));
router.post('/transcribe-audio', callController.transcribeAudio.bind(callController));

export default function setRoutes(app) {
    app.use('/api/calls', router);
}