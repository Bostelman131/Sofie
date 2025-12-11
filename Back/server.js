const { createClient } = require("@deepgram/sdk");
const twilio = require("twilio");
const VoiceResponse = require('twilio').twiml.VoiceResponse;
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const deepgramProjectId = process.env.DEEPGRAM_PROJECT_ID;
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgramSecret = process.env.DEEPGRAM_SECRET;

// add logger for all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


//const deepgramClient = createClient({ key: deepgramApiKey, accessToken: deepgramSecret });

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

/*
twilioClient.calls.create({
    url: 'http://demo.twilio.com/docs/voice.xml',
    to: '+14194392829', // Replace with the recipient's phone number
    from: twilioPhoneNumber
}).then(call => console.log(`Call initiated with SID: ${call.sid}`))
  .catch(error => console.error('Error initiating call:', error));
*/

app.post('/voice', (req, res) => {
    const twiml = new VoiceResponse();
    twiml.say('Hello, natalie. I have finally got this thing to talk! Goodbye!');
    res.type('text/xml');
    res.send(twiml.toString());
});


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

app.get('/.well-known/pki-validation/4A741F8505CB3F53A6D026A70C1CF994.txt', (req,res) => {
    res.sendFile('C:/inetpub/certs/KysonProof.txt');
  });

// Type: GET
// Access: Public
// @Description: Used to get SPA
app.get('*', (req,res) => {
  res.sendFile(path.resolve(__dirname, '../Front/build', 'index.html'));
});

/*
import express from 'express';
import { json } from 'body-parser';
import { setRoutes } from './routes/callRoutes';
import { deepgramClient } from './services/deepgramService';
import { twilioClient } from './services/twilioService';
import { logger } from './utils/logger';
import { PORT } from './config/index';

const app = express();

app.use(json());

setRoutes(app);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info('Connected to Twilio and Deepgram services');
});
*/