# VizAI Implementation Blueprint (Supabase Free Tier)

## System Architecture v2.0

**Edge Functions:** Two functions handling 5 sequential API calls
**Database Tables:** 
- `ai_generation_context` (conversation state)
- `projects` (results storage)
**Models:** Gemini 2.5 Flash exclusively ($0.30/$2.50 per 1M tokens)

## Function 1: analyze-csv

### Pre-AI Processing (JavaScript)
**Execute before any AI calls:**
```javascript
// Calculate these deterministically
const stats = {
  nullPercentages: calculateNullRates(csvData),
  uniqueCounts: calculateUniques(csvData),
  basicCorrelations: calculatePearsonR(numericalColumns),
  dataRanges: calculateMinMax(numericalColumns),
  categoricalDistributions: getCategoryFrequencies(categoricalColumns)
}
```

### Call 1A: Data Profiling + Pattern Detection

**Gemini API Request Structure:**
```javascript
{
  model: "gemini-2.5-flash",
  contents: [{
    role: "user", 
    parts: [{
      text: `[EXACT PROMPT BELOW]`
    }]
  }],
  generationConfig: {
    temperature: 0.1,
    response_mime_type: "application/json",
    response_schema: {
      type: "object",
      properties: {
        columnProfiles: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              detectedType: {type: "string", enum: ["numerical", "categorical", "temporal", "text"]},
              qualityAssessment: {type: "string"},
              statisticalSummary: {type: "string"}
            }
          }
        },
        patterns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {type: "string"},
              description: {type: "string"},
              strength: {type: "number", minimum: 0, maximum: 1},
              columns: {type: "array", items: {type: "string"}}
            }
          }
        },
        correlationInsights: {type: "array", items: {type: "string"}}
      },
      required: ["columnProfiles", "patterns", "correlationInsights"]
    }
  }
}
```

**Exact Prompt Template:**
```
Dataset: {filename}
Rows: {rowCount}, Columns: {columnCount}

Pre-computed Statistics:
{JSON.stringify(stats, null, 2)}

Sample Data (first 20 rows):
{JSON.stringify(sampleData, null, 2)}

Analyze this dataset. For each column, determine:
1. Most accurate data type (numerical/categorical/temporal/text)
2. Quality assessment (missing data, outliers, consistency)
3. Statistical summary in plain English

Identify patterns:
1. Strong correlations (>0.7 strength)
2. Temporal trends if time columns exist
3. Categorical clustering opportunities
4. Distribution shapes and anomalies

Return insights about correlation findings.
```

**Post-Processing:**
- Validate response against schema
- If validation fails, retry once with clarification
- Store in `ai_generation_context.step_1a_results`
- Update `projects.phase = 'analyzing', generation_progress = 33`

### Call 1B: Narrative + Metaphor Generation

**Input Context:**
- Results from 1A
- Domain type inferred from column names
- Data complexity assessment

**Gemini Request Schema:**
```javascript
response_schema: {
  type: "object",
  properties: {
    keyInsights: {type: "array", items: {type: "string"}, maxItems: 4},
    narrativePotential: {type: "string"},
    emotionalContext: {type: "string", enum: ["growth", "decline", "stability", "comparison", "flow"]},
    metaphors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {type: "string"},
          title: {type: "string"},
          description: {type: "string", maxLength: 200},
          category: {type: "string", enum: ["Organic", "Geometric", "Flow"]},
          innovationScore: {type: "number", minimum: 1, maximum: 10},
          colorPalette: {type: "array", items: {type: "string"}, maxItems: 5},
          d3Strategy: {type: "string"}
        },
        required: ["id", "title", "description", "category", "colorPalette"]
      },
      minItems: 3,
      maxItems: 3
    }
  }
}
```

**Exact Prompt Template:**
```
Based on the data analysis:
{summarize 1A results in 200 words}

Generate exactly 4 key insights about what this data reveals.

Create a narrative describing what story this data tells.

Determine emotional context: growth/decline/stability/comparison/flow.

Generate exactly 3 distinct visualization metaphors:

Metaphor 1 - Organic theme: Use nature, growth, ecosystems. Think trees, flowers, organisms.
Metaphor 2 - Geometric theme: Use shapes, networks, architecture. Think circuits, crystals, grids.  
Metaphor 3 - Flow theme: Use movement, rivers, particles. Think streams, migrations, journeys.

For each metaphor:
- Creative title reflecting the data story
- Description (max 200 chars) explaining why it fits
- Innovation score 1-10 (how unique/creative)
- 3-5 hex colors that embody the theme
- Brief D3 implementation approach

Make each metaphor distinctly different in visual approach.
```

