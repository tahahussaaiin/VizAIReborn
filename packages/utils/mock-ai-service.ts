// Mock AI Service for Development
// This allows full development without Gemini API key

export interface AnalysisResult {
  columnProfiles: Record<string, any>;
  patterns: Array<{
    type: string;
    description: string;
    strength: number;
    columns: string[];
  }>;
  metaphors: Metaphor[];
  compactSummary: string;
}

export interface Metaphor {
  id: string;
  title: string;
  description: string;
  category: 'Organic' | 'Geometric' | 'Flow';
  innovationScore: number;
  colorPalette: string[];
  d3Strategy: string;
}

export class MockAIService {
  async analyzeCSV(csvData: string[][]): Promise<AnalysisResult> {
    const headers = csvData[0];
    const rowCount = csvData.length - 1;
    
    // Generate mock column profiles
    const columnProfiles: Record<string, any> = {};
    headers.forEach((header, index) => {
      const sampleValues = csvData.slice(1, 6).map(row => row[index]);
      const hasNumbers = sampleValues.some(v => !isNaN(Number(v)));
      
      columnProfiles[header] = {
        detectedType: hasNumbers ? 'numerical' : 'categorical',
        nullPercentage: Math.random() * 5,
        uniqueCount: Math.floor(Math.random() * rowCount),
        sampleValues: sampleValues.slice(0, 3),
        qualityFlags: []
      };
    });
    
    // Generate mock patterns
    const patterns = [
      {
        type: "correlation",
        description: "Strong positive correlation detected between columns",
        strength: 0.85,
        columns: headers.slice(0, 2)
      },
      {
        type: "trend",
        description: "Upward trend observed over time",
        strength: 0.72,
        columns: [headers[0]]
      },
      {
        type: "clustering",
        description: "Natural clusters found in data",
        strength: 0.68,
        columns: headers.slice(1, 3)
      }
    ];
    
    // Return mock analysis with creative metaphors
    return {
      columnProfiles,
      patterns,
      metaphors: this.generateMockMetaphors(headers, rowCount),
      compactSummary: `Dataset with ${rowCount} rows and ${headers.length} columns showing interesting patterns and correlations. Perfect for creative visualization.`
    };
  }
  
  private generateMockMetaphors(headers: string[], rowCount: number): Metaphor[] {
    return [
      {
        id: "organic-forest-1",
        title: "Data Forest",
        description: "Your data grows like trees in an enchanted forest, each branch representing connections",
        category: "Organic",
        innovationScore: 8.5,
        colorPalette: ["#2D5F3F", "#8FBC8F", "#F0E68C", "#DEB887", "#8B4513"],
        d3Strategy: "Force-directed tree layout with organic curves"
      },
      {
        id: "geometric-crystal-1",
        title: "Crystal Matrix",
        description: "Data points crystallize into geometric patterns, revealing hidden structures",
        category: "Geometric",
        innovationScore: 7.8,
        colorPalette: ["#4B0082", "#8A2BE2", "#9370DB", "#BA55D3", "#DDA0DD"],
        d3Strategy: "Hexagonal binning with tessellation"
      },
      {
        id: "flow-river-1",
        title: "Data Rivers",
        description: "Information flows like rivers converging and diverging through time",
        category: "Flow",
        innovationScore: 9.2,
        colorPalette: ["#0077BE", "#00A8E8", "#00C9FF", "#90E0EF", "#CAF0F8"],
        d3Strategy: "Sankey diagram with flowing animations"
      }
    ];
  }
  
  async generateD3Code(metaphor: Metaphor, csvData: string[][]): Promise<string> {
    const headers = csvData[0];
    const dataRows = csvData.slice(1, 11); // Use first 10 rows for mock
    
    // Generate mock D3 code based on metaphor category
    if (metaphor.category === 'Flow') {
      return this.generateFlowVisualization(metaphor, headers, dataRows);
    } else if (metaphor.category === 'Geometric') {
      return this.generateGeometricVisualization(metaphor, headers, dataRows);
    } else {
      return this.generateOrganicVisualization(metaphor, headers, dataRows);
    }
  }
  
