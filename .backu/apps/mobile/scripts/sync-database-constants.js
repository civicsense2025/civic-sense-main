#!/usr/bin/env node

/**
 * Database Constants Sync Script for CivicSense Mobile
 * 
 * This script reads the main database.types.ts file and extracts:
 * - Table names from the Database.public.Tables interface
 * - Column information from each table's Row interface with proper types
 * - Enum values from the Database.public.Enums interface  
 * - Function names from the Database.public.Functions interface
 * - TypeScript type definitions for all tables (Row, Insert, Update)
 * - Function argument and return types
 * 
 * It then updates the mobile app's database-constants.ts file
 * to ensure consistency between web and mobile apps.
 */

const fs = require('fs');
const path = require('path');

// Paths
const MAIN_DB_TYPES_PATH = '../../../lib/database.types.ts';
const MOBILE_CONSTANTS_PATH = '../lib/database-constants.ts';

// Resolve absolute paths
const mainDbTypesPath = path.resolve(__dirname, MAIN_DB_TYPES_PATH);
const mobileConstantsPath = path.resolve(__dirname, MOBILE_CONSTANTS_PATH);

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

log('🔄 Syncing database constants for mobile...');
log(`📖 Reading from: ${mainDbTypesPath}`);
log(`✏️  Writing to: ${mobileConstantsPath}`);

// Read the main database types file
let dbTypesContent;
try {
  if (!fs.existsSync(mainDbTypesPath)) {
    log('Main database types file not found', 'error');
    process.exit(1);
  }
  dbTypesContent = fs.readFileSync(mainDbTypesPath, 'utf8');
} catch (error) {
  log(`Error reading database types file: ${error.message}`, 'error');
  process.exit(1);
}

// Extract table names from Tables interface
function extractTableNames(content) {
  const tableNames = [];
  
  try {
    // Look for the Tables interface definition
    const tablesMatch = content.match(/Tables:\s*\{([\s\S]*?)\s*\}\s*Views:/);
    if (tablesMatch) {
      const tablesContent = tablesMatch[1];
      
      // Look for table definitions: lines that start with table_name: { but exclude nested properties
      const tableMatches = tablesContent.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*):\s*\{/gm);
      if (tableMatches) {
        tableMatches.forEach(match => {
          const tableName = match.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*):/)[1];
          // Filter out nested properties like Row, Insert, Update, Relationships
          if (!['Row', 'Insert', 'Update', 'Relationships'].includes(tableName)) {
            tableNames.push(tableName);
          }
        });
      }
    }
  } catch (error) {
    log(`Error extracting table names: ${error.message}`, 'warning');
  }
  
  return [...new Set(tableNames)].sort();
}

// Extract detailed table information including columns and types
function extractTableDetails(content) {
  const tableDetails = {};
  
  try {
    // Look for the Tables interface definition
    const tablesMatch = content.match(/Tables:\s*\{([\s\S]*?)\s*\}\s*Views:/);
    if (tablesMatch) {
      const tablesContent = tablesMatch[1];
      log(`📊 Tables content length: ${tablesContent.length} characters`);
      
      // More sophisticated parsing - find each table block
      let depth = 0;
      let currentTable = null;
      let currentTableContent = '';
      let inTable = false;
      
      const lines = tablesContent.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if this line starts a new table
        const tableMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*\{/);
        if (tableMatch && depth === 0) {
          // Save previous table if exists
          if (currentTable && currentTableContent) {
            tableDetails[currentTable] = parseTableContent(currentTableContent);
          }
          
          currentTable = tableMatch[1];
          currentTableContent = '';
          inTable = true;
          depth = 1;
          continue;
        }
        
        if (inTable) {
          // Count braces to track depth
          const openBraces = (line.match(/\{/g) || []).length;
          const closeBraces = (line.match(/\}/g) || []).length;
          depth += openBraces - closeBraces;
          
          currentTableContent += line + '\n';
          
          // If we've closed all braces, we're done with this table
          if (depth === 0) {
            tableDetails[currentTable] = parseTableContent(currentTableContent);
            currentTable = null;
            currentTableContent = '';
            inTable = false;
          }
        }
      }
      
      // Handle last table if file doesn't end cleanly
      if (currentTable && currentTableContent) {
        tableDetails[currentTable] = parseTableContent(currentTableContent);
      }
    }
  } catch (error) {
    log(`Error extracting table details: ${error.message}`, 'warning');
  }
  
  return tableDetails;
}