**Post-Processing:**
- Validate 3 metaphors returned
- Store in `projects.suggested_metaphors`
- Create summary for next phase context
- Update `projects.phase = 'selecting', generation_progress = 66`

### Call 1C: Context Summarization

**Purpose:** Compress all analysis into compact context for visualization phase

**Input:** All results from 1A-1B

**Schema:**
```javascript
response_schema: {
  type: "object",
  properties: {
    compactSummary: {type: "string", maxLength: 400},
    keyColumns: {type: "array", items: {type: "string"}},
    dataCharacteristics: {type: "string"},
    visualizationHints: {type: "array", items: {type: "string"}}
  }
}
```

**Prompt:**
```
Summarize the complete analysis in exactly 400 characters:
- Dataset type and size
- Top 3 insights
- Emotional context
- Key columns for visualization

List 3-5 most important columns for visualization.
Describe data characteristics in one sentence.
Provide 3 visualization implementation hints.
```

**Storage:** Save to `ai_generation_context.compact_summary`

## Function 2: generate-visualization

### Call 2A: Complete D3 Generation

**Input Context:**
- Compact summary from 1C
- Selected metaphor (user choice)
- CSV column schema
- Canvas specs (1200x800px)

**Schema:**
```javascript
response_schema: {
  type: "object",
  properties: {
    completeD3Code: {type: "string"},
    stylingCode: {type: "string"},
    interactionCode: {type: "string"},
    animationCode: {type: "string"},
    accessibilityFeatures: {type: "string"}
  },
  required: ["completeD3Code"]
}
```

**Exact Prompt Template:**
```
Create complete D3.js v7 visualization implementing "{metaphor.title}" metaphor.

Data Summary: {compactSummary}
Key Columns: {keyColumns}
Metaphor: {metaphor.description}
Colors: {metaphor.colorPalette}
Canvas: 1200x800px with margins

Generate production-ready code including:

1. SVG setup with proper dimensions
2. Scales for all data mappings
3. Data processing and binding
4. Visual elements matching metaphor theme
5. Color implementation from palette
6. Hover tooltips showing data values
7. Smooth entrance animations
8. Basic responsiveness
9. Error handling for missing data

Use D3 best practices:
- Proper enter/update/exit pattern
- Efficient transitions
- Semantic element grouping
- Clean data joins

Return complete executable code ready for container injection.
```

**Post-Processing:**
- Syntax validation using JavaScript parser
- If syntax errors, retry with error details
- Store in `projects.visualization_code`
- Update `projects.phase = 'generating', generation_progress = 85`

### Call 2B: Code Optimization + Validation

**Input:** Complete D3 code from 2A + performance requirements

**Pre-Validation:** Run syntax check, identify issues

**Schema:**
```javascript
response_schema: {
  type: "object", 
  properties: {
    optimizedCode: {type: "string"},
    performanceImprovements: {type: "array", items: {type: "string"}},
    validationStatus: {type: "string", enum: ["passed", "failed"]},
    responsiveEnhancements: {type: "string"}
  }
}
```

**Prompt Template:**
```
Optimize this D3.js code for performance and mobile compatibility:

{codeFromStep2A}

Apply these optimizations:
1. Reduce DOM queries - cache selections
2. Minimize reflows - batch DOM updates
3. Optimize transitions - use transform over positional changes
4. Add mobile touch events
5. Implement viewport-based sizing
6. Add performance monitoring

Validate syntax and fix any errors.
Add responsive breakpoints for mobile (768px).
Ensure accessibility with ARIA labels.

Return optimized code ready for production.
```

**Final Processing:**
- Store optimized code in `projects.visualization_code`
- Update `projects.phase = 'exporting', status = 'completed', generation_progress = 100`
- Generate export configurations

## Error Handling Protocol

**JSON Validation Failure:**
1. Parse error → Retry with "Fix JSON syntax" prompt
2. Missing required fields → Retry with field specification
3. Invalid enum values → Retry with valid options listed

**Timeout Handling:**
- Individual call timeout → Retry up to 2 times
- Function timeout approaching → Skip optimization step
- Context corruption → Rebuild from database state

**Fallback Strategies:**
- Analysis failure → Use template-based column analysis
- Metaphor generation failure → Generate 3 standard metaphors
- Code generation failure → Create minimal working visualization
- Optimization failure → Use unoptimized code

## Database Updates

