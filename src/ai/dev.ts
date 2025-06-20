import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-thread';

import '@/ai/flows/summarize-attachment'; 

import '@/ai/flows/summarize-message';

import '@/ai/flows/summarize-text';

import '@/ai/schema/email';

import '@/ai/schema/task';