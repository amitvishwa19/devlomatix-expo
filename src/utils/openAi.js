import axios from "axios";
import { aiApiKey, googleGemeniApiKey, openAiApiKey } from "./constants";

const client = axios.create({
    headers: {
        'Authorization': 'Bearer ' + aiApiKey,
        "content-Type": 'application/json'
    }
})

const chatGptEndpoint = 'https://api.openai.com/v1/chat/completions'
const dalleEndpoint = 'https://api.openai.com/v1/images/generations'

const aiMlApiEndpoint = 'https://api.aimlapi.com/chat/completions'
const gemeniCahtEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleGemeniApiKey}`

export const openAiApiCall = async (prompt, messages) => {
    try {



        const res = await client.post(aiMlApiEndpoint, {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "user",
                    "content": `Dose this msg want to generate an AI picture / image / art or any thing similar ${prompt} simply answer with yes or no`
                },
            ]
        })

        //console.log('Api Call')
        //console.log(res.data)
        //console.log('data', res.data.choices[0].message)
        let isArt = res.data.choices[0]?.message?.content

        if (isArt.toLowerCase() === 'yes') {
            imageApiCall(prompt, messages || [])
            //console.log('AI Image Api')
        } else {
            textChatApiCall(prompt, messages || [])
            //console.log('AI Text Api')
        }




    } catch (error) {
        console.log('open-ai-api-call-error', error)
        return Promise.resolve({ success: false, msg: error.msg })
    }
}

const textChatApiCall = async (prompt, messages) => {
    try {
        const res = await client.post(aiMlApiEndpoint, {
            "model": "gpt-3.5-turbo",
            messages
        })

        //const res = 'this is response'

        //console.log('chat gpt response', res)


        let answer = res.data.choices[0]?.message?.content
        messages.push({ role: 'assistant', content: answer.trim() })

        console.log('answer', messages)


        return Promise.resolve({ success: true, msg: messages })
    } catch (error) {
        console.log('chat gpt ai api call error', error)
        return Promise.resolve({ success: false, msg: error.msg })
    }
}

const imageApiCall = async (prompt, messages) => {
    try {
        const res = await client.post(dalleEndpoint, {
            prompt,
            n: 1,
            size: "512 * 512"
        })
        let url = res.data?.data[0]?.url
        messages.push({ role: 'assistant', content: url })
        return Promise.resolve({ success: true, msg: messages })
    } catch (error) {
        console.log('chat gpt ai api call error', error)
        return Promise.resolve({ success: false, msg: error.msg })
    }
}