**Context Management:**
```sql
CREATE TABLE ai_generation_context (
  project_id UUID PRIMARY KEY,
  conversation_history JSONB,
  compact_summary TEXT,
  current_step TEXT,
  step_results JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Progress Tracking:**
- Update `projects.generation_progress` after each call
- Store `step_results` for recovery
- Maintain `conversation_history` for context

## Execution Monitoring

**Resource Tracking:**
- Log API response time for each call
- Track token usage per request
- Monitor memory usage in Edge Functions
- Alert if approaching 150s timeout

**Quality Metrics:**
- JSON validation success rate
- Code syntax validation rate
- User satisfaction with metaphors
- Visualization rendering success rate

**Rate Limit Management:**
- Track calls against 5 RPM limit
- Queue requests if limit approached
- Implement exponential backoff on rate limit errors
- Monitor daily usage against 100 request limit


## Rate Limiting & Job Queue System

### Rate Limit Enforcement (Before Each Gemini Call)
```javascript
async function checkRateLimit(userId, estimatedTokens) {
  const limit = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  // Reset daily counter if needed
  if (limit.daily_reset_at < new Date()) {
    await resetDailyLimits(userId);
  }
  
  // Check RPM (5 per minute free tier)
  const minuteAgo = new Date(Date.now() - 60000);
  if (limit.last_request_at > minuteAgo && limit.requests_this_minute >= 5) {
    throw new Error('RATE_LIMIT_RPM');
  }
  
  // Check daily token budget ($0.50 default)
  const estimatedCost = (estimatedTokens * 0.30) / 1000000; // Flash pricing
  if (limit.daily_cost_usd + estimatedCost > 0.50) {
    throw new Error('RATE_LIMIT_BUDGET');
  }
  
  return true;
}
```

### Job Queue Worker (Deno Edge Function)
```javascript
export async function handleJobQueue(req) {
  const job = await supabase
    .from('job_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(1)
    .single();
    
  if (!job) return new Response('No jobs', {status: 204});
  
  try {
    await processJob(job);
  } catch (error) {
    await handleJobFailure(job, error);
  }
}

async function handleJobFailure(job, error) {
  const attempts = job.attempts + 1;
  const maxAttempts = job.max_attempts;
  
  if (attempts >= maxAttempts) {
    // Mark as permanently failed
    await supabase.from('job_queue')
      .update({status: 'failed', last_error: error.message})
      .eq('id', job.id);
  } else {
    // Exponential backoff: 2s, 4s, 8s
    const delaySeconds = Math.pow(2, attempts) * 2;
    const scheduledAt = new Date(Date.now() + delaySeconds * 1000);
    
    await supabase.from('job_queue')
      .update({
        attempts,
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
        last_error: error.message
      })
      .eq('id', job.id);
  }
}
```

## Robust Error Handling & Recovery

### JSON Validation with AJV
```javascript
import Ajv from 'ajv';
const ajv = new Ajv();

async function validateAndRepair(response, schema, retryPrompt) {
  // First validation attempt
  const validate = ajv.compile(schema);
  let parsed;
  
  try {
    parsed = JSON.parse(response);
  } catch (e) {
    // Syntax repair attempt
    const repaired = repairJsonSyntax(response);
    try {
      parsed = JSON.parse(repaired);
    } catch (e2) {
      throw new Error('UNPARSEABLE_JSON');
    }
  }
  
  // Schema validation
  if (validate(parsed)) {
    return parsed;
  }
  
  // Single repair attempt
  const repairPrompt = `Fix this JSON to match the schema exactly. Return ONLY corrected JSON:\n${response}\n\nSchema: ${JSON.stringify(schema)}`;
  const repairedResponse = await callGemini(repairPrompt, schema);
  
  try {
    const repairedParsed = JSON.parse(repairedResponse);
    if (validate(repairedParsed)) {
      return repairedParsed;
    }
  } catch (e) {
    // Final fallback
    throw new Error('REPAIR_FAILED');
  }
}

function repairJsonSyntax(json) {
  return json
    .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
    .replace(/:\s*'([^']*?)'/g, ':"$1"') // Single to double quotes
    .trim();
}
```

### Semantic Validation
```javascript
async function validateCorrelations(patterns, csvData) {
  const correlationPatterns = patterns.filter(p => p.type === 'correlation');
  
  for (const pattern of correlationPatterns) {
    if (pattern.columns.length === 2) {
      const [col1, col2] = pattern.columns;
      const actualCorr = calculatePearsonR(csvData, col1, col2);
      const reportedCorr = pattern.strength;
      
      if (Math.abs(actualCorr - reportedCorr) > 0.15) {
        console.warn(`Correlation mismatch: reported ${reportedCorr}, actual ${actualCorr}`);
        pattern.confidence = 'low';
        pattern.verified = false;
      } else {
        pattern.verified = true;
      }
    }
  }
  
  return patterns;
}
```

## Token & Cost Budget Management

### Precise Cost Calculation
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

// Example calculation for single run:
// Call A1: 700 input + 800 output = 1500 tokens
// Call B1: 400 input + 1500 output = 1900 tokens  
// Total: 3400 tokens = $0.00# VizAI Production Implementation Blueprint v10 (Supabase Free Tier)

## System Architecture & Critical Constraints

**Supabase Free Tier (Hard Limits):**
- Wall-clock: 150s max per function
- Memory: 256MB
- CPU: ~2s per request (async I/O doesn't count)
- Cold starts: Variable, minimize function invocations

**Gemini 2.5 Flash Strategy:**
- Cost: $0.30/$2.50 per 1M tokens input/output
- Rate: 5 RPM free tier, higher paid
- Features: response_schema for structured JSON
- Target: 2 functions × 2-3 calls total = ~$0.006 per visualization

## Function 1: analyze-csv

### Pre-AI Deterministic Computations (JavaScript/SQL)

**Execute locally before any Gemini calls:**

```javascript
// Required stats - compute these first
const stats = {
  nullPercentages: calculateNullRates(csvData),
  uniqueCounts: calculateUniques(csvData),
  basicCorrelations: calculatePearsonR(numericalColumns), // sample if >2000 rows
  dataRanges: calculateMinMax(numericalColumns),
  categoricalDistributions: getCategoryFrequencies(categoricalColumns),
  outlierFlags: detectOutliers(numericalColumns) // Z-score > 3
}

