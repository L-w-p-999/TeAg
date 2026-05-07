type ChatDetailPageProps = {
  params: { chatId: string };
};

import { redirect } from "next/navigation";

export default function ChatDetailLegacyRoute({ params }: ChatDetailPageProps) {
  const chatId = params.chatId;
  redirect(`/mychatgpt?chatId=${encodeURIComponent(chatId)}`);
}
