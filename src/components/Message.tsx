interface MessageProps {
  message: any;
  avatarId?: string;
}

export const Message: React.FC<MessageProps> = ({ message, avatarId = 'jung' }) => {
  // Use avatarId when rendering the message avatar
  return (
    <View>
      {message.role === 'assistant' && (
        <SimpleAvatar avatarId={avatarId} size="small" />
      )}
      {/* Rest of your message component */}
    </View>
  );
}; 