// Use SQL for large datasets
const sqlStats = await supabase.from('temp_stats').select(`
  column_name,
  null_percentage,
  unique_count,
  min_val,
  max_val,
  top_categories
`).eq('project_id', projectId);
```

### Single Gemini Call A1: Complete Analysis + Metaphors

**Gemini API Configuration:**
```javascript
{
  model: "gemini-2.5-flash",
  contents: [{role: "user", parts: [{text: promptTemplate}]}],
  generationConfig: {
    temperature: 0.1,
    response_mime_type: "application/json",
    response_schema: strictJsonSchema
  }
}
```

**Exact JSON Schema (Copy-Paste Ready):**
```json
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
        },
        "required": ["detectedType", "nullPercentage", "uniqueCount"]
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
        },
        "required": ["type", "description", "strength"]
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
          "colorPalette": {
            "type": "array", 
            "items": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"}, 
            "minItems": 3, 
            "maxItems": 5
          },
          "d3Strategy": {"type": "string", "maxLength": 100}
        },
        "required": ["id", "title", "description", "category", "colorPalette", "d3Strategy"]
      }
    },
    "compactSummary": {"type": "string", "maxLength": 500},
    "keyColumns": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 6}
  },
  "required": ["columnProfiles", "patterns", "metaphors", "compactSummary", "keyColumns"]
}
```

**Exact Prompt Template:**
```
System: You are a data analysis assistant. Return ONLY valid JSON conforming to the response_schema. No commentary or explanations.

User: Dataset: {filename}
Rows: {rowCount}, Columns: {columnCount}

Precomputed Statistics:
{JSON.stringify(stats, null, 2)}

Sample Data (first 20 rows):
{JSON.stringify(sampleData, null, 2)}

Tasks:
1. For each column in the precomputed stats, provide:
   - detectedType (numerical/categorical/temporal/text)
   - nullPercentage (from stats)
   - uniqueCount (from stats) 
   - sampleValues (up to 5 representative values)
   - qualityFlags (array of issues: "high_nulls", "outliers", "inconsistent_format", "skewed")

2. Identify up to 10 meaningful patterns:
   - Correlations >0.6 strength (include column pairs)
   - Temporal trends if time columns exist
   - Categorical clustering opportunities
   - Distribution patterns and anomalies

3. Generate exactly 3 visualization metaphors:
   - Metaphor 1: Organic category (nature, growth, trees, ecosystems)
   - Metaphor 2: Geometric category (shapes, networks, architecture, circuits)
   - Metaphor 3: Flow category (rivers, particles, journeys, movement)
   
   For each metaphor provide id, title (max 50 chars), description (max 200 chars), category, innovationScore (1-10), colorPalette (3-5 hex colors), d3Strategy (brief implementation hint).

4. Create compactSummary (max 500 chars) describing the dataset story.

5. Select up to 6 keyColumns most important for visualization.

