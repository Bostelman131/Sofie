import { createClient } from "@deepgram/sdk";
require('dotenv').config();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const deepgramProjectId = process.env.DEEPGRAM_PROJECT_ID;
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgramSecret = process.env.DEEPGRAM_SECRET;

const deepgramClient = createClient({ key: deepgramApiKey, accessToken: deepgramSecret });