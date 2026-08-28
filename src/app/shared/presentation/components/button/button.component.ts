import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type NexaButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type NexaButtonSize = 'compact' | 'standard' | 'large';

@Component({
  selector: 'nexa-button',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<NexaButtonVariant>('primary');
  readonly size = input<NexaButtonSize>('standard');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly routerLink = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  classes(): string {
    return `${this.variant()} ${this.size()}${this.fullWidth() ? ' full-width' : ''}`;
  }

  linkDisabled(): boolean {
    return this.disabled() || this.loading();
  }

  guardLink(event: Event): void {
    if (!this.linkDisabled()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