Return only valid JSON matching the schema. Temperature: 0.1
```

**Post-Processing Protocol:**
1. **Immediate Validation:** Parse JSON against schema using AJV
2. **Repair Attempt:** If invalid, run single repair pass:
   ```
   Fix this JSON to match the schema exactly. Return ONLY corrected JSON:
   {invalidJson}
   Schema: {schema}
   ```
3. **Semantic Validation:** Verify correlation strengths by recomputing top 3 correlations
4. **Fallback:** If still invalid, use deterministic template metaphors and mark for review
5. **Persistence:** Store results in `ai_generation_context.step_results.analysis`

## Function 2: generate-visualization

### Call B1: Complete D3 Code Generation

**Input Context (Minimal Token Usage):**
- `compactSummary` from analysis
- `selectedMetaphor` (user's choice)
- `keyColumns` array
- Column data types only (not raw data)

**Response Schema:**
```json
{
  "type": "object",
  "properties": {
    "completeD3Code": {"type": "string"},
    "stylingCode": {"type": "string"}, 
    "interactionCode": {"type": "string"},
    "animationCode": {"type": "string"},
    "accessibilityNotes": {"type": "string", "maxLength": 200}
  },
  "required": ["completeD3Code"]
}
```

**Exact Prompt Template:**
```
System: Return ONLY valid JSON matching response_schema. The completeD3Code must be production-ready D3 v7 JavaScript.

User: Dataset Summary: {compactSummary}
Selected Metaphor: {selectedMetaphor.title} - {selectedMetaphor.description}
Key Columns: {keyColumns}
Color Palette: {selectedMetaphor.colorPalette}
Canvas: 1200x800 pixels

Requirements:
1. Generate complete D3 v7 code implementing the "{selectedMetaphor.title}" metaphor
2. Use robust null handling and data validation
3. Include tooltip logic with actual data values
4. Add smooth entrance animations matching metaphor theme
5. Implement hover effects and basic interactions
6. Add aria-labels for accessibility
7. Use only standard D3 v7 methods (no external dependencies)
8. Handle edge cases: empty data, single data point, all null values

Code Structure:
- SVG setup with margins (80px all sides)
- Scales appropriate for data types
- Data binding with enter/update/exit pattern
- Visual elements matching metaphor category
- Color mapping from provided palette
- Interaction handlers (hover, click)
- Accessibility attributes

Return only JSON. Temperature: 0.1
```

### Call B2: Code Optimization + Validation (Conditional)

**Trigger:** Only if B1 code fails syntax validation

**Input:** Failed code + linter errors

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "optimizedCode": {"type": "string"},
    "errorsFix": {"type": "array", "items": {"type": "string"}},
    "validationStatus": {"type": "string", "enum": ["passed", "failed"]},
    "performanceNotes": {"type": "string"}
  },
  "required": ["optimizedCode", "validationStatus"]
}
```

**Validation Pipeline:**
1. **Syntax Check:** Parse with Acorn/Esprima
2. **D3 Pattern Check:** Verify `.enter()`, `.join()`, `.transition()` usage
3. **Accessibility Check:** Scan for `aria-`, `role`, `title` attributes
4. **Performance Check:** Flag inefficient patterns

**Fallback D3 Template (If All Fails):**
```javascript
// Minimal working visualization template
const fallbackVisualization = `
const margin = {top: 40, right: 40, bottom: 60, left: 60};
const width = 1200 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

const svg = d3.select(container)
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Safe data processing
const processedData = csvData.filter(d => d && Object.keys(d).length > 0);

// Basic chart based on metaphor category
// ${metaphor.category === 'Organic' ? 'Circle pack layout' : 
//   metaphor.category === 'Geometric' ? 'Grid layout' : 'Flow layout'}
`;
```

## Error Handling Protocol

**JSON Validation Failure:**
1. Parse error → Retry with "Fix JSON syntax" prompt
2. Missing required fields → Retry with field specification
3. Invalid enum values → Retry with valid options listed

**Timeout Handling:**
- Individual call timeout → Retry up to 2 times
- Function timeout approaching → Skip optimization step
- Context corruption → Rebuild from database state

**Fallback Strategies:**
- Analysis failure → Use template-based column analysis
- Metaphor generation failure → Generate 3 standard metaphors
- Code generation failure → Create minimal working visualization
- Optimization failure → Use unoptimized code

## Database Schema (Production-Ready)

