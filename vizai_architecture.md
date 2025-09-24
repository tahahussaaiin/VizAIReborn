# VizAI Architecture Brief - Production Implementation

## System Overview

VizAI is a production-ready AI-powered data visualization generator that transforms raw CSV data into publication-quality, creative visualizations. The system operates within Supabase free tier constraints while maintaining high reliability and cost efficiency.

## Core Architecture

### Two-Function Pipeline

**Function A: `analyze-csv`**
- Pre-computes deterministic statistics (null rates, correlations, distributions)
- Single Gemini 2.5 Flash call for complete analysis + metaphor generation
- Structured JSON output with strict validation
- Generates 3 creative metaphors (Organic, Geometric, Flow categories)

**Function B: `generate-visualization`**
- Takes selected metaphor and generates complete D3 v7 code
- Single primary call with optional repair call for syntax issues
- Production-ready code with accessibility and interactions
- Fallback templates for guaranteed output

### AI Creative Intelligence Engine

The system doesn't use templates—it **invents new visual languages** for each dataset through:

- **Creative Inference Engine**: Analyzes data semantics and invents appropriate visual metaphors
- **Multi-Modal Imagination**: Combines data with contextual assets in novel ways  
- **Publication-Quality Creativity**: Generates professional-grade innovative visualizations
- **Unlimited Adaptability**: Pure creative intelligence, not predetermined templates

### Revolutionary Workflow

```
Raw Data → Creative Analysis → Visual Metaphor Generation → Asset Synthesis → Innovative Composition
```

## Technical Constraints & Strategy

