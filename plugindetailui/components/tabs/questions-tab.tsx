import { Button } from "@/components/ui/button"

export default function QuestionsTab() {
  const questions = [
    {
      id: 1,
      author: "用户X",
      date: "3天前",
      title: "如何在React项目中集成这个工具包？",
      content: "我正在使用Create React App创建的项目，想知道集成这个工具包的最佳实践是什么？有没有特别需要注意的地方？",
      answers: [
        {
          id: 101,
          author: "张三工作室",
          isAuthor: true,
          date: "2天前",
          content:
            "您可以通过npm安装我们的包，然后直接导入组件使用。对于CRA项目，不需要额外的配置。详细步骤请参考我们的文档中的'React集成'部分。如果遇到任何问题，欢迎随时提问。",
        },
      ],
    },
    {
      id: 2,
      author: "用户Y",
      date: "1周前",
      title: "支持自定义主题吗？",
      content: "我需要将图表的样式与我们的品牌风格匹配，请问是否支持完全自定义主题？具体需要如何配置？",
      answers: [
        {
          id: 201,
          author: "用户Z",
          isAuthor: false,
          date: "6天前",
          content: "我已经成功自定义了主题，你可以通过theme属性传入自定义的颜色和样式对象。文档中有详细的示例。",
        },
        {
          id: 202,
          author: "张三工作室",
          isAuthor: true,
          date: "5天前",
          content:
            "是的，我们支持完全自定义主题。除了用户Z提到的方法外，我们还提供了一个ThemeProvider组件，可以在应用级别设置主题，所有图表组件会自动继承这些设置。",
        },
      ],
    },
  ]

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-semibold">问答区</h3>
        <Button className="bg-indigo-600 hover:bg-indigo-700">提问</Button>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-lg font-medium">{question.title}</h4>
                <div className="text-sm text-neutral-500">
                  由 {question.author} 提问 · {question.date}
                </div>
              </div>
            </div>
            <p className="text-neutral-700 mb-4">{question.content}</p>

            {question.answers.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="text-sm font-medium text-neutral-700">{question.answers.length} 个回答</div>

                {question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`p-3 rounded-md ${answer.isAuthor ? "bg-indigo-50 border-l-3 border-indigo-600" : "bg-neutral-50"}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {answer.author}
                          {answer.isAuthor && (
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                              开发者
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500">{answer.date}</div>
                    </div>
                    <p className="text-neutral-700">{answer.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" className="text-neutral-600">
                回答
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
