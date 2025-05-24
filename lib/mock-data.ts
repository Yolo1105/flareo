export interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  rating: number;
  downloads: number;
  category: string;
  tags: string[];
  version: string;
  lastUpdated: string;
  imageUrl: string;
}

export const MOCK_PLUGINS: Plugin[] = [
  {
    id: "1",
    name: "AI Image Generator",
    description: "Generate stunning images using advanced AI algorithms",
    author: "Flareo Team",
    rating: 4.8,
    downloads: 15000,
    category: "AI",
    tags: ["image", "generation", "AI"],
    version: "1.2.0",
    lastUpdated: "2024-03-15",
    imageUrl: "/images/plugins/ai-image.jpg"
  },
  {
    id: "2",
    name: "Text Summarizer",
    description: "Automatically summarize long texts while maintaining key points",
    author: "TextAI",
    rating: 4.5,
    downloads: 12000,
    category: "Text",
    tags: ["text", "summarization", "AI"],
    version: "2.1.0",
    lastUpdated: "2024-03-10",
    imageUrl: "/images/plugins/text-summary.jpg"
  },
  {
    id: "3",
    name: "Code Assistant",
    description: "AI-powered code completion and suggestion tool",
    author: "CodeGenius",
    rating: 4.9,
    downloads: 20000,
    category: "Development",
    tags: ["code", "AI", "development"],
    version: "3.0.0",
    lastUpdated: "2024-03-20",
    imageUrl: "/images/plugins/code-assistant.jpg"
  }
];

export const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "ai", name: "AI" },
  { id: "text", name: "Text" },
  { id: "development", name: "Development" },
  { id: "productivity", name: "Productivity" },
  { id: "design", name: "Design" }
]; 