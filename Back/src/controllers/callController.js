import { Twilio } from 'twilio';
import Deepgram from '@deepgram/sdk';

class CallController {
    constructor(twilioService, deepgramService) {
        this.twilioService = twilioService;
        this.deepgramService = deepgramService;
    }

    handleIncomingCall(req, res) {
        const twilioResponse = this.twilioService.createResponse();
        twilioResponse.say('Hello, you have reached the Deepgram transcription service.');
        twilioResponse.record({
            maxLength: 30,
            action: '/api/calls/recording-complete',
            transcribe: false,
        });
        res.type('text/xml').send(twilioResponse.toString());
    }

    async handleRecordingComplete(req, res) {
        const recordingUrl = req.body.RecordingUrl;
        const transcription = await this.deepgramService.transcribeAudio(recordingUrl);
        res.send(transcription);
    }
}

export default CallController;