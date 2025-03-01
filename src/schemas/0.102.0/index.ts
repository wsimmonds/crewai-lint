import { CrewAISchema, ValidationResult } from '../../types/schema';
import { agentSchema } from './agent';
import { taskSchema } from './task';
import { createValidator } from '../../utils';

export const schema: CrewAISchema = {
  version: "0.102.0",
  agentSchema,
  taskSchema,
  validateAgent(data: any): ValidationResult {
    return createValidator(this.agentSchema)(data);
  },
  validateTask(data: any): ValidationResult {
    return createValidator(this.taskSchema)(data);
  }
};
