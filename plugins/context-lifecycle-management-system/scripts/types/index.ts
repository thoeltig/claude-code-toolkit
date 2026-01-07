export type ProjectType = "web_app" | "api" | "mobile_app" | "library" | "data_pipeline" | "cli_tool" | "data_science" | "embedded" | "unknown";
export type Layer = "domain" | "foundation" | "active";
export type FileType = "regulatory" | "decision" | "pattern" | "workflow" | "task" | "experiment" | "documentation" | "api_spec";

export interface ContextIndex {
  version: string;
  created: string;
  updated: string;
  project: {
    type: ProjectType;
    domain: string;
    tech_stack: {
      frontend?: string[];
      backend?: string[];
      database?: string[];
      infrastructure?: string[];
    };
  };
  stats: {
    total_files: number;
    total_tokens: number;
    by_layer: {
      domain: number;
      foundation: number;
      active: number;
    };
  };
  files: {
    [filename: string]: FileMetadata;
  };
}

export interface FileMetadata {
  layer: Layer;
  title: string;
  summary: string;
  tokens: number;
  type: FileType;
  keywords: string[];
  tags?: string[];
  nodes?: string[];
  updated: string;
  git_commit?: string;
  related_files?: string[];
  confidence?: number;
}

export interface ContextConfig {
  version: string;
  project: {
    root: string;
    type: ProjectType;
    domain: string;
  };
  lifecycle: {
    domain_review_interval: string;
    foundation_review_interval: string;
    active_expiry: string;
  };
  team: {
    sync_enabled: boolean;
    strategy: "git" | "filesystem" | "database";
    remote?: string;
  };
  privacy: {
    sanitize: boolean;
    patterns: string[];
  };
}

export interface ContextFile {
  id: string;
  title: string;
  category: Layer;
  type: FileType;
  created: string;
  updated: string;
  git_commit?: string;
  author?: string;
  content: DomainContent | FoundationContent | ActiveContent;
  metadata: {
    tokens: number;
    keywords: string[];
    related_files: string[];
    confidence?: number;
  };
}

export interface DomainContent {
  summary: string;
  full_text?: string;
  source?: string;
  nodes?: Record<string, NodeContent>;
}

export interface FoundationContent {
  decision: string;
  rationale: string;
  alternatives_considered?: string[];
  trade_offs?: string;
  implementation_details?: string;
  related_code_files?: string[];
  status: "proposed" | "approved" | "implemented" | "deprecated";
  nodes?: Record<string, NodeContent>;
}

export interface ActiveContent {
  description: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  sprint?: string;
  milestone?: string;
  blockers?: string[];
  related_tasks?: string[];
  expires?: string;
  nodes?: Record<string, NodeContent>;
}

export interface NodeContent {
  name: string;
  description: string;
  content: string;
  tokens: number;
}

export interface DirectoryInfo {
  type: 'directory';
  fullPath: string;
  subdirs: string[];
  files: string[];
  fileCount: number;
  depth: number;
}

export interface FileInfo {
  path: string;
  ext: string;
  size: number;
  depth: number;
}

export interface RawProjectData {
  structure: {
    [dirPath: string]: DirectoryInfo;
  };
  files: {
    [filePath: string]: FileInfo;
  };
  projectStats: {
    totalFiles: number;
    totalDirs: number;
    maxDepth: number;
    fileTypes: string[];
  };
}

export interface ProjectAnalysis {
  type: ProjectType;
  domain: string;
  tech_stack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    infrastructure?: string[];
  };
  confidence: {
    type: number;
    domain: number;
  };
  keywords: string[];
  initial_categories: {
    domain: string[];
    foundation: string[];
  };
}

export interface QueryResult {
  file: string;
  layer: Layer;
  title: string;
  summary: string;
  tokens: number;
  nodes: string[];
  relevance?: number;
}

export interface CategorizationResult {
  layer: Layer;
  confidence: number;
  reasoning: string;
  suggested_filename: string;
  keywords: string[];
  should_index: boolean;
  estimated_tokens: number;
  nodes?: Array<{
    name: string;
    description: string;
    estimated_tokens: number;
  }>;
}