// Parse individual table content to extract Row, Insert, Update interfaces
function parseTableContent(tableContent) {
  const tableInfo = {
    columns: [],
    rowType: null,
    insertType: null,
    updateType: null,
    relationships: []
  };
  
  try {
    // Extract Row interface
    const rowMatch = tableContent.match(/Row:\s*\{([\s\S]*?)\s*\}\s*Insert:/);
    if (rowMatch) {
      const rowContent = rowMatch[1];
      tableInfo.columns = extractColumnsFromInterface(rowContent);
      tableInfo.rowType = 'Row';
    }
    
    // Extract Insert interface
    const insertMatch = tableContent.match(/Insert:\s*\{([\s\S]*?)\s*\}\s*Update:/);
    if (insertMatch) {
      tableInfo.insertType = 'Insert';
    }
    
    // Extract Update interface
    const updateMatch = tableContent.match(/Update:\s*\{([\s\S]*?)\s*\}\s*Relationships:/);
    if (updateMatch) {
      tableInfo.updateType = 'Update';
    }
    
    // Extract Relationships - improved parsing for nested arrays
    const relationshipsStart = tableContent.indexOf('Relationships:');
    if (relationshipsStart !== -1) {
      const afterRelationships = tableContent.substring(relationshipsStart);
      const openBracketIndex = afterRelationships.indexOf('[');
      
      if (openBracketIndex !== -1) {
        let bracketDepth = 0;
        let endIndex = -1;
        
        // Find the matching closing bracket by counting depth
        for (let i = openBracketIndex; i < afterRelationships.length; i++) {
          if (afterRelationships[i] === '[') {
            bracketDepth++;
          } else if (afterRelationships[i] === ']') {
            bracketDepth--;
            if (bracketDepth === 0) {
              endIndex = i;
              break;
            }
          }
        }
        
        if (endIndex !== -1) {
          const relationshipsContent = afterRelationships.substring(openBracketIndex + 1, endIndex);
          log(`🔗 Found relationships section for table, content length: ${relationshipsContent.length}`);
          if (relationshipsContent.length > 0) {
            log(`🔗 Relationships content preview: ${relationshipsContent.substring(0, 200)}...`);
          }
          tableInfo.relationships = extractRelationships(relationshipsContent);
          log(`🔗 Extracted ${tableInfo.relationships.length} relationships for table`);
        } else {
          log(`🔗 Could not find closing bracket for relationships array`);
        }
      } else {
        log(`🔗 No opening bracket found after Relationships:`);
      }
    } else {
      log(`🔗 No relationships section found for table`);
    }
    
  } catch (error) {
    log(`Error parsing table content: ${error.message}`, 'warning');
  }
  
  return tableInfo;
}

// Extract columns from interface content
function extractColumnsFromInterface(interfaceContent) {
  const columns = [];
  
  try {
    // Split by lines and process each potential column
    const lines = interfaceContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      // Match column definitions: column_name: type
      const columnMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+?)(?:\s*$|\s*\/\/)/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        let columnType = columnMatch[2].trim();
        
        // Clean up the type (remove trailing commas, extra whitespace)
        columnType = columnType.replace(/,$/, '').replace(/\s+/g, ' ').trim();
        
        // Skip if this looks invalid
        if (columnName && columnType && !columnName.includes('{') && !columnName.includes('}')) {
          columns.push({
            name: columnName,
            type: columnType,
            nullable: columnType.includes('| null'),
            optional: columnType.includes('?')
          });
        }
      }
    }
  } catch (error) {
    log(`Error extracting columns: ${error.message}`, 'warning');
  }
  
  return columns;
}

