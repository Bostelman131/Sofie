require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require("path");
const { appendFile, writeFile } = require('fs').promises;
const { join } = require('path');
const { createClient, AgentEvents } = require("@deepgram/sdk");

const twilio = require("twilio");
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const WebSocket = require('ws');

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const deepgramProjectId = process.env.DEEPGRAM_PROJECT_ID;
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgramSecret = process.env.DEEPGRAM_SECRET;

const port = 7070;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Define allowed origins for CORS
const whitelist = ['http://localhost:3000', 'http://localhost:7070', 'https://meetsofie.com', 'https://www.meetsofie.com', 'http://meetsofie.com', 'https://meetsofie.com'];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
};

app.use(cors({
    origin: corsOptions,
}));

// Logger Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const usersName = "Kyle Bostelman";
const usersFirstName = "Kyle";

const userSpecificInformation = `
-He's a 35 years old male with a wife and a 3 year old son.
-He owns a company called Kyson Designs, where they perform subdivision development and residential real-estate development and rehab.
-He is interested in purchasing vacant land and distressed properties for rehab in his area.
-He has his real estate license and helps people buy and sell homes in his area.
-He helps people invest in real estate.
-His real estate activity (his area) is primarily focused on Durham, Chapel Hill, Cary, Hillsborough, and Raleigh, North Carolina.
-He is not interested in health insurance.
-He is not interested in services that sell him leads for real estate clients.
-He works full-time as a director of software systems for a company named Cornerstone Detention Products, Cornerstone for short
-He is responsible for taking calls from co-workers and clients and needs to ensure he is as helpful and thorough as possible.
-Typically IT support can handle calls for Cornerstone, but occasionally Kyle needs to take these calls personally for complex technical issues.
-Contact information for IT support at Cornerstone Detention Products is helpdesk@cornerstoneinc.com, Rodney or Sherry can likely assist
-Cornerstone IT support should be able to help with most Box issues, software installation, and password resets, and general troubleshooting related to Cornerstone.
-Kyle is currently located in Durham, North Carolina.
`;

const prompt = `
#Role
You are receiving calls on behalf of ${usersName}. You're here to handle what you can (listed within the enabled operations section), and collect information and relay the message to ${usersFirstName} when you can't help or are not sure.

#General Guidelines
-Be warm, friendly, and professional.
-Speak clearly and naturally in plain language.
-Keep most responses to 1 to 2 sentences and under 120 characters unless the caller asks for more detail (max: 300 characters).
-Do not use markdown formatting, like code blocks, quotes, bold, links, or italics.
-Use line breaks in lists.
-Use varied phrasing; avoid repetition.
-If unclear, ask for clarification.
-If the users message is empty, respond with an empty message.
-If asked about your well-being, respond briefly and kindly.
#Voice-Specific Instructions
-Speak in a conversational tone—your responses will be spoken aloud.
-Pause after questions to allow for replies.
-Confirm what the customer said if uncertain.
-Never interrupt.

#Enabled Operations
-Answer Basic Questions from Specific information or FAQs about User.
-Capture the reason for the call and their name, email, and phone number and politely close.

#Disabled Operations
-Don't answer questions about the current date or time.
-Don't answer questions about the current weather, refer them to the weather service of their choice.
-No current event information is to be provided.
-Don't provide navigation or location help beyond what is listed in Specific information or FAQs about User.

#Style
-Use active listening cues.
-Be warm and understanding, but concise.
-Use simple words unless the caller uses technical terms.

#Call Flow Objective
-Greet the caller and introduce yourself:
-Your primary goal is to help users quickly identify what they are calling for and address this as best as possible. Typically this will require notifying the user of the call reason and their contact information.
-If the request is unclear:
“Just to confirm, did you mean…?” or “Can you tell me a bit more?”,
-If the request is out of scope (e.g. legal, financial, or medical advice):
“I'm not able to provide advice on that, but I can help you find someone who can.”,
-If the request has more than 3 responses that are not any closer to finding the purpose of the call:
add "What was it that I could help you with today?" to the end of the response,
-Capture the reason for the call and their name, email, and phone number and politely close.
-If it is a family member calling, don't ask for their name, phone number, or email—just the reason for the call and politely close.
-Phone numbers should have 10 digits, including area code.
-If phone number is missing digits or invalid:
“Could you please provide your full 10-digit phone number, including area code?”,

#Specific information or FAQs about User:
${userSpecificInformation}

#Off-Scope Questions
-If asked about sensitive topics like health, legal, or financial matters:
“I'm not qualified to answer that, but I recommend reaching out to a licensed professional.”,

#User Considerations
-Callers may be in a rush, distracted, or unsure how to phrase their question. Stay calm, helpful, and clear—especially when the user seems stressed, confused, or overwhelmed.

#Closing
-Always ask:
“Is there anything else I can help you with today?”
If Not,
-Always close with the message:
“Thanks for calling. Take care and have a great day!”
`;

