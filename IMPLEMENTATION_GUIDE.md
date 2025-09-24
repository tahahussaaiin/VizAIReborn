# VizAI Implementation Guide - Complete Development Roadmap

## Table of Contents
1. [Project Overview & Vision](#project-overview--vision)
2. [System Architecture Deep Dive](#system-architecture-deep-dive)
3. [Detailed Implementation Steps](#detailed-implementation-steps)
4. [Development Environment Setup](#development-environment-setup)
5. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
6. [Testing & Quality Assurance](#testing--quality-assurance)
7. [Deployment & DevOps](#deployment--devops)
8. [Monitoring & Maintenance](#monitoring--maintenance)

## Project Overview & Vision

Based on the comprehensive specifications in `vizai_architecture.md`, `vizai_brand_guidelines (1).md`, and `vizai_component_library (1).md`, VizAI is a revolutionary AI-powered data visualization platform that transforms raw CSV data into publication-quality, creative visualizations.

**Core Innovation**: Unlike template-based systems, VizAI uses **Creative Intelligence** to invent unique visual languages for each dataset, making publication-quality data storytelling accessible to everyone.

### Key Differentiators
- **AI-Driven Creativity**: Generates unique metaphors for each dataset
- **Publication Quality**: Professional-grade outputs comparable to Visual Capitalist
- **Zero Learning Curve**: No technical knowledge required
- **Cost-Effective**: Optimized for free tier constraints (<$0.008 per visualization)
- **Rapid Generation**: Complete visualizations in under 45 seconds

## System Architecture Deep Dive

### Reference: `vizai_architecture.md` - Lines 1-354

The system operates on a **Two-Function Pipeline** optimized for Supabase Free Tier:

#### Critical Constraints (Lines 38-50)
- **Wall-clock**: 150s max per function
- **Memory**: 256MB limit
- **CPU**: ~2s per request (async I/O doesn't count)
- **Cost Target**: <$0.008 per visualization
- **Gemini 2.5 Flash**: $0.30/$2.50 per 1M tokens input/output

### System Flow Diagram
```
User Upload CSV → Function A (Analysis) → Metaphor Selection → Function B (Visualization) → Export
       ↓                    ↓                     ↓                      ↓                   ↓
   [Validation]      [AI Analysis]        [User Choice]          [D3 Generation]      [Download]
       ↓                    ↓                     ↓                      ↓                   ↓
   [Storage]         [Context Save]       [Progress UI]          [Validation]         [Share]
```

#### Function Architecture Strategy

**Function A: `analyze-csv`** (Lines 11-16)
- Pre-computes deterministic statistics (null rates, correlations, distributions)
- Single Gemini 2.5 Flash call for complete analysis + metaphor generation
- Structured JSON output with strict validation
- Generates 3 creative metaphors (Organic, Geometric, Flow categories)

**Function B: `generate-visualization`** (Lines 17-22)
- Takes selected metaphor and generates complete D3 v7 code
- Single primary call with optional repair call for syntax issues
- Production-ready code with accessibility and interactions
- Fallback templates for guaranteed output

## Development Environment Setup

### Prerequisites Installation

```bash
# Node.js and Package Manager
nvm install 20.10.0
nvm use 20.10.0
npm install -g pnpm

# Supabase CLI
npm install -g supabase

# Development Tools
npm install -g @types/node typescript tsx
```

### Project Initialization

```bash
# Create project structure
mkdir vizai-platform
cd vizai-platform

# Initialize monorepo
pnpm init
echo "packages:\n  - 'packages/*'\n  - 'apps/*'" > pnpm-workspace.yaml

# Create directory structure
mkdir -p apps/web apps/edge-functions packages/ui packages/utils packages/types
```

### Local Supabase Setup

```bash
# Initialize Supabase project
supabase init

# Start local development
supabase start

# Link to remote project (when ready)
supabase link --project-ref your-project-ref
```

## Detailed Implementation Steps

### Phase 1: Database Foundation

#### Reference: `vizai_architecture.md` - Lines 108-155

Create the core Supabase schema with all constraints:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects tracking with comprehensive metadata
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  row_count int NOT NULL,
  column_count int NOT NULL,
  generation_progress int DEFAULT 0 CHECK (generation_progress >= 0 AND generation_progress <= 100),
  phase text DEFAULT 'idle' CHECK (phase IN ('idle','analyzing','selecting','generating','exporting','failed')),
  selected_metaphor jsonb,
  visualization_code jsonb,
  token_usage jsonb DEFAULT '{"total_input":0,"total_output":0,"cost_usd":0}',
  status text DEFAULT 'draft' CHECK (status IN ('draft','processing','completed','error'))
);

-- AI conversation context for resumability (Lines 128-135)
CREATE TABLE ai_generation_context (
  project_id uuid REFERENCES projects(id) PRIMARY KEY,
  conversation_history jsonb DEFAULT '[]',
  compact_summary text,
  current_step text,
  step_results jsonb DEFAULT '{}' -- Stores analysis results, metaphors, etc.
);

-- Job queue for rate limiting and reliability (Lines 137-146)
CREATE TABLE job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  function_name text NOT NULL CHECK (function_name IN ('analyze-csv','generate-visualization')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','running','failed','completed')),
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  scheduled_at timestamptz DEFAULT now()
);

-- Rate limiting enforcement (Lines 148-154)
CREATE TABLE rate_limits (
  user_id uuid PRIMARY KEY,
  requests_this_minute int DEFAULT 0,
  daily_cost_usd decimal(10,4) DEFAULT 0,
  daily_reset_at timestamptz DEFAULT (current_date + interval '1 day')
);
```

#### Database Indexes and Performance

```sql
-- Create indexes for query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_job_queue_status ON job_queue(status, scheduled_at);
CREATE INDEX idx_rate_limits_reset ON rate_limits(daily_reset_at);

-- Create composite indexes for common queries
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_job_queue_project_status ON job_queue(project_id, status);
```

#### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- AI context policies
CREATE POLICY "Users can access own AI context" ON ai_generation_context
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
```

### Phase 2: AI Processing Pipeline

#### Reference: `README.md` - Lines 11-209 (Complete Analysis Function)

##### Complete Statistics Library Implementation

```typescript
// packages/utils/src/statistics.ts
import { DataFrame, ColumnStats, CorrelationMatrix } from '@vizai/types';

export class StatisticsEngine {
  private data: DataFrame;
  
  constructor(csvData: string[][]) {
    this.data = this.parseCSV(csvData);
  }
  
  calculateNullRates(): Record<string, number> {
    const nullRates: Record<string, number> = {};
    
    for (const column of this.data.columns) {
      const total = this.data.rows.length;
      const nullCount = this.data.rows.filter(
        row => !row[column] || row[column] === '' || row[column] === 'null'
      ).length;
      nullRates[column] = (nullCount / total) * 100;
    }
    
    return nullRates;
  }
  
  calculateUniques(): Record<string, number> {
    const uniques: Record<string, number> = {};
    
    for (const column of this.data.columns) {
      const uniqueValues = new Set(
        this.data.rows.map(row => row[column]).filter(v => v !== null)
      );
      uniques[column] = uniqueValues.size;
    }
    
    return uniques;
  }
  
  calculatePearsonR(columns: string[]): CorrelationMatrix {
    const matrix: CorrelationMatrix = {};
    
    for (let i = 0; i < columns.length; i++) {
      for (let j = i; j < columns.length; j++) {
        const col1 = columns[i];
        const col2 = columns[j];
        
        if (i === j) {
          matrix[`${col1}_${col2}`] = 1.0;
          continue;
        }
        
        const values1 = this.getNumericValues(col1);
        const values2 = this.getNumericValues(col2);
        
        if (values1.length < 2 || values2.length < 2) {
          matrix[`${col1}_${col2}`] = 0;
          continue;
        }
        
        const correlation = this.pearsonCorrelation(values1, values2);
        matrix[`${col1}_${col2}`] = correlation;
        matrix[`${col2}_${col1}`] = correlation;
      }
    }
    
    return matrix;
  }
  
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((total, yi) => total + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  detectOutliers(column: string, method: 'iqr' | 'zscore' = 'iqr'): number[] {
    const values = this.getNumericValues(column);
    
    if (method === 'iqr') {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      
      return values
        .map((v, i) => ({ value: v, index: i }))
        .filter(item => item.value < lower || item.value > upper)
        .map(item => item.index);
    }
    
    // Z-score method
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    return values
      .map((v, i) => ({ value: v, index: i }))
      .filter(item => Math.abs((item.value - mean) / std) > 3)
      .map(item => item.index);
  }
}
```

**Pre-AI Processing (Lines 13-25)**:
```javascript
// Calculate deterministic statistics before any AI calls
const stats = {
  nullPercentages: calculateNullRates(csvData),
  uniqueCounts: calculateUniques(csvData),
  basicCorrelations: calculatePearsonR(numericalColumns),
  dataRanges: calculateMinMax(numericalColumns),
  categoricalDistributions: getCategoryFrequencies(categoricalColumns)
}
```

**Single Comprehensive Gemini Call (Lines 27-104)**:

```typescript
// supabase/functions/analyze-csv/index.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { StatisticsEngine } from '@vizai/utils';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.1,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,
    responseMimeType: "application/json"
  }
});

export async function analyzeCSV(
  csvData: string[][],
  projectId: string,
  userId: string
): Promise<AnalysisResult> {
  // Pre-compute statistics
  const stats = new StatisticsEngine(csvData);
  const preComputed = {
    nullPercentages: stats.calculateNullRates(),
    uniqueCounts: stats.calculateUniques(),
    correlations: stats.calculatePearsonR(stats.getNumericalColumns()),
    dataRanges: stats.calculateMinMax(),
    distributions: stats.getCategoryFrequencies()
  };
  
  // Build comprehensive prompt
  const prompt = buildAnalysisPrompt(csvData, preComputed);
  
  // Single API call with structured output
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseSchema: analysisSchema // Defined schema from README
    }
  });
  
  // Parse and validate response
  const response = JSON.parse(result.response.text());
  const validated = await validateWithAJV(response, analysisSchema);
  
  // Save to context
  await saveAnalysisContext(projectId, validated, preComputed);
  
  return validated;
}
```

The analysis function makes ONE structured API call that handles:
1. Column profiling and type detection
2. Pattern analysis (correlations, trends, anomalies)
3. Creative metaphor generation (3 distinct categories)
4. Compact summary creation

**Exact JSON Schema (Lines 612-672)**:
```javascript
{
  "type": "object",
  "properties": {
    "columnProfiles": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "detectedType": {"type": "string", "enum": ["numerical","categorical","temporal","text"]},
          "nullPercentage": {"type": "number", "minimum": 0, "maximum": 100},
          "uniqueCount": {"type": "integer", "minimum": 0},
          "sampleValues": {"type": "array", "items": {"type": "string"}, "maxItems": 5},
          "qualityFlags": {"type": "array", "items": {"type": "string"}}
        }
      }
    },
    "patterns": {
      "type": "array",
      "maxItems": 10,
      "items": {
        "type": "object",
        "properties": {
          "type": {"type": "string"},
          "description": {"type": "string", "maxLength": 150},
          "strength": {"type": "number", "minimum": 0, "maximum": 1},
          "columns": {"type": "array", "items": {"type": "string"}, "maxItems": 4}
        }
      }
    },
    "metaphors": {
      "type": "array",
      "minItems": 3,
      "maxItems": 3,
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "title": {"type": "string", "maxLength": 50},
          "description": {"type": "string", "maxLength": 200},
          "category": {"type": "string", "enum": ["Organic", "Geometric", "Flow"]},
          "innovationScore": {"type": "number", "minimum": 1, "maximum": 10},
          "colorPalette": {"type": "array", "items": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"}, "minItems": 3, "maxItems": 5},
          "d3Strategy": {"type": "string", "maxLength": 100}
        }
      }
    }
  }
}
```

#### Creative Metaphor Generation System

**Reference: `vizai_architecture.md` - Lines 73-91**

The AI generates metaphors across three distinct categories:

1. **Organic Category** (Lines 77): Nature, growth, ecosystems - think trees, flowers, organisms
2. **Geometric Category** (Lines 78): Shapes, networks, architecture - think circuits, crystals, grids  
3. **Flow Category** (Lines 79): Movement, rivers, particles - think streams, migrations, journeys

**Metaphor Evaluation Criteria (Lines 83-90)**:
- Immediate Comprehension (0-10)
- Emotional Impact (0-10)
- Data Clarity (0-10)
- Visual Innovation (0-10)
- Cultural Sensitivity (0-10)
- Technical Feasibility (0-10)
- Shareability Factor (0-10)

### Phase 3: D3 Visualization Generation

#### Reference: `README.md` - Lines 210-315 (Visualization Function)

##### Complete D3 Generation Function

```typescript
// supabase/functions/generate-visualization/index.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { D3Validator } from './d3-validator';
import { FallbackTemplates } from './fallback-templates';

export async function generateVisualization(
  projectId: string,
  selectedMetaphor: Metaphor,
  context: AnalysisContext
): Promise<VisualizationResult> {
  const telemetry = new TelemetryCollector(projectId);
  
  try {
    // Load compact summary from context
    const { compactSummary, columnSchema } = context;
    
    // Build D3 generation prompt
    const prompt = buildD3Prompt({
      summary: compactSummary,
      metaphor: selectedMetaphor,
      columns: columnSchema,
      dimensions: { width: 1200, height: 800 }
    });
    
    telemetry.startStep('d3_generation');
    
    // Generate D3 code with structured output
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseSchema: d3Schema,
        temperature: 0.3,
        maxOutputTokens: 8192
      }
    });
    
    const d3Response = JSON.parse(result.response.text());
    telemetry.endStep('d3_generation', true, result.usageMetadata.totalTokenCount);
    
    // Validate D3 syntax
    const validator = new D3Validator();
    const validation = await validator.validate(d3Response.completeD3Code);
    
    let finalCode = d3Response.completeD3Code;
    
    if (!validation.isValid) {
      telemetry.startStep('d3_repair');
      
      // Attempt to repair syntax issues
      const repairPrompt = buildRepairPrompt(
        finalCode,
        validation.errors,
        selectedMetaphor
      );
      
      const repairResult = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
        generationConfig: {
          responseSchema: repairSchema,
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      });
      
      const repaired = JSON.parse(repairResult.response.text());
      const revalidation = await validator.validate(repaired.optimizedCode);
      
      if (revalidation.isValid) {
        finalCode = repaired.optimizedCode;
        telemetry.endStep('d3_repair', true, repairResult.usageMetadata.totalTokenCount);
      } else {
        // Use fallback template
        finalCode = FallbackTemplates.getTemplate(
          selectedMetaphor.category,
          columnSchema
        );
        telemetry.endStep('d3_repair', false, 0);
      }
    }
    
    // Save final visualization
    await saveVisualization(projectId, {
      code: finalCode,
      metaphor: selectedMetaphor,
      dimensions: { width: 1200, height: 800 },
      timestamp: new Date().toISOString()
    });
    
    await telemetry.flush();
    
    return {
      success: true,
      code: finalCode,
      metadata: {
        tokensUsed: telemetry.getTotalTokens(),
        generationTime: telemetry.getTotalTime(),
        repairAttempted: !validation.isValid
      }
    };
  } catch (error) {
    await telemetry.logError(error);
    throw error;
  }
}
```

**D3 Code Generation Process (Lines 212-270)**:

1. **Input Context** (Lines 214-218):
   - Compact summary from analysis phase
   - Selected metaphor (user choice)
   - CSV column schema
   - Canvas specifications (1200x800px)

2. **Response Schema** (Lines 221-233):
   ```javascript
   {
     "type": "object",
     "properties": {
       "completeD3Code": {"type": "string"},
       "stylingCode": {"type": "string"},
       "interactionCode": {"type": "string"},
       "animationCode": {"type": "string"},
       "accessibilityFeatures": {"type": "string"}
     },
     "required": ["completeD3Code"]
   }
   ```

3. **Code Requirements** (Lines 245-263):
   - SVG setup with proper dimensions
   - Scales for all data mappings
   - Data processing and binding
   - Visual elements matching metaphor theme
   - Color implementation from palette
   - Hover tooltips showing data values
   - Smooth entrance animations
   - Basic responsiveness
   - Error handling for missing data

### Phase 4: Error Handling & Recovery System

#### Reference: `vizai_architecture.md` - Lines 156-192

##### Complete Error Recovery Implementation

```typescript
// packages/utils/src/error-recovery.ts
import { RetryStrategy, FailureType, RecoveryAction } from '@vizai/types';

export class ErrorRecoverySystem {
  private strategies: Map<FailureType, RetryStrategy>;
  
  constructor() {
    this.initializeStrategies();
  }
  
  private initializeStrategies() {
    this.strategies = new Map([
      ['RATE_LIMIT_RPM', {
        maxRetries: 5,
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxDelay: 60000,
        jitter: true
      }],
      ['GEMINI_TIMEOUT', {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 2000,
        maxDelay: 16000,
        jitter: false
      }],
      ['UNPARSEABLE_JSON', {
        maxRetries: 1,
        backoffMultiplier: 1,
        initialDelay: 0,
        maxDelay: 0,
        jitter: false
      }]
    ]);
  }
  
  async handleError(
    error: Error,
    context: ErrorContext
  ): Promise<RecoveryAction> {
    const failureType = this.classifyError(error);
    const strategy = this.strategies.get(failureType);
    
    if (!strategy) {
      return {
        action: 'PERMANENT_FAILURE',
        reason: `Unrecoverable error: ${error.message}`,
        shouldNotify: true
      };
    }
    
    if (context.attemptCount >= strategy.maxRetries) {
      return {
        action: 'MAX_RETRIES_EXCEEDED',
        reason: `Failed after ${context.attemptCount} attempts`,
        shouldNotify: true
      };
    }
    
    const delay = this.calculateBackoff(
      context.attemptCount,
      strategy
    );
    
    return {
      action: 'RETRY',
      delayMs: delay,
      attemptNumber: context.attemptCount + 1,
      shouldNotify: false
    };
  }
  
  private calculateBackoff(
    attempt: number,
    strategy: RetryStrategy
  ): number {
    let delay = strategy.initialDelay * 
      Math.pow(strategy.backoffMultiplier, attempt);
    
    delay = Math.min(delay, strategy.maxDelay);
    
    if (strategy.jitter) {
      // Add random jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      delay += jitter;
    }
    
    return Math.floor(delay);
  }
  
  private classifyError(error: Error): FailureType {
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit') || message.includes('429')) {
      return 'RATE_LIMIT_RPM';
    }
    
    if (message.includes('timeout') || message.includes('504')) {
      return 'GEMINI_TIMEOUT';
    }
    
    if (message.includes('json') || message.includes('parse')) {
      return 'UNPARSEABLE_JSON';
    }
    
    if (message.includes('budget') || message.includes('quota')) {
      return 'RATE_LIMIT_BUDGET';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  async executeFallback(
    failureType: FailureType,
    context: any
  ): Promise<any> {
    switch (failureType) {
      case 'UNPARSEABLE_JSON':
        return this.generateFallbackVisualization(context);
      
      case 'RATE_LIMIT_BUDGET':
        return this.scheduleForNextDay(context);
      
      default:
        throw new Error(`No fallback available for ${failureType}`);
    }
  }
}
```

**Comprehensive Failure Matrix (Lines 160-174)**:

1. **Rate Limiting Errors**:
   - `RATE_LIMIT_RPM`: Queue with exponential backoff
   - `RATE_LIMIT_BUDGET`: Pause until daily reset

2. **JSON Validation Errors**:
   - `UNPARSEABLE_JSON`: Single repair attempt, fallback templates
   - Schema validation with AJV library
   - Automatic syntax repair for common issues

3. **Service Failures**:
   - `GEMINI_TIMEOUT`: Exponential backoff (2s, 4s, 8s) with max 3 retries
   - `SUPABASE_TIMEOUT`: Resume from checkpoint with partial state recovery
   - `PERMANENT_FAILURE`: Manual review required with admin notification

**Recovery Implementation (Lines 177-192)**:
```javascript
const failureHandlers = {
  'UNPARSEABLE_JSON': async (project, error, stepName) => {
    const fallback = await generateFallbackOutput(stepName, project);
    await updateContext(project.id, { [stepName]: fallback });
    return { action: 'FALLBACK_USED', fallback };
  },
  
  'GEMINI_TIMEOUT': async (project, error) => {
    const attempts = project.retry_count || 0;
    const delayMs = Math.pow(2, attempts) * 2000;
    await scheduleJobRetry(project.id, delayMs, attempts + 1);
    return { action: 'RETRY_BACKOFF', delayMs };
  }
};
```

### Phase 5: Frontend Implementation

#### Reference: `vizai_brand_guidelines (1).md` - Complete Design System

##### Next.js Application Setup

```bash
# Create Next.js app with TypeScript and Tailwind
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# Install dependencies
pnpm add @supabase/supabase-js @supabase/auth-ui-react
pnpm add d3 @types/d3
pnpm add lucide-react
pnpm add framer-motion
pnpm add react-dropzone
pnpm add papaparse @types/papaparse
pnpm add zustand
pnpm add react-hot-toast
```

##### Design System Configuration

```typescript
// apps/web/src/styles/design-tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93bbfc',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    },
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    }
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      display: '"Plus Jakarta Sans", sans-serif',
      mono: '"JetBrains Mono", monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: '1.1',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    }
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem'
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '1000ms'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
};
```

**Brand Identity (Lines 4-15)**:
- **Brand Essence**: "Unlock the Story in Your Data"
- **Personality**: Innovative, Accessible, Impactful, Professional, Creative
- **Visual Approach**: Inspired by Visual Capitalist but AI-powered for everyone

**Color System (Lines 20-48)**:
```css
/* Primary Palette */
--viz-primary: #2563eb;      /* Professional Blue */
--viz-secondary: #7c3aed;    /* Creative Purple */
--viz-accent: #06b6d4;       /* Cyan */
--viz-success: #10b981;      /* Emerald */
--viz-warning: #f59e0b;      /* Amber */
--viz-danger: #ef4444;       /* Red */
```

**Typography System (Lines 50-77)**:
- **Primary Font**: Inter (clean, modern, excellent readability)
- **Display Font**: Plus Jakarta Sans (creative, friendly, distinctive)
- **Font Scale**: From 12px (text-xs) to 60px (text-6xl)

#### Component Library Implementation

**Reference: `vizai_component_library (1).md` - Lines 1-580**

**Core Components Required**:

1. **Button System (Lines 83-140)**:
   ```typescript
   interface ButtonProps {
     variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
     size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
     loading?: boolean;
     icon?: React.ReactNode;
   }
   ```

2. **File Upload Component (Lines 234-256)**:
   ```jsx
   <FileUpload
     accept=".csv"
     maxSize={10 * 1024 * 1024} // 10MB
     multiple={false}
     onFileSelect={(file) => handleFileUpload(file)}
     onError={(error) => setError(error)}
   />
   ```

3. **Visualization Preview (Lines 536-547)**:
   ```jsx
   <VizPreview
     visualization={currentViz}
     interactive={true}
     showControls={true}
     aspectRatio="16:9"
     onDataPointHover={(point) => setTooltip(point)}
     onExport={(format) => handleExport(format)}
   />
   ```

4. **Metaphor Selection Cards (Lines 196-206)**:
   ```jsx
   <MetaphorCard
     title="Digital Rivers"
     description="Countries connected by flowing data streams"
     innovationScore={9.2}
     clarityScore={8.8}
     preview="/path/to/preview.jpg"
     isSelected={false}
     onSelect={() => {}}
   />
   ```

### Phase 6: Performance Optimization

#### Reference: `README.md` - Lines 943-996 (Telemetry System)

##### Advanced Telemetry Implementation

```typescript
// packages/utils/src/telemetry.ts
import { createClient } from '@supabase/supabase-js';

interface TelemetryEvent {
  timestamp: number;
  event: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: Error;
}

export class AdvancedTelemetryCollector {
  private projectId: string;
  private events: TelemetryEvent[] = [];
  private metrics: Map<string, any> = new Map();
  private startTimes: Map<string, number> = new Map();
  private supabase: any;
  
  constructor(projectId: string) {
    this.projectId = projectId;
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  
  startStep(stepName: string, metadata?: Record<string, any>) {
    const timestamp = Date.now();
    this.startTimes.set(stepName, timestamp);
    
    this.events.push({
      timestamp,
      event: `${stepName}_start`,
      metadata
    });
    
    // Initialize metrics for this step
    this.metrics.set(stepName, {
      startTime: timestamp,
      status: 'running',
      metadata
    });
  }
  
  endStep(
    stepName: string,
    success: boolean,
    tokens?: number,
    metadata?: Record<string, any>
  ) {
    const endTime = Date.now();
    const startTime = this.startTimes.get(stepName);
    
    if (!startTime) {
      console.warn(`No start time found for step: ${stepName}`);
      return;
    }
    
    const duration = endTime - startTime;
    
    // Update metrics
    const stepMetrics = this.metrics.get(stepName) || {};
    this.metrics.set(stepName, {
      ...stepMetrics,
      endTime,
      duration,
      success,
      tokens,
      metadata: { ...stepMetrics.metadata, ...metadata }
    });
    
    // Record event
    this.events.push({
      timestamp: endTime,
      event: `${stepName}_end`,
      duration,
      metadata: {
        success,
        tokens,
        ...metadata
      }
    });
    
    // Remove from active timers
    this.startTimes.delete(stepName);
  }
  
  recordMetric(name: string, value: any) {
    this.metrics.set(name, value);
    
    this.events.push({
      timestamp: Date.now(),
      event: 'metric_recorded',
      metadata: { name, value }
    });
  }
  
  logError(error: Error, context?: Record<string, any>) {
    this.events.push({
      timestamp: Date.now(),
      event: 'error',
      error,
      metadata: context
    });
  }
  
  async flush() {
    try {
      // Calculate summary statistics
      const summary = this.calculateSummary();
      
      // Save to database
      await this.supabase
        .from('telemetry')
        .insert({
          project_id: this.projectId,
          events: this.events,
          metrics: Object.fromEntries(this.metrics),
          summary,
          timestamp: new Date().toISOString()
        });
      
      // Update project with performance metrics
      await this.supabase
        .from('projects')
        .update({
          performance_metrics: summary
        })
        .eq('id', this.projectId);
      
      // Clear collected data
      this.events = [];
      this.metrics.clear();
      this.startTimes.clear();
    } catch (error) {
      console.error('Failed to flush telemetry:', error);
    }
  }
  
  private calculateSummary() {
    const totalDuration = this.getTotalTime();
    const totalTokens = this.getTotalTokens();
    const stepCount = this.metrics.size;
    const errorCount = this.events.filter(e => e.event === 'error').length;
    
    return {
      totalDuration,
      totalTokens,
      stepCount,
      errorCount,
      averageStepDuration: stepCount > 0 ? totalDuration / stepCount : 0,
      tokenEfficiency: totalTokens > 0 ? totalDuration / totalTokens : 0,
      successRate: stepCount > 0 ? 
        (stepCount - errorCount) / stepCount * 100 : 100
    };
  }
  
  getTotalTime(): number {
    let total = 0;
    for (const [_, metrics] of this.metrics) {
      if (metrics.duration) {
        total += metrics.duration;
      }
    }
    return total;
  }
  
  getTotalTokens(): number {
    let total = 0;
    for (const [_, metrics] of this.metrics) {
      if (metrics.tokens) {
        total += metrics.tokens;
      }
    }
    return total;
  }
}
```

**Performance Monitoring Implementation**:
```javascript
class TelemetryCollector {
  constructor(projectId) {
    this.projectId = projectId;
    this.metrics = {
      startTime: Date.now(),
      steps: {},
      errors: []
    };
  }
  
  startStep(stepName) {
    this.metrics.steps[stepName] = {
      startTime: Date.now(),
      tokenCount: 0,
      retryCount: 0
    };
  }
  
  endStep(stepName, success, tokens, retries = 0) {
    const step = this.metrics.steps[stepName];
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    step.success = success;
    step.tokenCount = tokens;
    step.retryCount = retries;
  }
}
```

**Cost Management (Lines 535-550)**:
```javascript
function calculateCost(inputTokens, outputTokens) {
  // Gemini 2.5 Flash pricing
  const inputCost = (inputTokens / 1000000) * 0.30;
  const outputCost = (outputTokens / 1000000) * 2.50;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    totalTokens: inputTokens + outputTokens
  };
}
```

## Phase-by-Phase Implementation

### Week 1: Foundation & Infrastructure

#### Day 1-2: Environment Setup
- [ ] Set up development environment
- [ ] Initialize Supabase project
- [ ] Configure local development
- [ ] Set up version control
- [ ] Configure CI/CD pipeline

#### Day 3-4: Database Schema
- [ ] Create all tables with constraints
- [ ] Set up indexes for performance
- [ ] Configure RLS policies
- [ ] Create database functions
- [ ] Test migrations

#### Day 5-7: Core Utilities
- [ ] Implement statistics library
- [ ] Build error recovery system
- [ ] Create telemetry collector
- [ ] Set up rate limiting
- [ ] Develop validation schemas

### Week 2: AI Processing Pipeline

#### Day 8-10: Analysis Function
- [ ] Implement pre-processing logic
- [ ] Create Gemini integration
- [ ] Build prompt templates
- [ ] Develop metaphor generation
- [ ] Test with sample datasets

#### Day 11-13: Visualization Function
- [ ] Implement D3 generation
- [ ] Create syntax validator
- [ ] Build repair mechanism
- [ ] Develop fallback templates
- [ ] Test visualization outputs

#### Day 14: Integration Testing
- [ ] End-to-end pipeline testing
- [ ] Performance benchmarking
- [ ] Error recovery testing
- [ ] Token usage optimization
- [ ] Cost analysis

### Week 3: Frontend Development

#### Day 15-17: Core UI Components
- [ ] Set up Next.js application
- [ ] Implement design system
- [ ] Create component library
- [ ] Build authentication flow
- [ ] Develop file upload interface

#### Day 18-19: Visualization Interface
- [ ] Create metaphor selection UI
- [ ] Build D3 rendering component
- [ ] Implement interaction handlers
- [ ] Add export functionality
- [ ] Create sharing features

#### Day 20-21: Polish & UX
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Create help documentation
- [ ] Add keyboard navigation
- [ ] Optimize performance

### Week 4: Production Readiness

#### Day 22-23: Security & Compliance
- [ ] Implement PII detection
- [ ] Add data encryption
- [ ] Configure CORS policies
- [ ] Set up rate limiting
- [ ] Audit security vulnerabilities

#### Day 24-25: Performance & Monitoring
- [ ] Set up monitoring dashboard
- [ ] Configure alerting
- [ ] Implement health checks
- [ ] Add performance metrics
- [ ] Create admin panel

#### Day 26-27: Documentation & Testing
- [ ] Write API documentation
- [ ] Create user guides
- [ ] Develop troubleshooting docs
- [ ] Conduct user testing
- [ ] Perform load testing

#### Day 28: Deployment
- [ ] Deploy to production
- [ ] Configure DNS
- [ ] Set up SSL certificates
- [ ] Verify all systems
- [ ] Launch announcement

## Testing & Quality Assurance

### Unit Testing Strategy

```typescript
// packages/utils/src/__tests__/statistics.test.ts
import { StatisticsEngine } from '../statistics';

describe('StatisticsEngine', () => {
  let engine: StatisticsEngine;
  
  beforeEach(() => {
    const testData = [
      ['Country', 'Population', 'GDP'],
      ['USA', '331000000', '21427000'],
      ['China', '1439000000', '14342000'],
      ['India', '1380000000', '2875000']
    ];
    engine = new StatisticsEngine(testData);
  });
  
  describe('calculateNullRates', () => {
    it('should calculate null percentages correctly', () => {
      const rates = engine.calculateNullRates();
      expect(rates).toHaveProperty('Country');
      expect(rates['Country']).toBe(0);
    });
  });
  
  describe('calculatePearsonR', () => {
    it('should calculate correlations between numerical columns', () => {
      const correlations = engine.calculatePearsonR(['Population', 'GDP']);
      expect(correlations).toHaveProperty('Population_GDP');
      expect(Math.abs(correlations['Population_GDP'])).toBeLessThanOrEqual(1);
    });
  });
});
```

### Integration Testing

```typescript
// supabase/functions/__tests__/analyze-csv.test.ts
import { analyzeCSV } from '../analyze-csv';
import { createMockSupabase } from '../test-utils';

describe('CSV Analysis Function', () => {
  it('should complete analysis within 150 seconds', async () => {
    const mockData = generateMockCSV(1000, 10);
    const startTime = Date.now();
    
    const result = await analyzeCSV(
      mockData,
      'test-project-id',
      'test-user-id'
    );
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(150000);
    expect(result).toHaveProperty('columnProfiles');
    expect(result).toHaveProperty('metaphors');
    expect(result.metaphors).toHaveLength(3);
  });
  
  it('should handle large datasets efficiently', async () => {
    const largeData = generateMockCSV(10000, 50);
    
    const result = await analyzeCSV(
      largeData,
      'test-project-id',
      'test-user-id'
    );
    
    expect(result).toBeDefined();
    expect(result.tokenUsage.totalCost).toBeLessThan(0.008);
  });
});
```

### End-to-End Testing

```typescript
// e2e/full-pipeline.test.ts
import { test, expect } from '@playwright/test';

test.describe('VizAI Full Pipeline', () => {
  test('should generate visualization from CSV upload', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3000');
    
    // Upload CSV file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/sample.csv');
    
    // Wait for analysis
    await expect(page.locator('[data-testid="analysis-complete"]'))
      .toBeVisible({ timeout: 60000 });
    
    // Select metaphor
    await page.click('[data-testid="metaphor-card-0"]');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for visualization
    await expect(page.locator('[data-testid="visualization-canvas"]'))
      .toBeVisible({ timeout: 90000 });
    
    // Verify D3 rendered
    const svgElement = await page.locator('svg.viz-canvas');
    expect(await svgElement.boundingBox()).toBeTruthy();
    
    // Test export
    await page.click('[data-testid="export-button"]');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.svg');
  });
});
```

## Deployment & DevOps

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy VizAI Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test
        
      - name: Run E2E tests
        run: pnpm test:e2e
        
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        run: npm install -g supabase
        
      - name: Deploy Edge Functions
        run: |
          supabase functions deploy analyze-csv
          supabase functions deploy generate-visualization
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Deploy Frontend
        run: |
          vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### Production Environment Variables

```bash
# .env.production
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Application
NEXT_PUBLIC_APP_URL=https://vizai.app
NEXT_PUBLIC_ENVIRONMENT=production

# Monitoring
SENTRY_DSN=your-sentry-dsn
POSTHOG_API_KEY=your-posthog-key

# Feature Flags
ENABLE_TELEMETRY=true
ENABLE_RATE_LIMITING=true
MAX_FILE_SIZE_MB=10
MAX_REQUESTS_PER_MINUTE=10
DAILY_BUDGET_USD=5.00
```

## Monitoring & Maintenance

### Health Check Implementation

```typescript
// supabase/functions/health-check/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const checks = {
    database: await checkDatabase(),
    gemini: await checkGeminiAPI(),
    storage: await checkStorage(),
    memory: checkMemoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  const allHealthy = Object.values(checks)
    .filter(v => typeof v === 'boolean')
    .every(v => v === true);
  
  return new Response(
    JSON.stringify({
      status: allHealthy ? 'healthy' : 'degraded',
      checks
    }),
    {
      status: allHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
});

async function checkDatabase(): Promise<boolean> {
  try {
    const result = await supabase.from('projects').select('count').single();
    return true;
  } catch {
    return false;
  }
}

async function checkGeminiAPI(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('test');
    return true;
  } catch {
    return false;
  }
}
```

### Monitoring Dashboard

```typescript
// apps/web/src/app/admin/dashboard/page.tsx
import { MetricsGrid, AlertsList, SystemHealth } from '@/components/admin';

export default async function AdminDashboard() {
  const metrics = await fetchMetrics();
  const alerts = await fetchAlerts();
  const health = await fetchSystemHealth();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">VizAI Admin Dashboard</h1>
      
      <SystemHealth status={health} />
      
      <MetricsGrid>
        <MetricCard
          title="Total Visualizations"
          value={metrics.totalVisualizations}
          change={metrics.dailyChange}
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          change={metrics.successRateChange}
        />
        <MetricCard
          title="Avg Generation Time"
          value={`${metrics.avgGenerationTime}s`}
          change={metrics.timeChange}
        />
        <MetricCard
          title="Daily Cost"
          value={`$${metrics.dailyCost}`}
          change={metrics.costChange}
        />
      </MetricsGrid>
      
      <AlertsList alerts={alerts} />
    </div>
  );
}
```

### Phase 7: Production Deployment

#### Reference: `README.md` - Lines 1290-1346 (Implementation Checklist)

**Deployment Phases**:

**Week 1 - Foundation**:
1. Database Schema with constraints and indexes
2. Rate Limiting with `checkRateLimit()` function
3. JSON Validation with AJV and repair logic
4. Telemetry System with `TelemetryCollector`
5. Error Handling with `failureHandlers` object

**Week 2 - Core Functions**:
6. Statistics Library (deterministic computation)
7. Edge Function A (`analyze-csv`) with structured Gemini calls
8. Edge Function B (`generate-visualization`) with D3 generation
9. Fallback Templates for each metaphor category
10. Syntax Validation for D3 code parsing

**Week 3 - User Interface**:
11. React Frontend with component library
12. File Upload with drag-and-drop functionality
13. Metaphor Selection interface
14. Real-time Visualization Preview
15. Export and Sharing capabilities

**Week 4 - Production Ready**:
16. Security with PII detection and data protection
17. Accessibility compliance (ARIA labels, keyboard navigation)
18. Performance testing with large datasets
19. Monitoring dashboard with real-time metrics
20. Documentation and troubleshooting guides

## Success Metrics & Quality Standards

#### Reference: `vizai_architecture.md` - Lines 326-352

**Quality Metrics**:
- JSON validation success rate >98%
- User satisfaction with metaphors >4.2/5.0
- Visualization render success rate >99%

**Performance Metrics**:
- Average generation time <45 seconds
- 95th percentile <90 seconds
- Memory usage <200MB peak
- Function cold start impact <5 seconds

**Cost & Reliability Metrics**:
- Average cost per visualization <$0.008
- Overall success rate >97%
- System uptime >99.5%
- Manual intervention required <3% of runs

## Technology Stack Summary

**Backend**:
- Platform: Supabase (Database + Edge Functions)
- Runtime: Deno (TypeScript/JavaScript)
- AI Model: Google Gemini 2.5 Flash
- Visualization Engine: D3.js v7

**Frontend**:
- Framework: React with TypeScript
- Styling: Tailwind CSS + Custom Design System
- Icons: Lucide React
- State Management: Context + Hooks
- Build Tool: Vite or Next.js

**Infrastructure**:
- Hosting: Vercel/Netlify for frontend
- Database: Supabase PostgreSQL
- File Storage: Supabase Storage
- Monitoring: Custom telemetry + health checks

## Critical Implementation Notes

### Performance Optimization Checklist

1. **Token Optimization**: 
   - Pre-compute all deterministic statistics to minimize AI token usage
   - Use structured outputs to reduce token count
   - Implement prompt caching for repeated patterns
   - Target <2000 tokens per complete generation

2. **Error Recovery**:
   - Implement comprehensive fallback systems for every failure point
   - Use exponential backoff with jitter for retries
   - Maintain conversation context for resumability
   - Log all errors with full context for debugging

3. **Rate Limiting**:
   - Strict enforcement to stay within free tier limits
   - Implement user-level and system-level limits
   - Queue system for handling bursts
   - Graceful degradation when limits approached

4. **Creative Quality**:
   - Focus on metaphor innovation over template efficiency
   - Maintain diverse visual language across categories
   - Ensure each visualization tells a unique story
   - Balance creativity with data clarity

5. **User Experience**:
   - Prioritize ease of use with professional-quality outputs
   - Sub-3-second response time for UI interactions
   - Clear progress indicators during generation
   - Intuitive error messages and recovery options

### Security Best Practices

- **Data Protection**:
  - Encrypt sensitive data at rest and in transit
  - Implement PII detection and redaction
  - Use row-level security for all database access
  - Regular security audits and penetration testing

- **API Security**:
  - Validate all inputs against schema
  - Implement CORS properly
  - Use API keys with proper rotation
  - Rate limit all endpoints

- **Authentication**:
  - Use Supabase Auth with MFA support
  - Implement session management
  - Secure password reset flows
  - Regular token rotation

### Scalability Considerations

- **Database**:
  - Implement proper indexing strategy
  - Use connection pooling
  - Regular vacuum and analyze
  - Monitor query performance

- **Edge Functions**:
  - Keep functions lightweight (<10MB)
  - Use streaming for large responses
  - Implement proper timeout handling
  - Monitor cold start impact

- **Frontend**:
  - Implement code splitting
  - Use lazy loading for components
  - Optimize bundle size
  - CDN for static assets

### Maintenance Schedule

**Daily**:
- Monitor error rates and alerts
- Check system health metrics
- Review cost tracking
- Validate backup completion

**Weekly**:
- Analyze performance trends
- Review user feedback
- Update documentation
- Security scan results

**Monthly**:
- Dependency updates
- Performance optimization review
- Cost analysis and optimization
- User satisfaction survey

**Quarterly**:
- Major feature releases
- Security audit
- Infrastructure review
- Disaster recovery testing

This comprehensive implementation guide provides the complete roadmap for building VizAI, with detailed code examples, testing strategies, deployment procedures, and maintenance guidelines. Each phase builds upon the previous one, ensuring a robust, scalable, and innovative data visualization platform that delivers professional-quality outputs while maintaining cost efficiency and excellent user experience.
