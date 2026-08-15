const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 8787;
const MAX_API_BASE = process.env.MAX_API_BASE || 'https://platform-api2.max.ru';
const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN;
const MAX_WEBHOOK_SECRET = process.env.MAX_WEBHOOK_SECRET || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const MAX_CA_CERT_PEM = process.env.MAX_CA_CERT_PEM || '';
const MAX_TLS_INSECURE = process.env.MAX_TLS_INSECURE === 'true';
const DAILY_SEND_ENABLED = process.env.DAILY_SEND_ENABLED === 'true';
const DAILY_SECRET = process.env.DAILY_SECRET || '';
const STORAGE_DIR = path.join(__dirname, 'data');
const SUBSCRIBERS_FILE = path.join(STORAGE_DIR, 'max-subscribers.json');
const MEDIA_DIR = path.join(__dirname, 'media');
const MEDIA_FILES = new Map([
  ['hero-balanced.jpg', 'image/jpeg'],
  ['main-menu.jpg', 'image/jpeg'],
  ['program.jpg', 'image/jpeg'],
  ['about-natalia.jpg', 'image/jpeg']
]);
const BUNDLED_MAX_CA_FILE = path.join(__dirname, 'certs', 'russian-trusted-root-ca.pem');
const MAX_CA = MAX_CA_CERT_PEM
  ? MAX_CA_CERT_PEM.replace(/\\n/g, '\n')
  : fs.existsSync(BUNDLED_MAX_CA_FILE)
    ? fs.readFileSync(BUNDLED_MAX_CA_FILE, 'utf8')
    : '';
const MAX_API_AGENT = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 16,
  maxFreeSockets: 4,
  timeout: 30_000
});

function normalizeLink(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
}