const deepgramConfigurationFile = {
    "type": "Settings",
    "audio": {
        "input": {
        "encoding": "mulaw",
        "sample_rate": 8000
        },
        "output": {
        "encoding": "mulaw",
        "sample_rate": 8000,
        "container": "none"
        }
    },
    "agent": {
        "language": "en",
        "speak": {
        "provider": {
            "type": "deepgram",
            "model": "aura-2-andromeda-en"
        }
        },
        "listen": {
        "provider": {
            "type": "deepgram",
            "version": "v2",
            "model": "flux-general-en"
        }
        },
        "think": {
        "provider": {
            "type": "anthropic",
            "model": "claude-haiku-4-5"
        },
        "prompt": prompt
        },
        "greeting": `Hi there, I'm Sofie, ${usersFirstName}'s assistant — how can I help today?`
    }
};

const deepgramClient = createClient(deepgramSecret);

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

// Create server
const server = app.listen(port, (error) => {
    console.log(`Server is running on port ${port}`);
    if(error) console.log(error);
});

// - - - - - - - - - - Web Socket - - - - - - - - - - -

// Create WebSocket server on the same port as HTTP server
const websocketServer = new WebSocket.Server({ 
    server,
    path: '/ws'
});

// Handle WebSocket connections from Twilio incoming Call
websocketServer.on('connection', (ws) => {   
    let deepgramConnection = null;
    let audioBuffer = Buffer.alloc(0);
    let conversationHistory = [];
    let emailSent = false;
    
    // Initialize Deepgram Agent connection
    const initializeDeepgramAgent = () => {        
        // Check if secret looks valid (should be much longer than 11 characters)
        if (!deepgramSecret || deepgramSecret.length < 20) {
            console.error("ERROR: Invalid Deepgram Secret detected!");
            console.error("Current secret:", deepgramSecret);
            console.error("Please check your .env file and ensure DEEPGRAM_SECRET is set to a valid Deepgram API key");
            console.error("Get your API key from: https://console.deepgram.com/");
            
            // Send error message to caller via Twilio
            if (ws.readyState === WebSocket.OPEN && ws.streamSid) {
                console.log("Sending error message to caller");
            };
            return;
        }
        
        try {
            deepgramConnection = deepgramClient.agent();
            
            deepgramConnection.on(AgentEvents.Welcome, () => {                
                // Configure the Agent
                deepgramConnection.configure(deepgramConfigurationFile);
                
                // Send Keep Alive messages
                const keepAliveInterval = setInterval(() => {
                    if (deepgramConnection && typeof deepgramConnection.keepAlive === 'function') {
                        deepgramConnection.keepAlive();
                    }
                }, 5000);
                
                // Store interval to clear later
                deepgramConnection.keepAliveInterval = keepAliveInterval;
            });

            deepgramConnection.on(AgentEvents.Open, () => {
                console.log("Deepgram connection opened");
            });

            deepgramConnection.on(AgentEvents.Close, async () => {
                console.log("Deepgram connection closed");
                if (deepgramConnection.keepAliveInterval) {
                    clearInterval(deepgramConnection.keepAliveInterval);
                }
                
                // Send conversation summary if we have conversation history
                if (!emailSent && conversationHistory.length > 0) {
                    const callSummary = {
                        callEndedAt: new Date().toISOString(),
                        callEndReason: 'Deepgram connection closed',
                        conversationLength: conversationHistory.length,
                        conversationHistory: conversationHistory,
                        streamSid: ws.streamSid
                    };
                    
                    try {
                        await handlePostCallActions(callSummary);
                        emailSent = true;
                    } catch (error) {
                        console.error("Error sending email on Deepgram close:", error);
                    }
                }
                
                // Terminate the Twilio stream when Deepgram agent closes
                if (ws.readyState === WebSocket.OPEN && ws.streamSid) {
                    console.log("Terminating Twilio stream due to Deepgram agent closure");
                    
                    // Close the WebSocket connection to end the call
                    ws.close();
                }
            });

            deepgramConnection.on(AgentEvents.ConversationText, async (data) => {
                console.log("Conversation text:", data);
                await appendFile(join(__dirname, `chatlog.txt`), JSON.stringify(data) + "\n");
                
                // Store conversation data for email summary
                conversationHistory.push({
                    role: data.role,
                    content: data.content,
                    timestamp: new Date().toISOString()
                });
                
                // Check if the agent is ending the conversation
                if (data.role === 'assistant' && data.content) {
                    const lowercaseContent = data.content.toLowerCase();
                    
                    // Look for conversation ending phrases
                    const endingPhrases = [
                        `Thanks for calling. Take care and have a great day!`,
                        'take care and have a great day',
                        'thanks for calling',
                        'goodbye',
                        'have a great day',
                        'take care'
                    ];
                    
                    const isConversationEnding = endingPhrases.some(phrase => 
                        lowercaseContent.includes(phrase)
                    );
                    
                    if (isConversationEnding) {
                        console.log("Detected conversation ending, will close stream after short delay");

                        // Give a short delay for the final message to be spoken
                        setTimeout(async () => {
                            if (ws.readyState === WebSocket.OPEN && ws.streamSid) {
                                console.log("Ending call due to conversation completion");
                                
                                // Prepare conversation summary for email
                                if (!emailSent && conversationHistory.length > 0) {
                                    const callSummary = {
                                        callEndedAt: new Date().toISOString(),
                                        callEndReason: 'Natural conversation completion',
                                        conversationLength: conversationHistory.length,
                                        conversationHistory: conversationHistory,
                                        streamSid: ws.streamSid
                                    };
                                    
                                    // Send email with conversation summary
                                    try {
                                        await handlePostCallActions(callSummary);
                                        emailSent = true;
                                    } catch (error) {
                                        console.error("Error sending email:", error);
                                    }
                                }
                                
                                ws.close();

                                // close deepgram connect gracefully
                            }
                        }, 5000); // 5 second delay to let the final message play
                    }
                }
            });

            deepgramConnection.on(AgentEvents.UserStartedSpeaking, () => {
                console.log("User started speaking");
                if (audioBuffer.length) {
                    console.log("User started speaking, clearing audio buffer");
                    audioBuffer = Buffer.alloc(0);
                }
            });

            deepgramConnection.on(AgentEvents.Audio, (data) => {
                
                // Audio should now be μ-law at 8kHz, perfect for Twilio
                if (data.length > 0) {
                    let buffer = Buffer.from(data);                    
                    // Send μ-law audio to Twilio WebSocket in smaller chunks
                    // Twilio expects 160-byte chunks (20ms at 8kHz μ-law)
                    if (ws.readyState === WebSocket.OPEN && ws.streamSid) {
                        const chunkSize = 160;
                        for (let i = 0; i < buffer.length; i += chunkSize) {
                            const chunk = buffer.slice(i, i + chunkSize);
                            
                            // Only send if we have a full chunk (160 bytes)
                            if (chunk.length === chunkSize) {
                                const audioMessage = {
                                    event: 'media',
                                    streamSid: ws.streamSid,
                                    media: {
                                        payload: chunk.toString('base64')
                                    }
                                };
                                ws.send(JSON.stringify(audioMessage));
                            }
                        }
                    }
                }
            });

            deepgramConnection.on(AgentEvents.Error, (err) => {
                console.error("Deepgram Error!");
                console.error(JSON.stringify(err, null, 2));
                
                // Check for common errors
                if (err.message && err.message.includes("non-101 status code")) {
                    console.error("This error usually means:");
                    console.error("1. Invalid API key");
                    console.error("2. No access to Deepgram Agent API");
                    console.error("3. Network/firewall issues");
                    console.error("Current secret length:", deepgramSecret ? deepgramSecret.length : 0);
                }
                
                // Don't retry immediately to avoid spam
                console.log("Not retrying due to authentication issues");
            });

            deepgramConnection.on(AgentEvents.Unhandled, (data) => {
                console.log("Unhandled event:", data);
            });
            
        } catch (error) {
            console.error("Failed to initialize Deepgram agent:", error);
            console.error("This might be due to:");
            console.error("1. Invalid API credentials");
            console.error("2. Deepgram Agent API not available for your account");
            console.error("3. Network connectivity issues");
        }
    };

    // Handle messages from Twilio
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.event) {
                case 'connected':
                    console.log('WebSocket connected to Twilio');
                    break;
                    
                case 'start':
                    console.log('Starting media stream with streamSid:', data.start.streamSid);
                    ws.streamSid = data.start.streamSid;
                    console.log('Stored streamSid:', ws.streamSid);
                    initializeDeepgramAgent();
                    break;
                    
                case 'media':
                    // Forward audio to Deepgram
                    if (deepgramConnection && data.media.payload) {
                        const audioData = Buffer.from(data.media.payload, 'base64');
                        deepgramConnection.send(audioData);
                    } else if (!deepgramConnection) {
                        console.log('No Deepgram connection available');
                    }
                    break;
                    
                case 'stop':
                    console.log('Media stream stopped');
                    if (deepgramConnection) {
                        try {
                            if (typeof deepgramConnection.finish === 'function') {
                                deepgramConnection.finish();
                            } else if (typeof deepgramConnection.close === 'function') {
                                deepgramConnection.close();
                            }
                            if (deepgramConnection.keepAliveInterval) {
                                clearInterval(deepgramConnection.keepAliveInterval);
                            }
                        } catch (err) {
                            console.log('Error closing Deepgram connection:', err.message);
                        }
                    }
                    break;
                    
                default:
                    console.log('Unknown event:', data.event);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });

    ws.on('close', async () => {
        console.log('WebSocket connection closed');
        
        // Send conversation summary if we have conversation history
        if (!emailSent && conversationHistory.length > 0) {
            const callSummary = {
                callEndedAt: new Date().toISOString(),
                callEndReason: 'WebSocket connection closed',
                conversationLength: conversationHistory.length,
                conversationHistory: conversationHistory,
                streamSid: ws.streamSid
            };
            
            try {
                await handlePostCallActions(callSummary);
                emailSent = true;
            } catch (error) {
                console.error("Error sending email on WebSocket close:", error);
            }
        }
        
        // end the twilio call
        if (deepgramConnection) {
            try {
                if (typeof deepgramConnection.finish === 'function') {
                    deepgramConnection.finish();
                } else if (typeof deepgramConnection.close === 'function') {
                    deepgramConnection.close();
                }
                if (deepgramConnection.keepAliveInterval) {
                    clearInterval(deepgramConnection.keepAliveInterval);
                }
            } catch (err) {
                console.log('Error closing Deepgram connection:', err.message);
            }
        }
    });

    ws.on('error', async (error) => {
        console.error('WebSocket error:', error);
        
        // Send conversation summary if we have conversation history
        if (!emailSent && conversationHistory.length > 0) {
            const callSummary = {
                callEndedAt: new Date().toISOString(),
                callEndReason: `WebSocket error: ${error.message}`,
                conversationLength: conversationHistory.length,
                conversationHistory: conversationHistory,
                streamSid: ws.streamSid
            };
            
            try {
                await handlePostCallActions(callSummary);
                emailSent = true;
            } catch (emailError) {
                console.error("Error sending email on WebSocket error:", emailError);
            }
        }
        
        if (deepgramConnection) {
            try {
                if (typeof deepgramConnection.finish === 'function') {
                    deepgramConnection.finish();
                } else if (typeof deepgramConnection.close === 'function') {
                    deepgramConnection.close();
                }
                if (deepgramConnection.keepAliveInterval) {
                    clearInterval(deepgramConnection.keepAliveInterval);
                }
            } catch (err) {
                console.log('Error closing Deepgram connection:', err.message);
            }
        }
    });
});