```sql
-- Core project tracking
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  row_count int NOT NULL,
  column_count int NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  generation_progress int DEFAULT 0 CHECK (generation_progress >= 0 AND generation_progress <= 100),
  phase text DEFAULT 'idle' CHECK (phase IN ('idle','analyzing','selecting','generating','exporting','failed')),
  selected_metaphor jsonb,
  visualization_code jsonb,
  token_usage jsonb DEFAULT '{"total_input":0,"total_output":0,"cost_usd":0}',
  error_log jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft','processing','completed','error'))
);

-- AI conversation context (resume capability)
CREATE TABLE ai_generation_context (
  project_id uuid REFERENCES projects(id) PRIMARY KEY ON CONFLICT REPLACE,
  conversation_history jsonb DEFAULT '[]',
  compact_summary text,
  current_step text,
  step_results jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job queue for rate limiting
CREATE TABLE job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  function_name text NOT NULL CHECK (function_name IN ('analyze-csv','generate-visualization')),
  payload jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','running','failed','completed')),
  attempts int DEFAULT 0 CHECK (attempts >= 0),
  max_attempts int DEFAULT 3,
  last_error text,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Rate limiting tracking
CREATE TABLE rate_limits (
  user_id uuid PRIMARY KEY,
  requests_this_minute int DEFAULT 0,
  tokens_this_minute int DEFAULT 0,
  last_request_at timestamptz DEFAULT now(),
  daily_cost_usd decimal(10,4) DEFAULT 0,
  daily_reset_at timestamptz DEFAULT (current_date + interval '1 day')
);

-- Indexes
CREATE INDEX idx_projects_user_updated ON projects(user_id, updated_at DESC);
CREATE INDEX idx_job_queue_status_scheduled ON job_queue(status, scheduled_at);
CREATE INDEX idx_rate_limits_user_time ON rate_limits(user_id, last_request_at);
```

// Total: 3400 tokens = $0.006 per visualization

async function trackTokenUsage(projectId, step, inputTokens, outputTokens) {
  const cost = calculateCost(inputTokens, outputTokens);
  
  await supabase.from('projects')
    .update({
      token_usage: {
        [`${step}_input`]: inputTokens,
        [`${step}_output`]: outputTokens,
        [`${step}_cost`]: cost.totalCost,
        total_cost: cost.totalCost // Will be summed across steps
      }
    })
    .eq('id', projectId);
    
  // Update user's daily spending
  await supabase.from('rate_limits')
    .update({
      daily_cost_usd: supabase.raw('daily_cost_usd + ?', [cost.totalCost])
    })
    .eq('user_id', userId);
}
```

## Telemetry & Monitoring

### Performance Metrics Collection
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
  
  recordError(stepName, error) {
    this.metrics.errors.push({
      step: stepName,
      error: error.message,
      timestamp: Date.now()
    });
  }
  
  async flush() {
    const totalDuration = Date.now() - this.metrics.startTime;
    const totalTokens = Object.values(this.metrics.steps)
      .reduce((sum, step) => sum + step.tokenCount, 0);
    
    await supabase.from('projects').update({
      telemetry: {
        totalDuration,
        totalTokens,
        stepMetrics: this.metrics.steps,
        errors: this.metrics.errors,
        timestamp: new Date().toISOString()
      }
    }).eq('id', this.projectId);
  }
}
```

### Health Checks & Alerts
```javascript
async function runHealthCheck() {
  const metrics = await supabase
    .from('projects')
    .select('telemetry, created_at')
    .gte('created_at', new Date(Date.now() - 86400000)) // Last 24h
    .not('telemetry', 'is', null);
    
  const analysis = {
    totalRuns: metrics.length,
    successRate: 0,
    avgDuration: 0,
    jsonValidationRate: 0,
    avgTokensPerRun: 0
  };
  
  if (metrics.length > 0) {
    analysis.successRate = metrics.filter(m => 
      m.telemetry.errors.length === 0
    ).length / metrics.length;
    
    analysis.avgDuration = metrics.reduce((sum, m) => 
      sum + m.telemetry.totalDuration, 0
    ) / metrics.length;
    
    analysis.avgTokensPerRun = metrics.reduce((sum, m) => 
      sum + m.telemetry.totalTokens, 0
    ) / metrics.length;
  }
  
  // Alert conditions
  if (analysis.successRate < 0.95) {
    await sendAlert('LOW_SUCCESS_RATE', analysis);
  }
  
  if (analysis.avgDuration > 120000) { // 2 minutes
    await sendAlert('HIGH_LATENCY', analysis);
  }
  
  return analysis;
}
```

## Failure Nodes & Automated Mitigations

