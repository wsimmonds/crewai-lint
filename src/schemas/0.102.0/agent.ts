import { AgentSchemaDefinition } from '../../types/schema';

export const agentSchema: AgentSchemaDefinition = {
  requiredFields: ["role", "goal", "backstory"],
  optionalFields: {
    role: {
      type: "string",
      description: "The role or title of the agent that defines their responsibilities."
    },
    goal: {
      type: "string",
      description: "The agent's primary objective or purpose within the crew."
    },
    backstory: {
      type: "string",
      description: "Provides context and personality to the agent, enriching interactions."
    },
    llm: { 
      type: ["string", "object"], 
      description: "Language model that powers the agent. Defaults to the model specified in OPENAI_MODEL_NAME or \"gpt-4\"." 
    },
    tools: { 
      type: "array", 
      description: "Capabilities or functions available to the agent. Defaults to an empty list." 
    },
    function_calling_llm: {
      type: "object",
      description: "Language model for tool calling, overrides crew's LLM if specified."
    },
    max_iter: { 
      type: "number", 
      description: "Maximum iterations before the agent must provide its best answer. Default is 20." 
    },
    max_rpm: {
      type: "number",
      description: "Maximum requests per minute to avoid rate limits."
    },
    max_execution_time: {
      type: "number",
      description: "Maximum time (in seconds) for task execution."
    },
    memory: {
      type: "boolean",
      description: "Whether the agent should maintain memory of interactions. Default is True."
    },
    verbose: {
      type: "boolean",
      description: "Enable detailed execution logs for debugging. Default is False."
    },
    allow_delegation: {
      type: "boolean",
      description: "Allow the agent to delegate tasks to other agents. Default is False."
    },
    step_callback: {
      type: "object",
      description: "Function called after each agent step, overrides crew callback."
    },
    cache: {
      type: "boolean",
      description: "Enable caching for tool usage. Default is True."
    },
    system_template: {
      type: "string",
      description: "Custom system prompt template for the agent."
    },
    prompt_template: {
      type: "string",
      description: "Custom prompt template for the agent."
    },
    response_template: {
      type: "string",
      description: "Custom response template for the agent."
    },
    allow_code_execution: {
      type: "boolean",
      description: "Enable code execution for the agent. Default is False."
    },
    max_retry_limit: {
      type: "number",
      description: "Maximum number of retries when an error occurs. Default is 2."
    },
    respect_context_window: {
      type: "boolean",
      description: "Keep messages under context window size by summarizing. Default is True."
    },
    code_execution_mode: {
      type: "string",
      description: "Mode for code execution: 'safe' (using Docker) or 'unsafe' (direct). Default is 'safe'."
    },
    embedder: {
      type: "object",
      description: "Configuration for the embedder used by the agent."
    },
    knowledge_sources: {
      type: "array",
      description: "Knowledge sources available to the agent."
    },
    use_system_prompt: {
      type: "boolean",
      description: "Whether to use system prompt (for o1 model support). Default is True."
    }
  }
};
