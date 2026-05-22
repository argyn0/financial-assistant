import { getAIRecommendations } from "@/lib/data";
import { AIInsightsClient } from "./ai-insights-client";

export default async function AIInsightsPage() {
  const recommendations = await getAIRecommendations();
  return <AIInsightsClient initialRecommendations={recommendations} />;
}
