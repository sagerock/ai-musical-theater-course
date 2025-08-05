# 🔒 AI Model Privacy & Data Usage Summary

This page outlines how the four large language models (LLMs) used in our platform handle **data privacy, retention, and training**. We’ve prioritized tools that protect **student and teacher data** by default.

---

## ✅ Quick Comparison

| Provider     | Trains on API Data? | Trains on Web App Data? | Data Retention         | Opt-Out Available? |
|--------------|---------------------|--------------------------|------------------------|---------------------|
| **OpenAI**   | ❌ No (default)      | ❌ No (Team/Enterprise)   | 30 days or less        | Not needed (off by default) |
| **Anthropic**| ❌ No (default)      | ❌ No (Claude Pro)        | 30 days or less        | Yes (feedback-based) |
| **Gemini**   | ❌ No (Workspace/Edu)| ✅ Yes (consumer Gemini)  | Session-only (Edu)     | Not applicable in Edu |
| **Perplexity**| ❌ No (API, Enterprise) | ✅ Yes (public site)   | Zero-day (API), 18 mo default (Web) | Yes (for public use) |

---

## 🔍 Provider Summaries

### 🔵 OpenAI (ChatGPT, API)
- **Enterprise, Team, API, and Edu plans** do **not** use your inputs or outputs to train their models.
- You retain ownership of your data.
- Fine-tuning and connector integrations are private by default.
- Retention: 30 days max (can be reduced).
- [OpenAI Enterprise Privacy](https://openai.com/enterprise-privacy)

---

### 🟢 Anthropic (Claude)
- Claude API and Claude Pro accounts **do not** use your data for training unless explicitly opted in.
- Feedback (e.g., thumbs up/down) may be used to improve safety systems.
- Organizations can disable feedback collection entirely.
- Retention: ~30 days; flagged content up to 2 years.
- [Anthropic Privacy & Training Policy](https://privacy.anthropic.com/en/articles/7996885-how-do-you-use-personal-data-in-model-training)

---

### 🟡 Gemini (Google Workspace)
- In **Google Workspace for Education**, Gemini:
  - Does **not** use your prompts to train models.
  - Does **not** share data outside your domain.
  - Retains prompts only for the session duration (not stored).
- Applies only to Workspace accounts (not consumer Gmail or mobile Gemini apps).
- [Google Workspace Gemini Privacy](https://workspace.google.com/solutions/ai/#security)

---

### 🟠 Perplexity (Sensor/Sonar API)
- **API & Enterprise**: Zero-day retention, no model training on your data.
- **Public app/site**: Collects data by default, but users can opt out.
- Retention (Web): Up to 18 months by default; configurable.
- Opt-out available under settings for individual users.
- [Perplexity FAQ](https://docs.perplexity.ai/faq/faq)

---

## 👩‍🏫 What This Means for Teachers

Our platform uses **API or enterprise-tier access** for all four LLMs, meaning:
- **Your students' data is never used to train these models.**
- **Your prompts and outputs are not retained beyond minimal support needs.**
- **We select providers with strong opt-out policies, or default non-training settings.**
