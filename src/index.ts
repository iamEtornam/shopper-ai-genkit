import * as z from 'zod';

import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { defineFlow, startFlowsServer } from '@genkit-ai/flow';
import { googleAI } from '@genkit-ai/googleai';
import {firebaseAuth} from "@genkit-ai/firebase/auth";
import {onFlow} from "@genkit-ai/firebase/functions";

// Import models from the Google AI plugin. The Google AI API provides access to
// several generative models. Here, we import Gemini 1.5 Flash.
import { gemini15Flash } from '@genkit-ai/googleai';

configureGenkit({
  plugins: [
    // Load the Google AI plugin. You can optionally specify your API key
    // by passing in a config object; if you don't, the Google AI plugin uses
    // the value from the GOOGLE_GENAI_API_KEY environment variable, which is
    // the recommended practice.
    googleAI(),
  ],
  // Log debug output to tbe console.
  logLevel: 'debug',
  // Perform OpenTelemetry instrumentation and enable trace collection.
  enableTracingAndMetrics: true,
});

export const productTitle = defineFlow({
  name: 'productTitle',
  inputSchema: z.string(),
  outputSchema: z.string(),
  authPolicy: (auth, input) => {
      if (!auth) {
        throw new Error('Authorization required.');
      }
    }
}, 
async (text) => {
	const llmResponse = await generate({
    prompt: [
      {
        text:'Based on this image url attached, generate a product title for the item. it should be simple and short.'
      },
      {
        media: { url: text }
      }
    ],
    model: gemini15Flash,
    config: {
      temperature: 1,
    },
  });

	return llmResponse.text();
});

type ProductDescriptionOutput = z.infer<typeof ProductDescriptionOutputSchema>;

const ProductDescriptionOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  specifications: z.string(),
  price: z.number(),
});

export const productInformation = onFlow(
  {
    name: 'productInformation',
    inputSchema: z.string(),
    outputSchema: ProductDescriptionOutputSchema,
    authPolicy: firebaseAuth((user:any) => {
        if (user.uid === null) {
          throw new Error("User not authenticated");
        }
      })
  },
  async (text) => {
    const llmResponse = await generate({
      prompt: [
        {
          text: 'Based on this image attached, generate a product title, product description for the item, including specifications and a price. convert the price to Kenyan shillings.'
        },
        {
          media: { url: text }
        }
      ],
      model: gemini15Flash,
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text() as unknown as ProductDescriptionOutput;
  });
      


// Start a flow server, which exposes your flows as HTTP endpoints. This call
// must come last, after all of your plug-in configuration and flow definitions.
// You can optionally specify a subset of flows to serve, and configure some
// HTTP server options, but by default, the flow server serves all defined flows.
startFlowsServer();
