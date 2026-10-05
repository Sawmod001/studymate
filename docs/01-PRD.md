# N-ATLAS StudyMate — Product Requirements Document

## 1. Product
**Name:** N-ATLAS StudyMate  
**Positioning:** A voice-first multilingual AI study assistant built around Nigeria's N-ATLAS language AI stack.

## 2. Problem
Many Nigerian learners can understand academic concepts better when explanations are simple, conversational, and available in familiar Nigerian languages. Existing AI study tools often assume strong English literacy and stable text-based interaction.

StudyMate lets a learner ask an academic question by voice or text, receive an understandable explanation, practice with questions, and request simpler or multilingual explanations.

## 3. NAIC Problem Statement
**Primary target:** Voice-First Access.

The solution is designed around the challenge's education/learning use case:
1. Voice/text input from learner.
2. Official N-ATLAS ASR service/model for supported speech.
3. N-ATLAS language model for educational response generation.
4. Low-bandwidth-friendly web interface.
5. Real-world validation with at least 50 documented user interactions.

> Compliance note: the final submission must use the official N-ATLAS ASR service/access mechanism required by the challenge. Do not claim compliance from a generic Whisper deployment.

## 4. Target Users
- Secondary-school students.
- University students.
- Learners who prefer Yoruba, Hausa, Igbo, or Nigerian-accented English.
- Teachers/peer tutors testing multilingual explanations.

## 5. MVP Features
### Core
- Voice question.
- Text question.
- Language selection.
- Academic level selection.
- Subject/topic input.
- AI explanation.
- Step-by-step explanation.
- Simple explanation.
- Example.
- Practice question.
- Quiz mode.
- Answer explanation.
- Conversation/session history.

### Voice
- Record audio in browser.
- Send audio to backend.
- N-ATLAS ASR transcription.
- Show transcript before/alongside answer.
- Generate answer with N-ATLAS.
- Allow user to correct transcript when needed.

### Language
- Yoruba.
- Hausa.
- Igbo.
- Nigerian English.
- English fallback where appropriate.

## 6. Learning Modes
- Explain
- Explain Simply
- Step-by-Step
- Give Example
- Practice
- Quiz
- Translate/Explain in Selected Language

## 7. Non-Goals
Do not add during MVP:
- Autonomous agents.
- RAG/vector database.
- Fine-tuning unless the selected submission track explicitly requires it.
- Payments.
- Social networking.
- Complex teacher dashboards.
- Native mobile apps.
- TTS.
- Production-scale enterprise tenancy.
- A second general-purpose LLM as fallback generation.

## 8. Success Criteria
- Working deployed application.
- Genuine N-ATLAS integration.
- Voice interaction works for supported language(s).
- At least 50 documented real interactions for Voice-First validation.
- Clear technical documentation.
- 3–5 minute demonstration video.
- Evidence mapped to all seven NAIC requirements.
- No unsupported claims about N-ATLAS.

## 9. Product Principle
**Make learning easier, not the AI more complicated.**
