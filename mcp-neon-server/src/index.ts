#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

class NeonMCPServer {
  private server: Server;
  private pool: Pool | null = null;
  private db: any = null;

  constructor() {
    this.server = new Server(
      {
        name: "neon-mcp-server",
        version: "1.0.0",
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "test_connection",
            description: "Test the Neon database connection",
            inputSchema: {
              type: "object",
              properties: {
                connectionString: {
                  type: "string",
                  description: "Neon database connection string"
                }
              },
              required: ["connectionString"]
            }
          },
          {
            name: "create_audit_table",
            description: "Create the audit_logs table with proper indexes",
            inputSchema: {
              type: "object",
              properties: {
                connectionString: {
                  type: "string",
                  description: "Neon database connection string"
                }
              },
              required: ["connectionString"]
            }
          },
          {
            name: "run_query",
            description: "Execute a SQL query on the Neon database",
            inputSchema: {
              type: "object",
              properties: {
                connectionString: {
                  type: "string",
                  description: "Neon database connection string"
                },
                query: {
                  type: "string",
                  description: "SQL query to execute"
                }
              },
              required: ["connectionString", "query"]
            }
          },
          {
            name: "list_tables",
            description: "List all tables in the database",
            inputSchema: {
              type: "object",
              properties: {
                connectionString: {
                  type: "string",
                  description: "Neon database connection string"
                }
              },
              required: ["connectionString"]
            }
          },
          {
            name: "get_table_count",
            description: "Get the row count of a table",
            inputSchema: {
              type: "object",
              properties: {
                connectionString: {
                  type: "string",
                  description: "Neon database connection string"
                },
                tableName: {
                  type: "string",
                  description: "Name of the table"
                }
              },
              required: ["connectionString", "tableName"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "test_connection":
            return await this.testConnection(args?.connectionString as string);
          
          case "create_audit_table":
            return await this.createAuditTable(args?.connectionString as string);
          
          case "run_query":
            return await this.runQuery(args?.connectionString as string, args?.query as string);
          
          case "list_tables":
            return await this.listTables(args?.connectionString as string);
          
          case "get_table_count":
            return await this.getTableCount(args?.connectionString as string, args?.tableName as string);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async testConnection(connectionString: string) {
    try {
      const pool = new Pool({ connectionString });
      const result = await pool.query('SELECT NOW() as current_time');
      await pool.end();
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Connection successful! Current time: ${result.rows[0].current_time}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Connection failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }

  private async createAuditTable(connectionString: string) {
    try {
      const pool = new Pool({ connectionString });
      
      const schema = `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          level TEXT NOT NULL CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
          source TEXT NOT NULL,
          message TEXT NOT NULL,
          details JSONB,
          user_id INTEGER,
          request_id TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs (level);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_source ON audit_logs (source);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_details_gin ON audit_logs USING GIN (details);
      `;
      
      await pool.query(schema);
      await pool.end();
      
      return {
        content: [
          {
            type: "text",
            text: `✅ audit_logs table created successfully with all indexes!`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to create audit table: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async runQuery(connectionString: string, query: string) {
    try {
      const pool = new Pool({ connectionString });
      const result = await pool.query(query);
      await pool.end();
      
      return {
        content: [
          {
            type: "text",
            text: `Query executed successfully!\n\nRows returned: ${result.rows.length}\n\nResult:\n${JSON.stringify(result.rows, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async listTables(connectionString: string) {
    try {
      const pool = new Pool({ connectionString });
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      await pool.end();

      const tables = result.rows.map(row => row.table_name).join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Tables in database:\n${tables || 'No tables found'}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getTableCount(connectionString: string, tableName: string) {
    try {
      const pool = new Pool({ connectionString });
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      await pool.end();
      
      return {
        content: [
          {
            type: "text",
            text: `Table '${tableName}' has ${result.rows[0].count} rows.`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get table count: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Neon MCP server running on stdio");
  }
}

// Start the server
const server = new NeonMCPServer();
server.run().catch(console.error);
