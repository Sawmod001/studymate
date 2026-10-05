# Real-World Validation Plan

## 1. NAIC Requirement

For Voice-First Access, target **50+ documented real user interactions**.

## 2. Validation Goal

Measure whether learners can:
- Ask a question by voice.
- Get an accurate transcript.
- Receive a useful explanation.
- Understand the response.
- Continue learning.

## 3. Interaction Log

Record only minimum necessary information.

Suggested fields:

```text
interaction_id
date
language
input_type
subject
academic_level
transcription_success
answer_usefulness
answer_clarity
user_correction
feedback
```

Do not collect names, phone numbers, student IDs, or raw audio unless genuinely necessary and properly consented.

## 4. Suggested User Feedback

After each interaction:

**Was your question transcribed correctly?**
- Yes
- Partly
- No

**Was the explanation useful?**
- 1
- 2
- 3
- 4
- 5

**Could you understand the explanation?**
- Yes
- Partly
- No

**Would you use this study assistant again?**
- Yes
- No

## 5. Validation Targets

Minimum:
- 50 interactions.
- Multiple users.
- At least two supported languages if feasible.
- Multiple academic topics.
- Voice interactions, not only typed questions.

Better evidence:
- 50+ interactions.
- 10+ unique users.
- Before/after transcript correction counts.
- Average usefulness score.
- Common failure categories.
- Improvements made after testing.

## 6. Evidence
Save:
- Anonymized interaction CSV.
- Screenshots.
- Short feedback summary.
- Testing notes.
- Before/after improvements.

## 7. Evaluation Summary

Calculate:
- ASR success rate.
- Average usefulness.
- Average clarity.
- Repeated-use intent.
- Most common error.
- Most common requested subject.

Never fabricate validation numbers.
