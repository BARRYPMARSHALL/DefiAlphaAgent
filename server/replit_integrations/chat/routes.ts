import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import type { PoolWithScore } from "@shared/schema";

const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
});

const ALPHA_BRAIN_SYSTEM_PROMPT = `You are Alpha Brain, the world's best DeFi yield investor and advisor. You have access to real-time pool data from DeFiLlama and use it to give reasoned, risk-aware advice.

Your expertise covers:
- **Pool Analysis**: Evaluate pools based on APY, TVL, chain, project reputation, and risk factors
- **Rebalance Suggestions**: Recommend moves when uplift potential exceeds 10%
- **Portfolio Allocation**: Advise max 20% per pool for diversification; suggest spreading across chains
- **Uniswap v3 Range Ideas**: Suggest narrow ranges for stablecoins (0.1-0.5%), wider ranges for volatile pairs (5-20% based on 7d volatility)
- **IL Mitigation**: Warn about impermanent loss risks, especially for volatile pairs

IMPORTANT GUIDELINES:
- Always warn about risks: gas costs, smart contract risks, rug potential, market conditions
- Never guarantee returns - DeFi is inherently risky
- Use markdown formatting for clarity: tables for comparisons, bullet points for lists
- When discussing specific pools, reference their actual data (APY, TVL, chain, IL risk)
- Consider sustainability flags: declining APY trends and low-liquidity reward tokens are red flags
- Be concise but thorough; users want actionable insights

Current pool data context will be provided in the conversation.`;

let poolDataContext: string = "";

export function updatePoolDataContext(pools: PoolWithScore[], stats: { totalPools: number; avgApy: number; topChain: string }) {
  const top20 = pools.slice(0, 20);
  
  const poolSummaries = top20.map((p, i) => 
    `${i + 1}. **${p.project}** ${p.symbol} on ${p.chain}: APY ${p.apy.toFixed(2)}%, TVL $${(p.tvlUsd / 1e6).toFixed(2)}M, IL Risk: ${p.ilRisk}${p.apyDeclining ? ' [APY DECLINING]' : ''}${p.lowLiquidityRewards ? ' [LOW LIQ REWARDS]' : ''}`
  ).join('\n');

  poolDataContext = `
## Current Market Data (Real-time from DeFiLlama)

**Stats Overview:**
- Total Pools Analyzed: ${stats.totalPools.toLocaleString()}
- Average APY: ${stats.avgApy.toFixed(2)}%
- Top Chain by TVL: ${stats.topChain}

**Top 20 Pools by Risk-Adjusted Score:**
${poolSummaries}

Use this data to provide specific, data-driven recommendations.`;
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/conversations", async (_req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, model = "x-ai/grok-3-mini-beta" } = req.body;

      await chatStorage.createMessage(conversationId, "user", content);

      const historyMessages = await chatStorage.getMessagesByConversation(conversationId);
      
      const chatMessages: Array<{role: "system" | "user" | "assistant"; content: string}> = [
        { role: "system", content: ALPHA_BRAIN_SYSTEM_PROMPT + "\n\n" + poolDataContext },
      ];

      for (const m of historyMessages) {
        chatMessages.push({
          role: m.role as "user" | "assistant",
          content: m.content,
        });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openrouter.chat.completions.create({
        model,
        messages: chatMessages,
        stream: true,
        max_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  app.get("/api/alpha-brain/context", async (_req: Request, res: Response) => {
    res.json({ context: poolDataContext });
  });
}
