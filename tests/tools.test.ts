/**
 * Tests for tool conversion utilities
 */

import { createToolFromFunction, extractMethodsFromInstance, processTools } from '../src/tools/tool-utils';

describe('Tool Conversion', () => {
  describe('createToolFromFunction', () => {
    it('should convert a simple function to a tool', () => {
      function add(a: number, b: number): number {
        return a + b;
      }

      const tool = createToolFromFunction(add);

      expect(tool.name).toBe('add');
      expect(tool.description).toBe('Execute the add tool.');
      
      const result = tool.run({ a: 5, b: 3 });
      expect(result).toBe(8);
    });

    it('should handle async functions', async () => {
      async function fetchData(id: string): Promise<string> {
        return `Data for ${id}`;
      }

      const tool = createToolFromFunction(fetchData);
      
      const result = await tool.run({ id: 'test123' });
      expect(result).toBe('Data for test123');
    });

    it('should extract function schema correctly', () => {
      function greet(name: string, _age?: number): string {
        return `Hello ${name}`;
      }

      const tool = createToolFromFunction(greet);
      const schema = tool.toFunctionSchema();

      expect(schema.name).toBe('greet');
      expect(schema.parameters.properties).toHaveProperty('name');
      expect(schema.parameters.required).toContain('name');
      expect(schema.parameters.required).not.toContain('age');
    });
  });

  describe('extractMethodsFromInstance', () => {
    it('should extract public methods from a class instance', () => {
      class TestClass {
        public method1(): string {
          return 'method1';
        }

        public method2(param: string): string {
          return `method2: ${param}`;
        }

        // @ts-ignore - Testing that private methods are not extracted
        private _privateMethod(): void {
          // Should not be extracted
        }
      }

      const instance = new TestClass();
      const tools = extractMethodsFromInstance(instance);

      expect(tools.length).toBe(2); // Should only include public methods
      
      const method1Tool = tools.find(t => t.name === 'method1');
      expect(method1Tool).toBeDefined();
      
      if (method1Tool) {
        const result = method1Tool.run({});
        expect(result).toBe('method1');
      }
    });

    it('should bind methods to the instance context', () => {
      class Counter {
        private count = 0;

        increment(): number {
          this.count++;
          return this.count;
        }

        getCount(): number {
          return this.count;
        }
      }

      const counter = new Counter();
      const tools = extractMethodsFromInstance(counter);

      const incrementTool = tools.find(t => t.name === 'increment');
      const getCountTool = tools.find(t => t.name === 'getCount');

      expect(incrementTool).toBeDefined();
      expect(getCountTool).toBeDefined();

      if (incrementTool && getCountTool) {
        incrementTool.run({});
        incrementTool.run({});
        const count = getCountTool.run({});
        expect(count).toBe(2);
      }
    });
  });

  describe('processTools', () => {
    it('should process mixed tool types', () => {
      function func1(): string {
        return 'func1';
      }

      class TestClass {
        method1(): string {
          return 'method1';
        }
      }

      const instance = new TestClass();
      const customTool = {
        name: 'custom',
        description: 'Custom tool',
        run: () => 'custom',
        toFunctionSchema: () => ({
          name: 'custom',
          description: 'Custom tool',
          parameters: { type: 'object' as const, properties: {} }
        })
      };

      const tools = processTools([func1, instance, customTool]);

      expect(tools.length).toBe(3);
      expect(tools.map(t => t.name)).toContain('func1');
      expect(tools.map(t => t.name)).toContain('method1');
      expect(tools.map(t => t.name)).toContain('custom');
    });

    it('should handle single tool input', () => {
      function singleFunc(): string {
        return 'single';
      }

      const tools = processTools(singleFunc);
      
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('singleFunc');
    });

    it('should handle empty input', () => {
      const tools = processTools(undefined as any);
      expect(tools).toEqual([]);
    });
  });
});