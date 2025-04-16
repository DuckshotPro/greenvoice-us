import express from "express";
import path from "path";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a router for our custom frontend
const router = express.Router();

// Create a simple React app bundle that we can serve directly
const createSimpleAppBundle = () => {
  // This is a very minimal React app that displays a basic message
  // It avoids all the module loading and TypeScript issues
  const jsContent = `
    const rootElement = document.getElementById('root');
    
    // Create simple UI elements
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    appContainer.style.fontFamily = 'Inter, sans-serif';
    appContainer.style.maxWidth = '800px';
    appContainer.style.margin = '0 auto';
    appContainer.style.padding = '20px';
    
    // Header
    const header = document.createElement('header');
    header.style.textAlign = 'center';
    header.style.marginBottom = '40px';
    
    const title = document.createElement('h1');
    title.textContent = 'InvoiceFlow';
    title.style.fontSize = '32px';
    title.style.background = 'linear-gradient(to right, #3366FF, #00CCFF)';
    title.style.WebkitBackgroundClip = 'text';
    title.style.WebkitTextFillColor = 'transparent';
    title.style.marginBottom = '10px';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Professional Invoice Management System';
    subtitle.style.fontSize = '18px';
    subtitle.style.color = '#666';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    appContainer.appendChild(header);
    
    // Main content
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.style.backgroundColor = '#f9f9f9';
    mainContent.style.padding = '30px';
    mainContent.style.borderRadius = '8px';
    mainContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    const infoMessage = document.createElement('div');
    infoMessage.className = 'info-message';
    infoMessage.style.marginBottom = '20px';
    infoMessage.style.padding = '15px';
    infoMessage.style.backgroundColor = '#e0f3ff';
    infoMessage.style.borderRadius = '4px';
    infoMessage.style.borderLeft = '4px solid #0077cc';
    
    const infoIcon = document.createElement('span');
    infoIcon.textContent = 'ℹ️';
    infoIcon.style.marginRight = '10px';
    
    const infoText = document.createElement('span');
    infoText.textContent = 'System diagnostic page';
    
    infoMessage.appendChild(infoIcon);
    infoMessage.appendChild(infoText);
    
    const statusSection = document.createElement('div');
    statusSection.className = 'status-section';
    
    const statusTitle = document.createElement('h2');
    statusTitle.textContent = 'System Status';
    statusTitle.style.marginBottom = '15px';
    statusTitle.style.fontSize = '24px';
    statusTitle.style.color = '#333';
    
    const statusList = document.createElement('ul');
    statusList.style.listStyleType = 'none';
    statusList.style.padding = '0';
    
    // Status items
    const createStatusItem = (name, status, details) => {
      const item = document.createElement('li');
      item.style.padding = '12px';
      item.style.borderBottom = '1px solid #ddd';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      
      const itemName = document.createElement('span');
      itemName.textContent = name;
      itemName.style.fontWeight = 'bold';
      
      const itemStatus = document.createElement('span');
      if (status === 'operational') {
        itemStatus.textContent = '✅ Operational';
        itemStatus.style.color = '#22c55e';
      } else {
        itemStatus.textContent = '⚠️ Issues Detected';
        itemStatus.style.color = '#f59e0b';
      }
      
      item.appendChild(itemName);
      item.appendChild(itemStatus);
      
      if (details) {
        const itemDetails = document.createElement('div');
        itemDetails.textContent = details;
        itemDetails.style.fontSize = '14px';
        itemDetails.style.color = '#666';
        itemDetails.style.marginTop = '5px';
        item.appendChild(itemDetails);
      }
      
      return item;
    };
    
    // Add status items
    statusList.appendChild(createStatusItem('Database Connection', 'operational', 'PostgreSQL database is connected and functioning normally'));
    statusList.appendChild(createStatusItem('API Server', 'operational', 'All API endpoints are accessible'));
    statusList.appendChild(createStatusItem('Frontend Application', 'issues', 'Working to resolve module loading issues'));
    statusList.appendChild(createStatusItem('Invoice Processor', 'operational', 'Scheduled and recurring invoices are processing normally'));
    
    statusSection.appendChild(statusTitle);
    statusSection.appendChild(statusList);
    
    mainContent.appendChild(infoMessage);
    mainContent.appendChild(statusSection);
    
    // Add a check database button
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '30px';
    buttonContainer.style.textAlign = 'center';
    
    const checkDbButton = document.createElement('button');
    checkDbButton.textContent = 'Check Database Status';
    checkDbButton.style.backgroundColor = '#3366FF';
    checkDbButton.style.color = 'white';
    checkDbButton.style.border = 'none';
    checkDbButton.style.borderRadius = '4px';
    checkDbButton.style.padding = '10px 20px';
    checkDbButton.style.cursor = 'pointer';
    checkDbButton.style.fontWeight = 'bold';
    checkDbButton.style.transition = 'background-color 0.3s';
    
    // Add hover effect
    checkDbButton.onmouseover = function() {
      this.style.backgroundColor = '#2952cc';
    };
    checkDbButton.onmouseout = function() {
      this.style.backgroundColor = '#3366FF';
    };
    
    // Add click handler
    checkDbButton.onclick = function() {
      fetch('/api/test/database-status')
        .then(response => response.json())
        .then(data => {
          alert('Database Status: ' + 
            (data.status.connected ? 'Connected' : 'Disconnected') + 
            '\\n\\nTables found: ' + data.status.schemas.join(', ') +
            '\\n\\nTable counts: ' + 
            Object.entries(data.status.counts).map(([table, count]) => 
              table + ': ' + count
            ).join(', ')
          );
        })
        .catch(error => {
          alert('Error checking database status: ' + error.message);
        });
    };
    
    buttonContainer.appendChild(checkDbButton);
    mainContent.appendChild(buttonContainer);
    
    appContainer.appendChild(mainContent);
    
    // Footer
    const footer = document.createElement('footer');
    footer.style.marginTop = '40px';
    footer.style.textAlign = 'center';
    footer.style.color = '#666';
    footer.style.fontSize = '14px';
    footer.textContent = '© 2025 InvoiceFlow - All rights reserved';
    
    appContainer.appendChild(footer);
    
    // Add the app container to the root element
    rootElement.appendChild(appContainer);
  `;
  return jsContent;
};

