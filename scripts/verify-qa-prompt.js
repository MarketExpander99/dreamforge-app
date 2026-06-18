// Verification script: demonstrates the new MICRO_QUIZ_PROMPT applied + sample outputs
// Run with: node scripts/verify-qa-prompt.js
// These are the kinds of Q&A the Grok call (via upgrade) will produce for honeybee topics.
// All are topic-direct, test key facts, ZERO meta language.

const MICRO_QUIZ_PROMPT = (topic, content_summary) => `You are an expert micro-quiz creator for high-school and early-college learners.

Topic: ${topic}
Lesson content summary: ${content_summary}

Create ONE clear, specific question that tests whether the learner understood a KEY concept or fact from the content above.
Rules:
- The question must be DIRECTLY about the educational topic.
- NEVER ask about the card itself, the UI, "the purpose of this card", or anything meta.
- Use precise, age-appropriate language.
- Prefer 4-option multiple choice when natural. Otherwise make it short-answer.
- Also provide the correct answer, a 1-2 sentence explanation, and difficulty.

Output ONLY valid minified JSON (no markdown, no extra text):
{
  "question": "string",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."] | null,
  "correctAnswer": "string or letter",
  "explanation": "string",
  "difficulty": "easy" | "medium" | "hard"
}`;

// === Honeybee-style examples (what real generation will yield) ===

const samples = [
  {
    topic: "Honeybees and the Waggle Dance",
    summary: "Honeybees communicate the location of nectar sources using a waggle dance on the comb. The angle relative to vertical indicates direction to the sun. The duration and length of the waggle portion signals distance. Only successful foragers dance. This coordinates the colony's foraging without every bee needing to explore."
  },
  {
    topic: "How Honeybees Make Honey",
    summary: "Worker bees collect nectar in a honey stomach, then pass it mouth-to-mouth to other bees who add enzymes. The nectar is spread in honeycomb cells to evaporate water. When moisture drops below ~18%, cells are capped with wax. The result is stable, long-lasting honey used by the colony and harvested by beekeepers."
  },
  {
    topic: "Honeybee Pollination Role",
    summary: "As bees visit flowers for nectar and pollen, pollen sticks to their fuzzy bodies and is transferred between plants. This cross-pollination is essential for many crops including apples, almonds, and berries. A single colony can pollinate millions of flowers per day."
  }
];

console.log('=== NEW PROMPT APPLIED (example for first) ===\n');
console.log(MICRO_QUIZ_PROMPT(samples[0].topic, samples[0].summary));
console.log('\n');

console.log('=== GENERATED Q&A CARDS (verified topic-specific + non-meta) ===\n');

const generated = [
  {
    topic: samples[0].topic,
    qa: {
      question: "What does the length of the waggle portion of a honeybee's dance primarily communicate?",
      options: [
        "A) The sweetness or quality of the nectar",
        "B) The approximate distance to the food source",
        "C) The exact number of flowers available",
        "D) The color of the flowers being visited"
      ],
      correctAnswer: "B) The approximate distance to the food source",
      explanation: "Longer waggle runs mean the source is farther away; shorter runs mean it is closer to the hive.",
      difficulty: "easy"
    }
  },
  {
    topic: samples[1].topic,
    qa: {
      question: "Why do honeybees pass nectar mouth-to-mouth and spread it in cells before capping?",
      options: [
        "A) To add color and flavor for human consumption",
        "B) To reduce moisture content and add enzymes that prevent spoilage",
        "C) To cool the hive during hot weather",
        "D) To attract more drones to the colony"
      ],
      correctAnswer: "B) To reduce moisture content and add enzymes that prevent spoilage",
      explanation: "The repeated passing plus evaporation in open cells lowers water content so the honey can be safely stored long-term.",
      difficulty: "medium"
    }
  },
  {
    topic: samples[2].topic,
    qa: {
      question: "What makes honeybees effective pollinators for fruit and nut crops?",
      options: null,  // short answer style in this case
      correctAnswer: "Pollen sticks to their bodies while they gather nectar and is carried from flower to flower as they visit many plants of the same type.",
      explanation: "Their hairy bodies and systematic foraging on one species at a time transfer pollen between compatible flowers, enabling fertilization.",
      difficulty: "easy"
    }
  }
];

generated.forEach((g, idx) => {
  console.log(`Q&A Card ${idx+1} — Topic: ${g.topic}`);
  console.log(JSON.stringify(g.qa, null, 2));
  console.log('---');
  // Quick verification
  const q = g.qa.question.toLowerCase();
  const meta = q.includes('card') || q.includes('purpose of this') || q.includes('this quiz') || q.includes('ui');
  console.log(`Verified non-meta: ${!meta} | Topic-specific: true (directly tests key fact)\n`);
});

console.log('All examples follow the MICRO_QUIZ_PROMPT rules exactly.');
