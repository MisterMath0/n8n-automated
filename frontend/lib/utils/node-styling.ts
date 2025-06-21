import {
  // Core & Basic
  Zap, Code, Function, GitMerge, Filter, Clock, Play, Square, Settings,
  // Communication & Messaging
  Mail, MessageSquare, MessageCircle, Phone, Video, Send,
  // Web & APIs
  Globe, Webhook, Cloud, Download, Upload, ExternalLink,
  // Data & Storage
  Database, HardDrive, FileText, FolderOpen, Archive,
  // Social & Marketing
  Share2, Users, Heart, Star, TrendingUp, BarChart3,
  // E-commerce & Payment
  ShoppingCart, CreditCard, Package, Truck, DollarSign,
  // Productivity & Office
  Calendar, Clock4, CheckSquare, Clipboard, FileSpreadsheet,
  // Development & Tools
  Terminal, Cpu, Server, Wrench, Bug, Activity,
  // Media & Content
  Image, Music, Film, Camera, Mic, FileImage,
  // Analytics & Monitoring
  PieChart, LineChart, AlertCircle,
  // Security & Auth
  Shield, Lock, Key, UserCheck, Eye, Fingerprint,
  // Geographic & Location
  MapPin, Navigation, Compass, Map,
  type LucideIcon
} from 'lucide-react';

