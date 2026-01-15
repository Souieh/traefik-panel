import { Badge } from '@/components/ui/badge';

export function RuleDisplay({ rule }: { rule: string }) {
  const parts = rule.split(' && ');

  return (
    <div className='flex flex-wrap gap-1'>
      {parts.map((part, i) => {
        const match = part.match(/^(\w+)\(`([^`]+)`\)$/);
        if (!match)
          return (
            <Badge key={i} variant='outline'>
              {part}
            </Badge>
          );

        const [, type, value] = match;
        let variant: 'default' | 'secondary' | 'outline' = 'outline';
        let displayType = type;

        switch (type) {
          case 'Host':
            variant = 'default';
            break;
          case 'Path':
          case 'PathPrefix':
            variant = 'secondary';
            break;
          case 'Method':
            displayType = 'method';
            break;
          case 'HostRegexp':
            displayType = 'regex';
            break;
        }

        return (
          <div key={i} className='flex items-center gap-1'>
            {i > 0 && <span className='text-muted-foreground text-sm'>&&</span>}
            <Badge variant={variant} className='font-mono text-xs'>
              {displayType}: {value}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
