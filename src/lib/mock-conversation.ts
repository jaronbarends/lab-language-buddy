import type { LanguageCode } from "@/lib/languages";
import type { LiveTranscript } from "@/lib/session-reducer";

/**
 * Stage 1 only. Canned content so every screen and turn state is reachable with no
 * network, no API keys and no microphone. Deleted once the real drivers land in
 * stages 2 and 3.
 *
 * There's a set per language purely so the mock doesn't show Norwegian to someone who
 * picked Spanish — it's throwaway text, not a translation effort. The Norwegian lines
 * are the ones from the reference screenshots, which makes the two directly
 * comparable while the layout is being judged.
 */
type MockScript = {
  aiLines: string[];
  userLines: string[];
};

const MOCK_SCRIPTS: Record<LanguageCode, MockScript> = {
  no: {
    aiLines: [
      "Hei! Det er så fint vær ute i dag, ikke sant? Jeg pleier ofte å gå en tur i parken når solen skinner, for det gir meg så mye energi. Liker du å være mye ute når det er fint vær?",
      "Det er helt sant, det finnes jo ikke dårlig vær hvis man har gode klær! Jeg synes også det er forfriskende med en gåtur i regnet av og til, så lenge man holder seg tørr. Pleier du å gå turer i skogen eller liker du deg best i byen?",
      "Å, det forstår jeg veldig godt! Det er så deilig å kjenne på den friske luften oppe i fjellet, og man får jo helt ro i sjelen der. Har du noen favorittsteder i fjellet som du pleier å besøke?",
    ],
    userLines: [
      "Jeg liker å gå ute når det er fint vær. Jeg liker å gå på tur selv om det regner.",
      "Jeg liker best å gå ute i naturen. Jeg foretrekker fjellet og skogen.",
    ],
  },
  nl: {
    aiLines: [
      "Hoi! Wat een lekker weer vandaag, vind je niet? Ik loop graag een rondje door het park als de zon schijnt. Ben jij ook veel buiten als het mooi weer is?",
      "Dat is waar, er bestaat geen slecht weer, alleen slechte kleding! Ik vind een wandeling in de regen ook wel verfrissend. Loop je liever in het bos of blijf je liever in de stad?",
      "Dat begrijp ik heel goed! De frisse lucht buiten de stad doet echt iets met je. Heb je een vaste plek waar je graag naartoe gaat?",
    ],
    userLines: [
      "Ik ben graag buiten als het mooi weer is. Ik loop ook als het regent.",
      "Ik ben het liefst in de natuur. Ik houd van het bos en de bergen.",
    ],
  },
  fr: {
    aiLines: [
      "Salut ! Il fait vraiment beau aujourd'hui, tu ne trouves pas ? J'aime bien me promener dans le parc quand il y a du soleil. Et toi, tu sors souvent quand il fait beau ?",
      "C'est tellement vrai, il n'y a pas de mauvais temps, seulement de mauvais vêtements ! Une promenade sous la pluie peut être agréable aussi. Tu préfères la forêt ou la ville ?",
      "Je te comprends très bien ! L'air frais de la montagne fait vraiment du bien. Tu as un endroit préféré où tu retournes souvent ?",
    ],
    userLines: [
      "J'aime sortir quand il fait beau. J'aime aussi marcher sous la pluie.",
      "Je préfère la nature. J'aime la montagne et la forêt.",
    ],
  },
  de: {
    aiLines: [
      "Hallo! Das Wetter ist heute richtig schön, findest du nicht? Ich gehe gern im Park spazieren, wenn die Sonne scheint. Bist du auch viel draußen, wenn das Wetter gut ist?",
      "Das stimmt, es gibt kein schlechtes Wetter, nur schlechte Kleidung! Ein Spaziergang im Regen ist auch mal erfrischend. Gehst du lieber in den Wald oder bleibst du in der Stadt?",
      "Das verstehe ich sehr gut! Die frische Luft in den Bergen tut wirklich gut. Hast du einen Lieblingsort, den du oft besuchst?",
    ],
    userLines: [
      "Ich bin gern draußen, wenn das Wetter schön ist. Ich gehe auch im Regen spazieren.",
      "Am liebsten bin ich in der Natur. Ich mag die Berge und den Wald.",
    ],
  },
  it: {
    aiLines: [
      "Ciao! Oggi c'è proprio un bel tempo, non trovi? Mi piace fare una passeggiata al parco quando c'è il sole. Anche tu stai spesso all'aperto quando il tempo è bello?",
      "È verissimo, non esiste cattivo tempo, solo vestiti sbagliati! Anche una passeggiata sotto la pioggia può essere piacevole. Preferisci il bosco o la città?",
      "Ti capisco benissimo! L'aria fresca di montagna fa davvero bene. Hai un posto preferito dove torni spesso?",
    ],
    userLines: [
      "Mi piace stare fuori quando c'è bel tempo. Cammino anche quando piove.",
      "Preferisco la natura. Mi piacciono la montagna e il bosco.",
    ],
  },
  es: {
    aiLines: [
      "¡Hola! Hace muy buen tiempo hoy, ¿no crees? Me gusta pasear por el parque cuando hace sol. ¿Tú también sales mucho cuando hace buen tiempo?",
      "Es totalmente cierto, no hay mal tiempo, solo ropa inadecuada. Un paseo bajo la lluvia también puede ser agradable. ¿Prefieres el bosque o la ciudad?",
      "¡Te entiendo perfectamente! El aire fresco de la montaña sienta muy bien. ¿Tienes algún lugar favorito al que sueles volver?",
    ],
    userLines: [
      "Me gusta salir cuando hace buen tiempo. También camino cuando llueve.",
      "Prefiero la naturaleza. Me gustan la montaña y el bosque.",
    ],
  },
};

/** Cycles, so the conversation never runs out during a long look-around. */
export function mockAiLine(language: LanguageCode, aiTurnIndex: number): string {
  const { aiLines } = MOCK_SCRIPTS[language];
  return aiLines[aiTurnIndex % aiLines.length];
}

export function mockUserLine(
  language: LanguageCode,
  userTurnIndex: number,
): string {
  const { userLines } = MOCK_SCRIPTS[language];
  return userLines[userTurnIndex % userLines.length];
}

/** Words still in flight when Deepgram hasn't settled on them yet. */
const INTERIM_WINDOW = 3;

/**
 * Rebuilds what a live transcript looks like partway through an utterance: a settled
 * prefix plus a trailing few words that are still provisional. Shaped to match
 * Deepgram's `is_final` split so the component consuming it doesn't change in stage 3.
 */
export function mockTranscriptAt(
  sentence: string,
  spokenWordCount: number,
): LiveTranscript {
  const words = sentence.split(" ");
  const heard = words.slice(0, spokenWordCount);
  const finalizedCount = Math.max(0, heard.length - INTERIM_WINDOW);

  return {
    finalized: heard.slice(0, finalizedCount).join(" "),
    interim: heard.slice(finalizedCount).join(" "),
  };
}

export function wordCountOf(sentence: string): number {
  return sentence.split(" ").length;
}
