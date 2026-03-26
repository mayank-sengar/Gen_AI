import axios from 'axios'
import dotenv from 'dotenv';
import readlineSync from 'readline-sync';
import { GoogleGenAI } from '@google/genai';
dotenv.config();

const History= [];

const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API
});

//arguments passed as objects
 function sum({num1,num2}){
    return num1+num2;
 }

 function prime({num}){
    if(num<2) return false;
    for(let i=2;i<=Math.sqrt(num);i++){
        if(num%i==0) return false;
    }
    return true;
 }

 async function crypto({coin}){
    const normalizedCoin = coin.toLowerCase().trim();
    console.log(coin);

    const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${normalizedCoin}`
    );

    if(!res.data.length){
        return `Invalid coin: ${coin}`;
    }

    return {
        name: res.data[0].name,
        price: res.data[0].current_price
    };
}
 const sumDeclaration = {
    name:'sum',
    description:"Get the sum of 2 number",
    //attributes
    parameters:{
        type:'OBJECT',
        properties:{
            num1:{
                type:'NUMBER',
                description: 'It will be first number for addition ex: 10'
            },
            num2:{
                type:'NUMBER',
                description:'It will be Second number for addition ex: 10'
            }
        },
        required: ['num1','num2']   
    }
}



const primeDeclaration = {
    name:'prime',
    description : 'Tell whether given number is prime or not',
    parameters:{
        type:'OBJECT',
        properties:{
            num:{
                type:'NUMBER',
                description:'It will be the number for which we need to tell it is prime or not prime ex: 13'
            }
        },
        required:['num']
    }

}
const cryptoDeclaration= {
    name: 'crypto',
    description: 'Gives current market price of coin ',
    parameters:{
        type:'OBJECT',
        properties:{
            coin:{
                type:'STRING',
                description : 'It will be a valid crypto coin for which we need to tell current market price of it ex. bitcoin'
            }
        },
        required:['coin']
    }
}

const availableTools = {
    sum:sum,
    prime:prime,
    crypto:crypto,
}


async function runAgent(userProblem){

    History.push({
        role: 'user',
        parts: [ {text: userProblem}]
    })

    while(true){

const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents :History,
    config:{
        systemInstruction: `You are an AI Agent, You have access of 3 available tools like to
         to find sum of 2 number, get crypto price of any currency and find a number is prime or not
        
        Use these tools whenever required to confirm user query.
        If user ask general question you can answer it directly if you don't need help of these three tools`,
    },
    tools:[
        {
            functionDeclarations:[sumDeclaration, primeDeclaration,cryptoDeclaration],
        }
    ],

   });


   if(response.functionCalls &&  response.functionCalls.length>0){
    //it can call multiple functions, here we want response from only one function 
    console.log(response.functionCalls[0]);
    const {name,args}= response.functionCalls[0];
    History.push({
        role:"model",
        parts:[
            {
                functionCall : response.functionCalls[0],
            }
        ]
    });


    const funCall=availableTools[name];
    //args=> object : {} 
    const result= await funCall(args);

    const functionResponse= {
        name:name,
        response:{
            result : result,
        }
    };

    
    //adding result in history
    History.push({
    role: "function",
    parts: [{
        functionResponse: {
            name: name,
            response: result   
        }
    }]
});
    

   }
   else{
   console.log(response.text);
    History.push({
        role: "model",
        parts: [{ text: response.text }]
    });
    break;
   }
}

}

async function main(){
    const userProblem = readlineSync.question("Ask me anything <3 ");
    await runAgent(userProblem);
    main();
}

main();
