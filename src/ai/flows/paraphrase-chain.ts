'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a chain of paraphrased sentences.
 *
 * The flow takes an original sentence and a number of paraphrase iterations as input.
 * It then uses the Gemini API to paraphrase the sentence multiple times, creating a chain of paraphrased sentences.
 * The final paraphrased sentence is returned as output.
 *
 * @param {ParaphraseChainInput} input - The input to the flow, including the original sentence and number of iterations.
 * @returns {Promise<ParaphraseChainOutput>} - A promise that resolves to the final paraphrased sentence.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParaphraseChainInputSchema = z.object({
  originalSentence: z.string().describe('The original sentence to paraphrase.'),
  numIterations: z.number().describe('The number of times to paraphrase the sentence.'),
});

export type ParaphraseChainInput = z.infer<typeof ParaphraseChainInputSchema>;

const ParaphraseChainOutputSchema = z.object({
  finalSentence: z.string().describe('The final paraphrased sentence after multiple iterations.'),
});

export type ParaphraseChainOutput = z.infer<typeof ParaphraseChainOutputSchema>;

export async function generateParaphraseChain(input: ParaphraseChainInput): Promise<ParaphraseChainOutput> {
  return paraphraseChainFlow(input);
}

const paraphrasePrompt = ai.definePrompt({
  name: 'paraphrasePrompt',
  input: {schema: z.object({sentence: z.string()})},
  output: {schema: z.object({paraphrasedSentence: z.string()})},
  prompt: `Paraphrase the following sentence in Vietnamese:

  {{sentence}}
  `,
});

const paraphraseChainFlow = ai.defineFlow(
  {
    name: 'paraphraseChainFlow',
    inputSchema: ParaphraseChainInputSchema,
    outputSchema: ParaphraseChainOutputSchema,
  },
  async input => {
    let currentSentence = input.originalSentence;

    for (let i = 0; i < input.numIterations; i++) {
      const {output} = await paraphrasePrompt({sentence: currentSentence});
      currentSentence = output!.paraphrasedSentence;
    }

    return {finalSentence: currentSentence};
  }
);
