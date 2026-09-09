1. AI Scam/Fraud Message Detector (fintech-adjacent, social impact, AI/ML)
User pastes a suspicious SMS/WhatsApp/email text or screenshot. AI flags scam probability, explains why in plain language (and ideally in a regional language), and logs it to a shared pattern database so the tool gets smarter with more reports.

Tech: a pretrained LLM call (few-shot prompted for scam classification + explanation) + a simple Supabase/Firebase table for the "community reported patterns" angle. This alone gives you a Scalability story for free — "grows smarter as more people use it."
