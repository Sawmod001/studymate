# UI / UX Specification

## Design Direction
Clean, modern, education-first interface.

Priorities:
1. Voice interaction should be obvious.
2. The user should reach the first question quickly.
3. Avoid dashboard overload.
4. Mobile-first.
5. Low-bandwidth friendly.

## 1. Landing Page `/`
Sections:
- Hero.
- Short explanation.
- "Ask by Voice" CTA.
- "Ask by Text" CTA.
- Supported languages.
- How it works.
- Validation/impact section.
- Footer.

## 2. Study Page `/study`
Main interface:
- Language selector.
- Academic level selector.
- Subject.
- Voice recorder.
- Text input.
- Ask button.
- Transcript preview.
- AI answer card.
- Key points.
- Example.
- Common mistake.
- Practice question.
- Quick actions.

Quick actions:
- Explain simpler.
- Step-by-step.
- Give another example.
- Explain in another language.
- Practice this.

## 3. Lesson Page `/learn/[id]`
- Question.
- Transcript if voice.
- Explanation.
- Key points.
- Example.
- Practice question.
- Related actions.

## 4. Quiz Page `/quiz/[id]`
- Question.
- Four options.
- Submit.
- Score.
- Explanation.

## 5. History `/history`
- Recent lessons.
- Language.
- Subject.
- Date.
- Open lesson.

## Voice Recorder States
- Idle.
- Recording.
- Processing.
- Transcribing.
- Generating answer.
- Complete.
- Error.

## Accessibility
- Keyboard support.
- Visible focus states.
- Large touch targets.
- Readable text.
- Clear error messages.
- Do not rely on color alone.
