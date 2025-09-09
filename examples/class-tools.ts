/**
 * Class-based Tools Example
 * Demonstrates using a class instance with methods as tools
 */

import { Agent } from '../src';

// Define a class with methods that can be used as tools
class DatabaseManager {
  private data: Map<string, any> = new Map();

  constructor() {
    // Initialize with some sample data
    this.data.set('users', [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
      { id: 3, name: 'Charlie', age: 35 },
    ]);
    
    this.data.set('products', [
      { id: 1, name: 'Laptop', price: 999 },
      { id: 2, name: 'Mouse', price: 29 },
      { id: 3, name: 'Keyboard', price: 79 },
    ]);
  }

  getUsers(): any[] {
    /** Get all users from the database */
    return this.data.get('users') || [];
  }

  getUserById(id: number): any {
    /** Get a specific user by their ID */
    const users = this.data.get('users') || [];
    return users.find((u: any) => u.id === id);
  }

  getProducts(): any[] {
    /** Get all products from the database */
    return this.data.get('products') || [];
  }

  getProductById(id: number): any {
    /** Get a specific product by its ID */
    const products = this.data.get('products') || [];
    return products.find((p: any) => p.id === id);
  }

  addUser(name: string, age: number): any {
    /** Add a new user to the database */
    const users = this.data.get('users') || [];
    const newUser = {
      id: users.length + 1,
      name,
      age,
    };
    users.push(newUser);
    this.data.set('users', users);
    return newUser;
  }
}

async function main() {
  // Create an instance of the database manager
  const dbManager = new DatabaseManager();

  // Create an agent with the class instance as tools
  const agent = new Agent({
    name: 'db-assistant',
    tools: [dbManager], // Pass the entire instance
    systemPrompt: 'You are a database assistant that can query and manage user and product data.',
  });

  // Example queries
  console.log('Example 1: Query users');
  const response1 = await agent.input('How many users are in the database and what are their names?');
  console.log('Response:', response1);
  console.log('---');

  console.log('Example 2: Query specific user');
  const response2 = await agent.input('Can you get me the details for user with ID 2?');
  console.log('Response:', response2);
  console.log('---');

  console.log('Example 3: Query products');
  const response3 = await agent.input('What products do we have and what is the total value of all products?');
  console.log('Response:', response3);
  console.log('---');

  console.log('Example 4: Add a user');
  const response4 = await agent.input('Please add a new user named Diana who is 28 years old');
  console.log('Response:', response4);
  console.log('---');

  console.log('Example 5: Verify addition');
  const response5 = await agent.input('Can you show me all users now?');
  console.log('Response:', response5);
}

// Run the example
main().catch(console.error);