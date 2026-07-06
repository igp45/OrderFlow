import Groq from 'groq-sdk';
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

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are a restaurant demand forecasting assistant.
Based on today's order data: ${JSON.stringify(summary)},
predict how many of each item will be ordered in the next hour.
Respond ONLY with a valid JSON object like: {"Item Name": 12, "Other Item": 8}
No explanation, no markdown, just raw JSON.`;

  const completion = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const text = completion.choices[0]?.message?.content?.trim() || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Groq returned invalid JSON');

  return JSON.parse(jsonMatch[0]);
}
