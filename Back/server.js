import { createClient } from "@deepgram/sdk";
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const deepgramProjectId = process.env.DEEPGRAM_PROJECT_ID;
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgramSecret = process.env.DEEPGRAM_SECRET;

const deepgramClient = createClient({ key: deepgramApiKey, accessToken: deepgramSecret });

const app = express();
const port = 7070;

const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1) {
        callback(null, true)
        } else {
        callback(new Error())
        }
    }
};

app.use(cors({
    origin: corsOptions,
}));

app.use(express.static(path.join(__dirname, '../Front/build')));

app.listen(port, (error) => {
    if(error) console.log(error);
    console.log(`Server is running on port: ${port}`);
});

app.get('/.well-known/pki-validation/A2423D15C9112823F52A362C91AD9CE6.txt', (req,res) => {
    res.sendFile('C:/inetpub/certs/KysonProof.txt');
  });

// Type: GET
// Access: Public
// @Description: Used to get SPA
app.get('*', (req,res) => {
  res.sendFile(path.resolve(__dirname, '../Front/build', 'index.html'));
});