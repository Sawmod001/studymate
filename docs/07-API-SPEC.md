# API Specification

## POST /api/study

### Request
```json
{
  "question": "Explain photosynthesis",
  "language": "en-NG",
  "academicLevel": "secondary",
  "subject": "Biology",
  "mode": "explain"
}
```

### Response
```json
{
  "success": true,
  "lesson": {
    "id": "uuid",
    "title": "Photosynthesis",
    "explanation": "...",
    "keyPoints": [],
    "example": "...",
    "commonMistake": "...",
    "practiceQuestion": {}
  }
}
```

## POST /api/voice

### Request
Multipart form:
```text
audio
language
academicLevel
subject
mode
```

### Response
```json
{
  "success": true,
  "transcript": "...",
  "language": "yo",
  "lesson": {}
}
```

## POST /api/quiz

### Request
```json
{
  "lessonId": "uuid",
  "answers": {}
}
```

### Response
```json
{
  "score": 4,
  "total": 5,
  "feedback": []
}
```

## GET /api/history

Returns the current anonymous user's study history.

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "NATLAS_UNAVAILABLE",
    "message": "The AI service is temporarily unavailable."
  }
}
```

Never expose API keys, stack traces, provider secrets, or internal infrastructure details.