// Extract relationship information
function extractRelationships(relationshipsContent) {
  const relationships = [];
  
  try {
    // More robust parsing to handle the actual Supabase relationship format
    // Look for relationship objects in the array
    const objectMatches = relationshipsContent.match(/\{[\s\S]*?\}/g);
    if (objectMatches) {
      objectMatches.forEach(match => {
        const relationship = {};
        
        // Extract foreignKeyName - handle both quoted formats
        const foreignKeyMatch = match.match(/foreignKeyName:\s*["|']([^"|']+)["|']/);
        if (foreignKeyMatch) {
          relationship.foreignKeyName = foreignKeyMatch[1];
        }
        
        // Extract columns array - handle various formats
        const columnsMatch = match.match(/columns:\s*\[([\s\S]*?)\]/);
        if (columnsMatch) {
          const columnsContent = columnsMatch[1];
          const columnValues = columnsContent.match(/["|']([^"|']+)["|']/g);
          if (columnValues) {
            relationship.columns = columnValues.map(col => col.replace(/["|']/g, ''));
          }
        }
        
        // Extract referencedRelation
        const referencedRelationMatch = match.match(/referencedRelation:\s*["|']([^"|']+)["|']/);
        if (referencedRelationMatch) {
          relationship.referencedRelation = referencedRelationMatch[1];
        }
        
        // Extract referencedColumns array
        const referencedColumnsMatch = match.match(/referencedColumns:\s*\[([\s\S]*?)\]/);
        if (referencedColumnsMatch) {
          const referencedColumnsContent = referencedColumnsMatch[1];
          const referencedColumnValues = referencedColumnsContent.match(/["|']([^"|']+)["|']/g);
          if (referencedColumnValues) {
            relationship.referencedColumns = referencedColumnValues.map(col => col.replace(/["|']/g, ''));
          }
        }
        
        // Extract isOneToOne (optional)
        const isOneToOneMatch = match.match(/isOneToOne:\s*(true|false)/);
        if (isOneToOneMatch) {
          relationship.isOneToOne = isOneToOneMatch[1] === 'true';
        }
        
        // Only add if we have the essential parts
        if (relationship.foreignKeyName && relationship.columns && relationship.referencedRelation && relationship.referencedColumns) {
          relationships.push(relationship);
        }
      });
    }
  } catch (error) {
    log(`Error extracting relationships: ${error.message}`, 'warning');
  }
  
  return relationships;
}

// Extract enum names and values from Enums interface
function extractEnums(content) {
  const enums = {};
  
  try {
    // Method 1: Try to extract from Constants.public.Enums (most reliable)
    const constantsMatch = content.match(/export const Constants = \{[\s\S]*?public:\s*\{[\s\S]*?Enums:\s*\{([\s\S]*?)\s*\}\s*,?\s*\}\s*,?\s*\}\s*as const/);
    if (constantsMatch) {
      log('📊 Found Constants.public.Enums section - extracting from arrays');
      const constantsEnumsContent = constantsMatch[1];
      
      // Extract enum definitions from the Constants format
      // Look for patterns like: enum_name: ["value1", "value2", "value3"]
      const enumMatches = constantsEnumsContent.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\[([\s\S]*?)\]/g);
      
      if (enumMatches) {
        enumMatches.forEach(match => {
          const enumMatch = match.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\[([\s\S]*?)\]/);
          if (enumMatch) {
            const enumName = enumMatch[1];
            const arrayContent = enumMatch[2];
            
            // Extract quoted values from the array
            const valueMatches = arrayContent.match(/"([^"]+)"/g);
            if (valueMatches) {
              const values = valueMatches.map(match => match.slice(1, -1)); // Remove quotes
              enums[enumName] = values;
              log(`✅ Extracted enum '${enumName}' with ${values.length} values: [${values.join(', ')}]`);
            }
          }
        });
      }
    }
    
    // Method 2: Fallback to Enums interface if Constants not found or incomplete
    if (Object.keys(enums).length === 0) {
      log('📊 Falling back to Enums interface extraction');
      const enumsMatch = content.match(/Enums:\s*\{([\s\S]*?)\s*\}\s*(?:CompositeTypes:|$)/);
      if (enumsMatch) {
        const enumsContent = enumsMatch[1];
        
        // Check if enums section is empty (contains only "[_ in never]: never")
        if (enumsContent.includes('[_ in never]: never')) {
          log('No custom enums found in database schema');
          return enums;
        }
        
        log(`📊 Processing enums interface content (${enumsContent.length} characters)`);
        
        // Extract enums from union type format
        // Look for patterns like: enum_name: "value1" | "value2" | "value3"
        const enumLines = enumsContent.split('\n');
        let currentEnum = null;
        let currentEnumLines = [];
        
        for (let i = 0; i < enumLines.length; i++) {
          const line = enumLines[i].trim();
          if (!line) continue;
          
          // Match enum declaration: enum_name: or enum_name:\n
          const enumStartMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
          
          if (enumStartMatch) {
            // Process previous enum if exists
            if (currentEnum && currentEnumLines.length > 0) {
              const values = extractEnumValuesFromLines(currentEnumLines);
              if (values.length > 0) {
                enums[currentEnum] = values;
                log(`✅ Extracted enum '${currentEnum}' with ${values.length} values: [${values.join(', ')}]`);
              }
            }
            
            currentEnum = enumStartMatch[1];
            currentEnumLines = [];
            
            // Check if values are on the same line
            const sameLine = enumStartMatch[2];
            if (sameLine && sameLine.trim()) {
              currentEnumLines.push(sameLine);
            }
          } else if (currentEnum && (line.startsWith('|') || line.includes('"'))) {
            // Continue collecting lines for current enum
            currentEnumLines.push(line);
          }
        }
        
        // Process final enum
        if (currentEnum && currentEnumLines.length > 0) {
          const values = extractEnumValuesFromLines(currentEnumLines);
          if (values.length > 0) {
            enums[currentEnum] = values;
            log(`✅ Extracted enum '${currentEnum}' with ${values.length} values: [${values.join(', ')}]`);
          }
        }
      }
    }
    
    log(`🎯 Successfully extracted ${Object.keys(enums).length} enums: ${Object.keys(enums).join(', ')}`);
    
  } catch (error) {
    log(`❌ Error extracting enums: ${error.message}`);
  }
  
  return enums;
}

// Helper function to extract enum values from lines of union type format
function extractEnumValuesFromLines(lines) {
  const values = [];
  
  try {
    // Join all lines and extract quoted values
    const content = lines.join(' ');
    
    // Remove leading/trailing pipes and extract all quoted strings
    const quotedMatches = content.match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach(match => {
        const value = match.slice(1, -1); // Remove quotes
        if (value && !values.includes(value)) {
          values.push(value);
        }
      });
    }
  } catch (error) {
    log(`Error extracting enum values from lines: ${error.message}`, 'warning');
  }
  
  return values;
}

// Helper function to extract enum values from content string
function extractEnumValuesFromContent(content) {
  const values = [];
  
  try {
    // Remove leading/trailing pipes and clean up content
    const cleanContent = content.replace(/^\|/, '').replace(/\|$/, '').trim();
    
    // Split by | and extract quoted values
    const parts = cleanContent.split('|');
    
    for (const part of parts) {
      const trimmedPart = part.trim();
      // Match quoted values - handles both single and double quotes
      const quotedMatch = trimmedPart.match(/^["|']([^"|']+)["|']$/);
      if (quotedMatch) {
        const value = quotedMatch[1].trim();
        if (value && !values.includes(value)) {
          values.push(value);
        }
      }
    }
    
    // If no values found with the split method, try a more comprehensive regex approach
    if (values.length === 0) {
      const allQuotedMatches = content.match(/["|']([^"|']+)["|']/g);
      if (allQuotedMatches) {
        allQuotedMatches.forEach(match => {
          const value = match.replace(/["|']/g, '').trim();
          if (value && !values.includes(value)) {
            values.push(value);
          }
        });
      }
    }
  } catch (error) {
    log(`Error extracting enum values from content: ${error.message}`, 'warning');
  }
  
  return values;
}

// Extract function names from Functions interface
function extractFunctionNames(content) {
  const functionNames = [];
  
  try {
    // Look for the Functions interface definition
    const functionsMatch = content.match(/Functions:\s*\{([\s\S]*?)\s*\}\s*\}/);
    if (functionsMatch) {
      const functionsContent = functionsMatch[1];
      
      // Look for function definitions: lines that start with function_name: {
      const functionMatches = functionsContent.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*):\s*\{/gm);
      if (functionMatches) {
        functionMatches.forEach(match => {
          const functionName = match.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*):/)[1];
          // Filter out nested properties like Args, Returns
          if (!['Args', 'Returns'].includes(functionName)) {
            functionNames.push(functionName);
          }
        });
      }
    }
  } catch (error) {
    log(`Error extracting function names: ${error.message}`, 'warning');
  }
  
  return [...new Set(functionNames)].sort();
}

