import React from "react";
import { cn } from "../../lib/utils";
import { AuroraClimateCard } from "./AuroraClimateCard";
import { AuroraWeatherCard } from "./AuroraWeatherCard";
import { AuroraMediaPlayerCard } from "./AuroraMediaPlayerCard";
import { AuroraLightCard } from "./AuroraLightCard";
import { AuroraSensor } from "./AuroraSensorCard";
import { AuroraButtonCard } from "./AuroraButtonCard";
import { AuroraTriggerCard } from "./AuroraTriggerCard";
import { AuroraEntitiesCard } from "./AuroraEntitiesCard";
import { AuroraFamilyCard } from "./AuroraFamilyCard";
import { AuroraFabCard } from "./AuroraFabCard";
import { AuroraFanCard } from "./AuroraFanCard";
import type { EntityName } from "@hakit/core";

export type ItemType = 
  | 'weather' 
  | 'climate' 
  | 'media' 
  | 'light' 
  | 'sensor' 
  | 'button' 
  | 'trigger' 
  | 'entities' 
  | 'family' 
  | 'fab' 
  | 'fan' 
  | 'header'
  | 'spacer';

export interface DashboardItem {
  id: string;
  type: ItemType;
  entityId?: string;
  title?: string;
  colSpan?: number;
  rowSpan?: number;
  // Extra props
  people?: string[]; 
  entityIds?: string[];
  domain?: string;
  target?: string;
  className?: string;
  variant?: string;
  icon?: any;
}

interface Props {
  item: DashboardItem;
  isEditMode?: boolean;
}

export function CardRenderer({ item, isEditMode }: Props) {
  const { type, entityId, ...props } = item;
  const className = cn(
    item.className, 
    isEditMode && "pointer-events-none", // Disable interaction while editing
    item.colSpan && `col-span-${item.colSpan}`,
    item.rowSpan && `row-span-${item.rowSpan}`
  );

  // Header special case
  if (type === 'header') {
    return (
      <h2 className={cn("text-xl font-semibold mb-1 flex items-center", className)}>
        {item.title}
      </h2>
    );
  }

  // Spacer
  if (type === 'spacer') {
      return <div className={className} />;
  }

  // Cards
  switch (type) {
    case 'weather':
      return <AuroraWeatherCard entityId={entityId as EntityName} className={className} />;
    case 'climate':
      return <AuroraClimateCard entityId={entityId as EntityName} className={className} />;
    case 'media':
      return <AuroraMediaPlayerCard entityId={entityId as EntityName} className={className} />;
    case 'light':
      return <AuroraLightCard entityId={entityId as EntityName} className={className} />;
    case 'sensor':
      return <AuroraSensor entityId={entityId as EntityName} className={className} />;
    case 'button':
      return <AuroraButtonCard entityId={entityId as EntityName} className={className} />;
    case 'trigger':
      return <AuroraTriggerCard domain={props.domain!} target={props.target!} title={item.title} className={className} />;
    case 'entities':
      return <AuroraEntitiesCard title={item.title!} entityIds={props.entityIds as EntityName[]} className={className} />;
    case 'family':
      return <AuroraFamilyCard people={props.people as EntityName[]} className={className} />;
    case 'fan':
      return <AuroraFanCard entityId={entityId as EntityName} className={className} variant={props.variant as any} icon={props.icon} />;
    default:
      return null;
  }
}
