import { supabase } from './supabase';

export interface ConversationSession {
  id: string;
  userId: string;
  conversationId: string;
  avatarId: string;
  startTime: string;
  lastActivity: string;
  endTime: string | null;
  messageCount: number;
  sessionDurationMinutes: number;
  creditCharged: boolean;
  isActive: boolean;
  sessionType: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  sessionId: string;
  messageCount: number;
  durationMinutes: number;
  creditCharged: boolean;
  isActive: boolean;
}

class SessionService {
  /**
   * Process a message with session tracking
   * This is the main function to call when sending a message
   */
  async processMessageWithSession(
    userId: string,
    conversationId: string,
    avatarId: string,
    messageContent: string = ''
  ): Promise<SessionInfo | null> {
    try {
      const { data, error } = await supabase
        .rpc('process_message_with_session', {
          user_uuid: userId,
          conversation_uuid: conversationId,
          avatar_id_param: avatarId,
          message_content: messageContent
        });

      if (error) {
        console.error('Error processing message with session:', error);
        return null;
      }

      return {
        sessionId: data.session_id,
        messageCount: data.message_count,
        durationMinutes: data.duration_minutes,
        creditCharged: data.credit_charged,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error in processMessageWithSession:', error);
      return null;
    }
  }

  /**
   * Get or create an active session for a conversation
   */
  async getOrCreateSession(
    userId: string,
    conversationId: string,
    avatarId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_session', {
          user_uuid: userId,
          conversation_uuid: conversationId,
          avatar_id_param: avatarId
        });

      if (error) {
        console.error('Error getting/creating session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateSession:', error);
      return null;
    }
  }

  /**
   * End a conversation session manually
   */
  async endSession(sessionId: string, forceEnd: boolean = false): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('end_conversation_session', {
          session_uuid: sessionId,
          force_end: forceEnd
        });

      if (error) {
        console.error('Error ending session:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in endSession:', error);
      return false;
    }
  }

  /**
   * Get session details by ID
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }

      return this.mapSessionData(data);
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
  }

  /**
   * Get user's active sessions
   */
  async getActiveSessions(userId: string): Promise<ConversationSession[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Error fetching active sessions:', error);
        return [];
      }

      return data.map(this.mapSessionData);
    } catch (error) {
      console.error('Error in getActiveSessions:', error);
      return [];
    }
  }

  /**
   * Get user's session history
   */
  async getSessionHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ConversationSession[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching session history:', error);
        return [];
      }

      return data.map(this.mapSessionData);
    } catch (error) {
      console.error('Error in getSessionHistory:', error);
      return [];
    }
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string, daysBack: number = 30): Promise<{
    totalSessions: number;
    averageDuration: number;
    totalCreditsSpent: number;
    averageMessagesPerSession: number;
    mostUsedAvatar: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString());

      if (error) {
        console.error('Error fetching session stats:', error);
        return this.getEmptyStats();
      }

      if (!data || data.length === 0) {
        return this.getEmptyStats();
      }

      const totalSessions = data.length;
      const totalCreditsSpent = data.filter(s => s.credit_charged).length;
      const totalDuration = data.reduce((sum, s) => sum + s.session_duration_minutes, 0);
      const totalMessages = data.reduce((sum, s) => sum + s.message_count, 0);
      
      const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
      const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

      // Find most used avatar
      const avatarCounts = data.reduce((acc, session) => {
        acc[session.avatar_id] = (acc[session.avatar_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedAvatar = Object.keys(avatarCounts).reduce((a, b) => 
        avatarCounts[a] > avatarCounts[b] ? a : b, ''
      );

      return {
        totalSessions,
        averageDuration,
        totalCreditsSpent,
        averageMessagesPerSession,
        mostUsedAvatar
      };
    } catch (error) {
      console.error('Error in getSessionStats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Check if a session should show warning about approaching limits
   */
  shouldShowSessionWarning(session: SessionInfo): {
    showWarning: boolean;
    warningType: 'time' | 'messages' | 'ending';
    message: string;
  } {
    const { messageCount, durationMinutes, isActive } = session;

    if (!isActive) {
      return {
        showWarning: false,
        warningType: 'ending',
        message: ''
      };
    }

    // Warning at 25 minutes or 25 messages
    if (durationMinutes >= 25) {
      return {
        showWarning: true,
        warningType: 'time',
        message: `Your session will end in ${30 - durationMinutes} minutes. You can continue chatting freely until then.`
      };
    }

    if (messageCount >= 25) {
      return {
        showWarning: true,
        warningType: 'messages',
        message: `You've sent ${messageCount} messages. Your session will end after ${30 - messageCount} more messages.`
      };
    }

    return {
      showWarning: false,
      warningType: 'ending',
      message: ''
    };
  }

  /**
   * Get session progress information for UI
   */
  getSessionProgress(session: SessionInfo): {
    timeProgress: number; // 0-100
    messageProgress: number; // 0-100
    timeRemaining: string;
    messagesRemaining: number;
  } {
    const { messageCount, durationMinutes } = session;
    
    const timeProgress = Math.min((durationMinutes / 60) * 100, 100);
    const messageProgress = Math.min((messageCount / 30) * 100, 100);
    
    const minutesRemaining = Math.max(60 - durationMinutes, 0);
    const messagesRemaining = Math.max(30 - messageCount, 0);
    
    const timeRemaining = minutesRemaining > 0 
      ? `${Math.floor(minutesRemaining)}m remaining`
      : 'Session ending soon';

    return {
      timeProgress,
      messageProgress,
      timeRemaining,
      messagesRemaining
    };
  }

  private mapSessionData(data: any): ConversationSession {
    return {
      id: data.id,
      userId: data.user_id,
      conversationId: data.conversation_id,
      avatarId: data.avatar_id,
      startTime: data.start_time,
      lastActivity: data.last_activity,
      endTime: data.end_time,
      messageCount: data.message_count,
      sessionDurationMinutes: data.session_duration_minutes,
      creditCharged: data.credit_charged,
      isActive: data.is_active,
      sessionType: data.session_type,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private getEmptyStats() {
    return {
      totalSessions: 0,
      averageDuration: 0,
      totalCreditsSpent: 0,
      averageMessagesPerSession: 0,
      mostUsedAvatar: ''
    };
  }
}

export const sessionService = new SessionService();
