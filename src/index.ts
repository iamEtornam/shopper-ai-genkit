import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash', {
    temperature: 0.8,
  }),
});


export const productTitle = ai.defineFlow({
  name: 'productTitle',
  inputSchema: z.string().describe('Image URL of the product'),
  outputSchema: z.string()
},
  async (text: string) => {
    if (!text || text.trim() === '') {
      throw new Error('Image URL is required');
    }

    const llmResponse = await ai.generate({
      prompt: [
        {
          text: 'Based on the image data attached, generate a product title for the item. it should be simple and short.'
        },
        {
          media: { url: text }
        }
      ],
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text;
  });

export const productDescription = ai.defineFlow({
  name: 'productDescription',
  inputSchema: z.string().describe('Image URL of the product'),
  outputSchema: z.string(),
},
  async (text: string) => {
    if (!text || text.trim() === '') {
      throw new Error('Image URL is required');
    }

    const llmResponse = await ai.generate({
      prompt: [
        {
          text: 'Based on this image data attached, generate a product description for the item. it should be detailed and informative.'
        },
        {
          media: { url: text }
        }
      ],
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text;
  });


export const productSpecifications = ai.defineFlow({
  name: 'productSpecifications',
  inputSchema: z.string().describe('Image URL of the product'),
  outputSchema: z.array(z.string()),
},
  async (imageUrl: string) => {
    if (!imageUrl || imageUrl.trim() === '') {
      throw new Error('Image URL is required');
    }

    const llmResponse = await ai.generate({
      prompt: [
        {
          text: 'Based on this image data attached, generate a product specifications for the item. it should be in bullet points form, informative, and detailed, do not include a title. use numbers for the bullet points. do not include asterisk. do not include the name of the item.'
        },
        {
          media: { url: imageUrl }
        }
      ],
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text.split('\n').filter((line: string) => line.trim() !== '');
  });


type ProductDescriptionOutput = z.infer<typeof ProductDescriptionOutputSchema>;

const ProductDescriptionOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  specifications: z.string(),
  price: z.number(),
});

export const productInformation = ai.defineFlow(
  {
    name: 'productInformation',
    inputSchema: z.string().describe('Image URL of the product'),
    outputSchema: ProductDescriptionOutputSchema,
  },

  async (text: string) => {
    if (!text || text.trim() === '') {
      throw new Error('Image URL is required');
    }

    const { output } = await ai.generate({
      prompt: [
        {
          text: 'Based on this image attached, generate a product title, product description for the item, including specifications and a price. convert the price to Ugandan shillings. Do not include specification for non gadgets'
        },

        {
          media: { url: text }
        }
      ],
      config: {
        temperature: 1,
      },
      output: {
        schema: ProductDescriptionOutputSchema
      }
    });

    return output as any;
  });
