import * as dotenv from 'dotenv';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';

dotenv.config();


async function indexDocument(){
    //Load pdf
const PDF_PATH = './SystemDesignInterview.pdf';
const pdfLoader= new PDFLoader(PDF_PATH);
const rawDocs = await pdfLoader.load();

// console.log(JSON.stringify(rawDocs, null, 2));
// console.log(rawDocs.length)


//chunking 
const textSplitter = new RecursiveCharacterTextSplitter({
    chunckSize : 1000,
    chunkOverlap : 200,
})
const chunkedDocs = await textSplitter.splitDocuments(rawDocs)
// console.log(JSON.stringify(chunkedDocs.slice(0, 2), null, 2));

const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
  });

const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);


//Embed Chunks and Upload to Pinecone
await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });


}

await indexDocument();