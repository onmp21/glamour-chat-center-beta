
import { ChannelMessage, RawMessage } from '@/types/messages';

export class MessageSorter {
  static sortRawMessages(messages: RawMessage[]): RawMessage[] {
    return messages.sort((a, b) => {
      const timeA = new Date(a.read_at || '').getTime();
      const timeB = new Date(b.read_at || '').getTime();
      return timeA - timeB;
    });
  }

  static sortChannelMessages(messages: ChannelMessage[]): ChannelMessage[] {
    return messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }
}