// Default every user-facing route to the primary frontend while allowing the
// future Render service to override URLs without editing the bot source.
const MINI_APP_URL = normalizeLink(process.env.MINI_APP_URL || 'https://new-site-kappa-eight.vercel.app/smartslimway');
const SITE_ORIGIN = new URL(MINI_APP_URL).origin;
const APPLICATION_URL = normalizeLink(process.env.APPLICATION_URL || `${SITE_ORIGIN}/application`);
const CALCULATOR_URL = normalizeLink(process.env.CALCULATOR_URL || `${SITE_ORIGIN}/calculator`);
const REVIEWS_URL = normalizeLink(process.env.REVIEWS_URL || `${SITE_ORIGIN}/reviews`);
const ABOUT_URL = normalizeLink(process.env.ABOUT_URL || `${SITE_ORIGIN}/about`);
const MARATHON_URL = normalizeLink(process.env.MARATHON_URL || `${SITE_ORIGIN}/program`);
const FAQ_URL = normalizeLink(process.env.FAQ_URL || `${SITE_ORIGIN}/faq`);
const CONTACTS_URL = normalizeLink(process.env.CONTACTS_URL || `${SITE_ORIGIN}/contacts`);
const HERO_IMAGE_URL = normalizeLink(process.env.HERO_IMAGE_URL || 'https://45-138-157-79.sslip.io/media/hero-balanced.jpg');
const MAIN_MENU_IMAGE_URL = normalizeLink(process.env.MAIN_MENU_IMAGE_URL || 'https://45-138-157-79.sslip.io/media/main-menu.jpg');
const PROGRAM_IMAGE_URL = normalizeLink(process.env.PROGRAM_IMAGE_URL || 'https://45-138-157-79.sslip.io/media/program.jpg');
const ABOUT_IMAGE_URL = normalizeLink(process.env.ABOUT_IMAGE_URL || 'https://45-138-157-79.sslip.io/media/about-natalia.jpg');
const DAILY_PROMPT_TEXT = process.env.DAILY_PROMPT_TEXT || 'Доброе утро ✨\n\nНу что, уже делаешь шаг к своей стройности? 🌿';
const DAILY_WINDOW_LABEL = process.env.DAILY_WINDOW_LABEL || 'с 10:00 до 12:00';
const WEBHOOK_URL = normalizeLink(process.env.WEBHOOK_URL || (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/webhook` : ''));

if (!MAX_BOT_TOKEN) {
  console.error('Missing MAX_BOT_TOKEN');
  process.exit(1);
}

const missingSecrets = [
  ['MAX_WEBHOOK_SECRET', MAX_WEBHOOK_SECRET],
  ['ADMIN_SECRET', ADMIN_SECRET],
  ...(DAILY_SEND_ENABLED ? [['DAILY_SECRET', DAILY_SECRET]] : [])
].filter(([, value]) => !value).map(([name]) => name);
if (missingSecrets.length) {
  console.error(`Missing required secret environment variable(s): ${missingSecrets.join(', ')}`);
  process.exit(1);
}

function ensureStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBSCRIBERS_FILE)) {
    fs.writeFileSync(SUBSCRIBERS_FILE, '[]\n', { encoding: 'utf8', mode: 0o600 });
  }
  fs.chmodSync(SUBSCRIBERS_FILE, 0o600);
}

function readSubscribers() {
  ensureStorage();
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeSubscribers(items) {
  ensureStorage();
  const temporaryFile = `${SUBSCRIBERS_FILE}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporaryFile, `${JSON.stringify(items, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    fs.chmodSync(temporaryFile, 0o600);
    fs.renameSync(temporaryFile, SUBSCRIBERS_FILE);
    fs.chmodSync(SUBSCRIBERS_FILE, 0o600);
  } catch (error) {
    try { fs.unlinkSync(temporaryFile); } catch {}
    throw error;
  }
}

function hasValidSecret(req, headerName, expected) {
  const supplied = req.headers[headerName];
  if (typeof supplied !== 'string' || !expected) return false;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function upsertSubscriber(update) {
  ensureStorage();

  const chatId = update?.chat_id ?? update?.message?.recipient?.chat_id ?? null;
  const userId = update?.user?.user_id ?? update?.user_id ?? update?.message?.recipient?.user_id ?? null;
  const key = chatId != null ? `chat:${chatId}` : userId != null ? `user:${userId}` : null;

  if (!key) return null;

  const items = readSubscribers();
  const now = new Date().toISOString();
  const existing = items.find(item => item.key === key);
  const next = {
    key,
    chatId,
    userId,
    active: existing ? existing.active !== false : true,
    lastSeenAt: now,
    addedAt: existing?.addedAt || now
  };

  if (existing) {
    Object.assign(existing, next);
  } else {
    items.push(next);
  }

  writeSubscribers(items);
  return next;
}

function setSubscriberActive(update, active) {
  ensureStorage();
  const chatId = update?.chat_id ?? update?.message?.recipient?.chat_id ?? null;
  const userId = update?.user?.user_id ?? update?.user_id ?? update?.message?.recipient?.user_id ?? null;
  const key = chatId != null ? `chat:${chatId}` : userId != null ? `user:${userId}` : null;
  if (!key) return null;

  const items = readSubscribers();
  const existing = items.find(item => item.key === key);
  if (!existing) return null;

  existing.active = active;
  existing.lastSeenAt = new Date().toISOString();
  writeSubscribers(items);
  return existing;
}

function activeSubscribers() {
  return readSubscribers().filter(item => item.active !== false);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text)
  });
  res.end(text);
}

function buildKeyboard(buttons) {
  const normalizedButtons = buttons.map(row => row.map(button => {
    if (button.type === 'open_app') {
      return {
        type: 'link',
        text: button.text,
        url: normalizeLink(button.url || MINI_APP_URL)
      };
    }
    if (button.type === 'link') {
      return {
        type: 'link',
        text: button.text,
        url: normalizeLink(button.url)
      };
    }
    if (button.type === 'callback') {
      return {
        type: 'callback',
        text: button.text,
        payload: String(button.payload || '')
      };
    }
    return button;
  }));

  return [{
    type: 'inline_keyboard',
    payload: { buttons: normalizedButtons }
  }];
}

function heroAttachment(url = HERO_IMAGE_URL) {
  const normalized = normalizeLink(url);
  if (!normalized) return [];

  return [{
    type: 'image',
    payload: { url: normalized }
  }];
}

function extractIncomingText(update) {
  return update?.message?.body?.text || update?.text || '';
}

function shouldTriggerStart(update) {
  const type = update?.update_type;
  const text = extractIncomingText(update);
  const normalized = String(text).trim().toLowerCase();

  if (type === 'bot_started') return true;
  if (type === 'message_created' && (normalized === '/start' || normalized === 'start')) return true;
  return false;
}

function startMessage() {
  return {
    text: 'Привет, я Наталья 💫\n\n«Умный путь к стройности» — это сопровождение, контроль, обратная связь и понятные привычки для обычной жизни. Не марафон на силу воли, а система, которую легче поддерживать.\n\nВыбери, с чего начать 👇',
    attachments: [
      ...heroAttachment(MAIN_MENU_IMAGE_URL),
      ...buildKeyboard([
        [{ type: 'link', text: '🧮 Бесплатный расчёт КБЖУ', url: CALCULATOR_URL }],
        [
          { type: 'callback', text: 'О программе', payload: 'marathon' },
          { type: 'callback', text: 'Стоимость', payload: 'price' }
        ],
        [
          { type: 'callback', text: 'Отзывы', payload: 'reviews' },
          { type: 'callback', text: 'О Наталье', payload: 'about' }
        ],
        [{ type: 'link', text: 'Подать заявку', url: APPLICATION_URL }]
      ])
    ],
    format: 'markdown'
  };
}

function calculatorMessage() {
  return {
    text: 'Бесплатно рассчитай ориентир по калориям и КБЖУ 💫\n\nКалькулятор определит базовый обмен, учтёт активность и цель, а затем покажет пример сбалансированного рациона. Расчёт подходит здоровым взрослым и не заменяет консультацию врача.',
    attachments: buildKeyboard([
      [{ type: 'link', text: 'Рассчитать КБЖУ бесплатно', url: CALCULATOR_URL }],
      [{ type: 'callback', text: 'Назад в главное меню', payload: 'start' }]
    ])
  };
}

function aboutMessage() {
  return {
    text: 'Меня зовут Наталья, мне 48 лет. Я дипломированный нутрициолог и наставник 💫\n\nПомогаю выстроить питание без жёстких диет, тревоги и чувства вины. Вместо чужого меню мы разбираемся в продуктах, порциях и сигналах тела — чтобы ты могла уверенно собирать рацион под свою жизнь.',
    attachments: [
      ...heroAttachment(ABOUT_IMAGE_URL),
      ...buildKeyboard([
        [{ type: 'link', text: 'Подробнее о Наталье', url: ABOUT_URL }],
        [{ type: 'callback', text: 'Подробнее о программе', payload: 'marathon' }],
        [{ type: 'callback', text: 'Назад в главное меню', payload: 'start' }]
      ])
    ]
  };
}

function marathonMessage() {
  return {
    text: '«Умный путь к стройности» 💫\n\nСопровождение, контроль, обратная связь и понятные привычки для обычной жизни. Это не марафон на силу воли, а система, которую легче поддерживать.\n\nЧто разбираем:\n• сигналы голода и сытости\n• роль инсулина, лептина и грелина\n• простые и сложные углеводы\n• полезные жиры и белки\n• сбалансированную тарелку и замены продуктов\n• зелень, овощи и питьевой режим\n\nТы учишься выбирать продукты без тревоги и самостоятельно собирать рацион под свой вкус, цель и распорядок дня.',
    attachments: [
      ...heroAttachment(PROGRAM_IMAGE_URL),
      ...buildKeyboard([
        [
          { type: 'callback', text: 'Стоимость', payload: 'price' },
          { type: 'callback', text: 'Отзывы', payload: 'reviews' }
        ],
        [{ type: 'link', text: 'Программа на сайте', url: MARATHON_URL }],
        [{ type: 'link', text: 'Бесплатный расчёт КБЖУ', url: CALCULATOR_URL }],
        [{ type: 'callback', text: 'Подать заявку', payload: 'apply' }],
        [{ type: 'callback', text: 'Назад в главное меню', payload: 'start' }]
      ])
    ]
  };
}

// Keep the legacy callback working, but show the single combined program page.
function insideMessage() {
  return marathonMessage();
}

function priceMessage() {
  return {
    text: 'Стоимость программы — 6 000 ₽ 💫\n\nВ стоимость входят сопровождение, ежедневная обратная связь, разбор рациона, групповой чат и учебные материалы.\n\nГлавный результат — не список блюд, а навык самостоятельно собирать питание, которое подходит тебе.',
    attachments: buildKeyboard([
      [
        { type: 'callback', text: 'Подать заявку', payload: 'apply' },
        { type: 'callback', text: 'О программе', payload: 'marathon' }
      ],
      [
        { type: 'link', text: 'Отзывы на сайте', url: REVIEWS_URL },
        { type: 'link', text: 'Контакты', url: CONTACTS_URL }
      ],
      [{ type: 'callback', text: 'Назад в главное меню', payload: 'start' }]
    ])
  };
}

function reviewsMessage() {
  return {
    text: 'Отзывы участниц ✨\n\nНа сайте собраны истории о формате, поддержке и изменениях в питании. Открой страницу, чтобы посмотреть отзывы и понять, подходит ли тебе программа.',
    attachments: buildKeyboard([
      [
        { type: 'link', text: 'Посмотреть отзывы', url: REVIEWS_URL },
        { type: 'callback', text: 'О программе', payload: 'marathon' }
      ],
      [{ type: 'callback', text: 'Подать заявку', payload: 'apply' }],
      [{ type: 'callback', text: 'Назад в главное меню', payload: 'start' }]
    ])
  };
}

function applyMessage() {
  return {
    text: 'Готова сделать первый шаг? 💫\n\nЗаполни короткую анкету на сайте. Наталья прочитает ответы лично, уточнит твою цель и честно скажет, подходит ли тебе программа.',
    attachments: buildKeyboard([
      [{ type: 'link', text: 'Заполнить анкету', url: APPLICATION_URL }],
      [
        { type: 'callback', text: 'О программе', payload: 'marathon' },
        { type: 'callback', text: 'Стоимость', payload: 'price' }
      ],
      [{ type: 'callback', text: 'Назад в главное меню', payload: 'start' }]
    ])
  };
}

function fallbackMessage() {
  return startMessage();
}

function dailyPromptMessage() {
  return {
    text: `${DAILY_PROMPT_TEXT}\n\nЯ пишу тебе в промежутке ${DAILY_WINDOW_LABEL}, чтобы мягко напомнить о себе 💫`,
    attachments: [
      ...heroAttachment('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80'),
      ...buildKeyboard([
        [
          { type: 'callback', text: 'Да, уже иду к цели', payload: 'daily_yes' }
        ],
        [
          { type: 'callback', text: 'Пока нет', payload: 'daily_no' }
        ],
        [
          { type: 'callback', text: 'Подать заявку', payload: 'apply' }
        ],
        [
          { type: 'callback', text: 'Больше не напоминать', payload: 'unsubscribe_daily' }
        ]
      ])
    ]
  };
}

function praiseMessage() {
  return {
    text: 'Умница 🫶\n\nДаже маленький шаг каждый день даёт большой результат. Продолжай в том же духе — ты себе очень за это спасибо скажешь 💫',
    attachments: [
      ...heroAttachment('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80'),
      ...buildKeyboard([
        [
          { type: 'callback', text: 'О программе', payload: 'marathon' },
          { type: 'callback', text: 'Подать заявку', payload: 'apply' }
        ],
        [
          { type: 'callback', text: 'Больше не напоминать', payload: 'unsubscribe_daily' }
        ]
      ])
    ]
  };
}

function nudgeMessage() {
  return {
    text: 'Ничего страшного 💛\n\nИногда начать сложнее всего. Если хочешь, я помогу сделать это мягко и без срывов.',
    attachments: buildKeyboard([
      [
        { type: 'callback', text: 'О программе', payload: 'marathon' },
        { type: 'callback', text: 'Подать заявку', payload: 'apply' }
      ],
      [{ type: 'link', text: 'Бесплатный расчёт КБЖУ', url: CALCULATOR_URL }],
      [
        { type: 'callback', text: 'Больше не напоминать', payload: 'unsubscribe_daily' }
      ]
    ])
  };
}

function unsubscribedMessage() {
  return {
    text: 'Хорошо, больше не буду присылать утренние напоминания 🌿\n\nЕсли захочешь вернуть их позже — просто нажми кнопку ниже.',
    attachments: buildKeyboard([
      [
        { type: 'callback', text: 'Вернуть напоминания', payload: 'subscribe_daily' }
      ],
      [
        { type: 'callback', text: 'Назад', payload: 'start' }
      ]
    ])
  };
}

function subscribedAgainMessage() {
  return {
    text: 'Готово ✨\n\nЯ снова буду присылать мягкие утренние напоминания.',
    attachments: buildKeyboard([
      [
        { type: 'callback', text: 'О программе', payload: 'marathon' },
        { type: 'callback', text: 'Подать заявку', payload: 'apply' }
      ],
      [
        { type: 'callback', text: 'Назад', payload: 'start' }
      ]
    ])
  };
}

function getResponseByPayload(payload, update) {
  switch (payload) {
    case 'about':
      return aboutMessage();
    case 'calculator':
      return calculatorMessage();
    case 'marathon':
      return marathonMessage();
    case 'inside':
      return insideMessage();
    case 'price':
      return priceMessage();
    case 'reviews':
      return reviewsMessage();
    case 'apply':
      return applyMessage();
    case 'start':
      return startMessage();
    case 'daily_yes':
      return praiseMessage();
    case 'daily_no':
      return nudgeMessage();
    case 'unsubscribe_daily':
      setSubscriberActive(update, false);
      return unsubscribedMessage();
    case 'subscribe_daily':
      upsertSubscriber(update);
      setSubscriberActive(update, true);
      return subscribedAgainMessage();
    default:
      return fallbackMessage();
  }
}

function detectChatTarget(update) {
  if (typeof update?.chat_id === 'number') return { query: `chat_id=${update.chat_id}` };
  if (typeof update?.chat_id === 'string' && update.chat_id.trim()) return { query: `chat_id=${encodeURIComponent(update.chat_id)}` };
  if (typeof update?.message?.recipient?.chat_id === 'number') return { query: `chat_id=${update.message.recipient.chat_id}` };
  if (typeof update?.message?.recipient?.user_id === 'number') return { query: `user_id=${update.message.recipient.user_id}` };
  if (typeof update?.user?.user_id === 'number') return { query: `user_id=${update.user.user_id}` };
  if (typeof update?.user_id === 'number') return { query: `user_id=${update.user_id}` };
  throw new Error('No chat_id or user_id found in update');
}

function buildRecipientQuery(item) {
  if (item.chatId != null) return `chat_id=${encodeURIComponent(item.chatId)}`;
  if (item.userId != null) return `user_id=${encodeURIComponent(item.userId)}`;
  throw new Error('Missing chatId/userId for subscriber');
}

function extractCallbackPayload(update) {
  return update?.callback?.payload
    ?? update?.payload
    ?? update?.message?.callback?.payload
    ?? update?.message?.body?.payload
    ?? null;
}

function extractCallbackId(update) {
  return update?.callback?.callback_id
    ?? update?.callback_id
    ?? update?.message?.callback?.callback_id
    ?? null;
}

function apiRequest(method, pathWithQuery, body) {
  const url = new URL(pathWithQuery, MAX_API_BASE);
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method,
      agent: MAX_API_AGENT,
      headers: {
        Authorization: MAX_BOT_TOKEN,
        'Content-Type': 'application/json',
        Connection: 'keep-alive',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      },
      ...(MAX_CA ? { ca: MAX_CA } : {}),
      ...(MAX_TLS_INSECURE ? { rejectUnauthorized: false } : {})
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`MAX API request failed with status ${res.statusCode}: ${data.slice(0, 500)}`));
        }
      });
    });

    req.setTimeout(15_000, () => {
      req.destroy(new Error('MAX API request timed out'));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function sendMessageByQuery(query, messageBody) {
  const payload = {
    text: messageBody.text,
    notify: true
  };

  if (messageBody.attachments?.length) {
    payload.attachments = messageBody.attachments;
  }

  if (messageBody.format) {
    payload.format = messageBody.format;
  }

  return apiRequest('POST', `/messages?${query}`, payload);
}

function buildOutgoingMessage(messageBody) {
  const message = { text: messageBody.text };
  if (messageBody.attachments) message.attachments = messageBody.attachments;
  if (messageBody.format) message.format = messageBody.format;
  return message;
}

async function answerCallback(update, messageBody) {
  const callbackId = extractCallbackId(update);
  if (!callbackId) {
    console.warn('Callback update has no callback_id; sending a new message as fallback');
    return sendMessageToUpdate(update, messageBody);
  }

  const payload = { message: buildOutgoingMessage(messageBody) };
  try {
    return await apiRequest('POST', `/answers?callback_id=${encodeURIComponent(callbackId)}`, payload);
  } catch (error) {
    // MAX can reject editing an old message (for example after an attachment
    // type change). Keep the button usable by sending the requested screen as
    // a fresh message instead.
    console.warn(`Callback answer failed; sending a fresh message: ${error.message}`);
    return sendMessageToUpdate(update, messageBody);
  }
}

async function sendMessageToUpdate(update, messageBody) {
  const target = detectChatTarget(update);
  return sendMessageByQuery(target.query, messageBody);
}

async function sendDailyPrompts() {
  if (!DAILY_SEND_ENABLED) {
    return { skipped: true, reason: 'DAILY_SEND_ENABLED is false' };
  }

  const recipients = activeSubscribers();
  if (!recipients.length) {
    return { skipped: true, reason: 'No active subscribers found' };
  }

  const results = [];
  for (const item of recipients) {
    try {
      const result = await sendMessageByQuery(buildRecipientQuery(item), dailyPromptMessage());
      results.push({ target: item.key, ok: true, result });
    } catch (error) {
      results.push({ target: item.key, ok: false, error: 'Message delivery failed' });
    }
  }

  return {
    ok: results.every(item => item.ok),
    total: recipients.length,
    sent: results.filter(item => item.ok).length,
    failed: results.filter(item => !item.ok).length,
    results
  };
}

async function handleUpdate(update) {
  upsertSubscriber(update);

  const type = update?.update_type;

  if (shouldTriggerStart(update)) {
    return sendMessageToUpdate(update, startMessage());
  }

  if (type === 'message_callback') {
    const payload = extractCallbackPayload(update);
    return answerCallback(update, getResponseByPayload(payload, update));
  }

  if (type === 'message_created') {
    const text = extractIncomingText(update);
    const normalized = String(text).trim().toLowerCase();

    if (normalized.includes('стоп') || normalized.includes('не напоминай')) {
      setSubscriberActive(update, false);
      return sendMessageToUpdate(update, unsubscribedMessage());
    }

    if (normalized.includes('верни') || normalized.includes('подпиши') || normalized.includes('напоминай')) {
      setSubscriberActive(update, true);
      return sendMessageToUpdate(update, subscribedAgainMessage());
    }

    if (normalized.includes('калор') || normalized.includes('кбжу') || normalized.includes('рассчит')) {
      return sendMessageToUpdate(update, calculatorMessage());
    }

    if (normalized.includes('марафон') || normalized.includes('программ')) {
      return sendMessageToUpdate(update, marathonMessage());
    }

    if (normalized.includes('наталь') || normalized.includes('о тебе') || normalized.includes('о вас')) {
      return sendMessageToUpdate(update, aboutMessage());
    }

    if (normalized.includes('отзыв') || normalized.includes('результ')) {
      return sendMessageToUpdate(update, reviewsMessage());
    }

    if (normalized.includes('стоим') || normalized.includes('цена')) {
      return sendMessageToUpdate(update, priceMessage());
    }

    if (normalized.includes('что входит') || normalized.includes('входит') || normalized.includes('внутри')) {
      return sendMessageToUpdate(update, insideMessage());
    }

    if (normalized.includes('заяв') || normalized.includes('участв') || normalized.includes('хочу')) {
      return sendMessageToUpdate(update, applyMessage());
    }

    return sendMessageToUpdate(update, startMessage());
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true, subscribers: activeSubscribers().length });
  }

  if (req.method === 'GET' && req.url.startsWith('/media/')) {
    const fileName = decodeURIComponent(req.url.slice('/media/'.length).split('?')[0]);
    const contentType = MEDIA_FILES.get(fileName);
    if (!contentType || fileName.includes('/') || fileName.includes('\\')) {
      return sendJson(res, 404, { ok: false, error: 'Not found' });
    }
    const filePath = path.join(MEDIA_DIR, fileName);
    if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: 'Not found' });
    const body = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': body.length,
      'Cache-Control': 'public, max-age=86400'
    });
    return res.end(body);
  }

  if (req.method === 'POST' && req.url === '/webhook') {
    try {
      if (!hasValidSecret(req, 'x-max-bot-api-secret', MAX_WEBHOOK_SECRET)) {
        return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      }

      const update = await parseJsonBody(req);
      sendJson(res, 200, { ok: true });
      handleUpdate(update).catch(error => {
        console.error('Failed to handle update:', error);
      });
      return;
    } catch (error) {
      console.error('Webhook request failed:', error.message);
      return sendJson(res, 400, { ok: false, error: 'Invalid request' });
    }
  }

  if (req.method === 'POST' && req.url === '/register-webhook') {
    try {
      if (!hasValidSecret(req, 'x-admin-secret', ADMIN_SECRET)) {
        return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      }
      if (!WEBHOOK_URL) {
        return sendJson(res, 503, { ok: false, error: 'Webhook is not configured' });
      }
      const body = await parseJsonBody(req);
      const result = await apiRequest('POST', '/subscriptions', {
        url: WEBHOOK_URL,
        update_types: body.update_types || ['bot_started', 'message_created', 'message_callback'],
        secret: MAX_WEBHOOK_SECRET
      });
      return sendJson(res, 200, result);
    } catch (error) {
      console.error('Register webhook failed:', error.message);
      return sendJson(res, 502, { ok: false, error: 'Webhook registration failed' });
    }
  }

  if (req.method === 'POST' && req.url === '/send-daily') {
    try {
      if (!hasValidSecret(req, 'x-daily-secret', DAILY_SECRET)) {
        return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
      }

      const result = await sendDailyPrompts();
      return sendJson(res, 200, result);
    } catch (error) {
      console.error('Daily send failed:', error.message);
      return sendJson(res, 502, { ok: false, error: 'Daily send failed' });
    }
  }

  if (req.method === 'GET' && req.url === '/subscribers') {
    if (!hasValidSecret(req, 'x-admin-secret', ADMIN_SECRET)) {
      return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    }
    return sendJson(res, 200, { total: readSubscribers().length, active: activeSubscribers().length });
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
});

ensureStorage();

server.listen(PORT, () => {
  console.log(`MAX bot webhook listening on http://localhost:${PORT}`);
  console.log(`Mini app URL: ${MINI_APP_URL}`);
  console.log(`Subscribers file: ${SUBSCRIBERS_FILE}`);
  if (WEBHOOK_URL && MAX_WEBHOOK_SECRET) {
    apiRequest('POST', '/subscriptions', {
      url: WEBHOOK_URL,
      update_types: ['bot_started', 'message_created', 'message_callback'],
      secret: MAX_WEBHOOK_SECRET
    }).then(() => console.log(`MAX webhook registered: ${WEBHOOK_URL}`))
      .catch(error => console.error(`MAX webhook registration failed for ${WEBHOOK_URL}:`, error.message));
  } else {
    console.warn('MAX webhook auto-registration skipped: set WEBHOOK_URL');
  }
});

function shutdown(signal) {
  console.log(`Received ${signal}; shutting down`);
  server.close(error => {
    if (error) {
      console.error('Shutdown failed:', error.message);
      process.exitCode = 1;
    }
    process.exit();
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
