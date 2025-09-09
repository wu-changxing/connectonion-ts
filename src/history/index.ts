/**
 * History tracking for ConnectOnion TypeScript SDK
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BehaviorEntry } from '../types';

export class History {
  private behaviorPath: string;
  private behaviors: BehaviorEntry[] = [];

  constructor(name: string) {
    
    // Set up behavior tracking directory
    const homeDir = os.homedir();
    const connectonionDir = path.join(homeDir, '.connectonion', 'agents', name);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(connectonionDir)) {
      fs.mkdirSync(connectonionDir, { recursive: true });
    }
    
    this.behaviorPath = path.join(connectonionDir, 'behavior.json');
    
    // Load existing behaviors if file exists
    if (fs.existsSync(this.behaviorPath)) {
      try {
        const data = fs.readFileSync(this.behaviorPath, 'utf-8');
        const parsed = JSON.parse(data);
        // Ensure behaviors is always an array
        if (Array.isArray(parsed)) {
          this.behaviors = parsed;
        } else {
          console.warn('Behavior file does not contain an array, initializing empty');
          this.behaviors = [];
        }
      } catch (error) {
        console.warn(`Failed to load existing behaviors: ${error}`);
        this.behaviors = [];
      }
    }
  }

  /**
   * Add an entry to the behavior history
   */
  add(type: BehaviorEntry['type'], data: any): void {
    const entry: BehaviorEntry = {
      timestamp: new Date().toISOString(),
      type,
      data,
    };
    
    this.behaviors.push(entry);
    this.save();
  }

  /**
   * Add input to history
   */
  addInput(prompt: string): void {
    this.add('input', { prompt });
  }

  /**
   * Add LLM response to history
   */
  addLLMResponse(response: any): void {
    this.add('llm_response', response);
  }

  /**
   * Add tool call to history
   */
  addToolCall(name: string, args: any, result: any, callId: string): void {
    this.add('tool_call', {
      name,
      arguments: args,
      result,
      call_id: callId,
    });
  }

  /**
   * Add output to history
   */
  addOutput(output: string): void {
    this.add('output', { output });
  }

  /**
   * Get all behaviors
   */
  getBehaviors(): BehaviorEntry[] {
    return this.behaviors;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.behaviors = [];
    this.save();
  }

  /**
   * Save behaviors to file
   */
  private save(): void {
    try {
      fs.writeFileSync(
        this.behaviorPath,
        JSON.stringify(this.behaviors, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error(`Failed to save behaviors: ${error}`);
    }
  }
}