# VizAI Component Library & UI Specifications

## Core Component System

### Design Tokens & Variables
```typescript
// Design tokens for consistent theming
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#2563eb',
      600: '#1d4ed8',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#faf5ff',
      500: '#7c3aed',
      600: '#6d28d9'
    },
    accent: {
      50: '#ecfeff',
      500: '#06b6d4',
      600: '#0891b2'
    },
    success: {
      50: '#ecfdf5',
      500: '#10b981',
      600: '#059669'
    },
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      500: '#64748b',
      900: '#0f172a'
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }
  },
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
    20: '5rem'
  },
  borderRadius: {
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  }
} as const;
```

---

## Button Component System

### Button Variants & Specifications
```typescript
// Button component with comprehensive variants
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// CSS classes for each variant
const buttonVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200',
  outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50',
  ghost: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  destructive: 'bg-red-500 hover:bg-red-600 text-white'
};

const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
};
```

### Button Usage Examples
```jsx
// Primary action buttons
<Button variant="primary" size="lg" icon={<Upload />}>
  Upload CSV File
</Button>

// Secondary actions  
<Button variant="secondary" size="md">
  Save as Draft
</Button>

// Destructive actions
<Button variant="destructive" size="sm">
  Delete Project
</Button>

// Loading state
<Button variant="primary" loading={true}>
  Generating Visualization...
</Button>

// Icon-only buttons
<Button variant="ghost" size="sm" icon={<Settings />} />
```

---

## Card Component System

### Card Variants
```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Card styling variants
const cardVariants = {
  default: 'bg-white border border-gray-200 rounded-xl',
  elevated: 'bg-white shadow-lg rounded-xl border-0',
  outlined: 'bg-white border-2 border-gray-300 rounded-xl',
  glass: 'bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl'
};

// Interactive states
const cardInteractive = {
  hover: 'transition-all duration-200 hover:shadow-md hover:-translate-y-1',
  clickable: 'cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-98'
};
```

### Specialized Card Components
```jsx
// Project Card - for dashboard project grid
<ProjectCard
  title="Sales Data Q4 2024"
  description="Regional sales performance analysis"
  lastModified="2 hours ago"
  thumbnail="/path/to/thumbnail.jpg"
  status="completed"
  onEdit={() => {}}
  onDelete={() => {}}
  onDuplicate={() => {}}
/>

// Visualization Preview Card - for gallery
<VizPreviewCard
  title="Global Internet Speeds"
  author="John Doe"
  likes={24}
  views={156} 
  thumbnail="/path/to/viz.jpg"
  tags={['technology', 'global', 'infrastructure']}
  onClick={() => {}}
/>

// Metaphor Selection Card - for creative metaphor choice
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

---

## Form Components

### Input Component System
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

// Input variants and states
const inputClasses = {
  base: 'w-full rounded-lg border px-3 py-2 text-base transition-colors',
  default: 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
  error: 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100',
  success: 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-100',
  disabled: 'bg-gray-50 text-gray-500 cursor-not-allowed'
};
```

### File Upload Component
```jsx
// Advanced file upload with drag-and-drop
<FileUpload
  accept=".csv"
  maxSize={10 * 1024 * 1024} // 10MB
  multiple={false}
  onFileSelect={(file) => handleFileUpload(file)}
  onError={(error) => setError(error)}
  className="min-h-64"
>
  <div className="text-center">
    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Drop your CSV file here
    </h3>
    <p className="text-gray-600 mb-4">
      or click to browse your files
    </p>
    <Button variant="outline">Choose File</Button>
  </div>
</FileUpload>
```

---

## Data Display Components

### Data Table Component
```jsx
// Sortable, filterable data table for CSV preview
<DataTable
  data={csvData}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'value', label: 'Value', sortable: true, type: 'number' },
    { key: 'category', label: 'Category', filterable: true }
  ]}
  pagination={true}
  pageSize={10}
  maxHeight="400px"
  loading={false}
  onSort={(column, direction) => {}}
  onFilter={(filters) => {}}
/>
```

### Statistics Display Component
```jsx
// Show data insights and statistics
<StatsGrid>
  <StatCard
    title="Total Rows"
    value="1,247"
    trend="+12%"
    trendDirection="up"
    icon={<BarChart />}
  />
  <StatCard
    title="Columns"
    value="8"
    description="All validated"
    icon={<Grid />}
  />
  <StatCard
    title="Missing Values"
    value="3.2%"
    trend="-0.8%"
    trendDirection="down"
    icon={<AlertCircle />}
  />
</StatsGrid>
```

---

## Navigation Components

### Header Navigation
```jsx
// Main application header
<Header>
  <HeaderSection position="left">
    <Logo />
    <Navigation>
      <NavItem href="/dashboard" active>Dashboard</NavItem>
      <NavItem href="/create">Create</NavItem>
      <NavItem href="/gallery">Gallery</NavItem>
    </Navigation>
  </HeaderSection>
  
  <HeaderSection position="right">
    <SearchBar placeholder="Search visualizations..." />
    <NotificationButton count={3} />
    <UserMenu user={currentUser} />
  </HeaderSection>
</Header>
```

