class TwilioService {
    constructor(accountSid, authToken) {
        this.twilioClient = require('twilio')(accountSid, authToken);
    }

    async makeCall(to, from, url) {
        try {
            const call = await this.twilioClient.calls.create({
                to,
                from,
                url
            });
            return call;
        } catch (error) {
            throw new Error(`Failed to make call: ${error.message}`);
        }
    }

    async receiveCall(callSid) {
        try {
            const call = await this.twilioClient.calls(callSid).fetch();
            return call;
        } catch (error) {
            throw new Error(`Failed to retrieve call: ${error.message}`);
        }
    }
}

export default TwilioService;