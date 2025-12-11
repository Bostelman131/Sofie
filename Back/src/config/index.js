import dotenv from 'dotenv';

dotenv.config();

const config = {
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    deepgram: {
        projectId: process.env.DEEPGRAM_PROJECT_ID,
        apiKey: process.env.DEEPGRAM_API_KEY,
        secret: process.env.DEEPGRAM_SECRET,
    },
    server: {
        port: process.env.PORT || 3000,
    },
};

export default config;