### Comprehensive Failure Handling Matrix
```javascript
const failureHandlers = {
  'RATE_LIMIT_RPM': async (project, error) => {
    // Wait until next minute + jitter
    const delayMs = (60 - new Date().getSeconds()) * 1000 + Math.random() * 5000;
    await scheduleJobRetry(project.id, delayMs);
    return { action: 'DELAYED', delayMs };
  },
  
  'RATE_LIMIT_BUDGET': async (project, error) => {
    // Switch to batch mode or pause until tomorrow
    await supabase.from('projects')
      .update({ status: 'paused', error_message: 'Daily budget exceeded' })
      .eq('id', project.id);
    return { action: 'PAUSED_BUDGET' };
  },
  
  'UNPARSEABLE_JSON': async (project, error, stepName) => {
    // Use fallback templates
    const fallback = await generateFallbackOutput(stepName, project);
    await supabase.from('ai_generation_context')
      .update({ 
        step_results: { [stepName]: fallback },
        current_step: stepName + '_fallback'
      })
      .eq('project_id', project.id);
    return { action: 'FALLBACK_USED', fallback };
  },
  
  'GEMINI_TIMEOUT': async (project, error) => {
    // Exponential backoff with max 3 retries
    const attempts = project.retry_count || 0;
    if (attempts >= 3) {
      return failureHandlers['PERMANENT_FAILURE'](project, error);
    }
    
    const delayMs = Math.pow(2, attempts) * 2000; // 2s, 4s, 8s
    await scheduleJobRetry(project.id, delayMs, attempts + 1);
    return { action: 'RETRY_BACKOFF', delayMs, attempt: attempts + 1 };
  },
  
  'SUPABASE_TIMEOUT': async (project, error) => {
    // Persist partial state and resume
    await savePartialState(project);
    const resumePoint = determineResumePoint(project);
    await scheduleJobRetry(project.id, 5000, 0, resumePoint);
    return { action: 'RESUME_FROM_CHECKPOINT', resumePoint };
  },
  
  'PERMANENT_FAILURE': async (project, error) => {
    await supabase.from('projects')
      .update({ 
        status: 'failed', 
        phase: 'failed',
        error_message: error.message,
        needs_manual_review: true
      })
      .eq('id', project.id);
    
    await notifyAdmins(project.id, error);
    return { action: 'MANUAL_REVIEW_REQUIRED' };
  }
};

async function handleFailure(project, error, stepName) {
  const handler = failureHandlers[error.code] || failureHandlers['PERMANENT_FAILURE'];
  const result = await handler(project, error, stepName);
  
  // Log for analytics
  await supabase.from('projects').update({
    error_log: supabase.raw('error_log || ?::jsonb', [{
      timestamp: new Date().toISOString(),
      step: stepName,
      error: error.message,
      code: error.code,
      action: result.action,
      context: { project_id: project.id }
    }])
  }).eq('id', project.id);
  
  return result;
}
```

## Edge Function Implementation Templates

