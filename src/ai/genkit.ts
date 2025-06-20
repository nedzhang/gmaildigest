import { GenerationCommonConfigSchema, genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { openAI } from "genkitx-openai";
import { ModelInfo } from "genkit/model";

const deepseekChatV3ModelInfo: ModelInfo = {
  versions: ["deepseek/deepseek-chat-v3-0324:free"],
  label: "deepseek-chat-v3-0324",
  supports: {
    multiturn: true,
    tools: true,
    media: false,
    systemRole: true,
    output: ["json", "text"],
  },
};

const deepseekR1ModelInfo: ModelInfo = {
  versions: ["deepseek/deepseek-r1:free"],
  label: "deepseek-r1",
  supports: {
    multiturn: true,
    tools: true,
    media: false,
    systemRole: true,
    output: ["json", "text"],
  },
};

const gemini25proexp0325: ModelInfo = {
  versions: ["google/gemini-2.5-pro-exp-03-25"],
  label: "gemini-2.5-pro-exp-03-25",
  supports: {
    multiturn: true,
    tools: true,
    media: true,
    systemRole: true,
    output: ["json", "text"],
  },
};



const schema = GenerationCommonConfigSchema.extend({});

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "http://localhost:9002/api/openai-proxy",
      // baseURL: process.env.OPENAI_BASEURL,
      models: [
        { name: "deepseek/deepseek-chat-v3-0324:free", info: deepseekChatV3ModelInfo, configSchema: schema },
        { name: "deepseek/deepseek-r1:free", info: deepseekR1ModelInfo, configSchema: schema },
        { name: "google/gemini-2.5-pro-exp-03-25", info: gemini25proexp0325, configSchema: schema },
      ],
    }),
  ],
  // model: "googleai/gemini-2.0-flash",
  // promptDir: 'src/prompts',
});