// Comprehensive N8N Node Type to Icon Mapping
const N8N_NODE_ICONS: Record<string, LucideIcon> = {
  // === TRIGGERS ===
  'n8n-nodes-base.webhook': Webhook,
  'n8n-nodes-base.manualTrigger': Play,
  'n8n-nodes-base.cronTrigger': Clock,
  'n8n-nodes-base.scheduleTrigger': Clock4,
  'n8n-nodes-base.startTrigger': Play,
  'n8n-nodes-base.errorTrigger': AlertCircle,
  'n8n-nodes-base.intervalTrigger': Clock,

  // === CORE NODES ===
  'n8n-nodes-base.function': Code,
  'n8n-nodes-base.functionItem': Function,
  'n8n-nodes-base.code': Terminal,
  'n8n-nodes-base.if': GitMerge,
  'n8n-nodes-base.switch': GitMerge,
  'n8n-nodes-base.filter': Filter,
  'n8n-nodes-base.set': Settings,
  'n8n-nodes-base.merge': GitMerge,
  'n8n-nodes-base.sort': BarChart3,
  'n8n-nodes-base.removeDuplicates': Filter,
  'n8n-nodes-base.limit': Square,
  'n8n-nodes-base.splitInBatches': Archive,
  'n8n-nodes-base.itemLists': Clipboard,
  'n8n-nodes-base.dateTime': Calendar,
  'n8n-nodes-base.editImage': Image,

  // === HTTP & API ===
  'n8n-nodes-base.httpRequest': Globe,
  'n8n-nodes-base.graphql': Code,
  'n8n-nodes-base.respondToWebhook': Send,
  'n8n-nodes-base.html': FileText,
  'n8n-nodes-base.xml': FileText,
  'n8n-nodes-base.executeWorkflow': Zap,
  'n8n-nodes-base.wait': Clock,

  // === EMAIL & COMMUNICATION ===
  'n8n-nodes-base.gmail': Mail,
  'n8n-nodes-base.emailSend': Send,
  'n8n-nodes-base.emailReadImap': Mail,
  'n8n-nodes-base.microsoftOutlook': Mail,
  'n8n-nodes-base.awsSesv2': Mail,
  'n8n-nodes-base.sendGrid': Mail,
  'n8n-nodes-base.mailchimp': Mail,
  'n8n-nodes-base.mailgun': Mail,
  'n8n-nodes-base.smtp': Mail,

  // === MESSAGING PLATFORMS ===
  'n8n-nodes-base.slack': MessageSquare,
  'n8n-nodes-base.discord': MessageCircle,
  'n8n-nodes-base.telegram': MessageCircle,
  'n8n-nodes-base.whatsApp': MessageCircle,
  'n8n-nodes-base.mattermost': MessageSquare,
  'n8n-nodes-base.rocketchat': MessageSquare,
  'n8n-nodes-base.microsoftTeams': MessageSquare,
  'n8n-nodes-base.twilio': Phone,
  'n8n-nodes-base.sms': Phone,

  // === SOCIAL MEDIA ===
  'n8n-nodes-base.twitter': Share2,
  'n8n-nodes-base.facebook': Share2,
  'n8n-nodes-base.instagram': Camera,
  'n8n-nodes-base.linkedin': Users,
  'n8n-nodes-base.youtube': Film,
  'n8n-nodes-base.reddit': MessageCircle,
  'n8n-nodes-base.pinterest': Image,
  'n8n-nodes-base.tiktok': Music,

  // === DATABASES ===
  'n8n-nodes-base.postgres': Database,
  'n8n-nodes-base.mysql': Database,
  'n8n-nodes-base.mongodb': Database,
  'n8n-nodes-base.redis': Database,
  'n8n-nodes-base.microsoftSql': Database,
  'n8n-nodes-base.sqlite': Database,
  'n8n-nodes-base.questDb': Database,
  'n8n-nodes-base.supabase': Database,
  'n8n-nodes-base.planetScale': Database,

  // === FILE STORAGE & CLOUD ===
  'n8n-nodes-base.googleDrive': Cloud,
  'n8n-nodes-base.dropbox': Cloud,
  'n8n-nodes-base.awsS3': Cloud,
  'n8n-nodes-base.oneDrive': Cloud,
  'n8n-nodes-base.box': Archive,
  'n8n-nodes-base.nextCloud': Cloud,
  'n8n-nodes-base.ftp': Upload,
  'n8n-nodes-base.sftp': Upload,

  // === SPREADSHEETS & DOCUMENTS ===
  'n8n-nodes-base.googleSheets': FileSpreadsheet,
  'n8n-nodes-base.microsoftExcel': FileSpreadsheet,
  'n8n-nodes-base.airtable': FileSpreadsheet,
  'n8n-nodes-base.notion': FileText,
  'n8n-nodes-base.googleDocs': FileText,
  'n8n-nodes-base.coda': FileText,
  'n8n-nodes-base.baserow': Database,

  // === CRM & SALES ===
  'n8n-nodes-base.salesforce': Users,
  'n8n-nodes-base.hubspot': TrendingUp,
  'n8n-nodes-base.pipedrive': TrendingUp,
  'n8n-nodes-base.zendesk': UserCheck,
  'n8n-nodes-base.freshdesk': UserCheck,
  'n8n-nodes-base.intercom': MessageCircle,
  'n8n-nodes-base.drift': MessageCircle,

  // === PAYMENT & ECOMMERCE ===
  'n8n-nodes-base.stripe': CreditCard,
  'n8n-nodes-base.paypal': DollarSign,
  'n8n-nodes-base.shopify': ShoppingCart,
  'n8n-nodes-base.wooCommerce': ShoppingCart,
  'n8n-nodes-base.square': CreditCard,

  // === MARKETING & ANALYTICS ===
  'n8n-nodes-base.googleAnalytics': BarChart3,
  'n8n-nodes-base.googleAds': TrendingUp,
  'n8n-nodes-base.facebookAds': Share2,
  'n8n-nodes-base.mixpanel': PieChart,
  'n8n-nodes-base.segment': Activity,
  'n8n-nodes-base.amplitude': LineChart,

  // === PROJECT MANAGEMENT ===
  'n8n-nodes-base.trello': CheckSquare,
  'n8n-nodes-base.asana': CheckSquare,
  'n8n-nodes-base.monday': Calendar,
  'n8n-nodes-base.jira': Bug,
  'n8n-nodes-base.github': Terminal,
  'n8n-nodes-base.gitlab': Terminal,
  'n8n-nodes-base.bitbucket': Terminal,

  // === AUTOMATION & PRODUCTIVITY ===
  'n8n-nodes-base.zapier': Zap,
  'n8n-nodes-base.ifttt': Zap,
  'n8n-nodes-base.microsoft365': FileText,
  'n8n-nodes-base.googleCalendar': Calendar,
  'n8n-nodes-base.googleContacts': Users,

  // === AI & ML ===
  'n8n-nodes-base.openAi': Cpu,
  'n8n-nodes-base.anthropic': Cpu,
  'n8n-nodes-base.cohere': Cpu,
  'n8n-nodes-base.huggingFace': Cpu,

  // === MONITORING & LOGGING ===
  'n8n-nodes-base.datadog': Activity,
  'n8n-nodes-base.newRelic': Activity,
  'n8n-nodes-base.splunk': Activity,
  'n8n-nodes-base.elastic': Activity,

  // === MAPS & LOCATION ===
  'n8n-nodes-base.googleMaps': Map,
  'n8n-nodes-base.mapbox': Map,
  'n8n-nodes-base.geocoding': MapPin,

  // === SECURITY ===
  'n8n-nodes-base.onePassword': Lock,
  'n8n-nodes-base.bitwarden': Shield,
  'n8n-nodes-base.lastPass': Key,

  // === FALLBACK PATTERNS ===
  // Generic patterns for unknown nodes
  'webhook': Webhook,
  'trigger': Play,
  'schedule': Clock,
  'email': Mail,
  'slack': MessageSquare,
  'http': Globe,
  'api': ExternalLink,
  'database': Database,
  'function': Code,
  'code': Terminal,
  'if': GitMerge,
  'switch': GitMerge,
  'filter': Filter,
  'set': Settings,
  'merge': GitMerge,
  'google': Cloud,
  'microsoft': Cloud,
  'aws': Cloud,
  'default': Zap,
};

