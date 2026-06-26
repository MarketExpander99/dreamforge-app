const bad = `{"label": "Fine-Tuning Pretrained LLMs Using LoRA", "short_description": "LoRA, or Low-Rank Adaptation, enables efficient fine-tuning of large language models by training only small low-rank matr`;

function mapExplorationToLessonCard(exploration, index) {
  let label = exploration?.label;
  let shortDesc = exploration?.short_description;

  const tryUnwrap = (val) => {
    if (!val) return null;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("{") && trimmed.includes('"label"') && trimmed.includes("short_description")) {
        try {
          const obj = JSON.parse(trimmed);
          if (obj && typeof obj === "object" && obj.label && obj.short_description !== undefined) {
            return { label: obj.label, short_description: obj.short_description };
          }
        } catch {}
        // Robust fallback for truncated JSON strings that were stored as the raw object (parse fails but pattern matches)
        // Does not split lesson text on internal commas.
        const key = '"short_description": "';
        const idx = trimmed.indexOf(key);
        if (idx !== -1) {
          let rest = trimmed.substring(idx + key.length);
          const closingPatterns = ['", "', '"}', '",', '"}', '"'];
          let endPos = rest.length;
          for (const p of closingPatterns) {
            const pIdx = rest.indexOf(p);
            if (pIdx !== -1 && pIdx < endPos) endPos = pIdx;
          }
          let extracted = rest.substring(0, endPos).trim();
          if (extracted.includes('",') || extracted.includes('"}')) {
            extracted = extracted.split('",')[0].split('"}')[0];
          }
          if (extracted.length > 3) {
            return { label: label || 'unwrapped', short_description: extracted.replace(/\\"/g, '"') };
          }
        }
      }
      return null;
    }
    if (typeof val === "object" && val.label && val.short_description !== undefined) {
      return { label: val.label, short_description: val.short_description };
    }
    return null;
  };

  const unwrapped = tryUnwrap(shortDesc) || tryUnwrap(exploration);
  if (unwrapped) {
    if (unwrapped.label) label = unwrapped.label;
    if (unwrapped.short_description !== undefined) shortDesc = unwrapped.short_description;
  }
  return {
    title: label || "Learning Topic",
    content: (typeof shortDesc === "string" ? shortDesc : "") || ""
  };
}

const exp = { label: "Fine-Tuning Pretrained LLMs Using LoRA", short_description: bad };
const result = mapExplorationToLessonCard(exp, 0);
console.log("Title:", result.title);
console.log("Content:", result.content);
console.log("Avoided raw?", !result.content.includes('"label"'));
console.log("Starts with clean lesson?", result.content.startsWith("LoRA, or Low-Rank"));
