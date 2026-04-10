import axios from 'axios';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class AiService {
    private static apiKey = process.env.OPENROUTER_API_KEY;
    private static model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
    private static baseUrl = 'https://openrouter.ai/api/v1';

    /**
     * Sends a chat completion request to OpenRouter
     */
    static async chatCompletion(messages: ChatMessage[]) {
        if (!this.apiKey) {
            console.error('❌ AiService Error: OPENROUTER_API_KEY is missing.');
            throw new Error('AI Service is not configured.');
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': 'https://cyvhub.com', // Optional requirement for OpenRouter
                        'X-Title': 'CYVhub Intelligence',     // Optional requirement for OpenRouter
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content as string;
            }

            throw new Error('Invalid response from AI provider');
        } catch (error: any) {
            console.error('❌ AiService API Error:', error.response?.data || error.message);
            throw new Error('Failed to generate AI response.');
        }
    }
}
