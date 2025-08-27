#!/bin/bash

# Setup script for MCP Neon server
echo "🔧 Setting up MCP Neon Server"
echo "============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create MCP server directory if it doesn't exist
if [ ! -d "mcp-neon-server" ]; then
    echo "📁 Creating mcp-neon-server directory..."
    mkdir -p mcp-neon-server
fi

cd mcp-neon-server

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "📝 Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "mcp-neon-server",
  "version": "1.0.0",
  "description": "MCP server for Neon database operations",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "@neondatabase/serverless": "^0.9.0",
    "drizzle-orm": "^0.29.0",
    "ws": "^8.14.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/ws": "^8.5.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
fi

# Create TypeScript config
echo "📝 Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create src directory and main file
mkdir -p src

echo "📝 Creating MCP server source code..."
cat > src/index.ts << 'EOF'
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
      },
      {
        capabilities: {
          tools: {},
        },
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
            return await this.testConnection(args.connectionString);
          
          case "create_audit_table":
            return await this.createAuditTable(args.connectionString);
          
          case "run_query":
            return await this.runQuery(args.connectionString, args.query);
          
          case "list_tables":
            return await this.listTables(args.connectionString);
          
          case "get_table_count":
            return await this.getTableCount(args.connectionString, args.tableName);
          
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
EOF

# Create .env file
echo "📝 Creating .env file..."
cat > .env << 'EOF'
# Neon Database Connection
# Replace with your actual Neon connection string
DATABASE_URL="postgresql://neondb_owner:password@ep-xxx.neon.tech/dbname?sslmode=require"
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the MCP server..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 MCP Neon Server Setup Complete!"
    echo "=================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit mcp-neon-server/.env with your Neon connection string"
    echo "2. Test the server: cd mcp-neon-server && npm start"
    echo "3. Add to Cursor's MCP configuration:"
    echo ""
    echo "Add this to ~/.cursor/mcp_servers.json:"
    echo "{"
    echo '  "mcpServers": {'
    echo '    "neon": {'
    echo '      "command": "node",'
    echo '      "args": ["'$(pwd)'/mcp-neon-server/dist/index.js"],'
    echo '      "env": {'
    echo '        "DATABASE_URL": "your-neon-connection-string"'
    echo '      }'
    echo '    }'
    echo '  }'
    echo "}"
    echo ""
    echo "4. Restart Cursor to load the MCP server"
    echo ""
    echo "🔧 Available Tools:"
    echo "  • test_connection - Test Neon database connection"
    echo "  • create_audit_table - Create audit_logs table with indexes"
    echo "  • run_query - Execute SQL queries"
    echo "  • list_tables - List all tables"
    echo "  • get_table_count - Get row count for a table"
    echo ""
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi