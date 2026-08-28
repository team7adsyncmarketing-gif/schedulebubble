import { GoogleGenerativeAI } from '@google/generative-ai';

export const generatePost = async (req, res) => {
  try {
    const { topic, tone, platforms } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        message: 'GEMINI_API_KEY is not configured in the backend environment.',
        content: 'Error: API key missing.',
        generatedText: 'Error: API key missing.'
      });
    }

    const platformList = Array.isArray(platforms) ? platforms : ['linkedin'];
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `Write a highly engaging social media post about "${topic}" with a ${tone} tone.
I need customized, distinct versions tailored for the following platforms: ${platformList.join(', ')}.
Each platform version should include appropriate formatting, hashtags, and emojis for that specific platform.

CRITICAL INSTRUCTION: You must output the content in EXACTLY the following format, with the platform name in all-caps brackets before each version:

[PLATFORM_NAME_1]
Content for platform 1...

[PLATFORM_NAME_2]
Content for platform 2...
`;

    const result = await model.generateContent(prompt);
    const finalContent = result.response.text();

    return res.status(200).json({ content: finalContent.trim(), generatedText: finalContent.trim() });
    
  } catch (error) {
    console.error('Error generating AI post:', error);
    return res.status(500).json({ 
      content: "Error generating post with Gemini",
      generatedText: "Error generating post with Gemini",
      message: error.message
    });
  }
};