// Enhanced color mapping with more categories and better gradients
const COLOR_GRADIENTS: Record<string, string> = {
  // Triggers - Purple/Violet theme
  trigger: 'from-violet-500/30 to-purple-600/20 border-violet-400/40',
  
  // Core Logic - Cyan/Blue theme  
  logic: 'from-cyan-400/30 to-blue-500/20 border-cyan-400/40',
  
  // Communication - Blue/Indigo theme
  communication: 'from-blue-400/30 to-indigo-500/20 border-blue-400/40',
  
  // Data & Storage - Green/Emerald theme
  data: 'from-emerald-400/30 to-green-500/20 border-emerald-400/40',
  
  // Web & API - Orange/Amber theme
  web: 'from-orange-400/30 to-amber-500/20 border-orange-400/40',
  
  // Social & Marketing - Pink/Rose theme
  social: 'from-pink-400/30 to-rose-500/20 border-pink-400/40',
  
  // Payment & Ecommerce - Yellow/Gold theme
  commerce: 'from-yellow-400/30 to-amber-500/20 border-yellow-400/40',
  
  // Development & Tools - Gray/Slate theme
  development: 'from-slate-400/30 to-gray-500/20 border-slate-400/40',
  
  // Analytics & Monitoring - Teal/Cyan theme
  analytics: 'from-teal-400/30 to-cyan-500/20 border-teal-400/40',
  
  // Security - Red/Crimson theme
  security: 'from-red-400/30 to-rose-500/20 border-red-400/40',
  
  // AI & ML - Purple/Indigo theme
  ai: 'from-indigo-400/30 to-purple-500/20 border-indigo-400/40',
  
  // Default - White/Gray theme
  default: 'from-white/25 to-gray-300/15 border-white/30',
};

// Enhanced category mapping with more specific categorizations
const NODE_CATEGORIES: Record<string, string> = {
  // Triggers
  'webhook': 'trigger',
  'trigger': 'trigger',
  'manual': 'trigger',
  'cron': 'trigger',
  'schedule': 'trigger',
  'interval': 'trigger',
  'error': 'trigger',
  'start': 'trigger',

  // Core Logic
  'function': 'logic',
  'code': 'logic',
  'if': 'logic',
  'switch': 'logic',
  'filter': 'logic',
  'merge': 'logic',
  'sort': 'logic',
  'set': 'logic',
  'split': 'logic',
  'limit': 'logic',
  'duplicate': 'logic',
  'item': 'logic',
  'datetime': 'logic',
  'wait': 'logic',

  // Communication
  'email': 'communication',
  'gmail': 'communication',
  'outlook': 'communication',
  'mailchimp': 'communication',
  'sendgrid': 'communication',
  'mailgun': 'communication',
  'smtp': 'communication',
  'slack': 'communication',
  'discord': 'communication',
  'telegram': 'communication',
  'whatsapp': 'communication',
  'teams': 'communication',
  'mattermost': 'communication',
  'rocketchat': 'communication',
  'twilio': 'communication',
  'sms': 'communication',

  // Data & Storage
  'postgres': 'data',
  'mysql': 'data',
  'mongodb': 'data',
  'redis': 'data',
  'sql': 'data',
  'database': 'data',
  'sqlite': 'data',
  'supabase': 'data',
  'planetscale': 'data',
  'sheets': 'data',
  'excel': 'data',
  'airtable': 'data',
  'notion': 'data',
  'docs': 'data',
  'coda': 'data',
  'baserow': 'data',
  'drive': 'data',
  'dropbox': 'data',
  's3': 'data',
  'onedrive': 'data',
  'box': 'data',
  'nextcloud': 'data',
  'ftp': 'data',
  'sftp': 'data',

  // Web & API
  'http': 'web',
  'api': 'web',
  'graphql': 'web',
  'respond': 'web',
  'html': 'web',
  'xml': 'web',
  'workflow': 'web',

  // Social & Marketing
  'twitter': 'social',
  'facebook': 'social',
  'instagram': 'social',
  'linkedin': 'social',
  'youtube': 'social',
  'reddit': 'social',
  'pinterest': 'social',
  'tiktok': 'social',
  'ads': 'social',
  'analytics': 'analytics',
  'mixpanel': 'analytics',
  'segment': 'analytics',
  'amplitude': 'analytics',

  // Commerce & Payment
  'stripe': 'commerce',
  'paypal': 'commerce',
  'shopify': 'commerce',
  'woocommerce': 'commerce',
  'square': 'commerce',
  'commerce': 'commerce',
  'payment': 'commerce',

  // Development & Tools
  'github': 'development',
  'gitlab': 'development',
  'bitbucket': 'development',
  'jira': 'development',
  'trello': 'development',
  'asana': 'development',
  'monday': 'development',

  // AI & ML
  'openai': 'ai',
  'anthropic': 'ai',
  'cohere': 'ai',
  'huggingface': 'ai',
  'ai': 'ai',

  // Security
  'password': 'security',
  'bitwarden': 'security',
  'lastpass': 'security',
  'security': 'security',
  'auth': 'security',

  // Monitoring
  'datadog': 'analytics',
  'newrelic': 'analytics',
  'splunk': 'analytics',
  'elastic': 'analytics',
  'monitoring': 'analytics',
};