### Function A: analyze-csv.ts (Deno)
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const telemetry = new TelemetryCollector(projectId);
  
  try {
    // 1. Extract and validate request
    const { projectId, csvData, csvMetadata } = await req.json();
    
    // 2. Rate limiting check
    await checkRateLimit(userId, 1500); // Estimated tokens
    
    // 3. Pre-compute deterministic stats
    telemetry.startStep('precompute');
    const stats = await computeStatistics(csvData, csvMetadata);
    telemetry.endStep('precompute', true, 0);
    
    // 4. Single Gemini call
    telemetry.startStep('gemini_analysis');
    const prompt = buildAnalysisPrompt(csvMetadata, stats, csvData.slice(0, 20));
    const response = await callGeminiStructured(prompt, analysisSchema);
    const validated = await validateAndRepair(response, analysisSchema);
    telemetry.endStep('gemini_analysis', true, countTokens(prompt + response));
    
    // 5. Semantic validation
    const validatedPatterns = await validateCorrelations(validated.patterns, csvData);
    validated.patterns = validatedPatterns;
    
    // 6. Persist results
    await supabase.from('ai_generation_context').upsert({
      project_id: projectId,
      step_results: { analysis: validated },
      compact_summary: validated.compactSummary,
      current_step: 'analysis_complete'
    });
    
    await supabase.from('projects').update({
      suggested_metaphors: validated.metaphors,
      phase: 'selecting',
      generation_progress: 100
    }).eq('id', projectId);
    
    await telemetry.flush();
    
    return new Response(JSON.stringify({
      success: true,
      metaphors: validated.metaphors,
      summary: validated.compactSummary
    }), { headers: corsHeaders });
    
  } catch (error) {
    const result = await handleFailure({ id: projectId }, error, 'analysis');
    await telemetry.flush();
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      recovery: result
    }), { 
      status: result.action === 'PERMANENT_FAILURE' ? 500 : 202,
      headers: corsHeaders 
    });
  }
});
```

### Function B: generate-visualization.ts (Deno)
```typescript
serve(async (req) => {
  const telemetry = new TelemetryCollector(projectId);
  
  try {
    const { projectId, selectedMetaphor } = await req.json();
    
    // Load context
    const context = await supabase
      .from('ai_generation_context')
      .select('compact_summary, step_results')
      .eq('project_id', projectId)
      .single();
    
    await checkRateLimit(userId, 1900); // Estimated tokens for D3 generation
    
    // Call B1: D3 Generation
    telemetry.startStep('d3_generation');
    const d3Prompt = buildD3Prompt(context.compact_summary, selectedMetaphor);
    const d3Response = await callGeminiStructured(d3Prompt, d3Schema);
    const validatedD3 = await validateAndRepair(d3Response, d3Schema);
    telemetry.endStep('d3_generation', true, countTokens(d3Prompt + d3Response));
    
    // Syntax validation
    const syntaxValid = await validateD3Syntax(validatedD3.completeD3Code);
    let finalCode = validatedD3.completeD3Code;
    
    if (!syntaxValid.isValid) {
      // Call B2: Repair
      telemetry.startStep('d3_repair');
      const repairPrompt = buildRepairPrompt(finalCode, syntaxValid.errors);
      const repairResponse = await callGeminiStructured(repairPrompt, repairSchema);
      const repairedCode = await validateAndRepair(repairResponse, repairSchema);
      
      if (await validateD3Syntax(repairedCode.optimizedCode).isValid) {
        finalCode = repairedCode.optimizedCode;
        telemetry.endStep('d3_repair', true, countTokens(repairPrompt + repairResponse));
      } else {
        // Use fallback template
        finalCode = generateFallbackD3(selectedMetaphor);
        telemetry.endStep('d3_repair', false, 0);
      }
    }
    
    // Persist final result
    await supabase.from('projects').update({
      visualization_code: finalCode,
      visualization_config: {
        metaphor: selectedMetaphor,
        dimensions: { width: 1200, height: 800 }
      },
      phase: 'exporting',
      status: 'completed',
      generation_progress: 100
    }).eq('id', projectId);
    
    await telemetry.flush();
    
    return new Response(JSON.stringify({
      success: true,
      code: finalCode,
      phase: 'exporting'
    }), { headers: corsHeaders });
    
  } catch (error) {
    const result = await handleFailure({ id: projectId }, error, 'generation');
    await telemetry.flush();
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      recovery: result
    }), { 
      status: result.action === 'PERMANENT_FAILURE' ? 500 : 202,
      headers: corsHeaders 
    });
  }
});
```

## Implementation Checklist (Priority Order)

### Phase 1: Foundation (Week 1)
1. **Database Schema**: Create all tables with constraints and indexes
2. **Rate Limiting**: Implement `checkRateLimit()` and `rate_limits` table management
3. **JSON Validation**: Set up AJV with repair logic for both schemas
4. **Telemetry System**: Implement `TelemetryCollector` class
5. **Error Handling**: Build `failureHandlers` object with all recovery strategies

### Phase 2: Core Functions (Week 2)
6. **Statistics Library**: Create deterministic stats computation (JS + SQL)
7. **Edge Function A**: Implement `analyze-csv` with single structured Gemini call
8. **Edge Function B**: Implement `generate-visualization` with D3 generation + repair
9. **Fallback Templates**: Create minimal working D3 templates for each metaphor category
10. **Syntax Validation**: Build D3 code parser and linter integration

### Phase 3: Resilience (Week 3)
11. **Job Queue**: Implement `job_queue` table and worker function
12. **Exponential Backoff**: Add retry logic with jitter and circuit breakers
13. **Context Management**: Build conversation history pruning and summarization
14. **Health Monitoring**: Create daily health check function and alerting
15. **Cost Tracking**: Implement precise token counting and budget enforcement

### Phase 4: Production Ready (Week 4)
16. **Security**: Add PII detection and redaction for CSV data
17. **Accessibility**: Ensure all generated D3 includes ARIA labels and keyboard nav
18. **Performance Testing**: Load test with large CSVs and concurrent users
19. **Monitoring Dashboard**: Build real-time metrics and error rate tracking
20. **Documentation**: Create deployment guide and troubleshooting runbook

## Success Metrics & KPIs

**Quality Metrics:**
- JSON validation success rate > 98%
- D3 syntax validation success rate > 95%
- User satisfaction with metaphors > 4.2/5.0
- Visualization render success rate > 99%

**Performance Metrics:**
- Average generation time < 45 seconds
- 95th percentile generation time < 90 seconds
- Function cold start impact < 5 seconds
- Memory usage < 200MB peak

**Cost Metrics:**
- Average cost per visualization < $0.008
- Token efficiency: >70% useful output tokens
- Rate limit hit rate < 2%
- Daily budget adherence > 99%

**Reliability Metrics:**
- Overall success rate > 97%
- Recovery from failure rate > 90%
- Manual intervention required < 3% of runs
- System uptime > 99.5%

This blueprint provides complete implementation guidance for a production-ready, cost-effective VizAI system that operates efficiently within Supabase free tier constraints while maintaining high quality and reliability standards.