### Supabase Free Tier Limits
- **Wall-clock**: 150s max per function
- **Memory**: 256MB
- **CPU**: ~2s per request (async I/O doesn't count)
- **Cold starts**: Minimized through efficient function design

### Gemini 2.5 Flash Integration
- **Cost**: $0.30/$2.50 per 1M tokens input/output
- **Rate**: 5 RPM free tier, higher for paid
- **Target**: 2 functions × 2-3 calls total = ~$0.006 per visualization
- **Features**: `response_schema` for guaranteed structured JSON

## Data Processing Pipeline

### Phase 1: Deep Creative Data Analysis

#### Semantic Data Intelligence
```
Raw CSV → Column Analysis → Entity Recognition → Semantic Mapping → Story Assessment
```

**Technical Implementation:**
- NLP Entity Recognition for companies, people, locations, concepts
- Statistical Pattern Detection for trends, outliers, correlations
- Contextual Domain Classification (finance, health, environment, etc.)
- Emotional Sentiment Analysis for appropriate visual tone

#### Cultural & Contextual Intelligence
- Global audience considerations and cultural sensitivity
- Industry-specific storytelling conventions
- Audience emotional journey mapping
- Competitive landscape analysis for visual differentiation

### Phase 2: Visual Metaphor Generation Engine

#### Metaphor Ideation Matrix
AI generates 15-20 diverse visual metaphors across categories:
- **Physical World Analogies** (objects, nature, architecture)
- **Human Experience Metaphors** (emotions, relationships, journeys)
- **Abstract Conceptual Models** (systems, processes, transformations)
- **Cultural Reference Points** (shared experiences, symbols)

#### Evaluation & Ranking
Each metaphor scored on:
1. Immediate Comprehension (0-10)
2. Emotional Impact (0-10)
3. Data Clarity (0-10)
4. Visual Innovation (0-10)
5. Cultural Sensitivity (0-10)
6. Technical Feasibility (0-10)
7. Shareability Factor (0-10)

### Phase 3: Multi-Modal Asset Intelligence

#### Custom Asset Generation
- **Custom Illustration Generation**: AI creates unique illustrations for each visualization
- **Contextual Background Creation**: Backgrounds that enhance story, not just decorate
- **Icon and Symbol Innovation**: Custom symbols matching data story
- **Animation and Interaction Design**: Movement supporting the narrative

### Phase 4: Innovative Composition Engine

#### Layout Innovation Algorithm
- **Grid Rebellion**: Break traditional chart layouts when it serves the story
- **Organic Layouts**: Data flows like natural forms when appropriate
- **Interactive Layers**: Progressive disclosure of information
- **Responsive Creativity**: Adapt creative vision to different display contexts

## Database Architecture

### Core Tables

```sql
-- Project tracking with token usage and progress
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

-- AI conversation context for resumability
CREATE TABLE ai_generation_context (
  project_id uuid REFERENCES projects(id) PRIMARY KEY,
  conversation_history jsonb DEFAULT '[]',
  compact_summary text,
  current_step text,
  step_results jsonb DEFAULT '{}' -- Stores analysis results, metaphors, etc.
);

-- Job queue for rate limiting and reliability
CREATE TABLE job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  function_name text NOT NULL CHECK (function_name IN ('analyze-csv','generate-visualization')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','running','failed','completed')),
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  scheduled_at timestamptz DEFAULT now()
);

-- Rate limiting enforcement
CREATE TABLE rate_limits (
  user_id uuid PRIMARY KEY,
  requests_this_minute int DEFAULT 0,
  daily_cost_usd decimal(10,4) DEFAULT 0,
  daily_reset_at timestamptz DEFAULT (current_date + interval '1 day')
);
```

## Error Handling & Recovery

### Comprehensive Failure Matrix

**Rate Limiting:**
- `RATE_LIMIT_RPM`: Queue with exponential backoff
- `RATE_LIMIT_BUDGET`: Pause until daily reset

**JSON Validation:**
- `UNPARSEABLE_JSON`: Single repair attempt, fallback templates
- Schema validation with AJV library
- Automatic syntax repair for common issues

**Service Failures:**
- `GEMINI_TIMEOUT`: Exponential backoff (2s, 4s, 8s) with max 3 retries
- `SUPABASE_TIMEOUT`: Resume from checkpoint with partial state recovery
- `PERMANENT_FAILURE`: Manual review required with admin notification

### Recovery Strategies

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

## API Schema Definitions

### Analysis Output Schema
```json
{
  "columnProfiles": {
    "additionalProperties": {
      "detectedType": "numerical|categorical|temporal|text",
      "nullPercentage": "number 0-100",
      "uniqueCount": "integer",
      "sampleValues": "array max 5 items",
      "qualityFlags": "array of strings"
    }
  },
  "patterns": {
    "type": "array max 10 items",
    "items": {
      "type": "string",
      "description": "string max 150 chars",
      "strength": "number 0-1",
      "columns": "array max 4 strings"
    }
  },
  "metaphors": {
    "minItems": 3, "maxItems": 3,
    "items": {
      "id": "string",
      "title": "string max 50 chars",
      "description": "string max 200 chars",
      "category": "Organic|Geometric|Flow",
      "innovationScore": "number 1-10",
      "colorPalette": "array 3-5 hex colors",
      "d3Strategy": "string max 100 chars"
    }
  }
}
```

### D3 Generation Schema
```json
{
  "completeD3Code": "string - production-ready D3 v7",
  "stylingCode": "string - CSS styling",
  "interactionCode": "string - hover/click handlers",
  "animationCode": "string - entrance animations",
  "accessibilityNotes": "string max 200 chars"
}
```

## Performance & Cost Optimization

### Token Management
- **Pre-computation**: All deterministic stats calculated locally
- **Context Pruning**: Maintain minimal conversation history
- **Structured Responses**: Force JSON schema to reduce token waste
- **Target Cost**: <$0.008 per visualization (2 functions × ~1700 tokens each)

### Rate Limiting Strategy
```javascript
async function checkRateLimit(userId, estimatedTokens) {
  // Check 5 RPM free tier limit
  // Verify daily budget ($0.50 default)
  // Reset counters at midnight
  // Queue jobs if limits exceeded
}
```

### Caching & Resumability
- Store analysis results in `ai_generation_context`
- Resume from any checkpoint after failures
- Reuse metaphors and analysis for similar datasets
- Minimize redundant API calls

## Quality Assurance

### Validation Pipeline
1. **JSON Schema Validation**: AJV with automatic repair
2. **Semantic Validation**: Verify correlations match computed values
3. **D3 Syntax Validation**: Parse with Acorn, check D3 patterns
4. **Accessibility Validation**: Scan for ARIA attributes and roles

### Fallback Systems
- **Template Metaphors**: Standard metaphors when generation fails
- **Minimal D3 Code**: Working visualization templates
- **Progressive Enhancement**: Core functionality first, enhancements second

## Telemetry & Monitoring

### Key Metrics
- **JSON validation success rate**: >98%
- **D3 syntax validation success rate**: >95%  
- **Average generation time**: <45 seconds
- **Cost per visualization**: <$0.008
- **Overall success rate**: >97%

### Health Monitoring
```javascript
async function runHealthCheck() {
  // Analyze last 24h metrics
  // Check success rates, latency, costs
  // Alert on degraded performance
  // Track token efficiency trends
}
```

## Deployment Strategy

### Phase 1: Foundation
- Database schema with constraints
- Rate limiting implementation
- JSON validation with repair
- Error handling framework

### Phase 2: Core Functions
- Deterministic statistics computation
- Gemini integration with structured responses
- D3 code generation and validation
- Fallback template system

### Phase 3: Resilience
- Job queue with exponential backoff
- Context management and resumability
- Comprehensive health monitoring
- Cost tracking and budget enforcement

### Phase 4: Production Ready
- Security and PII detection
- Accessibility compliance
- Performance testing at scale
- Monitoring dashboard and alerting

## Success Criteria

### Quality Metrics
- JSON validation success rate >98%
- User satisfaction with metaphors >4.2/5.0
- Visualization render success rate >99%

### Performance Metrics  
- Average generation time <45 seconds
- 95th percentile <90 seconds
- Memory usage <200MB peak
- Function cold start impact <5 seconds

### Cost & Reliability Metrics
- Average cost per visualization <$0.008
- Overall success rate >97%
- System uptime >99.5%
- Manual intervention required <3% of runs

## Innovation Impact

VizAI advances data visualization by:
- **Eliminating Template Constraints**: Pure creative AI generates unique visualizations
- **Contextual Intelligence**: Understanding data stories beyond just numbers  
- **Emotional Engagement**: Creating visualizations that make viewers care about data
- **Publication Quality**: Automatically generating professional-grade creative outputs
- **Accessibility**: Ensuring all visualizations are inclusive and barrier-free

The system represents a paradigm shift from template-based visualization to true creative intelligence, making publication-quality data storytelling accessible to everyone.
