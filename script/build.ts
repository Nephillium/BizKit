import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const distIndexContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

process.env.NODE_ENV = 'production';

const serverPath = path.join(__dirname, '..', 'server', 'index.ts');

const child = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
`;

async function buildAll() {
  console.log("Building Next.js application...");
  
  try {
    execSync("npx next build", { stdio: "inherit" });
    
    console.log("Creating production server wrapper...");
    if (!existsSync("dist")) {
      mkdirSync("dist", { recursive: true });
    }
    writeFileSync(join("dist", "index.cjs"), distIndexContent);
    
    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
