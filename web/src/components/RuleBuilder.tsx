import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/ui/multi-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Code, Wand2 } from 'lucide-react';
import { RuleDisplay } from './RuleDisplay';

export type RuleBlock =
  | { type: 'host'; value: string }
  | { type: 'hostRegexp'; value: string }
  | { type: 'path'; value: string }
  | { type: 'pathPrefix'; value: string }
  | { type: 'method'; value: string };

export function compileRule(blocks: RuleBlock[]): string {
  if (!blocks.length) return '';
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'host':
          return `Host(\`${b.value}\`)`;
        case 'hostRegexp':
          return `HostRegexp(\`${b.value}\`)`;
        case 'path':
          return `Path(\`${b.value}\`)`;
        case 'pathPrefix':
          return `PathPrefix(\`${b.value}\`)`;
        case 'method':
          return `Method(\`${b.value}\`)`;
      }
    })
    .join(' && ');
}

interface RuleBuilderProps {
  mode: 'simple' | 'advanced';
  setMode: (mode: 'simple' | 'advanced') => void;
  domain: string;
  setDomain: (domain: string) => void;
  useRegex: boolean;
  setUseRegex: (use: boolean) => void;
  path: string;
  setPath: (path: string) => void;
  usePathPrefix: boolean;
  setUsePathPrefix: (use: boolean) => void;
  methods: string[];
  setMethods: (methods: string[]) => void;
  rawRule: string;
  setRawRule: (rule: string) => void;
}

export function RuleBuilder({
  mode,
  setMode,
  domain,
  setDomain,
  useRegex,
  setUseRegex,
  path,
  setPath,
  usePathPrefix,
  setUsePathPrefix,
  methods,
  setMethods,
  rawRule,
  setRawRule,
}: RuleBuilderProps) {
  const compiledRule = compileRule(
    [
      domain
        ? useRegex
          ? { type: 'hostRegexp', value: domain }
          : { type: 'host', value: domain }
        : null,
      path
        ? usePathPrefix
          ? { type: 'pathPrefix', value: path }
          : { type: 'path', value: path }
        : null,
      ...methods.map((m) => ({ type: 'method', value: m })),
    ].filter(Boolean) as RuleBlock[]
  );

  const exampleRules = [
    { label: 'Basic Domain', value: 'Host(`example.com`)' },
    { label: 'Domain with Path', value: 'Host(`example.com`) && Path(`/api`)' },
    {
      label: 'Multiple Domains',
      value: 'Host(`api.example.com`, `api.test.com`)',
    },
    { label: 'Regex Domain', value: 'HostRegexp(`^api\\..+\\.com$`)' },
    {
      label: 'Path Prefix',
      value: 'Host(`example.com`) && PathPrefix(`/v2/`)',
    },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-base font-semibold'>Rule Configuration</Label>
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'advanced')}>
          <TabsList>
            <TabsTrigger value='simple' className='flex items-center gap-2'>
              <Wand2 className='h-4 w-4' />
              Simple Builder
            </TabsTrigger>
            <TabsTrigger value='advanced' className='flex items-center gap-2'>
              <Code className='h-4 w-4' />
              Raw Rule
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === 'simple' ? (
        <div className='space-y-4 rounded-lg border p-4'>
          <div className='space-y-2'>
            <Label htmlFor='domain' className='flex items-center gap-2'>
              Domain
              <Badge variant='outline' className='ml-2 text-xs'>
                Required
              </Badge>
            </Label>
            <div className='flex gap-2'>
              <Input
                id='domain'
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder='example.com or ^api\..+\.com$'
                className='flex-1'
              />
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='useRegex'
                  checked={useRegex}
                  onCheckedChange={(v) => setUseRegex(!!v)}
                />
                <Label htmlFor='useRegex' className='text-sm cursor-pointer'>
                  Regex
                </Label>
              </div>
            </div>
            {useRegex && (
              <div className='flex items-center gap-2 text-sm text-amber-600'>
                <AlertCircle className='h-4 w-4' />
                <span>Use ^api\\..+\\.com$ for domains starting with "api."</span>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='path' className='text-muted-foreground'>
              Path (Optional)
            </Label>
            <div className='flex gap-2'>
              <Input
                id='path'
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder='/api or /v2/users'
                className='flex-1'
              />
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='usePathPrefix'
                  checked={usePathPrefix}
                  onCheckedChange={(v) => setUsePathPrefix(!!v)}
                />
                <Label htmlFor='usePathPrefix' className='text-sm cursor-pointer'>
                  Prefix
                </Label>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-muted-foreground'>HTTP Methods (Optional)</Label>
            <MultiSelect values={methods} onValuesChange={setMethods}>
              <MultiSelectTrigger>
                <MultiSelectValue placeholder='Select methods...' />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectGroup>
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map((m) => (
                    <MultiSelectItem key={m} value={m}>
                      {m}
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>
          </div>

          {compiledRule && (
            <div className='space-y-2 rounded-md bg-muted/50 p-3'>
              <Label className='text-sm'>Generated Rule</Label>
              <RuleDisplay rule={compiledRule} />
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Code className='h-3 w-3' />
                <code className='text-xs'>{compiledRule}</code>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='rawRule'>Raw Rule Expression</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setRawRule(compiledRule)}
                  disabled={!domain}
                >
                  Use Simple Builder Rule
                </Button>
              </div>
              <textarea
                id='rawRule'
                value={rawRule}
                onChange={(e) => setRawRule(e.target.value)}
                placeholder='Host(`example.com`) && PathPrefix(`/api`)'
                className='w-full min-h-[100px] font-mono text-sm p-3 rounded-md border bg-background resize-y'
                spellCheck={false}
              />
              <div className='space-y-2'>
                <Label className='text-sm'>Quick Examples:</Label>
                <div className='flex flex-wrap gap-2'>
                  {exampleRules.map((example, i) => (
                    <Button
                      key={i}
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setRawRule(example.value)}
                      className='h-auto py-1 px-2 text-xs'
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
