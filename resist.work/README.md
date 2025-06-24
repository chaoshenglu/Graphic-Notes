curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer API-Key" \
  -d $'{
    "model": "doubao-seed-1-6-250615",
    "messages": [
        {
            "content": [
                {
                    "text": "请将下面的代码中的中文翻译成英文(翻译后按原代码格式返回)：<p>商品参数</p>",
                    "type": "text"
                }
            ],
            "role": "user"
        }
    ]
}'

接口返回如下：
{"choices":[{"finish_reason":"stop","index":0,"logprobs":null,"message":{"content":"\u003cp\u003eProduct Specifications\u003c/p\u003e","reasoning_content":"\n用户让我把代码中的中文“商品参数”翻译成英文。首先，我需要确认这个短语在网页或电商语境中的常用表达。“商品”通常是“product”，“参数”在这里应该是指规格、详细信息，常用“specifications”或者“specs”。不过“specifications”更正式一些，适合用在标题里。所以“商品参数”翻译成“Product Specifications”比较合适。然后，原来的代码是\u003cp\u003e商品参数\u003c/p\u003e，所以替换后的应该是\u003cp\u003eProduct Specifications\u003c/p\u003e。需要确保只替换中文部分，保留HTML标签不变。检查一下，没有其他需要注意的地方，应该就是这样了。","role":"assistant"}}],"created":1750762818,"id":"021750762813358f25149d267da02f550d0000dce333d6986c337","model":"doubao-seed-1-6-250615","service_tier":"default","object":"chat.completion","usage":{"completion_tokens":153,"prompt_tokens":102,"total_tokens":255,"prompt_tokens_details":{"cached_tokens":0},"completion_tokens_details":{"reasoning_tokens":146}}}