import { TaskSchemaDefinition } from '../../types/schema';

export const taskSchema: TaskSchemaDefinition = {
  requiredFields: ["description", "expected_output"],
  optionalFields: {
    description: {
      type: "string",
      description: "A clear, concise statement of what the task entails."
    },
    expected_output: {
      type: "string",
      description: "A detailed description of what the task's completion looks like."
    },
    name: {
      type: "string",
      description: "A name identifier for the task."
    },
    agent: { 
      type: ["string", "object"], 
      description: "The agent responsible for executing the task." 
    },
    tools: {
      type: "array",
      description: "The tools/resources the agent is limited to use for this task."
    },
    context: {
      type: "array",
      description: "Other tasks whose outputs will be used as context for this task."
    },
    async_execution: {
      type: "boolean",
      description: "Whether the task should be executed asynchronously. Defaults to False."
    },
    human_input: {
      type: "boolean",
      description: "Whether the task should have a human review the final answer of the agent. Defaults to False."
    },
    config: {
      type: "object",
      description: "Task-specific configuration parameters."
    },
    output_file: {
      type: "string",
      description: "File path for storing the task output."
    },
    output_json: {
      type: "object",
      description: "A Pydantic model to structure the JSON output."
    },
    output_pydantic: {
      type: "object",
      description: "A Pydantic model for task output."
    },
    callback: {
      type: "object",
      description: "Function/object to be executed after task completion."
    }
  }
};