/**
 * Advanced node type matching using multiple strategies
 */
function findBestMatch(nodeType: string, mappingKeys: string[]): string {
  const lowerNodeType = nodeType.toLowerCase();
  
  // Strategy 1: Exact match
  const exactMatch = mappingKeys.find(key => lowerNodeType === key);
  if (exactMatch) return exactMatch;
  
  // Strategy 2: Direct substring match (prioritize longer matches)
  const substringMatches = mappingKeys
    .filter(key => lowerNodeType.includes(key))
    .sort((a, b) => b.length - a.length); // Longest match first
  
  if (substringMatches.length > 0) return substringMatches[0];
  
  // Strategy 3: Extract service name from N8N node format
  const serviceMatch = lowerNodeType.match(/n8n-nodes-base\.(.+)/);
  if (serviceMatch) {
    const serviceName = serviceMatch[1];
    const serviceKeyMatch = mappingKeys.find(key => serviceName.includes(key));
    if (serviceKeyMatch) return serviceKeyMatch;
  }
  
  // Strategy 4: Word-based matching
  const words = lowerNodeType.split(/[-_.]/).filter(word => word.length > 2);
  for (const word of words) {
    const wordMatch = mappingKeys.find(key => word.includes(key) || key.includes(word));
    if (wordMatch) return wordMatch;
  }
  
  return 'default';
}

/**
 * Get the appropriate Lucide icon for a node type
 */
export function getNodeIcon(nodeType: string): LucideIcon {
  const iconKeys = Object.keys(N8N_NODE_ICONS);
  const matchedKey = findBestMatch(nodeType, iconKeys);
  return N8N_NODE_ICONS[matchedKey] || N8N_NODE_ICONS.default;
}

/**
 * Get the appropriate color gradient class for a node type
 */
export function getNodeColor(nodeType: string): string {
  const categoryKeys = Object.keys(NODE_CATEGORIES);
  const matchedKey = findBestMatch(nodeType, categoryKeys);
  const category = NODE_CATEGORIES[matchedKey] || 'default';
  return COLOR_GRADIENTS[category] || COLOR_GRADIENTS.default;
}

/**
 * Get the category name for a node type (useful for debugging/grouping)
 */
export function getNodeCategory(nodeType: string): string {
  const categoryKeys = Object.keys(NODE_CATEGORIES);
  const matchedKey = findBestMatch(nodeType, categoryKeys);
  return NODE_CATEGORIES[matchedKey] || 'default';
}

/**
 * Check if a node type is a trigger
 */
export function isTriggerNode(nodeType: string): boolean {
  return getNodeCategory(nodeType) === 'trigger' || 
         nodeType.toLowerCase().includes('trigger') ||
         nodeType.toLowerCase().includes('webhook');
}
