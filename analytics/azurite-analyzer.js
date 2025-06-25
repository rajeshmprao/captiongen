#!/usr/bin/env node

/**
 * Azurite Data Analyzer
 * Connects to local Azurite emulator and analyzes telemetry data
 */

const { TableServiceClient, TableClient } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

// Azurite connection string (use development storage)
const connectionString = "UseDevelopmentStorage=true";

class AzuriteAnalyzer {
    constructor() {
        this.tableClient = TableServiceClient.fromConnectionString(connectionString);
    }

    async listTables() {
        console.log('📊 Discovering tables in Azurite...\n');
        try {
            const tables = [];
            for await (const table of this.tableClient.listTables()) {
                tables.push(table.name);
            }
            return tables;
        } catch (error) {
            console.error('❌ Error listing tables:', error.message);
            return [];
        }
    }

    async analyzeTable(tableName, limit = 10) {
        console.log(`\n🔍 Analyzing table: ${tableName}`);
        console.log('=' .repeat(50));
        
        try {
            const tableClient = TableClient.fromConnectionString(connectionString, tableName);
            const entities = [];
            
            // Get entities with pagination
            let count = 0;
            for await (const entity of tableClient.listEntities()) {
                if (count >= limit) break;
                entities.push(entity);
                count++;
            }

            if (entities.length === 0) {
                console.log('   (No data found)');
                return;
            }

            // Analyze schema
            const firstEntity = entities[0];
            const columns = Object.keys(firstEntity).filter(key => 
                !key.startsWith('odata.') && !['partitionKey', 'rowKey', 'timestamp'].includes(key)
            );

            console.log(`📈 Found ${entities.length} entities (showing first ${Math.min(limit, entities.length)})`);
            console.log(`📋 Columns: ${columns.join(', ')}`);
            
            // Show sample data
            entities.slice(0, 3).forEach((entity, idx) => {
                console.log(`\n   Sample ${idx + 1}:`);
                console.log(`   PartitionKey: ${entity.partitionKey}`);
                console.log(`   RowKey: ${entity.rowKey}`);
                console.log(`   Timestamp: ${entity.timestamp}`);
                
                columns.forEach(col => {
                    if (entity[col] !== undefined) {
                        let value = entity[col];
                        if (typeof value === 'string' && value.length > 100) {
                            value = value.substring(0, 100) + '...';
                        }
                        console.log(`   ${col}: ${value}`);
                    }
                });
            });

            // Basic analytics for telemetry tables
            if (tableName.toLowerCase().includes('telemetry') || tableName.toLowerCase().includes('log')) {
                await this.analyzeTelemetryData(entities);
            }

        } catch (error) {
            console.error(`❌ Error analyzing table ${tableName}:`, error.message);
        }
    }

    async analyzeTelemetryData(entities) {
        console.log('\n📊 Telemetry Analytics:');
        
        // Group by message/event type
        const messageGroups = {};
        const userStats = {};
        const timeStats = {};
        
        entities.forEach(entity => {
            // Message analysis
            const message = entity.message || entity.Message || 'Unknown';
            messageGroups[message] = (messageGroups[message] || 0) + 1;
            
            // User analysis
            const userId = entity.userId || entity.UserId || entity.user_id || 'Unknown';
            userStats[userId] = (userStats[userId] || 0) + 1;
            
            // Time analysis
            const timestamp = entity.timestamp || entity.Timestamp;
            if (timestamp) {
                const hour = new Date(timestamp).getHours();
                timeStats[hour] = (timeStats[hour] || 0) + 1;
            }
        });

        // Top messages
        const topMessages = Object.entries(messageGroups)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        console.log('   Top Event Types:');
        topMessages.forEach(([msg, count]) => {
            console.log(`     • ${msg}: ${count} events`);
        });

        // User activity
        const userCount = Object.keys(userStats).length;
        const totalEvents = Object.values(userStats).reduce((a, b) => a + b, 0);
        console.log(`\n   User Activity:`);
        console.log(`     • Unique users: ${userCount}`);
        console.log(`     • Total events: ${totalEvents}`);
        console.log(`     • Avg events/user: ${(totalEvents / userCount).toFixed(1)}`);

        // Time distribution
        if (Object.keys(timeStats).length > 0) {
            const peakHour = Object.entries(timeStats)
                .sort((a, b) => b[1] - a[1])[0];
            console.log(`     • Peak activity hour: ${peakHour[0]}:00 (${peakHour[1]} events)`);
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            tables: {},
            summary: {}
        };

        const tables = await this.listTables();
        
        if (tables.length === 0) {
            console.log('⚠️  No tables found. Make sure Azurite is running and has data.');
            return;
        }

        console.log(`Found ${tables.length} tables: ${tables.join(', ')}\n`);

        for (const tableName of tables) {
            await this.analyzeTable(tableName, 100);
        }

        console.log('\n✅ Analysis complete!');
        console.log('\n💡 Tips:');
        console.log('   • Increase the limit parameter to analyze more data');
        console.log('   • Use Azure Storage Explorer for visual browsing');
        console.log('   • Import the Kusto queries into Application Insights for production analysis');
    }
}

// Main execution
async function main() {
    console.log('🚀 Azurite Data Analyzer');
    console.log('========================\n');
    
    const analyzer = new AzuriteAnalyzer();
    await analyzer.generateReport();
}

// Check if Azurite is running
async function checkAzurite() {
    try {
        const tableClient = TableServiceClient.fromConnectionString(connectionString);
        await tableClient.listTables().next();
        return true;
    } catch (error) {
        return false;
    }
}

if (require.main === module) {
    checkAzurite().then(isRunning => {
        if (!isRunning) {
            console.log('❌ Cannot connect to Azurite. Make sure it\'s running on port 10002.');
            console.log('   Start with: azurite --silent --location c:\\azurite --debug c:\\azurite\\debug.log');
            process.exit(1);
        }
        main().catch(console.error);
    });
}

module.exports = { AzuriteAnalyzer };
