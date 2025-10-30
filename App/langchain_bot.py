from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.chains import RetrievalQA
from dotenv import load_dotenv
import os
load_dotenv() 
llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash")

def create_vector_store(pdf_path):
    print(f"Processing PDF: {pdf_path}")
    loader=PyPDFLoader(pdf_path)
    doc=loader.load()
    print(f"Loaded {len(doc)} pages")
    splitter=RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks=splitter.split_documents(doc)
    print(f"Split into {len(chunks)} chunks") 
    embeddings=GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectordb=Chroma.from_documents(chunks, embedding=embeddings, persist_directory="./chroma_db")
    #vectordb.persist()
    return vectordb

def query_health_bot(query: str):
    vectordb = Chroma(persist_directory="./chroma_db", embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001"))
    retriever = vectordb.as_retriever(search_type="mmr", search_kwargs={"k": 5, "fetch_k": 20})
    docs = retriever.get_relevant_documents(query)
    print(f"Retrieved {len(docs)} documents") 
    context = "\n\n".join(doc.page_content for doc in docs)
    prompt = f"""
You are a helpful AI health assistant.

Below is the extracted text from a medical report (e.g., CT scan, MRI, blood test, etc.).

Your task is to:
1. Understand what type of report it is (based on the text).
2. Summarize the findings in **simple, layman-friendly language**.
3. Clearly mention whether the findings are normal or abnormal.
4. Suggest next steps for the patient, if needed (e.g., consult a specialist, follow-up, no action needed).

If the text is too unclear or doesn’t appear to be a medical report, reply:
"⚠️ Sorry, I couldn’t understand this report."

---

📄 Extracted Report Text:
{context}

Now respond with a clear and easy-to-understand summary:
"""



    llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3)
    response = llm.invoke(prompt)

    return response.content

if __name__ == "__main__":
    pdf_paths = [
        "data/book.pdf",
        "data/disease-handbook-complete.pdf",
        "data/harvard.pdf",
        "data/Medical_Words_Reference.pdf",
        "data/non-communicable.pdf",
        "Red_Book.pdf",
        "vol.pdf"
    ]

    for path in pdf_paths:
        create_vector_store(path)