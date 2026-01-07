import type { Conversation, Message } from "@shared/schema";

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

class MemChatStorage implements IChatStorage {
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message[]> = new Map();
  private nextConversationId = 1;
  private nextMessageId = 1;

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createConversation(title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.nextConversationId++,
      title,
      createdAt: new Date(),
    };
    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    this.conversations.delete(id);
    this.messages.delete(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.messages.get(conversationId) || [];
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const message: Message = {
      id: this.nextMessageId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    const convMessages = this.messages.get(conversationId) || [];
    convMessages.push(message);
    this.messages.set(conversationId, convMessages);
    return message;
  }
}

export const chatStorage: IChatStorage = new MemChatStorage();
