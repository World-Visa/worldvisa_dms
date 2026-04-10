'use client';

import { cn } from '@/lib/utils';
import { getInitials, formatRole } from '@/lib/constants/users';
import type { ActiveAgent } from '@/api/activity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { HelpTooltipIndicator } from '@/components/ui/primitives/help-tooltip-indicator';
import { FlickeringGridPlaceholder } from '@/components/v2/dashboard/analytics/flickering-grid-placeholder';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';

type AgentCardProps = {
  agent: ActiveAgent;
};

function AgentCard({ agent }: AgentCardProps) {
  const isOnline = agent.onlineStatus === 'online';
  const initials = getInitials(agent.username, agent.fullName);

  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-bg-weak/40 hover:bg-bg-weak transition-colors">
      <div className="relative">
        <Avatar className="size-9">
          {agent.profileImageUrl && (
            <AvatarImage src={agent.profileImageUrl} alt={agent.fullName} />
          )}
          <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-bg-white',
            isOnline ? 'bg-success-base' : 'bg-neutral-300',
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      </div>
      <div className="text-center min-w-0 w-full">
        <p className="text-[11px] font-medium text-text-strong truncate leading-tight" title={agent.fullName}>
          {agent.fullName || agent.username}
        </p>
        <p className="text-[10px] text-text-soft truncate leading-tight capitalize">
          {formatRole(agent.role)}
        </p>
      </div>
    </div>
  );
}

type ActiveSubscribersTrendChartProps = {
  data?: ActiveAgent[];
  isLoading?: boolean;
  error?: Error | null;
};

export function ActiveSubscribersTrendChart({ data, isLoading }: ActiveSubscribersTrendChartProps) {
  const onlineCount = data?.filter((a) => a.onlineStatus === 'online').length ?? 0;

  return (
    <Card className="shadow-box-xs border-none h-full flex flex-col min-h-0">
      <CardHeader className="bg-transparent p-2.5 pb-0 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-code text-[12px] text-text-sub font-normal uppercase flex items-center gap-0.5 tracking-[normal] shrink-0">
            Active agents
            <HelpTooltipIndicator text={ANALYTICS_TOOLTIPS.ACTIVE_SUBSCRIBERS_TREND} />
          </CardTitle>
          {!isLoading && data && data.length > 0 && (
            <span className="text-[11px] text-text-soft tabular-nums shrink-0">
              <span className="text-success-base font-medium">{onlineCount}</span>
              <span className="text-text-disabled"> / {data.length} online</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2.5 pt-1.5 flex flex-col flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <FlickeringGridPlaceholder className="w-full flex-1" minHeight={80} topFadeHeight={24} bottomFadeHeight={24} />
        ) : !data || data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-text-soft">No active agents</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 overflow-y-auto overscroll-contain pr-0.5 max-h-full">
            {data.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
