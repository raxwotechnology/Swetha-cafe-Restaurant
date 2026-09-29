const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");
const OLD_URL = "https://gasmachineserestaurantapp.onrender.com";
const NEW_IMPORT = `import API_BASE_URL from "../api.js";`;
const NEW_IMPORT_CONTEXT = `import API_BASE_URL from "../../api.js";`;

let filesModified = 0;
let totalReplacements = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes(OLD_URL)) return;

  const occurrences = (content.match(new RegExp(OLD_URL.replace(/\./g, "\\."), "g")) || []).length;

  // Replace all occurrences of the old URL string with the variable
  content = content.replace(new RegExp(`"${OLD_URL.replace(/\./g, "\\.")}`, "g"), '`${API_BASE_URL}');
  content = content.replace(new RegExp(`'${OLD_URL.replace(/\./g, "\\.")}`, "g"), '`${API_BASE_URL}');

  // Close template literals - convert `${API_BASE_URL}/path" → `${API_BASE_URL}/path`
  // The pattern: `${API_BASE_URL}...ending with " or '
  content = content.replace(/(`\$\{API_BASE_URL\}[^`"'\n]*)['"]/g, "$1`");

  // Add API_BASE_URL import if not already present
  const relativeDepth = filePath.replace(srcDir, "").split(path.sep).length - 1;
  const importStatement = relativeDepth <= 1 ? NEW_IMPORT : NEW_IMPORT_CONTEXT;

  if (!content.includes("import API_BASE_URL")) {
    // Add import after the last existing import line
    const lastImportIndex = content.lastIndexOf("import ");
    const endOfLastImport = content.indexOf("\n", lastImportIndex);
    if (lastImportIndex !== -1 && endOfLastImport !== -1) {
      content = content.slice(0, endOfLastImport + 1) + importStatement + "\n" + content.slice(endOfLastImport + 1);
    } else {
      content = importStatement + "\n" + content;
    }
  }

  fs.writeFileSync(filePath, content, "utf8");
  filesModified++;
  totalReplacements += occurrences;
  console.log(`✅ Updated: ${path.basename(filePath)} (${occurrences} replacements)`);
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith(".jsx") || entry.name.endsWith(".js")) && entry.name !== "api.js") {
      processFile(fullPath);
    }
  }
}

console.log("Starting URL replacement across all frontend files...\n");
walkDir(srcDir);
console.log(`\nDone! Modified ${filesModified} files with ${totalReplacements} total URL replacements.`);