// Extract existing type exports from the main database.types.ts file
function extractExistingTypeExports(content) {
  const typeExports = [];
  
  try {
    // Look for export type statements at the end of the file
    const exportMatches = content.match(/^export type Db[A-Z][a-zA-Z0-9]+ = .+$/gm);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const typeMatch = match.match(/^export type (Db[A-Z][a-zA-Z0-9]+) = (.+)$/);
        if (typeMatch) {
          typeExports.push({
            name: typeMatch[1],
            definition: typeMatch[2]
          });
        }
      });
    }
  } catch (error) {
    log(`Error extracting existing type exports: ${error.message}`, 'warning');
  }
  
  return typeExports;
}

// Generate table columns constants with enhanced type information
function generateTableColumnsConstants(tableDetails) {
  let columnsCode = '';
  let columnTypesCode = '';
  
  const sortedTableNames = Object.keys(tableDetails).sort();
  
  for (const tableName of sortedTableNames) {
    const tableInfo = tableDetails[tableName];
    const constantName = tableName.toUpperCase();
    
    if (tableInfo.columns && tableInfo.columns.length > 0) {
      // Generate column names constant
      columnsCode += `  ${constantName}: {\n`;
      tableInfo.columns.forEach(column => {
        const columnConstant = column.name.toUpperCase();
        columnsCode += `    ${columnConstant}: '${column.name}' as const,\n`;
      });
      columnsCode += `  } as const,\n\n`;
      
      // Generate column types constant
      columnTypesCode += `  ${constantName}: {\n`;
      tableInfo.columns.forEach(column => {
        const columnConstant = column.name.toUpperCase();
        columnTypesCode += `    ${columnConstant}: '${column.type}' as const,\n`;
      });
      columnTypesCode += `  } as const,\n\n`;
    }
  }
  
  return { columnsCode, columnTypesCode };
}