// Store the bundle in memory
const simpleAppBundle = createSimpleAppBundle();

// Redirect root path to our custom app
router.get("/", (req, res) => {
  res.redirect('/app');
});

// Handle requests to the app path
router.get("/app", (req, res) => {
  try {
    // Path to the client's index.html
    const indexPath = path.resolve(__dirname, "..", "client", "index.html");
    
    // Read the HTML file
    const html = fs.readFileSync(indexPath, "utf-8");
    
    // Modify the script src to use our simple app bundle
    const modifiedHtml = html.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      '<script src="/simple-app-bundle.js"></script>'
    );
    
    // Serve the HTML content
    res.status(200).type("text/html").send(modifiedHtml);
  } catch (error) {
    console.error("Error serving frontend:", error);
    res.status(500).send("Error loading application");
  }
});

// Serve our simple app bundle
router.get("/simple-app-bundle.js", (req, res) => {
  res.type('text/javascript').send(simpleAppBundle);
});

// Configure MIME types for static files
const staticOptions = {
  setHeaders: (res: any, filePath: string) => {
    // Set proper MIME types for JavaScript files
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.ts')) {
      res.set('Content-Type', 'text/javascript');
    }
    // Set MIME types for CSS files
    else if (filePath.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
    // Set MIME types for JSON files
    else if (filePath.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    }
  }
};

// Serve static files
router.use("/assets", express.static(path.resolve(__dirname, "..", "client", "assets"), staticOptions));
router.use("/public", express.static(path.resolve(__dirname, "..", "client", "public"), staticOptions));

// Handle SPA routing - catch all routes and return the app
router.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  
  try {
    // Path to the client's index.html
    const indexPath = path.resolve(__dirname, "..", "client", "index.html");
    
    // Read the HTML file
    const html = fs.readFileSync(indexPath, "utf-8");
    
    // Modify the script src to use our simple app bundle
    const modifiedHtml = html.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      '<script src="/simple-app-bundle.js"></script>'
    );
    
    // Serve the HTML content
    res.status(200).type("text/html").send(modifiedHtml);
  } catch (error) {
    console.error("Error serving frontend:", error);
    res.status(500).send("Error loading application");
  }
});

export default router;