  private generateFlowVisualization(metaphor: Metaphor, headers: string[], dataRows: string[][]): string {
    return `
// ${metaphor.title} - Flow Visualization
(function() {
  const width = 1200;
  const height = 800;
  const margin = {top: 60, right: 60, bottom: 60, left: 60};
  
  // Create SVG
  const svg = d3.select('#viz-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', \`0 0 \${width} \${height}\`);
  
  // Add gradient definitions
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', 'flow-gradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '0%');
  
  gradient.append('stop')
    .attr('offset', '0%')
    .style('stop-color', '${metaphor.colorPalette[0]}')
    .style('stop-opacity', 0.8);
  
  gradient.append('stop')
    .attr('offset', '100%')
    .style('stop-color', '${metaphor.colorPalette[2]}')
    .style('stop-opacity', 0.8);
  
  // Create flowing paths
  const flowData = [
    {x: 100, y: 400, width: 80, target: 500},
    {x: 300, y: 300, width: 60, target: 500},
    {x: 300, y: 500, width: 40, target: 500},
  ];
  
  const flowPaths = svg.selectAll('.flow-path')
    .data(flowData)
    .enter()
    .append('path')
    .attr('class', 'flow-path')
    .attr('d', d => {
      const midX = (d.x + d.target) / 2;
      return \`M\${d.x},\${d.y} Q\${midX},\${d.y - 50} \${d.target},400\`;
    })
    .attr('fill', 'none')
    .attr('stroke', 'url(#flow-gradient)')
    .attr('stroke-width', d => d.width)
    .attr('opacity', 0)
    .attr('stroke-linecap', 'round');
  
  // Add labels
  svg.selectAll('.label')
    .data(headers.slice(0, 3))
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', (d, i) => 100 + i * 200)
    .attr('y', (d, i) => 350 + i * 50)
    .attr('text-anchor', 'middle')
    .style('font-family', 'Inter, sans-serif')
    .style('font-size', '14px')
    .style('fill', '#333')
    .text(d => d);
  
  // Animate flows
  flowPaths.transition()
    .duration(1500)
    .delay((d, i) => i * 200)
    .attr('opacity', 0.7)
    .attr('stroke-dasharray', function() {
      const length = this.getTotalLength();
      return length + ' ' + length;
    })
    .attr('stroke-dashoffset', function() {
      return this.getTotalLength();
    })
    .transition()
    .duration(2000)
    .attr('stroke-dashoffset', 0);
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-family', 'Plus Jakarta Sans, sans-serif')
    .style('font-size', '24px')
    .style('font-weight', 'bold')
    .style('fill', '${metaphor.colorPalette[0]}')
    .text('${metaphor.title}');
})();
    `;
  }
  
  private generateGeometricVisualization(metaphor: Metaphor, headers: string[], dataRows: string[][]): string {
    return `
// ${metaphor.title} - Geometric Visualization
(function() {
  const width = 1200;
  const height = 800;
  const margin = {top: 60, right: 60, bottom: 60, left: 60};
  
  const svg = d3.select('#viz-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Create hexagonal pattern
  const hexRadius = 30;
  const hexData = d3.range(20).map(i => ({
    x: 200 + (i % 5) * hexRadius * 2 * Math.sqrt(3)/2,
    y: 200 + Math.floor(i / 5) * hexRadius * 3/2,
    value: Math.random() * 100,
    label: headers[i % headers.length]
  }));
  
  const hexagon = d => {
    const angle = Math.PI / 3;
    return d3.range(6).map(i => [
      d.x + hexRadius * Math.cos(angle * i),
      d.y + hexRadius * Math.sin(angle * i)
    ]).join(' ');
  };
  
  // Color scale
  const colorScale = d3.scaleLinear()
    .domain([0, 50, 100])
    .range(['${metaphor.colorPalette[0]}', '${metaphor.colorPalette[2]}', '${metaphor.colorPalette[4]}']);
  
  // Draw hexagons
  const hexagons = svg.selectAll('.hexagon')
    .data(hexData)
    .enter()
    .append('polygon')
    .attr('class', 'hexagon')
    .attr('points', hexagon)
    .attr('fill', d => colorScale(d.value))
    .attr('stroke', '${metaphor.colorPalette[1]}')
    .attr('stroke-width', 2)
    .attr('opacity', 0);
  
  // Animate appearance
  hexagons.transition()
    .duration(1000)
    .delay((d, i) => i * 50)
    .attr('opacity', 0.8)
    .attr('transform', d => \`scale(1) translate(0, 0)\`)
    .transition()
    .duration(500)
    .attr('transform', d => \`scale(1.05) translate(-\${d.x * 0.05}, -\${d.y * 0.05})\`)
    .transition()
    .duration(500)
    .attr('transform', d => \`scale(1) translate(0, 0)\`);
  
  // Add hover effect
  hexagons.on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
        .attr('transform', \`scale(1.1) translate(-\${d.x * 0.1}, -\${d.y * 0.1})\`);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.8)
        .attr('transform', 'scale(1) translate(0, 0)');
    });
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-family', 'Plus Jakarta Sans, sans-serif')
    .style('font-size', '24px')
    .style('font-weight', 'bold')
    .style('fill', '${metaphor.colorPalette[0]}')
    .text('${metaphor.title}');
})();
    `;
  }
  