// Generate complete mobile constants file with enhanced type information
function generateMobileConstantsFile(tableNames, tableDetails, enums, functionNames) {
  const timestamp = new Date().toISOString();
  
  // Generate table constants
  let tableConstantsCode = '';
  tableNames.forEach(tableName => {
    const constantName = tableName.toUpperCase();
    tableConstantsCode += `  ${constantName}: '${tableName}' as const,\n`;
  });
  
  // Generate column constants
  const { columnsCode, columnTypesCode } = generateTableColumnsConstants(tableDetails);
  
  // Generate enum constants
  let enumConstantsCode = '';
  const enumNames = Object.keys(enums).sort();
  
  if (enumNames.length > 0) {
    enumNames.forEach(enumName => {
      const enumValues = enums[enumName];
      const constantName = enumName.toUpperCase();
      
      enumConstantsCode += `  ${constantName}: {\n`;
      enumValues.forEach(value => {
        // Convert value to valid constant name (replace hyphens, spaces, etc.)
        const valueConstant = value.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        enumConstantsCode += `    ${valueConstant}: '${value}' as const,\n`;
      });
      enumConstantsCode += `  } as const,\n\n`;
    });
  } else {
    enumConstantsCode = '  // No enums found in database schema\n';
  }
  
  // Generate function constants
  let functionConstantsCode = '';
  functionNames.forEach(functionName => {
    const constantName = functionName.toUpperCase();
    functionConstantsCode += `  ${constantName}: '${functionName}' as const,\n`;
  });
  
  // Generate type exports for all tables
  let typeExportsCode = '';
  tableNames.forEach(tableName => {
    const pascalCaseName = tableName.split('_').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    
    typeExportsCode += `// ${tableName} types\n`;
    typeExportsCode += `export type Db${pascalCaseName} = Tables<'${tableName}'>\n`;
    typeExportsCode += `export type Db${pascalCaseName}Insert = TablesInsert<'${tableName}'>\n`;
    typeExportsCode += `export type Db${pascalCaseName}Update = TablesUpdate<'${tableName}'>\n\n`;
  });
  
  // Generate enum type exports
  let enumTypesCode = '';
  enumNames.forEach(enumName => {
    const pascalCaseName = enumName.split('_').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    
    enumTypesCode += `export type Db${pascalCaseName} = Database['public']['Enums']['${enumName}']\n`;
  });
  
  if (enumNames.length > 0) {
    enumTypesCode += '\n';
  }

  // Generate function types
  let functionTypesCode = '';
  functionNames.forEach(functionName => {
    const pascalCaseName = functionName.split('_').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    
    functionTypesCode += `export type Db${pascalCaseName}Args = Database['public']['Functions']['${functionName}']['Args']\n`;
    functionTypesCode += `export type Db${pascalCaseName}Returns = Database['public']['Functions']['${functionName}']['Returns']\n\n`;
  });

  // Generate relationship constants
  let relationshipConstantsCode = '';
  const allRelationships = [];
  
  Object.keys(tableDetails).forEach(tableName => {
    const table = tableDetails[tableName];
    if (table.relationships && table.relationships.length > 0) {
      table.relationships.forEach(rel => {
        allRelationships.push({
          tableName,
          ...rel
        });
      });
    }
  });
  
  if (allRelationships.length > 0) {
    relationshipConstantsCode = `export const DB_RELATIONSHIPS = {\n`;
    
    // Group relationships by table
    const relationshipsByTable = {};
    allRelationships.forEach(rel => {
      if (!relationshipsByTable[rel.tableName]) {
        relationshipsByTable[rel.tableName] = [];
      }
      relationshipsByTable[rel.tableName].push(rel);
    });
    
    Object.keys(relationshipsByTable).sort().forEach(tableName => {
      const tableConstant = tableName.toUpperCase();
      relationshipConstantsCode += `  ${tableConstant}: [\n`;
      
      relationshipsByTable[tableName].forEach(rel => {
        relationshipConstantsCode += `    {\n`;
        relationshipConstantsCode += `      foreignKeyName: '${rel.foreignKeyName}',\n`;
        relationshipConstantsCode += `      columns: [${rel.columns.map(col => `'${col}'`).join(', ')}],\n`;
        relationshipConstantsCode += `      referencedRelation: '${rel.referencedRelation}',\n`;
        relationshipConstantsCode += `      referencedColumns: [${rel.referencedColumns.map(col => `'${col}'`).join(', ')}],\n`;
        if (rel.isOneToOne !== undefined) {
          relationshipConstantsCode += `      isOneToOne: ${rel.isOneToOne},\n`;
        }
        relationshipConstantsCode += `    },\n`;
      });
      
      relationshipConstantsCode += `  ],\n`;
    });
    
    relationshipConstantsCode += `} as const;\n\n`;
  }

  const content = `/**
 * Database Constants for CivicSense Mobile App
 * 
 * This file is auto-generated from the main database.types.ts file
 * to ensure consistency between web and mobile apps.
 * 
 * Last updated: ${timestamp}
 * 
 * DO NOT EDIT MANUALLY - Use 'npm run sync:db-constants' to update
 */

import type { Database, Tables, TablesInsert, TablesUpdate } from './database-types'

// =============================================================================
// TABLE NAMES
// =============================================================================

export const DB_TABLES = {
${tableConstantsCode}} as const;

export type DbTableName = keyof typeof DB_TABLES;

// =============================================================================
// TABLE COLUMNS
// =============================================================================

export const DB_COLUMNS = {
${columnsCode}} as const;

export const getTableColumns = (tableName: string): string[] => {
  const tableKey = tableName.toUpperCase() as keyof typeof DB_COLUMNS;
  const columns = DB_COLUMNS[tableKey];
  return columns ? Object.values(columns) : [];
};

export const DB_COLUMN_TYPES = {
${columnTypesCode}} as const;

// =============================================================================
// DATABASE ENUMS
// =============================================================================

export const DB_ENUMS = {
${enumConstantsCode}} as const;

export type DbEnumName = keyof typeof DB_ENUMS;

// =============================================================================
// ENUM UTILITY FUNCTIONS
// =============================================================================

export const isValidEnumValue = (enumName: string, value: string): boolean => {
  const enumKey = enumName.toUpperCase() as keyof typeof DB_ENUMS;
  const enumValues = DB_ENUMS[enumKey];
  return enumValues ? Object.values(enumValues).includes(value as any) : false;
};

export const getEnumValues = (enumName: string): string[] => {
  const enumKey = enumName.toUpperCase() as keyof typeof DB_ENUMS;
  const enumValues = DB_ENUMS[enumKey];
  return enumValues ? Object.values(enumValues) : [];
};

export const getAllEnumSchemas = () => {
  return Object.keys(DB_ENUMS).map(enumKey => ({
    enumName: enumKey.toLowerCase(),
    values: Object.values(DB_ENUMS[enumKey as keyof typeof DB_ENUMS])
  }));
};

// =============================================================================
// DATABASE FUNCTIONS
// =============================================================================

export const DB_FUNCTIONS = {
${functionConstantsCode}} as const;

export type DbFunctionName = keyof typeof DB_FUNCTIONS;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const isValidTableName = (tableName: string): tableName is DbTableName => {
  return Object.values(DB_TABLES).includes(tableName as any);
};

export const isValidFunctionName = (functionName: string): functionName is DbFunctionName => {
  return Object.values(DB_FUNCTIONS).includes(functionName as any);
};

export const isValidEnumName = (enumName: string): enumName is DbEnumName => {
  return Object.keys(DB_ENUMS).includes(enumName.toUpperCase());
};

export const getTableConstant = (tableName: string): string | undefined => {
  const tableKey = Object.keys(DB_TABLES).find(
    key => DB_TABLES[key as keyof typeof DB_TABLES] === tableName
  );
  return tableKey ? DB_TABLES[tableKey as keyof typeof DB_TABLES] : undefined;
};

export const getFunctionConstant = (functionName: string): string | undefined => {
  const functionKey = Object.keys(DB_FUNCTIONS).find(
    key => DB_FUNCTIONS[key as keyof typeof DB_FUNCTIONS] === functionName
  );
  return functionKey ? DB_FUNCTIONS[functionKey as keyof typeof DB_FUNCTIONS] : undefined;
};

// =============================================================================
// SCHEMA DISCOVERY UTILITIES
// =============================================================================

export const discoverTableSchema = (tableName: string) => {
  const columns = getTableColumns(tableName);
  const tableKey = tableName.toUpperCase() as keyof typeof DB_COLUMN_TYPES;
  const columnTypes = DB_COLUMN_TYPES[tableKey];
  
  return {
    tableName,
    columns,
    columnTypes: columnTypes ? Object.entries(columnTypes).map(([key, type]) => ({
      name: key.toLowerCase(),
      type
    })) : []
  };
};

export const getAllTableSchemas = () => {
  return Object.values(DB_TABLES).map(tableName => discoverTableSchema(tableName));
};

// =============================================================================
// QUERY PATTERN HELPERS
// =============================================================================

export const QUERY_PATTERNS = {
  SELECT_ALL: (tableName: string) => \`SELECT * FROM \${tableName}\`,
  SELECT_BY_ID: (tableName: string) => \`SELECT * FROM \${tableName} WHERE id = $1\`,
  INSERT: (tableName: string, columns: string[]) => 
    \`INSERT INTO \${tableName} (\${columns.join(', ')}) VALUES (\${columns.map((_, i) => \`$\${i + 1}\`).join(', ')})\`,
  UPDATE_BY_ID: (tableName: string, columns: string[]) => 
    \`UPDATE \${tableName} SET \${columns.map((col, i) => \`\${col} = $\${i + 1}\`).join(', ')} WHERE id = $\${columns.length + 1}\`,
  DELETE_BY_ID: (tableName: string) => \`DELETE FROM \${tableName} WHERE id = $1\`,
} as const;

// =============================================================================
// REALTIME CHANNEL HELPERS
// =============================================================================

export const REALTIME_CHANNELS = {
  TABLE_CHANGES: (tableName: string) => \`table-db-changes:\${tableName}\`,
  USER_CHANGES: (userId: string) => \`user-changes:\${userId}\`,
  MULTIPLAYER_ROOM: (roomId: string) => \`multiplayer-room:\${roomId}\`,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type DatabaseConstants = typeof DB_TABLES;
export type DatabaseColumns = typeof DB_COLUMNS;
export type DatabaseColumnTypes = typeof DB_COLUMN_TYPES;
export type DatabaseEnums = typeof DB_ENUMS;
export type DatabaseFunctions = typeof DB_FUNCTIONS;
export type QueryPatterns = typeof QUERY_PATTERNS;
export type RealtimeChannels = typeof REALTIME_CHANNELS;

// =============================================================================
// TABLE TYPE EXPORTS
// =============================================================================

${typeExportsCode}

// =============================================================================
// ENUM TYPE EXPORTS
// =============================================================================

${enumTypesCode}

// =============================================================================
// FUNCTION TYPE EXPORTS
// =============================================================================

${functionTypesCode}

// =============================================================================
// RELATIONSHIP TYPE EXPORTS
// =============================================================================

${relationshipConstantsCode}`;

  return content;
}

