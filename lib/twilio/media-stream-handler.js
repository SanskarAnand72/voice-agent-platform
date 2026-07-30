const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const WebSocket = require('ws');
const Redis = require('ioredis');

// Initialize Supabase Client for database logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Redis Client for conversation persistence
let redisClient = null;
let isRedisConnected = false;
const memoryStore = new Map(); // Local in-memory fallback

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[MediaStream] Redis connection timed out. Falling back to memory.');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('[MediaStream] Redis connected for conversation state.');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn('[MediaStream] Redis error:', err.message);
    });
  } catch (err) {
    console.error('[MediaStream] Redis initialization error:', err.message);
  }
} else {
  console.log('[MediaStream] Running in local in-memory conversation fallback mode.');
}

/**
 * Helper to retrieve conversation history from Redis or memory fallback.
 * Uses the exact same key space (`conv:${callSid}`) as the REST and Gather pipelines.
 */
async function getConversationHistory(callSid) {
  if (isRedisConnected && redisClient) {
    try {
      const raw = await redisClient.get(`conv:${callSid}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[MediaStream] Redis conversation read failed:', err.message);
    }
  }
  return memoryStore.get(callSid) || [];
}

/**
 * Helper to append a turn to the conversation history in Redis or memory fallback.
 */
async function addToConversation(callSid, role, content) {
  const history = await getConversationHistory(callSid);
  history.push({ role, content });

  const MAX_HISTORY_TURNS = 20;
  const trimmed = history.length > MAX_HISTORY_TURNS
    ? history.slice(history.length - MAX_HISTORY_TURNS)
    : history;

  if (isRedisConnected && redisClient) {
    try {
      // 24-hour expiration (TTL) matches the Next.js API storage TTL
      await redisClient.set(`conv:${callSid}`, JSON.stringify(trimmed), 'EX', 24 * 60 * 60);
    } catch (err) {
      console.warn('[MediaStream] Redis conversation write failed:', err.message);
    }
  }
  memoryStore.set(callSid, trimmed);
}

/**
 * Main WebSocket Media Stream Coordinator
 */
function handleMediaStream(ws, req) {
  console.log('[MediaStream] Client connected');

  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const agentId = urlParams.get('agent_id');

  if (!agentId) {
    console.error('[MediaStream] Connection closed: Missing agent_id');
    ws.close(4000, 'Missing agent_id');
    return;
  }

  let agent = null;
  let streamSid = null;
  let callSid = null;
  let callRecord = null;

  // Sockets & Stream controllers
  let deepgramSocket = null;
  let elevenLabsSocket = null;
  let currentOpenAIController = null;

  // Pipeline state
  let isPlaying = false;
  let textBuffer = '';
  let lastAssistantResponse = '';

  // Load Agent profile
  async function loadAgent() {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error || !data) {
        throw new Error(error ? error.message : 'Agent not found');
      }

      agent = data;
      console.log(`[MediaStream] Agent "${agent.name}" configuration loaded.`);
      initDeepgram();
    } catch (err) {
      console.error('[MediaStream] Failed to load agent configuration:', err.message);
      ws.close(4001, 'Failed to load agent');
    }
  }

  // Initialize Deepgram Live STT
  function initDeepgram() {
    const deepgramUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2-phonecall&encoding=mulaw&sample_rate=8000&channels=1&endpointing=300&interim_results=true';
    
    deepgramSocket = new WebSocket(deepgramUrl, {
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      },
    });

    deepgramSocket.on('open', () => {
      console.log('[MediaStream] Deepgram Live STT connected.');
    });

    deepgramSocket.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        const transcript = response.channel?.alternatives[0]?.transcript || '';
        const isFinal = response.is_final;

        if (!transcript.trim()) return;

        console.log(`[STT] (${isFinal ? 'Final' : 'Interim'}): ${transcript}`);

        // ── Barge-In / Interruption Engine ──────────────────────────────
        if (isPlaying) {
          console.log('[Barge-In] User interrupted bot. Clearing audio stream...');
          
          if (streamSid) {
            ws.send(
              JSON.stringify({
                event: 'clear',
                streamSid: streamSid,
              })
            );
          }

          if (currentOpenAIController) {
            currentOpenAIController.abort();
            currentOpenAIController = null;
          }

          if (elevenLabsSocket && elevenLabsSocket.readyState === WebSocket.OPEN) {
            elevenLabsSocket.close();
            elevenLabsSocket = null;
          }

          isPlaying = false;
          textBuffer = '';
          lastAssistantResponse = '';
        }
        // ──────────────────────────────────────────────────────────────────

        if (isFinal) {
          handleUserUtterance(transcript);
        }
      } catch (err) {
        console.error('[STT] Error processing Deepgram message:', err.message);
      }
    });

    deepgramSocket.on('error', (err) => {
      console.error('[STT] Deepgram WebSocket error:', err.message);
    });

    deepgramSocket.on('close', () => {
      console.log('[STT] Deepgram connection closed.');
    });
  }

  // Handle User Speech turn
  async function handleUserUtterance(userText) {
    if (!agent || !callSid) return;

    console.log(`[Conversation] Processing user input: "${userText}"`);
    
    // Log user speech turn to DB logs
    if (callRecord) {
      supabase
        .from('call_logs')
        .insert({
          call_id: callRecord.id,
          user_id: callRecord.user_id,
          type: 'user_speech',
          content: userText,
          timestamp_ms: Date.now(),
        })
        .catch(console.error);
    }

    // Persist user turn to Shared Redis space
    await addToConversation(callSid, 'user', userText);
    
    // Fetch aggregated history to feed into OpenAI
    const history = await getConversationHistory(callSid);
    generateStreamingAIResponse(history);
  }

  // OpenAI Chat Completion token stream
  async function generateStreamingAIResponse(history) {
    currentOpenAIController = new AbortController();
    
    const voiceSystemPrompt = `${agent.system_prompt}

IMPORTANT VOICE CALL GUIDELINES:
- Keep responses concise (2-3 sentences max) for natural phone conversation
- Do not use markdown, bullet points, or formatting
- Speak naturally as if in a phone conversation
- Ask one clear question at a time if you need information
- Be warm, professional, and helpful`;

    const messages = [
      { role: 'system', content: voiceSystemPrompt },
      ...history,
    ];

    try {
      console.log('[LLM] Requesting streaming completion...');
      const stream = await openai.chat.completions.create({
        model: agent.model || 'gpt-4o',
        messages: messages,
        temperature: agent.temperature || 0.7,
        max_tokens: 200,
        stream: true,
      }, { signal: currentOpenAIController.signal });

      initElevenLabsStream();

      textBuffer = '';
      lastAssistantResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          textBuffer += content;
          lastAssistantResponse += content;

          if (/[.!?\n]/.test(content) || textBuffer.length > 60) {
            sendTextToTTS(textBuffer);
            textBuffer = '';
          }
        }
      }

      if (textBuffer.trim()) {
        sendTextToTTS(textBuffer);
      }

      closeTTSSubmission();

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[LLM] OpenAI stream generation aborted.');
      } else {
        console.error('[LLM] OpenAI stream error:', err.message);
      }
    }
  }

  // ElevenLabs Streaming TTS WebSocket
  function initElevenLabsStream() {
    const voiceId = agent.voice_id || '21m00Tcm4TlvDq8ikWAM';
    const elevenLabsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_turbo_v2&output_format=ulaw_8000`;

    console.log('[TTS] Connecting to ElevenLabs...');
    elevenLabsSocket = new WebSocket(elevenLabsUrl);

    elevenLabsSocket.on('open', () => {
      const initPayload = {
        text: ' ',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
        generation_config: {
          chunk_length_schedule: [120, 160, 250, 290],
        },
        xi_api_key: process.env.ELEVENLABS_API_KEY,
      };

      elevenLabsSocket.send(JSON.stringify(initPayload));
    });

    elevenLabsSocket.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        const audioBase64 = response.audio;

        if (audioBase64) {
          isPlaying = true;
          ws.send(
            JSON.stringify({
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: audioBase64,
              },
            })
          );
        }

        if (response.isFinal) {
          console.log('[TTS] Final audio chunk received.');
          isPlaying = false;
          saveAssistantResponse(lastAssistantResponse);
        }
      } catch (err) {
        console.error('[TTS] Error parsing message:', err.message);
      }
    });

    elevenLabsSocket.on('error', (err) => {
      console.error('[TTS] ElevenLabs error:', err.message);
    });

    elevenLabsSocket.on('close', () => {
      console.log('[TTS] ElevenLabs closed.');
    });
  }

  function sendTextToTTS(text) {
    if (elevenLabsSocket && elevenLabsSocket.readyState === WebSocket.OPEN) {
      console.log(`[TTS] Streaming text chunk: "${text.trim()}"`);
      elevenLabsSocket.send(
        JSON.stringify({
          text: text,
          try_trigger_generation: true,
        })
      );
    }
  }

  function closeTTSSubmission() {
    if (elevenLabsSocket && elevenLabsSocket.readyState === WebSocket.OPEN) {
      elevenLabsSocket.send(
        JSON.stringify({
          text: '',
        })
      );
    }
  }

  // Persist Assistant response
  async function saveAssistantResponse(text) {
    if (!text.trim() || !callSid) return;

    console.log(`[Conversation] Assistant response generated: "${text}"`);
    
    // Save Assistant turn to Shared Redis space
    await addToConversation(callSid, 'assistant', text);

    if (callRecord) {
      supabase
        .from('call_logs')
        .insert({
          call_id: callRecord.id,
          user_id: callRecord.user_id,
          type: 'ai_response',
          content: text,
          timestamp_ms: Date.now(),
        })
        .catch(console.error);
    }
  }

  // Handle Twilio Webhook Events
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.event) {
        case 'start':
          streamSid = data.start.streamSid;
          callSid = data.start.callSid;
          console.log(`[MediaStream] Stream started. streamSid: ${streamSid}, callSid: ${callSid}`);
          
          const { data: callObj } = await supabase
            .from('calls')
            .select('id, user_id')
            .eq('twilio_call_sid', callSid)
            .single();

          callRecord = callObj;
          break;

        case 'media':
          const rawAudioBase64 = data.media.payload;
          if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            const buffer = Buffer.from(rawAudioBase64, 'base64');
            deepgramSocket.send(buffer);
          }
          break;

        case 'stop':
          console.log('[MediaStream] Twilio stream stop event.');
          break;
      }
    } catch (err) {
      console.error('[MediaStream] Error handling Twilio event:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('[MediaStream] Client disconnected. Cleaning up connections...');
    if (deepgramSocket) deepgramSocket.close();
    if (elevenLabsSocket) elevenLabsSocket.close();
    if (currentOpenAIController) currentOpenAIController.abort();
  });

  loadAgent();
}

module.exports = {
  handleMediaStream,
};
