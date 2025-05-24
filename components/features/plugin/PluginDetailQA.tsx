import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

interface Question {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  title: string;
  content: string;
  date: string;
  answers: {
    id: string;
    author: {
      name: string;
      avatar: string;
      isDeveloper: boolean;
    };
    content: string;
    date: string;
  }[];
}

interface PluginDetailQAProps {
  questions: Question[];
}

export function PluginDetailQA({ questions }: PluginDetailQAProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">常见问题</h3>
        <Button>
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          提问
        </Button>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <Card key={question.id} className="p-6">
            <div className="flex items-start gap-4">
              <img
                src={question.author.avatar}
                alt={question.author.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{question.author.name}</span>
                  <span className="text-sm text-gray-500">{question.date}</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">{question.title}</h4>
                <p className="text-gray-700 mb-4">{question.content}</p>

                {/* 回答列表 */}
                {question.answers.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {question.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={answer.author.avatar}
                            alt={answer.author.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {answer.author.name}
                            </span>
                            {answer.author.isDeveloper && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                开发者
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {answer.date}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700">{answer.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 