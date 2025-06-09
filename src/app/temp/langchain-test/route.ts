import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";

dotenv.config();

const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.0-flash-exp", // Replace with your desired model
});

const prompt = new PromptTemplate({
    template: "Tell me a joke about {topic}",
    inputVariables: ["topic"],
});

const outputParser = new StringOutputParser();

const chain = prompt.pipe(model).pipe(outputParser);

const getJoke = async (topic: string) => {
    const result = await chain.invoke({ topic: topic });
    return result;
};

export async function GET(request: NextRequest) {
    const joke = await getJoke("ice cream");
    return NextResponse.json(joke);
}
