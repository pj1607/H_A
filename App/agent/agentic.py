from langchain.agents import initialize_agent, AgentType
from backroute.health_agents import health_summary, report_diff, doctor_availability_tool
from langchain_google_genai import ChatGoogleGenerativeAI  

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",  # or gemini-1.5-pro
    temperature=0.3,
)
tools = [health_summary, report_diff,doctor_availability_tool]
health_agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, # Agent auto decide karega kaunsa tool use ho
    verbose=True
)