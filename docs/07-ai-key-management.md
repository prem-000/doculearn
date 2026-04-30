# AI Key Management — Gemini Chaining + Ollama Fallback

---

## 1. Key Chaining Algorithm

```
ALGORITHM: KeyRotator

INIT:
  keys = load_user_keys_from_supabase()  // decrypted on server
  cooldowns = load_key_cooldowns(keys)

FUNCTION get_available_key():
  for key in keys:
    if cooldowns[key.index] < now():
      return key
  return None  // all exhausted

FUNCTION call_with_rotation(prompt):
  for attempt in range(len(keys)):
    key = get_available_key()
    
    if key is None:
      if ollama_configured():
        return call_ollama(prompt)
      else:
        return error("ALL_KEYS_EXHAUSTED", retry_after=min_cooldown_remaining())
    
    try:
      response = call_gemini(prompt, key.value)
      increment_request_count(key.index)
      return response
    
    except RateLimitError (429):
      set_cooldown(key.index, minutes=60)
      continue
    
    except AuthError (401):
      mark_key_invalid(key.index)
      continue
  
  return error("ALL_KEYS_FAILED")
```

---

## 2. Key Storage in Supabase

```sql
-- api_key_usage table
-- Keys are encrypted at rest using pgcrypto

SELECT pgp_sym_decrypt(gemini_keys_encrypted, app_secret)
FROM user_settings
WHERE user_id = :device_id;  -- device/session identifier
```

### Security Measures

Keys are:
- ✅ Encrypted with `pgp_sym_encrypt` before storage
- ✅ Decrypted only in the Next.js API route (server-side)
- ✅ Never exposed to the browser
- ✅ Identified by sha256 hash in cooldown tracking (not raw key)

---

## 3. Supabase Cooldown Table

**Table**: `api_key_usage`

```sql
CREATE TABLE api_key_usage (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL,       -- device/session identifier
  key_index        INT,
  key_hash         TEXT,       -- sha256(key) for identification
  status           TEXT,       -- 'available' | 'cooldown' | 'invalid'
  cooldown_until   TIMESTAMP,
  request_count    INT DEFAULT 0,
  error_count      INT DEFAULT 0,
  last_used        TIMESTAMP,
  last_error       TEXT
);
```

---

## 4. Ollama Integration

### Setup

1. User provides: `http://localhost:11434` in settings
2. App tests connection via: `GET {ollama_url}/api/tags`
3. Response: `{ "models": [{"name": "llama3:8b"}, ...] }`
4. User selects preferred model from dropdown

### Request Format

```
POST {ollama_url}/api/chat

{
  "model": "llama3:8b",
  "messages": [
    {"role": "system", "content": system_prompt},
    {"role": "user",   "content": user_prompt}
  ],
  "stream": true
}
```

### Trigger Conditions

1. All Gemini keys in cooldown → auto-switch to Ollama
2. User manually selects Ollama in model picker
3. User sets Ollama as default in settings

### UI Indicator

Model badge always visible in chatbot header:
- `"Gemini (Key 2)"`
- `"Ollama (llama3:8b)"`
- `"Auto"`

---

## 5. Key Rotation Flow

```
User asks question
       ↓
KeyRotator.get_available_key()
       ↓
Key 1 available? → Use Key 1
       ↓
Call Gemini API
       ↓
Rate limit (429)? → Mark Key 1 cooldown (60 min)
       ↓
KeyRotator.get_available_key()
       ↓
Key 2 available? → Use Key 2
       ↓
Call Gemini API
       ↓
Success → Return response
```

---

## 6. Cooldown Management

### Automatic Cooldown

- **Trigger**: HTTP 429 (Rate Limit Exceeded)
- **Duration**: 60 minutes (configurable)
- **Action**: Mark key as `cooldown`, set `cooldown_until` timestamp

### Manual Cooldown

- **Trigger**: User clicks "Pause Key" in settings
- **Duration**: User-specified (default 60 min)
- **Action**: Same as automatic

### Cooldown Reset

- **Automatic**: When `cooldown_until < now()`
- **Manual**: User clicks "Resume Key" in settings

---

## 7. Error Handling

### Rate Limit (429)

```javascript
{
  error: "RATE_LIMIT_EXCEEDED",
  key_index: 0,
  cooldown_until: "2025-01-15T14:30:00Z",
  next_available_key: 1,
  action: "auto_rotated"
}
```

### All Keys Exhausted

```javascript
{
  error: "ALL_KEYS_EXHAUSTED",
  retry_after_seconds: 45,
  ollama_available: true,
  action: "switched_to_ollama"
}
```

### Ollama Unreachable

```javascript
{
  error: "OLLAMA_UNREACHABLE",
  ollama_url: "http://localhost:11434",
  suggestion: "Check if Ollama is running locally"
}
```

### Invalid Key (401)

```javascript
{
  error: "INVALID_API_KEY",
  key_index: 0,
  action: "marked_invalid",
  suggestion: "Update API key in settings"
}
```

---

## 8. User Settings UI

### API Keys Section

```
┌─────────────────────────────────────────┐
│ Gemini API Keys                         │
├─────────────────────────────────────────┤
│ Key 1: AIza...xyz  [Active]   [Remove] │
│ Key 2: AIza...abc  [Cooldown] [Resume] │
│ Key 3: AIza...def  [Invalid]  [Update] │
│                                         │
│ [+ Add New Key]                         │
└─────────────────────────────────────────┘
```

### Ollama Section

```
┌─────────────────────────────────────────┐
│ Ollama (Local AI)                       │
├─────────────────────────────────────────┤
│ Base URL: http://localhost:11434        │
│ Status: ● Connected                     │
│ Model: llama3:8b ▼                      │
│                                         │
│ [Test Connection]                       │
└─────────────────────────────────────────┘
```

### Default Model

```
┌─────────────────────────────────────────┐
│ Default AI Model                        │
├─────────────────────────────────────────┤
│ ○ Auto (Gemini with Ollama fallback)   │
│ ○ Gemini Only                           │
│ ○ Ollama Only                           │
└─────────────────────────────────────────┘
```

---

**Next**: See `08-data-models.md` for complete database schemas.
