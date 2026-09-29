const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

// Fix: all files in src/components/ should use "../api.js"
// files in src/context/ and src/hooks/ and src/utils/ also use "../api.js"
// files directly in src/ use "./api.js"

function fixImportPaths(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      fixImportPaths(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith(".jsx") || entry.name.endsWith(".js")) && entry.name !== "api.js") {
      let content = fs.readFileSync(fullPath, "utf8");
      
      if (!content.includes("from \"../../api.js\"") && !content.includes("from \"../api.js\"") && !content.includes("from \"./api.js\"")) continue;
      
      // Determine correct relative path from this file to src/api.js
      const relativeToSrc = path.relative(srcDir, path.dirname(fullPath));
      const depth = relativeToSrc === "" ? 0 : relativeToSrc.split(path.sep).length;
      
      let correctImport;
      if (depth === 0) {
        correctImport = "./api.js";
      } else if (depth === 1) {
        correctImport = "../api.js";
      } else {
        correctImport = "../".repeat(depth) + "api.js";
      }
      
      // Replace all wrong paths with the correct one
      content = content.replace(/from "\.\.\/\.\.\/api\.js"/g, `from "${correctImport}"`);
      content = content.replace(/from "\.\.\/api\.js"/g, `from "${correctImport}"`);
      content = content.replace(/from "\.\/api\.js"/g, `from "${correctImport}"`);
      
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`✅ Fixed import path in: ${path.relative(srcDir, fullPath)} → ${correctImport}`);
    }
  }
}

console.log("Fixing API import paths...\n");
fixImportPaths(srcDir);
console.log("\nAll import paths fixed!");
