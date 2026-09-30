export function splitSentences(text) {

  if (!text) return [];

  const sentences = text
    .match(/[^.!?]+[.!?]+/g);


  return sentences
    ? sentences.map(sentence => sentence.trim())
    : [text.trim()];

}