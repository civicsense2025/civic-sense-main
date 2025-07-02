#!/usr/bin/env node

/**
 * Database Constants Regeneration Script
 * 
 * This script regenerates the database-constants.ts file from database.types.ts
 * to ensure consistency between web and mobile apps.
 */

import fs from 'fs';
import path from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

const LIB_DIR = path.join(process.cwd(), 'lib');
const DATABASE_TYPES_FILE = path.join(LIB_DIR, 'database.types.ts');
const DATABASE_CONSTANTS_FILE = path.join(LIB_DIR, 'database-constants.ts');

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toConstantCase(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function toPascalCase(str: string): string {
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

// =============================================================================
// TYPE PARSING FUNCTIONS
// =============================================================================

interface TableInfo {
  name: string;
  columns: string[];
}

interface FunctionInfo {
  name: string;
  args: Record<string, string>;
  returns: string;
}

interface EnumInfo {
  name: string;
  values: string[];
}

function parseTablesFromTypeScript(content: string): TableInfo[] {
  const tables: TableInfo[] = [];
  
  // Match the Tables section in the Database type
  const tablesMatch = content.match(/Tables:\s*\{([^}]+(?:\}[^}]*)*)\}/s);
  if (!tablesMatch || !tablesMatch[1]) {
    throw new Error('Could not find Tables section in database.types.ts');
  }
  
  const tablesContent = tablesMatch[1];
  
  // Extract each table definition
  const tableMatches = tablesContent.matchAll(/(\w+):\s*\{[^}]*Row:\s*\{([^}]+)\}/gs);
  
  for (const match of tableMatches) {
    const tableName = match[1];
    const rowContent = match[2];
    
    if (!tableName || !rowContent) {
      continue; // Skip invalid matches
    }
    
    // Extract column names from the Row type
    const columnMatches = rowContent.matchAll(/(\w+):/g);
    const columns = Array.from(columnMatches)
      .map(m => m[1])
      .filter((col): col is string => col !== undefined);
    
    tables.push({
      name: tableName,
      columns: columns
    });
  }
  
  return tables;
}

function parseFunctionsFromTypeScript(content: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  
  // Match the Functions section
  const functionsMatch = content.match(/Functions:\s*\{([^}]+(?:\}[^}]*)*)\}/s);
  if (!functionsMatch || !functionsMatch[1]) {
    return functions; // No functions defined
  }
  
  const functionsContent = functionsMatch[1];
  
  // Extract each function definition
  const functionMatches = functionsContent.matchAll(/(\w+):\s*\{[^}]*Args:\s*([^}]*)\s*Returns:\s*([^}]*)\}/gs);
  
  for (const match of functionMatches) {
    const functionName = match[1];
    const argsContent = match[2];
    const returnsContent = match[3];
    
    if (!functionName || !argsContent || !returnsContent) {
      continue; // Skip invalid matches
    }
    
    // Parse args (simplified - just extract the type)
    const args: Record<string, string> = {};
    const argMatches = argsContent.matchAll(/(\w+):\s*([^,}]+)/g);
    for (const argMatch of argMatches) {
      const argName = argMatch[1];
      const argType = argMatch[2];
      if (argName && argType) {
        args[argName] = argType.trim();
      }
    }
    
    functions.push({
      name: functionName,
      args,
      returns: returnsContent.trim()
    });
  }
  
  return functions;
}

function parseEnumsFromTypeScript(content: string): EnumInfo[] {
  const enums: EnumInfo[] = [];
  
  // Match the Enums section
  const enumsMatch = content.match(/Enums:\s*\{([^}]+(?:\}[^}]*)*)\}/s);
  if (!enumsMatch || !enumsMatch[1]) {
    return enums; // No enums defined
  }
  
  const enumsContent = enumsMatch[1];
  
  // Extract each enum definition
  const enumMatches = enumsContent.matchAll(/(\w+):\s*\{[^}]*Row:\s*([^}]+)\}/gs);
  
  for (const match of enumMatches) {
    const enumName = match[1];
    const valuesContent = match[2];
    
    if (!enumName || !valuesContent) {
      continue; // Skip invalid matches
    }
    
    // Extract enum values (simplified)
    const valueMatches = valuesContent.matchAll(/"([^"]+)"/g);
    const values = Array.from(valueMatches)
      .map(m => m[1])
      .filter((val): val is string => val !== undefined);
    
    enums.push({
      name: enumName,
      values
    });
  }
  
  return enums;
}

// =============================================================================
// CODE GENERATION FUNCTIONS
// =============================================================================

function generateTableConstants(tables: TableInfo[]): string {
  const tableEntries = tables.map(table => 
    `  ${toConstantCase(table.name)}: '${table.name}' as const,`
  ).join('\n');
  
  return `export const DB_TABLES = {
${tableEntries}
} as const;

export type DbTableName = keyof typeof DB_TABLES;`;
}

function generateColumnConstants(tables: TableInfo[]): string {
  const columnSections = tables.map(table => {
    const columnEntries = table.columns.map(column =>
      `    ${toConstantCase(column)}: '${column}' as const,`
    ).join('\n');
    
    return `  ${toConstantCase(table.name)}: {
${columnEntries}
  } as const,`;
  }).join('\n\n');
  
  return `export const DB_COLUMNS = {
${columnSections}
} as const;`;
}

function generateTypeAliases(tables: TableInfo[]): string {
  const aliases = tables.flatMap(table => [
    `export type Db${toPascalCase(table.name)} = Tables<'${table.name}'>`,
    `export type Db${toPascalCase(table.name)}Insert = TablesInsert<'${table.name}'>`,
    `export type Db${toPascalCase(table.name)}Update = TablesUpdate<'${table.name}'>`
  ]).join('\n');
  
  return aliases;
}

