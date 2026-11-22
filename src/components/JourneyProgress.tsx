import { useMemo } from 'react';
import type { Journey } from '../domain/types';
import { journeyProgress } from '../domain/progress';

export default function JourneyProgress({journey,time}:{journey:Journey;time:number}) {
  const report = useMemo(() => journeyProgress(journey,time),[journey,time]);
  const date = new Date(`${journey.month.month}-${String(report.day).padStart(2,'0')}T12:00:00Z`);
  const label = date.toLocaleDateString('en-US',{month:'long',day:'numeric',timeZone:'UTC'});
  return <section className="journey-progress" aria-label="Date and category progress">
    <div className="journey-progress-date"><div><span className="journey-progress-kicker">YOUR MONTH UNFOLDING</span><h2>{label}<span>{date.getUTCFullYear()}</span></h2></div><span className="journey-progress-day">DAY <b>{report.day}</b><span>OF {journey.month.days}</span></span></div>
    <div className="journey-progress-columns">{report.categories.map(category => <div className="journey-progress-column" key={category.category}>
      <span className="journey-progress-count">{category.completed}<span>/{category.count}</span></span>
      <div className="journey-progress-bar-space"><div className="journey-progress-track" style={{height:`clamp(var(--bar-min), calc(${category.count} * var(--bar-unit)), var(--bar-max))`}} role="progressbar" aria-label={`${category.label} milestones`} aria-valuemin={0} aria-valuemax={category.count} aria-valuenow={category.completed} aria-valuetext={`${category.completed} of ${category.count} ${category.label.toLowerCase()} milestones passed`}>
        <div className="journey-progress-fill" style={{background:category.color,transform:`scaleY(${category.fraction})`}}/>
      </div></div><span className="journey-progress-category" title={category.label}>{category.label}</span>
    </div>)}</div>
    <p>Milestones along your journey</p>
  </section>;
}