  private generateOrganicVisualization(metaphor: Metaphor, headers: string[], dataRows: string[][]): string {
    return `
// ${metaphor.title} - Organic Visualization
(function() {
  const width = 1200;
  const height = 800;
  const margin = {top: 60, right: 60, bottom: 60, left: 60};
  
  const svg = d3.select('#viz-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Create tree-like structure
  const treeData = {
    name: "Root",
    value: 100,
    children: headers.slice(0, 3).map((h, i) => ({
      name: h,
      value: 50 + Math.random() * 50,
      children: dataRows.slice(0, 3).map((row, j) => ({
        name: row[i] || 'Node',
        value: 10 + Math.random() * 30
      }))
    }))
  };
  
  const root = d3.hierarchy(treeData)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
  
  const treeLayout = d3.tree()
    .size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
  
  treeLayout(root);
  
  const g = svg.append('g')
    .attr('transform', \`translate(\${margin.left},\${margin.top})\`);
  
  // Create organic curved links
  const link = g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d => {
      const sx = d.source.x;
      const sy = d.source.y;
      const tx = d.target.x;
      const ty = d.target.y;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      return \`M\${sx},\${sy} Q\${mx},\${sy} \${mx},\${my} T\${tx},\${ty}\`;
    })
    .attr('fill', 'none')
    .attr('stroke', '${metaphor.colorPalette[1]}')
    .attr('stroke-width', 2)
    .attr('opacity', 0);
  
  // Create nodes
  const node = g.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => \`translate(\${d.x},\${d.y})\`);
  
  node.append('circle')
    .attr('r', d => Math.sqrt(d.value) * 2)
    .attr('fill', (d, i) => metaphor.colorPalette[i % metaphor.colorPalette.length])
    .attr('opacity', 0)
    .attr('stroke', '${metaphor.colorPalette[0]}')
    .attr('stroke-width', 1);
  
  // Animate tree growth
  link.transition()
    .duration(1500)
    .delay((d, i) => i * 100)
    .attr('opacity', 0.6);
  
  node.selectAll('circle')
    .transition()
    .duration(1000)
    .delay((d, i) => i * 50)
    .attr('opacity', 0.8)
    .attr('r', d => Math.sqrt(d.value) * 2);
  
  // Add labels
  node.append('text')
    .attr('dy', 3)
    .attr('x', d => d.children ? -10 : 10)
    .style('text-anchor', d => d.children ? 'end' : 'start')
    .style('font-size', '12px')
    .style('fill', '#333')
    .text(d => d.data.name)
    .attr('opacity', 0)
    .transition()
    .duration(1000)
    .delay(1500)
    .attr('opacity', 1);
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-family', 'Plus Jakarta Sans, sans-serif')
    .style('font-size', '24px')
    .style('font-weight', 'bold')
    .style('fill', '${metaphor.colorPalette[0]}')
    .text('${metaphor.title}');
})();
    `;
  }
}