function generateFunctionConstants(functions: FunctionInfo[]): string {
  const functionEntries = functions.map(func => 
    `  ${toConstantCase(func.name)}: '${func.name}' as const,`
  ).join('\n');
  
  if (functions.length === 0) {
    return `export const DB_FUNCTIONS = {} as const;

export type DbFunctionName = keyof typeof DB_FUNCTIONS;`;
  }
  
  return `export const DB_FUNCTIONS = {
${functionEntries}
} as const;

export type DbFunctionName = keyof typeof DB_FUNCTIONS;`;
}

function generateEnumConstants(enums: EnumInfo[]): string {
  const enumSections = enums.map(enumInfo => {
    const valueEntries = enumInfo.values.map(value =>
      `    ${toConstantCase(value)}: '${value}' as const,`
    ).join('\n');
    
    return `  ${toConstantCase(enumInfo.name)}: {
${valueEntries}
  } as const,`;
  }).join('\n\n');
  
  if (enums.length === 0) {
    return `export const DB_ENUMS = {} as const;

export type DbEnumName = keyof typeof DB_ENUMS;`;
  }
  
  return `export const DB_ENUMS = {
${enumSections}
} as const;

export type DbEnumName = keyof typeof DB_ENUMS;`;
}

function generateUtilityFunctions(): string {
  return `
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getTableColumns = (tableName: string): string[] => {
  const tableConstant = toConstantCase(tableName);
  const columns = (DB_COLUMNS as any)[tableConstant];
  return columns ? Object.values(columns) : [];
};

export const isValidTableName = (tableName: string): tableName is DbTableName => {
  return Object.values(DB_TABLES).includes(tableName as any);
};

export const isValidFunctionName = (functionName: string): functionName is DbFunctionName => {
  return Object.values(DB_FUNCTIONS).includes(functionName as any);
};

export const isValidEnumName = (enumName: string): enumName is DbEnumName => {
  return Object.values(DB_ENUMS).includes(enumName as any);
};

export const getTableConstant = (tableName: string): string | undefined => {
  const entries = Object.entries(DB_TABLES);
  const entry = entries.find(([_, value]) => value === tableName);
  return entry ? entry[0] : undefined;
};

export const getFunctionConstant = (functionName: string): string | undefined => {
  const entries = Object.entries(DB_FUNCTIONS);
  const entry = entries.find(([_, value]) => value === functionName);
  return entry ? entry[0] : undefined;
};

function toConstantCase(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}`;
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

function generateDatabaseConstants(): string {
  console.log('📖 Reading database.types.ts...');
  
  if (!fs.existsSync(DATABASE_TYPES_FILE)) {
    throw new Error(`Database types file not found: ${DATABASE_TYPES_FILE}`);
  }
  
  const content = fs.readFileSync(DATABASE_TYPES_FILE, 'utf-8');
  
  console.log('🔍 Parsing database schema...');
  const tables = parseTablesFromTypeScript(content);
  const functions = parseFunctionsFromTypeScript(content);
  const enums = parseEnumsFromTypeScript(content);
  
  console.log(`✅ Found ${tables.length} tables, ${functions.length} functions, ${enums.length} enums`);
  
  console.log('🏗️ Generating constants...');
  
  const header = `/**
 * Database Constants for CivicSense Mobile App
 * 
 * This file is auto-generated from the main database.types.ts file
 * to ensure consistency between web and mobile apps.
 * 
 * Last updated: ${new Date().toISOString()}
 * 
 * DO NOT EDIT MANUALLY - Use 'npm run regen:db-constants' to update
 */

import type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

// =============================================================================
// TABLE NAMES
// =============================================================================

`;
  
  const tableConstants = generateTableConstants(tables);
  const columnConstants = generateColumnConstants(tables);
  const functionConstants = generateFunctionConstants(functions);
  const enumConstants = generateEnumConstants(enums);
  const typeAliases = generateTypeAliases(tables);
  const utilityFunctions = generateUtilityFunctions();
  
  const footer = `
// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type DatabaseConstants = typeof DB_TABLES;
export type DatabaseColumns = typeof DB_COLUMNS;
export type DatabaseFunctions = typeof DB_FUNCTIONS;
export type DatabaseEnums = typeof DB_ENUMS;

// =============================================================================
// TABLE TYPE ALIASES
// =============================================================================

${typeAliases}
`;
  
  return [
    header,
    tableConstants,
    '',
    '// =============================================================================',
    '// TABLE COLUMNS',
    '// =============================================================================',
    '',
    columnConstants,
    '',
    '// =============================================================================',
    '// FUNCTIONS',
    '// =============================================================================',
    '',
    functionConstants,
    '',
    '// =============================================================================',
    '// ENUMS',
    '// =============================================================================',
    '',
    enumConstants,
    utilityFunctions,
    footer
  ].join('\n');
}

// =============================================================================
// MAIN SCRIPT
// =============================================================================

async function main() {
  try {
    console.log('🚀 Starting database constants regeneration...');
    
    const constantsContent = generateDatabaseConstants();
    
    console.log('💾 Writing database-constants.ts...');
    fs.writeFileSync(DATABASE_CONSTANTS_FILE, constantsContent, 'utf-8');
    
    console.log('✅ Database constants regenerated successfully!');
    console.log(`📁 Output: ${DATABASE_CONSTANTS_FILE}`);
    
  } catch (error) {
    console.error('❌ Error regenerating database constants:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { generateDatabaseConstants }; 