import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LogisticsFacade } from '../application/logistics.facade';

@Component({selector:'nexa-operational-analytics-page',standalone:true,imports:[PercentPipe,PageHeaderComponent,SectionPanelComponent],template:`<section class="page"><nexa-page-header title="Operational Analytics" subtitle="Bounded server-side range; no fabricated chart values"/><nexa-section-panel title="Last 30 days">@if(facade.analytics();as data){<dl><dt>Dispatches</dt><dd>{{data.dispatches}}</dd><dt>Delivered</dt><dd>{{data.delivered}}</dd><dt>On-time rate</dt><dd>{{data.onTimeRate|percent}}</dd><dt>Incidents</dt><dd>{{data.incidents}}</dd><dt>Temperature excursions</dt><dd>{{data.temperatureExcursions}}</dd><dt>POD completed</dt><dd>{{data.podCompleted}}</dd></dl>}@else{<p>Loading analytics…</p>}</nexa-section-panel></section>`,styles:[`dl{display:grid;grid-template-columns:max-content 1fr;gap:.5rem 1rem}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class OperationalAnalyticsPageComponent{readonly facade=inject(LogisticsFacade);constructor(){const to=new Date();const from=new Date(to.getTime()-30*24*60*60*1000);this.facade.loadAnalytics(from.toISOString(),to.toISOString());}}