// Generate summary of what was extracted
function generateSchemaSummary(tableNames, tableDetails, enums, functionNames) {
  const totalColumns = Object.values(tableDetails).reduce((sum, table) => sum + (table.columns?.length || 0), 0);
  const totalEnumValues = Object.values(enums).reduce((sum, enumValues) => sum + enumValues.length, 0);
  
  return {
    tables: tableNames.length,
    totalColumns,
    enums: Object.keys(enums).length,
    totalEnumValues,
    functions: functionNames.length,
    tablesWithRelationships: Object.values(tableDetails).filter(table => table.relationships.length > 0).length
  };
}

// Main execution function
function main() {
  try {
    log('🔍 Extracting database schema information...');
    
    // Extract all database information
    const tableNames = extractTableNames(dbTypesContent);
    const tableDetails = extractTableDetails(dbTypesContent);
    const enums = extractEnums(dbTypesContent);
    const functionNames = extractFunctionNames(dbTypesContent);
    
    // Generate summary
    const summary = generateSchemaSummary(tableNames, tableDetails, enums, functionNames);
    
    log(`📊 Extraction Summary:`);
    log(`   • Tables: ${summary.tables}`);
    log(`   • Total Columns: ${summary.totalColumns}`);
    log(`   • Tables with Relationships: ${summary.tablesWithRelationships}`);
    log(`   • Enums: ${summary.enums} (${summary.totalEnumValues} total values)`);
    log(`   • Functions: ${summary.functions}`);
    
    // Generate the mobile constants file
    log('📝 Generating mobile constants file...');
    const mobileConstantsContent = generateMobileConstantsFile(tableNames, tableDetails, enums, functionNames);
    
    // Write the file
    log('💾 Writing constants file...');
    fs.writeFileSync(mobileConstantsPath, mobileConstantsContent, 'utf8');
    
    log('✅ Database constants sync completed successfully!', 'success');
    log(`📁 Updated: ${mobileConstantsPath}`);
    
  } catch (error) {
    log(`❌ Error during sync: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();