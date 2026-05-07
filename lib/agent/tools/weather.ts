import type { ToolDefinition } from "@/lib/llm/types";

export const weatherToolDefinition: ToolDefinition = {
  name: "get_weather",
  description: "查询指定城市的当前天气情况，包括温度、天气状况和湿度",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "城市名称，例如：北京、上海、广州",
      },
    },
    required: ["city"],
  },
};

export async function executeWeatherTool(args: Record<string, unknown>): Promise<string> {
  const city = String(args.city ?? "未知");

  // 实际项目里这里换成真实天气 API，比如 OpenWeatherMap
  const mockData: Record<string, { temp: number; condition: string; humidity: number }> = {
    北京: { temp: 22, condition: "晴天", humidity: 40 },
    上海: { temp: 26, condition: "多云", humidity: 65 },
    广州: { temp: 30, condition: "阵雨", humidity: 80 },
    深圳: { temp: 29, condition: "晴转多云", humidity: 72 },
  };

  const weather = mockData[city] ?? { temp: 20, condition: "未知", humidity: 50 };

  return JSON.stringify({
    city,
    temperature: `${weather.temp}°C`,
    condition: weather.condition,
    humidity: `${weather.humidity}%`,
    timestamp: new Date().toISOString(),
  });
}

export const toolRegistry: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  get_weather: executeWeatherTool,
};