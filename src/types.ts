export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
};

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  user_id?: string;
}; 