// - - - - - - - - - - Tool Functions - - - - - - - - - - -

// Handle post-call actions like sending email summaries and other actions
const handlePostCallActions = async (callDetails) => {
    // Create a formatted conversation summary
    let conversationSummary = "No conversation recorded";
    if (callDetails.conversationHistory && callDetails.conversationHistory.length > 0) {
        conversationSummary = callDetails.conversationHistory
            .map(msg => `[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n');
    }
    
    const structuredCompleteCallData = {
        callEndReason: callDetails.callEndReason,
        conversationLength: callDetails.conversationLength,
        conversationSummary: conversationSummary,
        streamSid: callDetails.streamSid,
        timestamp: callDetails.callEndedAt
    };

    console.log("Complete data prepared:", structuredCompleteCallData);

    // Send the structuredCompleteCallData to an LLM model to further process and perform actions like sending emails or adding event to calendars etc...
    // LangChain or similar framework can be used here to interact with LLMs and tools

    try {
        await appendFile(join(__dirname, `call_summaries.txt`), 
            `\n=== CALL SUMMARY ===\n` +
            `Timestamp: ${emailData.timestamp}\n` +
            `End Reason: ${emailData.callEndReason}\n` +
            `Stream SID: ${emailData.streamSid}\n` +
            `Messages: ${emailData.conversationLength}\n` +
            `Conversation:\n${emailData.conversationSummary}\n` +
            `=====================\n\n`
        );
        console.log("Call summary saved to call_summaries.txt");
    } catch (error) {
        console.error("Error saving call summary:", error);
    }
};

// - - - - - - - - - - APIS Below - - - - - - - - - - -

app.use(express.static(path.join(__dirname, '../Front/build')));

// Type: POST
// Access: Public
// @Description: Used by Twilio to get TwiML instructions for incoming Call
app.post('/voice', (req, res) => {
    const twiml = new VoiceResponse();

    // Use your actual domain for the WebSocket URL
    const websocketUrl = 'wss://www.meetsofie.com/ws';

    // Connect the media stream for bidirectional audio
    const connect = twiml.connect();
    connect.stream({
        url: websocketUrl
    });

    res.type('text/xml');
    res.send(twiml.toString());
});

// Type: GET
// Access: Public
// @Description: Used to get SPA
app.get('*', (req,res) => {
  res.sendFile(path.resolve(__dirname, '../Front/build', 'index.html'));
});