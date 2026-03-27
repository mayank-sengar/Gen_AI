import axios from 'axios'
import dotenv from 'dotenv';
import readlineSync from 'readline-sync';
import { GoogleGenAI } from '@google/genai';
import os from 'os';
import {exec} from 'child_process';
import { promisify } from 'util';
dotenv.config();

const platform = os.platform();

const asyncExecute= promisify(exec);

const History= [];

const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API
});




// function to execute terminal/shell commands
async function executeCommand({command}){
    const blocked = ["rm -rf", "shutdown", "del /f", "format", "mkfs"];

    for(const b of blocked){
        if(command.includes(b)){
            return "Blocked dangerous command";
        }
    }
    try{
        const {stdout, stderr} = await asyncExecute(command);

        if(stderr){
            return `Error: ${stderr}`;
        }

        return `Success: ${stdout} `;
    
    }
    catch(err){
        return `Error: ${err}`;
    }

}

const executeCommandDeclaration={
    name : "executeCommand",
    description : "Execute a single terminal/shell command. A command can  be to create/delete a folder,navigate inside it,create/delete file ,write/edit the file  ",
    parameters:{
        type:"OBJECT",
        properties:{
            command:{
            type:'STRING',
            description :'It will be a single terminal command. Ex: "mkdir calculator" '
            }
        }
    },
    required:['command']
}

  

const availableTools = {
    executeCommand
}


async function runAgent(userProblem){

    History.push({
        role: 'user',
        parts: [ {text: userProblem}]
    })

    //while response has a function call we run this,when the response is a text we simply end the loop 

while(true){

const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents :History,
    config:{
        systemInstruction: `
                    You are an AI Frontend Developer Agent.

                    Your job is to build a complete frontend project by executing terminal/shell commands step by step using the available tool "executeCommand".

                    You MUST follow these rules:

                    1. Always think step-by-step before executing commands.
                    2. Break tasks into small steps (project setup → files → code → install deps → run).
                    3. Use ONLY one command at a time.
                    4. ALWAYS use proper commands depending on OS (Windows/Linux/Mac).
                    5. Create files using echo, type, or appropriate shell commands.
                    6. Write clean, modern frontend code (HTML, CSS, JavaScript, React if asked).
                    7. Prefer using Vite or Create React App for React projects.
                    8. Install dependencies when required using npm.
                    9. Never assume files exist — create them explicitly.
                    10. After creating files, write correct code inside them.
                    11. If an error occurs, fix it by issuing new commands.

                    Command Guidelines:
                    - Create folder: mkdir project-name
                    - Navigate: cd project-name
                    - Create file: touch index.html 
                    - Install packages: npm install
                    - Run project: npm run dev / npm start

                    IMPORTANT:
                    - Do NOT explain anything unless asked.
                    - You must CONTINUE executing commands step-by-step until the entire project is fully built.
                    - Do NOT stop after one command.
                    - After each tool execution, analyze the result and immediately decide the next step.
                    - Only stop when the full project is completed.
                    - If task is completed, then give a final plain text response.

                    Goal:
                    Build fully working frontend projects based on user request.

                    Examples:
                    User: "Create a simple calculator website"
                    → You should:
                    1. Create folder
                    2. Create HTML/CSS/JS files
                    3. Add code
                    4. Run project

                    User: "Create React todo app"
                    → You should:
                    1. Create React app
                    2. Add components
                    3. Style UI
                    4. Run project

                    *Always verify previous command output before next step.*

                    Be precise, efficient, and autonomous.
                    `
    },
    tools:[
        {
            functionDeclarations:[executeCommandDeclaration],
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
    const userProblem = readlineSync.question("What do you want to build today <3 : ");
    await runAgent(userProblem);
    main();
}

main();
