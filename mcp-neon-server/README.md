# Neon MCP Server

A Model Context Protocol (MCP) server for Neon database operations. This server provides tools for testing connections, creating tables, running queries, and managing your Neon database directly through MCP.

## Features

- **Connection Testing**: Verify Neon database connectivity
- **Table Management**: Create tables and view table information
- **Query Execution**: Run SQL queries directly
- **Database Inspection**: List tables and get row counts
- **Schema Information**: View table structures and column details

## Setup

### 1. Install Dependencies

```bash
cd mcp-neon-server
npm install
```

### 2. Configure Environment

Copy the example environment file and add your Neon connection string:

```bash
cp .env.example .env
```

Edit `.env` and add your Neon connection string:
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-xxx.neon.tech/dbname?sslmode=require"
```

### 3. Build the Server

```bash
npm run build
```

### 4. Test the Server

```bash
npm start
```

## Available Tools

### `test_connection`
Test the Neon database connection.

**Parameters:**
- `connectionString` (string): Neon database connection string

### `create_table`
Create a new table in the Neon database.

**Parameters:**
- `tableName` (string): Name of the table to create
- `schema` (string): SQL schema for the table

### `run_query`
Execute a SQL query on the Neon database.

**Parameters:**
- `query` (string): SQL query to execute

### `get_table_info`
Get information about a table structure.

**Parameters:**
- `tableName` (string): Name of the table

### `list_tables`
List all tables in the database.

**Parameters:** None

### `get_table_count`
Get the row count of a table.

**Parameters:**
- `tableName` (string): Name of the table

## Usage Examples

### Testing Connection
```json
{
  "name": "test_connection",
  "arguments": {
    "connectionString": "postgresql://user:pass@host/db?sslmode=require"
  }
}
```

### Creating the Audit Logs Table
```json
{
  "name": "create_table",
  "arguments": {
    "tableName": "audit_logs",
    "schema": "CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), level TEXT NOT NULL, source TEXT NOT NULL, message TEXT NOT NULL, details JSONB, user_id INTEGER, request_id TEXT, ip_address TEXT, user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"
  }
}
```

### Running a Query
```json
{
  "name": "run_query",
  "arguments": {
    "query": "SELECT COUNT(*) FROM audit_logs"
  }
}
```

## Integration with Cursor

To use this MCP server with Cursor:

1. **Add to Cursor's MCP configuration** (usually in `~/.cursor/mcp_servers.json`):
```json
{
  "mcpServers": {
    "neon": {
      "command": "node",
      "args": ["/path/to/your/project/mcp-neon-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "your-neon-connection-string"
      }
    }
  }
}
```

2. **Restart Cursor** to load the new MCP server.

3. **Use the tools** in your conversations with the AI assistant.

## Development

### Running in Development Mode
```bash
npm run dev
```

### Watching for Changes
```bash
npm run watch
```

## Security Notes

- Keep your database connection strings secure
- Consider using environment variables for sensitive data
- The server runs with the permissions of the database user specified in the connection string
- Only grant necessary permissions to the database user

## Troubleshooting

### Connection Issues
- Verify your Neon connection string is correct
- Ensure SSL is enabled (`sslmode=require`)
- Check that your IP is allowed in Neon's connection settings

### Permission Issues
- Ensure your database user has the necessary permissions
- For table creation, the user needs `CREATE` permission
- For queries, the user needs appropriate `SELECT`, `INSERT`, `UPDATE`, `DELETE` permissions

### Build Issues
- Make sure TypeScript is installed: `npm install -g typescript`
- Check that all dependencies are installed: `npm install`
- Verify the TypeScript configuration in `tsconfig.json`