### Sidebar Navigation
```jsx
// Collapsible sidebar for dashboard
<Sidebar collapsed={sidebarCollapsed}>
  <SidebarSection title="Projects">
    <SidebarItem icon={<FolderIcon />} active>
      All Projects
    </SidebarItem>
    <SidebarItem icon={<StarIcon />}>
      Favorites
    </SidebarItem>
    <SidebarItem icon={<ClockIcon />}>
      Recent
    </SidebarItem>
  </SidebarSection>
  
  <SidebarSection title="Account">
    <SidebarItem icon={<SettingsIcon />}>
      Settings
    </SidebarItem>
    <SidebarItem icon={<CreditCardIcon />}>
      Billing
    </SidebarItem>
  </SidebarSection>
</Sidebar>
```

---

## Modal & Overlay Components

### Modal System
```jsx
// Reusable modal component
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  size="lg"
  closeOnOverlayClick={true}
  closeOnEscapeKey={true}
>
  <ModalHeader>
    <ModalTitle>Delete Project</ModalTitle>
    <ModalCloseButton />
  </ModalHeader>
  
  <ModalBody>
    <p>Are you sure you want to delete this project? This action cannot be undone.</p>
  </ModalBody>
  
  <ModalFooter>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Cancel
    </Button>
    <Button variant="destructive" onClick={handleDelete}>
      Delete Project
    </Button>
  </ModalFooter>
</Modal>
```

### Drawer Component
```jsx
// Slide-out drawer for settings/customization
<Drawer
  isOpen={showCustomization}
  onClose={() => setShowCustomization(false)}
  position="right"
  size="lg"
>
  <DrawerHeader>
    <DrawerTitle>Customize Visualization</DrawerTitle>
  </DrawerHeader>
  
  <DrawerBody>
    <CustomizationPanel
      visualization={currentViz}
      onChange={handleCustomizationChange}
    />
  </DrawerBody>
</Drawer>
```

---

## Feedback & Status Components

### Toast Notification System
```jsx
// Toast notifications for user feedback
<ToastProvider position="top-right">
  <Toast
    type="success"
    title="Visualization Generated!"
    description="Your visualization is ready for download."
    action={
      <Button size="sm" variant="outline">
        View
      </Button>
    }
    duration={5000}
    closeable={true}
  />
</ToastProvider>
```

### Loading States
```jsx
// Various loading state components
<LoadingSpinner size="lg" />

<LoadingSkeleton className="w-full h-64 rounded-lg" />

<ProgressBar 
  value={65} 
  max={100}
  label="Generating assets..."
  showPercentage={true}
  color="primary"
/>

<StepProgress
  steps={[
    { label: 'Upload Data', status: 'completed' },
    { label: 'Analyze', status: 'completed' },
    { label: 'Generate', status: 'current' },
    { label: 'Customize', status: 'pending' }
  ]}
  currentStep={2}
/>
```

### Alert Components
```jsx
// Alert banners for important information
<Alert variant="info" dismissible>
  <AlertIcon />
  <AlertTitle>New Feature Available</AlertTitle>
  <AlertDescription>
    Try our new AI chat interface for natural language visualization editing.
  </AlertDescription>
  <AlertAction>
    <Button size="sm" variant="outline">Learn More</Button>
  </AlertAction>
</Alert>
```

---

## Layout Components

### Grid System
```jsx
// Responsive grid layouts
<Grid cols={3} gap={6} responsive={{ sm: 1, md: 2, lg: 3 }}>
  <GridItem>
    <ProjectCard {...project1} />
  </GridItem>
  <GridItem>
    <ProjectCard {...project2} />
  </GridItem>
  <GridItem>
    <ProjectCard {...project3} />
  </GridItem>
</Grid>

// Masonry layout for gallery
<Masonry
  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  gap={24}
>
  {visualizations.map(viz => (
    <VizPreviewCard key={viz.id} {...viz} />
  ))}
</Masonry>
```

### Container System
```jsx
// Responsive containers with max widths
<Container size="xl" centered padding="lg">
  <Section spacing="xl">
    <SectionHeader>
      <SectionTitle>Your Projects</SectionTitle>
      <SectionActions>
        <Button variant="primary" icon={<Plus />}>
          New Project
        </Button>
      </SectionActions>
    </SectionHeader>
    
    <SectionContent>
      <ProjectGrid projects={projects} />
    </SectionContent>
  </Section>
</Container>
```

---

## Specialized VizAI Components

### Visualization Preview
```jsx
// Interactive visualization preview component
<VizPreview
  visualization={currentViz}
  interactive={true}
  showControls={true}
  aspectRatio="16:9"
  onDataPointHover={(point) => setTooltip(point)}
  onExport={(format) => handleExport(format)}
  className="border rounded-xl shadow-sm"
/>
```

### AI Chat Interface
```jsx
// Conversational AI interface for visualization editing
<AIChatInterface
  messages={chatMessages}
  onSendMessage={handleSendMessage}
  suggestions={[
    'Make the colors warmer',
    'Emphasize the highest values',
    'Add a subtle animation'
  ]}
  isTyping={aiIsTyping}
  context={{
    visualization: currentViz,
    data: vizData
  }}
/>
```

### Metaphor Comparison
```jsx
// Side-by-side metaphor comparison tool
<MetaphorComparison
  metaphors={[selectedMetaphor1, selectedMetaphor2]}
  criteria={['Innovation', 'Clarity', 'Impact', 'Feasibility']}
  onSelect={(metaphor) => setSelectedMetaphor(metaphor)}
  showScores={true}
  showPreview={true}
/>
```

This component library provides a comprehensive foundation for building VizAI with consistent, professional UI components that support the creative AI workflow while maintaining excellent user experience standards.