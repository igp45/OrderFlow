import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../prisma/client';

export async function predictDemand(): Promise<Record<string, number>> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orderItems = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: startOfDay } } },
    include: { menuItem: true },
  });

  const summary: Record<string, number> = {};
  for (const item of orderItems) {
    const name = item.menuItem.name;
    summary[name] = (summary[name] || 0) + item.quantity;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  const prompt = `
You are a restaurant demand forecasting assistant.
Based on today's order data: ${JSON.stringify(summary)},
predict how many of each item will be ordered in the next hour.
Respond ONLY with a valid JSON object like: {"Item Name": 12, "Other Item": 8}
No explanation, no markdown, just JSON.
  `.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned invalid JSON');

  return JSON.parse(jsonMatch[0]);
}
