import { createClient } from "@deepgram/sdk";

class DeepgramService {
    constructor(apiKey, projectId) {
        this.client = createClient({ key: apiKey });
        this.projectId = projectId;
    }

    async transcribeAudio(audioUrl) {
        try {
            const response = await this.client.transcription.preRecorded({
                url: audioUrl,
                model: 'general',
                punctuate: true,
                projectId: this.projectId
            });
            return response;
        } catch (error) {
            throw new Error(`Deepgram transcription error: ${error.message}`);
        }
    }
}

export default DeepgramService;